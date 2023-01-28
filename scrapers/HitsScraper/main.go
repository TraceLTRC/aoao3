package main

import (
	"context"
	"log"
	"strings"
	"sync"

	"archive.tracel.xyz/scrapers/worker"
	"github.com/gocolly/colly/v2"
)

func main() {
	var wg sync.WaitGroup
	ctx := context.Background()

	collector := colly.NewCollector(
		colly.AllowedDomains("archiveofourown.org"),
	)

	works := make(chan string, 50)

	for w := 1; w <= 5; w++ {
		wg.Add(1)
		go worker.ScrapeWorker(ctx, w, works, &wg)
	}

	collector.OnHTML("ol.index > li[id^=work]", func(h *colly.HTMLElement) {
		workId := h.Attr("id")
		if !strings.HasPrefix(workId, "work_") {
			log.Fatalf("ID Attribute doesnt start with work_, %s", workId)
		}
		workId = workId[5:]
		works <- workId
		log.Printf("Sent workId %s to work pool", workId)
	})

	collector.OnHTML("li.next[title=\"next\"]", func(h *colly.HTMLElement) {
		child := h.DOM.First().Children().First()

		if href, attrExist := child.Attr("href"); !child.HasClass("disabled") && attrExist {
			h.Request.Visit(href)
		}
	})

	collector.OnRequest(func(r *colly.Request) {
		log.Printf("Visiting URL %s", r.URL)
	})

	err := collector.Visit("https://archiveofourown.org/works?commit=Sort+and+Filter&work_search[sort_column]=hits&tag_id=OMORI+(Video+Game)")
	if err != nil {
		panic(err)
	}

	close(works)

	wg.Wait()
}
