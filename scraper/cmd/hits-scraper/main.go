package main

import (
	"context"
	"flag"
	"os"
	"os/signal"
	"sync"
	"time"

	"archive.tracel.xyz/scraper/internal/logger"
	"archive.tracel.xyz/scraper/internal/scrapers"
	"archive.tracel.xyz/scraper/internal/utils"
	"archive.tracel.xyz/scraper/internal/workers"
	"github.com/redis/go-redis/v9"
)

func main() {
	workerAmt := flag.Int("worker-amount", 30, "Amount of workers posting to the function")
	startingPage := flag.Int("starting-page", 1, "Amount of fanfics to be archived before sleeping")

	flag.Parse()

	var wg sync.WaitGroup
	log := logger.NewLogger()
	ctx, cancel := context.WithCancel(context.Background())

	redisAddress, exists := os.LookupEnv("REDIS_ADDRESS")
	if !exists {
		log.Err.Fatalf("Redis' address is not set! REDIS_ADDRESS")
	}
	archiveUrl, exists := os.LookupEnv("ARCHIVE_FUNCTION_ENDPOINT")
	if !exists {
		log.Err.Fatalf("Archiving function endpoint is not set! ARCHIVE_FUNCTION_ENDPOINT")
	}
	fandoms, err := utils.ReadLines("fandoms.txt")
	if err != nil {
		log.Err.Fatalf("Failed to load fandoms, %v", err)
	}

	log.Info.Printf("Fandoms to scrape: ")
	for _, fandom := range fandoms {
		log.Info.Printf("\t%s", fandom)
	}

	rdb := redis.NewClient(&redis.Options{
		Addr:     redisAddress,
		Password: "",
		DB:       0,
	})

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt)
	go func() {
		for range sigChan {
			log.Info.Printf("Closing...")
			cancel()
			break
		}
	}()

	// Launch scrapers

	for i := *workerAmt; i > 0; i-- {
		wg.Add(1)
		go workers.PostWorker(ctx, log, rdb, &wg, archiveUrl, "workIds:queue:hits")
	}

	for _, fandom := range fandoms {
		wg.Add(1)
		go scrapers.HitsScraper(ctx, log, rdb, &wg, fandom, *startingPage)
		time.Sleep(time.Second * 15)
	}

	wg.Wait()
}
