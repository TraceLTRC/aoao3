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
	workerAmt := flag.Int("worker-amount", 25, "Amount of workers posting to the function")
	newAmount := flag.Int("new-works", 100, "Amount of fanfics to be archived before sleeping")

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
	for _, fandom := range fandoms {
		wg.Add(1)
		go scrapers.NewScraper(ctx, log, rdb, &wg, fandom, utils.GetMD5Hash(fandom), *newAmount)
	}

	for i := *workerAmt; i > 0; i-- {
		wg.Add(1)
		go workers.PostWorker(ctx, log, rdb, &wg, archiveUrl, "workIds:queue:new")
		time.Sleep(time.Second * 5)
	}

	wg.Wait()
}
