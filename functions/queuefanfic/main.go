package queuefanfic

import "net/http"

func QueueFanfic(req http.Request, res http.ResponseWriter) {
	var Body struct {
		Name string
	}

	switch req.Method {
	case "GET":

	}
}
