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
	"archive.tracel.xyz/scraper/internal/workers"
	"github.com/redis/go-redis/v9"
)

const (
	genshinFandom   = "原神 | Genshin Impact (Video Game)"
	undertaleFandom = "Undertale (Video Game)"
	omoriFandom     = "OMORI (Video Game)"
	deltaruneFandom = "Deltarune (Video Game)"
)

func main() {
	workerAmt := flag.Int("worker-amount", 25, "Amount of workers posting to the function")
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
	_, exists = os.LookupEnv("GOOGLE_APPLICATION_CREDENTIALS")
	if !exists {
		log.Err.Fatalf("GCloud credentials is not set! GOOGLE_APPLICATION_CREDENTIALS")
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
		time.Sleep(time.Second * 5)
	}

	wg.Add(1)
	go scrapers.HitsScraper(ctx, log, rdb, &wg, omoriFandom, *startingPage)
	time.Sleep(time.Second * 15)
	wg.Add(1)
	go scrapers.HitsScraper(ctx, log, rdb, &wg, genshinFandom, *startingPage)
	time.Sleep(time.Second * 15)
	wg.Add(1)
	go scrapers.HitsScraper(ctx, log, rdb, &wg, undertaleFandom, *startingPage)
	time.Sleep(time.Second * 15)
	wg.Add(1)
	go scrapers.HitsScraper(ctx, log, rdb, &wg, deltaruneFandom, *startingPage)

	wg.Wait()
}
