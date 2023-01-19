package archivefanfic

import (
	"fmt"
	"net/http"
)

func ArchiveFanfic(req http.Request, res http.ResponseWriter) {
	fmt.Fprint(res, "Hello, world!\nYou accessed archivefanfic function!")
}
