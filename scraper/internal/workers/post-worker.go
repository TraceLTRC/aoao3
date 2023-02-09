package workers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"archive.tracel.xyz/scraper/internal/logger"

	"github.com/redis/go-redis/v9"
	"google.golang.org/api/idtoken"
)

type WorkPostBody struct {
	WorkId string `json:"workId"`
}

func PostWorker(ctx context.Context, log *logger.CustomLogger, rdb *redis.Client, wg *sync.WaitGroup, endpoint string, queueKey string) {
	defer wg.Done()

	for {
		select {
		case <-ctx.Done():
			log.Info.Printf("Worker closing...")
			return
		case <-time.After(time.Second * 5):
			func() {
				res, err := rdb.ZPopMin(context.Background(), queueKey, 1).Result()
				if err != nil {
					if err == redis.Nil {
						return
					} else {
						log.Err.Printf("Error on ZPopMin, %v", err)
						return
					}
				}

				if len(res) <= 0 {
					return
				}

				workId := fmt.Sprintf("%v", res[0].Member)

				body, err := json.Marshal(WorkPostBody{
					WorkId: workId,
				})
				if err != nil {
					log.Err.Printf("Error on marshalling Json for work %s, %v", workId, err)
					rdb.ZAdd(context.Background(), queueKey, redis.Z{
						Member: workId,
						Score:  float64(time.Now().UnixMilli()),
					})
					return
				}

				client, err := idtoken.NewClient(context.Background(), endpoint)
				if err != nil {
					log.Err.Printf("Error on getting a client for work %s, %v", workId, err)
					rdb.ZAdd(context.Background(), queueKey, redis.Z{
						Member: workId,
						Score:  float64(time.Now().UnixMilli()),
					})
					return
				}

				resp, err := client.Post(endpoint, "application/json", bytes.NewReader(body))
				if err != nil {
					log.Err.Printf("Error on posting to URL for work %s, %v", workId, err)
					rdb.ZAdd(context.Background(), queueKey, redis.Z{
						Member: workId,
						Score:  float64(time.Now().UnixMilli()),
					})
					return
				}
				defer resp.Body.Close()

				switch resp.StatusCode {
				case 202:
					log.Info.Printf("Queued archiving task for work %s", workId)
				case 304:
					log.Info.Printf("Work %s has already been archived recently!", workId)
					rdb.ZAdd(context.Background(), queueKey, redis.Z{
						Member: workId,
						Score:  float64(time.Now().UnixMilli()),
					})
				default:
					log.Err.Printf("Work %s got an unexpected status code, %d", workId, resp.StatusCode)
					rdb.ZAdd(context.Background(), queueKey, redis.Z{
						Member: workId,
						Score:  float64(time.Now().UnixMilli()),
					})
				}
			}()
		}
	}
}
