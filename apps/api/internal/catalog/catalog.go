// Package catalog serves reference data about what GEKEL sells.
// Right now the categories live in this file. Later they can move to a Postgres table
// without changing the endpoint the apps call.
package catalog

import (
	"net/http"

	"github.com/geofreysakayo/gekel-finds-auth/internal/httpx"
)

// Category is one "aisle" in the app. Names are Kenyan on purpose: people search the way they talk.
type Category struct {
	ID       string `json:"id"`       // stable key used in URLs and the database
	Name     string `json:"name"`     // what the shopper sees
	Subtitle string `json:"subtitle"` // plain-English hint under the name
	Icon     string `json:"icon"`     // Ionicons name the apps draw
	Color    string `json:"color"`    // soft tint behind the icon
}

var categories = []Category{
	{"viatu", "Viatu Mtaani", "Shoes, sneakers & sandals", "footsteps", "#FBE3D3"},
	{"mavazi", "Mavazi", "Clothes for the whole family", "shirt", "#F3E3D2"},
	{"mtumba", "Mtumba Gems", "Quality second-hand finds", "pricetags", "#E9E5E0"},
	{"vito", "Vito & Mikoba", "Bags, watches & accessories", "watch", "#E4E8EE"},
	{"simu", "Simu & Gadgets", "Phones, buds & chargers", "phone-portrait", "#E6E3DE"},
	{"duka-la-mama", "Duka la Mama", "Kitchen & household", "restaurant", "#FDEBC8"},
	{"nyumba", "Nyumba Poa", "Home, curtains & décor", "home", "#F6E7DA"},
	{"fundi", "Fundi Tools", "Hardware & workshop tools", "hammer", "#DDE6EE"},
	{"kiosk", "Kiosk Stock", "Bulk for shops & kiosks", "cube", "#E3F1E4"},
	{"saloon", "Saloon & Kinyozi", "Hair, beauty & barber kit", "cut", "#FBE4EA"},
	{"shule", "Shule Ready", "School wear & stationery", "school", "#E3E8F8"},
	{"mtoto", "Mama & Mtoto", "Baby & kids", "happy", "#FFF1C9"},
	{"boda", "Boda & Auto", "Motorbike & car spares", "speedometer", "#E6E6E6"},
	{"harusi", "Harusi & Events", "Weddings, parties & church", "sparkles", "#F7E3F5"},
	{"mkulima", "Mkulima Inputs", "Seeds, feeds & farm tools", "leaf", "#E3F1D9"},
}

// Categories returns a copy so callers cannot change the master list by accident.
func Categories() []Category {
	out := make([]Category, len(categories))
	copy(out, categories)
	return out
}

type Handler struct{}

// List answers GET /api/v1/categories. It is public and the same for everyone, so it may be cached for an hour.
func (Handler) List(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Cache-Control", "public, max-age=3600")
	httpx.JSON(w, http.StatusOK, map[string]any{"categories": Categories()})
}
