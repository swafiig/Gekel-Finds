package catalog

import (
	"net/http"

	"github.com/geofreysakayo/gekel-finds-auth/internal/httpx"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Category struct {
    ID       string `json:"id"`
    Name     string `json:"name"`
    Subtitle string `json:"subtitle"`
    Icon     string `json:"icon"`
    ImageURL string `json:"image_url"`
    Color    string `json:"color"`
}

type Handler struct{ DB *pgxpool.Pool }

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
    rows, err := h.DB.Query(r.Context(), `SELECT id, name, subtitle, icon, image_url, color FROM categories ORDER BY name`)
    if err != nil { httpx.Error(w, r, http.StatusInternalServerError, "db_error", "Could not load categories", nil); return }
    defer rows.Close()
    out := []Category{}
    for rows.Next() {
        var c Category
        if err := rows.Scan(&c.ID, &c.Name, &c.Subtitle, &c.Icon, &c.ImageURL, &c.Color); err == nil {
            out = append(out, c)
        }
    }
    httpx.JSON(w, http.StatusOK, map[string]any{"categories": out})
}

func (h Handler) ListSubcategories(w http.ResponseWriter, r *http.Request) {
    cat := r.URL.Query().Get("category")
    rows, err := h.DB.Query(r.Context(), `SELECT id, category_id, name, COALESCE(image_url,'') FROM subcategories WHERE category_id = $1 ORDER BY name`, cat)
    if err != nil { httpx.Error(w, r, http.StatusInternalServerError, "db_error", "Could not load subcategories", nil); return }
    defer rows.Close()
    out := []map[string]string{}
    for rows.Next() {
        var id, catID, name, img string
        if err := rows.Scan(&id, &catID, &name, &img); err == nil {
            out = append(out, map[string]string{"id": id, "category_id": catID, "name": name, "image_url": img})
        }
    }
    httpx.JSON(w, http.StatusOK, map[string]any{"subcategories": out})
}