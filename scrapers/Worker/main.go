package worker

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/url"
	"os"
	"sync"

	"google.golang.org/api/idtoken"
)

func ScrapeWorker(ctx context.Context, id int, works <-chan string, wg *sync.WaitGroup) {
	_, err := url.ParseRequestURI(os.Getenv("ARCHIVE_FUNCTION_URL"))
	if err != nil {
		log.Fatalf("Fatal processing URI: %v", err)
	}

	client, err := idtoken.NewClient(ctx, os.Getenv("ARCHIVE_FUNCTION_URL"))
	if err != nil {
		log.Fatalf("Fatal getting auth client! %v", err)
	}

	for j := range works {
		func() {
			log.Printf("Worker %d is processing workId %s", id, j)
			data, err := json.Marshal(map[string]string{
				"workId": j,
			})
			if err != nil {
				log.Fatalf("Error marshalling json!\n%v", err)
			}

			reqBody := bytes.NewBuffer(data)

			resp, err := client.Post(os.Getenv("ARCHIVE_FUNCTION_URL"), "application/json", reqBody)
			if err != nil {
				log.Fatalf("Error sending post request!\n%v", err)
			}
			defer resp.Body.Close()

			if resp.StatusCode != 200 {
				log.Fatalf("Error sending post request! Status code: \n%d", resp.StatusCode)
			}
			log.Printf("Worker %d finished processing workId %s", id, j)
		}()
	}

	wg.Done()
}
