export type Rating = "Not Rated" | "General Audiences" | "Teen And Up Audiences" | "Mature" | "Explicit"

export type Category = "F/F" | "M/M" | "F/M" | "Gen" | "Multi" | "Other"

export type Warning = "Creator Chose Not To Use Archive Warnings" | "Graphic Depictions Of Violence" | "Major Character Death" | "No Archive Warnings Apply" | "Rape/Non-Con" | "Underage"

export type ArchiveMeta = {
    lastChecked: number,
    contentHash: string[],
}

export type WorkStats = {
    publishedTime: number,
    lastUpdated?: number,
    words: number,
    currChapter: number,
    maxChapter: number,
    kudos: number,
    bookmarks: number,
    hits: number,
}

export type WorkMeta = {
    title: string,
    authors: string[],
    warnings: Warning[],
    rating: Rating,
    categories: Category[],
    fandoms: string[],
    relationships: string[],
    characters: string[],
    tags: string[],
    language: string
} & WorkStats

export type WorkChapter = {
    title: string
    summary: string
    beginningNotes: string
    endingNotes: string
    content: string
}

export type WorkContent = {
    beginningNotes: string,
    endingNotes: string,
    skin: string,
    chapters: WorkChapter[]
}

export type Work = {
    id: string,
    summary: string,
} & WorkMeta

export type WorkDocument = Work & ArchiveMeta