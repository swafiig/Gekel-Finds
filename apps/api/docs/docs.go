// Package docs embeds the OpenAPI document and a self-hosted copy of Swagger UI,
// so the API docs work offline and under a strict Content-Security-Policy (no CDN).
package docs

import (
	"crypto/sha256"
	"crypto/subtle"
	"embed"
	"io/fs"
	"net/http"
)

//go:embed openapi.json
var spec []byte

//go:embed swaggerui
var ui embed.FS

// Handler serves /swagger/ (UI) and /swagger/doc.json (spec). If user is set, HTTP basic auth is required.
func Handler(user, password string) http.Handler {
	sub, _ := fs.Sub(ui, "swaggerui")
	files := http.StripPrefix("/swagger/", http.FileServer(http.FS(sub)))
	mux := http.NewServeMux()
	mux.HandleFunc("GET /swagger/doc.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = w.Write(spec)
	})
	mux.Handle("GET /swagger/", files)
	mux.HandleFunc("GET /swagger", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/swagger/", http.StatusMovedPermanently)
	})
	if user == "" {
		return mux
	}
	wantU, wantP := sha256.Sum256([]byte(user)), sha256.Sum256([]byte(password))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u, p, ok := r.BasicAuth()
		gotU, gotP := sha256.Sum256([]byte(u)), sha256.Sum256([]byte(p))
		if !ok || subtle.ConstantTimeCompare(gotU[:], wantU[:]) != 1 || subtle.ConstantTimeCompare(gotP[:], wantP[:]) != 1 {
			w.Header().Set("WWW-Authenticate", `Basic realm="GEKEL API docs"`)
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		mux.ServeHTTP(w, r)
	})
}
