package scrapers

import (
	"context"
	"fmt"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"

	"archive.tracel.xyz/scraper/internal/logger"

	"github.com/gocolly/colly/v2"
	"github.com/redis/go-redis/v9"
)

func HitsScraper(ctx context.Context, log *logger.CustomLogger, rdb *redis.Client, wg *sync.WaitGroup, fandom string, startingPage int) {
	defer wg.Done()

	var stringFandom string
	var err error

	stringFandom, err = url.QueryUnescape(fandom)
	if err != nil {
		stringFandom = fandom
	}

	var lastPage int

	startingUrl := fmt.Sprintf("https://archiveofourown.org/works?commit=Sort+and+Filter&work_search[sort_column]=hits&page=%d&tag_id=%s", startingPage, fandom)

	collector := colly.NewCollector(colly.AllowedDomains("archiveofourown.org"))

	collector.OnHTML("ol.work.index.group > li[id^=\"work_\"]", func(h *colly.HTMLElement) {
		workId := strings.TrimSpace(h.Attr("id")[5:])

		if _, err := strconv.Atoi(workId); err != nil {
			log.Err.Printf("Unable to get work id! Detected work id: %s", workId)
			return
		}

		err := rdb.ZAddNX(context.Background(), "workIds:queue:hits", redis.Z{
			Score:  float64(time.Now().UnixMilli()),
			Member: workId,
		}).Err()
		if err != nil {
			log.Err.Printf("Failed to add work in queue, %v", err)
		}

		log.Info.Printf("Added %s to queue (%s)", workId, stringFandom)
	})
	defer collector.OnHTMLDetach("ol.work.index.group > li[id^=\"work_\"]")

	collector.OnHTML("ol.pagination.actions", func(h *colly.HTMLElement) {
		if lastPage != 0 {
			return
		}

		lastUrl, exists := h.DOM.First().ChildrenFiltered("li").Eq(-2).ChildrenFiltered("a").First().Attr("href")
		if !exists {
			lastPage = 5000
			log.Err.Printf("Unable to find last page while searchin for element")
		}

		i, err := strconv.Atoi(lastUrl[strings.LastIndex(lastUrl, "&page=")+6 : strings.LastIndex(lastUrl, "&work_search")])
		if err != nil {
			lastPage = 5000
			log.Err.Printf("Unable to find last page while converting int, %v", err)
		}

		lastPage = i
	})

	collector.OnRequest(func(r *colly.Request) {
		select {
		case <-ctx.Done():
			r.Abort()
			log.Info.Printf("Aborted URL visit %s", r.URL)
			return
		default:
			log.Info.Printf("Visiting %s", r.URL.String())
		}
	})

	// first visit
	for {
		err = collector.Visit(startingUrl)
		if err == nil {
			break
		}
		log.Err.Printf("Failed to visit %s, %v", startingUrl, err)
		time.Sleep(time.Second * 5)
	}
	collector.OnHTMLDetach("ol.pagination.actions")

	page := startingPage + 1
	for {
		select {
		case <-ctx.Done():
			log.Info.Printf("Hit scraper (%s) finished...", stringFandom)
			return
		case <-time.After(time.Second * 30):
			if page > lastPage {
				log.Info.Printf("Hit scraper (%s) finished...", stringFandom)
				return
			}

			pageUrl := fmt.Sprintf("https://archiveofourown.org/works?commit=Sort+and+Filter&work_search[sort_column]=hits&page=%d&tag_id=%s", page, fandom)
			for {
				err = collector.Visit(pageUrl)
				if err == nil || strings.Contains(err.Error(), "already visited") {
					break
				}
				log.Err.Printf("Visiting %s failed with status %v", pageUrl, err)
				if strings.Contains(err.Error(), "Too Many Requests") {
					time.Sleep(time.Minute * 5)
				}
			}
			page++
		}
	}
}
