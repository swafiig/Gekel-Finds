package products

import (
	"net/http"
	"strconv"

	"github.com/geofreysakayo/gekel-finds-auth/internal/httpx"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Product struct {
    ID          string  `json:"id"`
    SupplierID  string  `json:"supplier_id"`
    CategoryID  string  `json:"category_id"`
    Subcategory string  `json:"subcategory,omitempty"`
    Name        string  `json:"name"`
    Description string  `json:"description"`
    Price       int     `json:"price"`
    OldPrice    *int    `json:"old_price,omitempty"`
    ImageURL    string  `json:"image_url"`
    IsFlashSale bool    `json:"is_flash_sale"`
}

type Supplier struct {
    ID          string  `json:"id"`
    ShopName    string  `json:"shop_name"`
    Market      string  `json:"market"`
    Rating      float64 `json:"rating"`
    ReviewCount int     `json:"review_count"`
    Verified    bool    `json:"verified"`
}

type Handler struct {
    DB *pgxpool.Pool
}

// ListProducts answers GET /api/v1/products?category=shoes&supplier=<uuid>
func (h Handler) ListProducts(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()
    cat := r.URL.Query().Get("category")
    sup := r.URL.Query().Get("supplier")

    query := `SELECT id, supplier_id, category_id, COALESCE(sc.name,''), name, description, price, old_price, image_url, is_flash_sale
              FROM products p LEFT JOIN subcategories sc ON p.subcategory_id = sc.id
              WHERE is_active = TRUE`
    args := []any{}
    if cat != "" {
        args = append(args, cat)
        query += ` AND category_id = $` + strconv.Itoa(len(args))
    }
    if sup != "" {
        args = append(args, sup)
        query += ` AND supplier_id = $` + strconv.Itoa(len(args))
    }
    query += ` ORDER BY created_at DESC LIMIT 100`

    rows, err := h.DB.Query(ctx, query, args...)
    if err != nil {
        httpx.Error(w, r, http.StatusInternalServerError, "db_error", "Could not load products", nil)
        return
    }
    defer rows.Close()

    out := []Product{}
    for rows.Next() {
        var p Product
        if err := rows.Scan(&p.ID, &p.SupplierID, &p.CategoryID, &p.Subcategory, &p.Name, &p.Description, &p.Price, &p.OldPrice, &p.ImageURL, &p.IsFlashSale); err == nil {
            out = append(out, p)
        }
    }
    httpx.JSON(w, http.StatusOK, map[string]any{"products": out})
}

// ListSuppliers answers GET /api/v1/suppliers
func (h Handler) ListSuppliers(w http.ResponseWriter, r *http.Request) {
    rows, err := h.DB.Query(r.Context(), `SELECT id, shop_name, market, rating, review_count, verified FROM supplier_profiles ORDER BY rating DESC LIMIT 50`)
    if err != nil {
        httpx.Error(w, r, http.StatusInternalServerError, "db_error", "Could not load suppliers", nil)
        return
    }
    defer rows.Close()
    out := []Supplier{}
    for rows.Next() {
        var s Supplier
        if err := rows.Scan(&s.ID, &s.ShopName, &s.Market, &s.Rating, &s.ReviewCount, &s.Verified); err == nil {
            out = append(out, s)
        }
    }
    httpx.JSON(w, http.StatusOK, map[string]any{"suppliers": out})
}