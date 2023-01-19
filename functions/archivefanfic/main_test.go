package archivefanfic

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestArchiveFanfic(t *testing.T) {
	tests := []struct {
		body   string
		want   string
		method string
	}{
		{body: `{"name":"TraceL"}`, want: `You did a post request, TraceL!`, method: "POST"},
		{body: ``, want: `You did a get request to /!`, method: "GET"},
		{body: ``, want: `You did a PUT request!`, method: "PUT"},
	}

	for _, test := range tests {
		req := httptest.NewRequest("GET", "/", strings.NewReader(test.body))
		req.Header.Add("Content-Type", "application/json")
		req.Method = test.method

		rr := httptest.NewRecorder()
		ArchiveFanfic(rr, req)

		if got := rr.Body.String(); got != test.want {
			t.Errorf("HelloHTTP(%q) = %q, want %q", test.body, got, test.want)
		}
	}
}
