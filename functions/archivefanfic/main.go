package archivefanfic

import (
	"fmt"
	"net/http"

	"github.com/GoogleCloudPlatform/functions-framework-go/functions"
)

func init() {
	functions.HTTP("archivefanfic", ArchiveFanfic)
}

func ArchiveFanfic(res http.ResponseWriter, req *http.Request) {
	fmt.Fprint(res, "Hello, world!\nYou accessed archivefanfic function!")
}
