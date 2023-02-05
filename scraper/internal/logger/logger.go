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
		Err:  log.New(os.Stderr, "ERROR: ", log.Lshortfile|log.Ltime),
		Info: log.New(os.Stdout, "INFO: ", log.Lshortfile|log.Ltime),
	}

	return logger
}
