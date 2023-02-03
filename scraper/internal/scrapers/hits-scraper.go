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

	url := fmt.Sprintf("https://archiveofourown.org/works?commit=Sort+and+Filter&work_search[sort_column]=hits&page=%d&tag_id=", startingPage) + url.QueryEscape(fandom)

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

		log.Info.Printf("Added %s to queue", workId)
	})

	collector.OnHTML("a[rel=\"next\"]", func(h *colly.HTMLElement) {
		link, ok := h.DOM.Attr("href")
		if !ok {
			log.Info.Printf("No link detected on next anchor...")
			return
		}

		worksInQueue, err := rdb.ZCount(context.Background(), "workIds:queue:hits", "-inf", "+inf").Result()
		if err != nil {
			log.Err.Printf("Failed to get amount of works in queue...")
		} else {
			if worksInQueue > 1000 {
				log.Info.Printf("Queue is 1000 in length! Sleeping for 5 minutes...")
				time.Sleep(time.Minute * 1)
			}
		}

		select {
		case <-ctx.Done():
			return
		case <-time.After(time.Minute * 1):
			h.Request.Visit(link)
		}
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

	err := collector.Visit(url)
	if err != nil {
		log.Err.Printf("Failed to visit %s, %v", url, err)
	}

	log.Info.Printf("Hit scraper finished...")
}
