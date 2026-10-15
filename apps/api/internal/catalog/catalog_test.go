package catalog

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCategoriesAreWellFormed(t *testing.T) {
	seen := map[string]bool{}
	for _, c := range Categories() {
		if c.ID == "" || c.Name == "" || c.Icon == "" || c.Color == "" {
			t.Errorf("incomplete category: %+v", c)
		}
		if seen[c.ID] {
			t.Errorf("duplicate id %q", c.ID)
		}
		seen[c.ID] = true
	}
	if len(seen) < 10 {
		t.Errorf("expected a proper catalogue, got %d categories", len(seen))
	}
}

func TestCategoriesReturnsACopy(t *testing.T) {
	a := Categories()
	a[0].Name = "HACKED"
	if Categories()[0].Name == "HACKED" {
		t.Fatal("callers must not be able to change the master list")
	}
}

func TestListHandler(t *testing.T) {
	rec := httptest.NewRecorder()
	Handler{}.List(rec, httptest.NewRequest("GET", "/api/v1/categories", nil))
	if rec.Code != http.StatusOK {
		t.Fatalf("status %d", rec.Code)
	}
	if rec.Header().Get("Cache-Control") != "public, max-age=3600" {
		t.Errorf("Cache-Control = %q", rec.Header().Get("Cache-Control"))
	}
	var body struct {
		Categories []Category `json:"categories"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil || len(body.Categories) == 0 {
		t.Fatalf("bad body: %v %s", err, rec.Body.String())
	}
}
