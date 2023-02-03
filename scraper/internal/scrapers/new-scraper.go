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

	"github.com/PuerkitoBio/goquery"
	"github.com/gocolly/colly/v2"
	"github.com/redis/go-redis/v9"
)

func NewScraper(ctx context.Context, log *logger.CustomLogger, rdb *redis.Client, wg *sync.WaitGroup, fandom string, lastWorkKey string, maxAmount int) {
	defer wg.Done()

	url := "https://archiveofourown.org/works?commit=Sort+and+Filter&work_search[sort_column]=revised_at&tag_id=" + url.QueryEscape(fandom)

	var lastWorkId string
	var firstWork string
	var amount int

	collector := colly.NewCollector(
		colly.AllowedDomains("archiveofourown.org"),
		colly.AllowURLRevisit(),
	)

	collector.OnHTML("ol.work.index.group", func(h *colly.HTMLElement) {
		finished := false

		h.DOM.ChildrenFiltered("li[id^=\"work_\"]").EachWithBreak(func(i int, s *goquery.Selection) bool {
			workId := strings.TrimSpace(s.AttrOr("id", "BUFFER")[5:])

			if _, err := strconv.Atoi(workId); err != nil {
				log.Err.Printf("Unable to get work id! Detected work id: %s, err: %v", workId, err)
				return true
			} else {
				if workId == lastWorkId {
					finished = true
					return false
				}
			}

			if i == 0 && firstWork == "" {
				err := rdb.Set(context.Background(), fmt.Sprintf("workId:last_work:%s", lastWorkKey), workId, 0).Err()
				if err != nil {
					log.Err.Printf("Unable to set last work ID to redis, %v", err)
				}
				firstWork = workId
			}

			err := rdb.ZAddNX(context.Background(), "workIds:queue:new", redis.Z{
				Score:  float64(time.Now().UnixMilli()),
				Member: workId,
			}).Err()
			if err != nil {
				log.Err.Printf("Failed to add work %s to queue, %v", workId, err)
				return true
			}

			if amount--; amount <= 0 {
				finished = true
				return false
			}

			log.Info.Printf("Added %s to queue", workId)

			return true
		})

		if !finished {
			log.Info.Printf("Going to next page...")
			url, exists := h.DOM.SiblingsFiltered("ol.pagination").First().Find("a[rel=\"next\"]").First().Attr("href")
			if !exists {
				log.Err.Printf("Unable to find next page link")
			}

			h.Request.Visit(url)
		}
	})

	collector.OnRequest(func(r *colly.Request) {
		log.Info.Printf("Visiting %s", r.URL.String())
	})

	for {
		select {
		case <-ctx.Done():
			log.Info.Printf("New Scraper closing...")
			return
		case <-time.After(time.Minute * 5):
			func() {
				var err error
				lastWorkId, err = rdb.Get(context.Background(), fmt.Sprintf("workId:last_work:%s", lastWorkKey)).Result()
				if err != nil {
					if err == redis.Nil {
						lastWorkId = ""
					} else {
						log.Err.Printf("Error getting lastWork, %v", err)
					}
				}
				amount = maxAmount
				firstWork = ""

				err = collector.Visit(url)
				if err != nil {
					log.Err.Printf("VIsiting %s failed!, %v", url, err)
				}
			}()
		}
	}
}
