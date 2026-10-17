// Package users exposes the signed-in user's profile and role-gated admin endpoints.
package users

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/geofreysakayo/gekel-finds-auth/internal/auth"
	"github.com/geofreysakayo/gekel-finds-auth/internal/httpx"
)

type Handler struct {
	Auth auth.Handler
}

func (h Handler) st() auth.Store    { return h.Auth.Svc.Store }
func (h Handler) svc() auth.Service { return h.Auth.Svc }

type updateMeReq struct {
	FullName *string `json:"full_name"`
	Email    *string `json:"email"` // "" removes the email
}

// UpdateMe lets a user change their own name and email. Phone changes need OTP verification and are not offered here.
func (h Handler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	c, _ := auth.ClaimsFrom(r.Context())
	var in updateMeReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	if in.FullName == nil && in.Email == nil {
		h.Auth.WriteError(w, r, &auth.ValidationError{Fields: map[string]string{"_": "Provide full_name and/or email"}})
		return
	}
	cur, err := h.st().UserByID(r.Context(), c.UserID)
	if err != nil {
		h.Auth.WriteError(w, r, err)
		return
	}
	fields := map[string]string{}
	name, email := cur.FullName, cur.Email
	if in.FullName != nil {
		n, err := auth.NormalizeName(*in.FullName)
		if err != nil {
			fields["full_name"] = err.Error()
		} else {
			name = n
		}
	}
	if in.Email != nil {
		if strings.TrimSpace(*in.Email) == "" {
			email = nil
		} else if e, err := auth.NormalizeEmail(*in.Email); err != nil {
			fields["email"] = err.Error()
		} else {
			email = &e
		}
	}
	if len(fields) > 0 {
		h.Auth.WriteError(w, r, &auth.ValidationError{Fields: fields})
		return
	}
	u, err := h.st().UpdateProfile(r.Context(), c.UserID, name, email)
	if err != nil {
		h.Auth.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, u)
}

/* ───────────── Admin / staff ───────────── */

func (h Handler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	limit := 20
	if v := q.Get("limit"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 || n > 100 {
			httpx.Error(w, r, http.StatusBadRequest, "invalid_limit", "limit must be between 1 and 100", nil)
			return
		}
		limit = n
	}
	search := strings.TrimSpace(q.Get("q"))
	if len(search) > 64 {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_query", "q must be at most 64 characters", nil)
		return
	}
	role := auth.Role(q.Get("role"))
	if role != "" && !role.Valid() {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_role", "Unknown role", nil)
		return
	}
	list, next, err := h.st().ListUsers(r.Context(), search, role, limit, q.Get("cursor"))
	if err != nil {
		if err.Error() == "invalid cursor" {
			httpx.Error(w, r, http.StatusBadRequest, "invalid_cursor", "Invalid cursor", nil)
			return
		}
		h.Auth.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"users": list, "next_cursor": next})
}

func (h Handler) Get(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if _, err := uuid.Parse(id); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", "Invalid user id", nil)
		return
	}
	u, err := h.st().UserByID(r.Context(), id)
	if err != nil {
		h.Auth.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, u)
}

// target loads the user an admin action applies to and enforces who may touch whom.
func (h Handler) target(w http.ResponseWriter, r *http.Request) (actor auth.Claims, t auth.User, ok bool) {
	actor, _ = auth.ClaimsFrom(r.Context())
	id := r.PathValue("id")
	if _, err := uuid.Parse(id); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", "Invalid user id", nil)
		return
	}
	if id == actor.UserID {
		httpx.Error(w, r, http.StatusBadRequest, "not_allowed", "You cannot change your own status or role here", nil)
		return
	}
	t, err := h.st().UserByID(r.Context(), id)
	if err != nil {
		h.Auth.WriteError(w, r, err)
		return
	}
	// Admins manage ordinary accounts only; staff/admin/super_admin accounts need a super_admin.
	if t.Role.Privileged() && actor.Role != auth.RoleSuperAdmin {
		httpx.Error(w, r, http.StatusForbidden, "forbidden", "Only a super admin can change this account", nil)
		return
	}
	return actor, t, true
}

type statusReq struct {
	IsActive *bool `json:"is_active"`
}

func (h Handler) SetStatus(w http.ResponseWriter, r *http.Request) {
	var in statusReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	if in.IsActive == nil {
		h.Auth.WriteError(w, r, &auth.ValidationError{Fields: map[string]string{"is_active": "Required"}})
		return
	}
	actor, t, ok := h.target(w, r)
	if !ok {
		return
	}
	u, err := h.st().SetActive(r.Context(), t.ID, *in.IsActive)
	if err != nil {
		h.Auth.WriteError(w, r, err)
		return
	}
	if !*in.IsActive { // sign the user out of every device right now
		_ = h.svc().LogoutAll(r.Context(), t.ID, "account_disabled", h.Auth.Meta(r))
	}
	h.svc().AuditAdmin(r.Context(), actor.UserID, "admin_set_status", h.Auth.Meta(r), map[string]any{"target": t.ID, "is_active": *in.IsActive})
	httpx.JSON(w, http.StatusOK, u)
}

type roleReq struct {
	Role auth.Role `json:"role"`
}

// SetRole is super_admin only (enforced by the router).
func (h Handler) SetRole(w http.ResponseWriter, r *http.Request) {
	var in roleReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	if !in.Role.Valid() {
		h.Auth.WriteError(w, r, &auth.ValidationError{Fields: map[string]string{"role": "Unknown role"}})
		return
	}
	actor, t, ok := h.target(w, r)
	if !ok {
		return
	}
	u, err := h.st().SetRole(r.Context(), t.ID, in.Role)
	if err != nil {
		h.Auth.WriteError(w, r, err)
		return
	}
	_ = h.svc().LogoutAll(r.Context(), t.ID, "role_changed", h.Auth.Meta(r)) // old tokens carry the old role
	h.svc().AuditAdmin(r.Context(), actor.UserID, "admin_set_role", h.Auth.Meta(r), map[string]any{"target": t.ID, "from": t.Role, "to": in.Role})
	httpx.JSON(w, http.StatusOK, u)
}
type pushTokenReq struct {
	Token string `json:"token"`
}


func (h Handler) UpdatePushToken(w http.ResponseWriter, r *http.Request) {
	// 1. Get the user ID from the auth context
	claims, ok := auth.ClaimsFrom(r.Context())
	if !ok {
		httpx.Error(w, r, http.StatusUnauthorized, "unauthenticated", "Sign in to continue", nil)
		return
	}

	// 2. Decode the JSON body
	var in pushTokenReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}

	if in.Token == "" {
		httpx.Error(w, r, http.StatusUnprocessableEntity, "validation_failed", "Token is required", nil)
		return
	}

	// 3. Save to database (using the Auth handler's Store)
	if err := h.st().UpdatePushToken(r.Context(), claims.UserID, in.Token); err != nil {
		h.Auth.WriteError(w, r, err)
		return
	}

	// 4. Return 204 No Content
	httpx.NoContent(w)
}

type notificationItem struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	Type      string    `json:"type"`
	RefID     string    `json:"reference_id,omitempty"`
	IsRead    bool      `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
}

// ListNotifications returns the user's in-app notification history.
func (h Handler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	c, _ := auth.ClaimsFrom(r.Context())
	rows, err := h.st().DB.Query(r.Context(), `
		SELECT id, title, body, type, COALESCE(reference_id, ''), is_read, created_at
		FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`, c.UserID)
	if err != nil {
		h.Auth.WriteError(w, r, err)
		return
	}
	defer rows.Close()

	out := []notificationItem{}
	for rows.Next() {
		var n notificationItem
		if err := rows.Scan(&n.ID, &n.Title, &n.Body, &n.Type, &n.RefID, &n.IsRead, &n.CreatedAt); err == nil {
			out = append(out, n)
		}
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"notifications": out})
}

// MarkNotificationsRead sets is_read = true for all of the user's notifications.
func (h Handler) MarkNotificationsRead(w http.ResponseWriter, r *http.Request) {
	c, _ := auth.ClaimsFrom(r.Context())
	_, err := h.st().DB.Exec(r.Context(), `UPDATE user_notifications SET is_read = TRUE WHERE user_id = $1`, c.UserID)
	if err != nil {
		h.Auth.WriteError(w, r, err)
		return
	}
	httpx.NoContent(w)
}