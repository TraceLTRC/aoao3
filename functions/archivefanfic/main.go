package archivefanfic

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
)

func init() {
	functions.HTTP("archivefanfic", ArchiveFanfic)
}

func ArchiveFanfic(w http.ResponseWriter, r *http.Request) {
	var b struct {
		Name string
	}

	switch r.Method {
	case "GET":
		fmt.Fprintf(w, "You did a get request to %s!", r.URL)
	case "POST":
		err := json.NewDecoder(r.Body).Decode(&b)
		if err != nil {
			fmt.Fprintf(w, "Failed to decode, %v", err)
		}

		fmt.Fprintf(w, "You did a post request, %s!", b.Name)
	default:
		fmt.Fprintf(w, "You did a %s request!", r.Method)
	}
}
