import * as ff from '@google-cloud/functions-framework'
import * as cheerio from 'cheerio'
import axios from 'axios'
import { MeiliSearch } from 'meilisearch'
import { MeiliSearchApiError } from 'meilisearch/dist/types/errors'

enum Warnings {
    Invalid = 0,
    Unknown = 1,
    None = (1 << 1),
    GraphicViolence = (1 << 2),
    MajorDeath = (1 << 3),
    NonCon = (1 << 4),
    Underage = (1 << 5)
}

enum Ratings {
    Invalid,
    NotRated,
    General,
    Teen,
    Mature,
    Explicit,
}

enum Categories {
    Invalid = 0,
    Gen = 1,
    FemaleMale = (1 << 1),
    FemaleFemale = (1 << 2),
    MaleMale = (1 << 3),
    Multi = (1 << 4),
    Other = (1 << 5),
}

type WorkStats = {
    publishedTime: Date,
    lastUpdated?: Date,
    words: number,
    chapter: [number, number],
    kudos: number,
    bookmarks: number,
    hits: number,
}

type WorkMeta = {
    title: string,
    authors: string[],
    warnings: Warnings,
    rating: Ratings,
    categories: Categories,
    fandoms: string[],
    relationships: string[],
    characters: string[],
    tags: string[],
    language: string
} & WorkStats

type WorkChapter = {
    title: string
    summary: string
    beginningNotes: string
    endingNotes: string
    content: string
}

type WorkContent = {
    summary: string,
    beginningNotes: string,
    endingNotes: string,
    skin: string,
    chapters: WorkChapter[]
}

type Work = {
    id: string,
    content: WorkContent
} & WorkMeta

function workFactory(id: string): Work {
    return {
        authors: [],
        bookmarks: 0,
        categories: Categories.Invalid,
        chapter: [-1, -1],
        characters: [],
        fandoms: [],
        hits: -1,
        id: id,
        kudos: 0,
        language: "",
        publishedTime: new Date(0),
        rating: Ratings.Invalid,
        relationships: [],
        tags: [],
        title: "",
        warnings: Warnings.Invalid,
        words: -1,
        content: {
            beginningNotes: "",
            chapters: [],
            endingNotes: "",
            skin: "",
            summary: "",
        }
    }
}

function stringToRating(str: string): Ratings {
    switch (str) {
        case "Not Rated":
            return Ratings.NotRated
        case "General Audiences":
            return Ratings.General
        case "Teen And Up Audiences":
            return Ratings.Teen
        case "Mature":
            return Ratings.Mature
        case "Explicit":
            return Ratings.Explicit
        default:
            return Ratings.Invalid
    }
}

function stringToWarnings(str: string): Warnings {
	switch (str) {
        case "Rape/Non-Con":
            return Warnings.NonCon
        case "Underage":
            return Warnings.Underage
        case "Creator Chose Not To Use Archive Warnings":
            return Warnings.Unknown
        case "No Archive Warnings Apply":
            return Warnings.None
        case "Graphic Depictions Of Violence":
            return Warnings.GraphicViolence
        default:
            return Warnings.Invalid
        }
}

function stringToCategories(str: string): Categories {
	switch (str) {
        case "Gen":
            return Categories.Gen
        case "F/M":
            return Categories.FemaleMale
        case "M/M":
            return Categories.MaleMale
        case "Other":
            return Categories.Other
        case "F/F":
            return Categories.FemaleFemale
        default:
            return Categories.Invalid
        }
}

async function getWork(workId: string) {
    const work = workFactory(workId)

    const url = `https://archiveofourown.org/works/${workId}?view_full_work=true&view_adult=true`
    const { data, status } = await axios.get<string>(url, {responseType: 'document', validateStatus: (status) => status < 500})
    if (status != 200) {
        throw new Error(`Unable to fetch work! err: ${status}`)
    }

    const $ = cheerio.load(data)

    // Collect preface
    const prefaceEl = $("div#inner div#workskin > div.preface.group")
    
    work.title = prefaceEl.find(".title").text().trim()
    work.authors = prefaceEl.find("a[rel=\"author\"]").map((i, el) => {
        return $(el).text().trim()
    }).toArray()
    work.content.beginningNotes = prefaceEl.find("div.notes").children().not("h3").html()?.trim() ?? ""
    work.content.endingNotes = $("div#work_endnotes").children().not('h3').html() ?? ""
    work.content.summary = prefaceEl.find("div.summary").children().not("h3").html()?.trim() ?? ""
    work.content.skin = $("div#inner style").text().trim() ?? ""

    // collect stats
    $("div#inner dl.work.meta").find("dd").each((i, el) => {
        if ($(el).hasClass("rating")) {
            work.rating = stringToRating($("a", el).first().text().trim())
        } else if ($(el).hasClass("warning")) {
            work.warnings = $("a", el).toArray().reduce((prev, curr) => {
                return prev | stringToWarnings($(curr).text().trim());
            }, Warnings.Invalid)
        } else if ($(el).hasClass("category")) {
            work.categories = $("a", el).toArray().reduce((prev, curr) => {
                return prev | stringToCategories($(curr).text().trim());
            }, Categories.Invalid)
        } else if ($(el).hasClass("fandom")) {
            work.fandoms = $("a", el).map((i, el) => {
                return $(el).text().trim()
            }).toArray()
        } else if ($(el).hasClass("relationship")) {
            work.relationships = $("a", el).map((i, el) => {
                return $(el).text().trim()
            }).toArray()
        } else if ($(el).hasClass("character")) {
            work.characters = $("a", el).map((i, el) => {
                return $(el).text().trim()
            }).toArray()
        } else if ($(el).hasClass("freeform")) {
            work.tags = $("a", el).map((i, el) => {
                return $(el).text().trim()
            }).toArray()
        } else if ($(el).hasClass("language")) {
            work.language = $(el).text().trim()
        } else if ($(el).hasClass("published")) {
            const splitDate = $(el).text().trim().split('-')
            work.publishedTime = new Date(+splitDate[0], +splitDate[1] - 1, +splitDate[2])
        } else if ($(el).hasClass("status")) {
            const splitDate = $(el).text().trim().split('-')
            work.lastUpdated = new Date(+splitDate[0], +splitDate[1] - 1, +splitDate[2])
        } else if ($(el).hasClass("words")) {
            work.words = +$(el).text().trim()
        } else if ($(el).hasClass("chapters")) {
            const chapterSplit = $(el).text().trim().split("/")
            if (chapterSplit[1] == '?') {
                work.chapter = [+chapterSplit[0], -1]
            } else {
                work.chapter = [+chapterSplit[0], +chapterSplit[1]]
            }
        } else if ($(el).hasClass("kudos")) {
            work.kudos = +$(el).text().trim()
        } else if ($(el).hasClass("bookmarks")) {
            work.bookmarks = +$(el).text().trim()
        } else if ($(el).hasClass("hits")) {
            work.hits = +$(el).text().trim()
        }
    })

    // Collect chapters
    work.content.chapters = $("div[id^=\"chapter-\"]").map((i, el) => {
        return $(el).children().map((i, el) => {
            const chapter: WorkChapter = {
                beginningNotes: "",
                content: "",
                endingNotes: "",
                summary: "",
                title: "",
            }

            if ($(el).is(".chapter.preface.group[role=\"complementary\"]")) { // Beginning notes, summary, and title
                const preTitle = $(el).children(".title").first().clone().children().remove().end().text().trim()
                if (preTitle.startsWith(": ")) {
                    chapter.title = preTitle.substring(2)
                } else if (preTitle.length > 0) {
                    console.error("Unexpected chapter prefix!")
                } else {
                    chapter.title = ""
                }

                chapter.summary = $(el).find("div.summary > blockquote.userstuff").html() ?? ""
                chapter.beginningNotes = $(el).find("div.notes > blockquote.userstuff").html() ?? ""
            } else if ($(el).is(".userstuff.module")) {
                chapter.content = $(el).children(".landmark").remove().end().html() ?? ""
            } else if ($(el).is(".chapter.preface.group:not([role])")) {
                chapter.endingNotes = $(el).find("blockquote").html() ?? ""
            }

            return chapter
        }).toArray()
    }).toArray()

    return work
}

ff.http('ArchiveFanfic', async (req: ff.Request, res: ff.Response) => {
    if (req.body == null || req.body.workId == null) {
        res.status(400).end()
        return
    }
    const workId = req.body.workId as string

    console.log(process.env.ADMIN_API_KEY)

    const client = new MeiliSearch({
        host: `http://${process.env.SEARCH_DOMAIN}`,
        apiKey: process.env.ADMIN_API_KEY,
    });
    try {
        const doc = await (await client.getIndex('archives')).getDocument(workId)
        res.send(doc).end()
        return
    } catch (e) {
        if (e instanceof MeiliSearchApiError) {
            console.log(`code: ${e.code}\ntype: ${e.type}`)
        } else {
            console.error(e)
        }
    } finally {
        res.end()
    }
})