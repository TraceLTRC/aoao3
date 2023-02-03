package logger

import (
	"log"
	"os"
)

type CustomLogger struct {
	Err  *log.Logger
	Info *log.Logger
}

func NewLogger() *CustomLogger {
	logger := &CustomLogger{
		Err:  log.New(os.Stderr, "ERROR: ", log.Lshortfile),
		Info: log.New(os.Stdout, "INFO: ", log.Lshortfile),
	}

	return logger
}
