package auth

import (
	"context"
	"errors"
	"log/slog"
	"net"
	"net/http"

	"github.com/google/uuid"

	"github.com/geofreysakayo/gekel-finds-auth/internal/httpx"
)

type Handler struct {
	Svc     Service
	Log     *slog.Logger
	Trusted []*net.IPNet
}

func (h Handler) meta(r *http.Request) ClientMeta {
	ua := r.UserAgent()
	if len(ua) > 300 {
		ua = ua[:300]
	}
	dev := r.Header.Get("X-Client")
	if len(dev) > 80 {
		dev = dev[:80]
	}
	return ClientMeta{IP: httpx.ClientIP(r, h.Trusted), UserAgent: ua, Device: dev}
}

// Meta exposes request metadata (IP, user agent, device) to other packages.
func (h Handler) Meta(r *http.Request) ClientMeta { return h.meta(r) }

// WriteError maps domain errors to HTTP responses. Exported so other packages reuse the same mapping.
func (h Handler) WriteError(w http.ResponseWriter, r *http.Request, err error) {
	var ve *ValidationError
	var rl *RateLimitError
	switch {
	case errors.As(err, &ve):
		httpx.Error(w, r, http.StatusUnprocessableEntity, "validation_failed", "Please fix the highlighted fields", ve.Fields)
	case errors.As(err, &rl):
		msg := "Too many attempts. Please wait before trying again."
		switch rl.Code {
		case "account_locked":
			msg = "Too many failed sign-in attempts. Try again later, or reset your password."
		case "otp_cooldown":
			msg = "A code was just sent. Wait a moment before requesting another."
		}
		httpx.TooMany(w, r, rl.RetryAfter, rl.Code, msg)
	case errors.Is(err, ErrInvalidCredentials):
		httpx.Error(w, r, http.StatusUnauthorized, "invalid_credentials", "Incorrect phone, email or password", nil)
	case errors.Is(err, ErrAccountDisabled):
		httpx.Error(w, r, http.StatusForbidden, "account_disabled", "This account has been disabled. Contact support", nil)
	case errors.Is(err, ErrAccountExists):
		httpx.Error(w, r, http.StatusConflict, "account_exists", "An account with this phone number or email already exists", nil)
	case errors.Is(err, ErrInvalidRefresh):
		httpx.Error(w, r, http.StatusUnauthorized, "invalid_refresh", "Your session has expired. Please sign in again", nil)
	case errors.Is(err, ErrInvalidOTP):
		httpx.Error(w, r, http.StatusBadRequest, "invalid_code", "That code is incorrect or has expired", nil)
	case errors.Is(err, ErrInvalidResetToken):
		httpx.Error(w, r, http.StatusBadRequest, "invalid_reset_token", "This reset link has expired. Start again", nil)
	case errors.Is(err, ErrWrongPassword):
		httpx.Error(w, r, http.StatusBadRequest, "wrong_password", "Your current password is incorrect", map[string]string{"current_password": "Incorrect password"})
	case errors.Is(err, ErrAlreadyVerified):
		httpx.Error(w, r, http.StatusConflict, "already_verified", "Your phone number is already verified", nil)
	case errors.Is(err, ErrDelivery):
		httpx.Error(w, r, http.StatusBadGateway, "delivery_failed", "We could not send the SMS. Try again shortly", nil)
	case errors.Is(err, ErrNotFound):
		httpx.Error(w, r, http.StatusNotFound, "not_found", "Not found", nil)
	case errors.Is(err, context.DeadlineExceeded), errors.Is(err, context.Canceled):
		httpx.Error(w, r, http.StatusServiceUnavailable, "timeout", "The request took too long. Try again", nil)
	default:
		h.Log.Error("request failed", "request_id", httpx.RequestID(r.Context()), "err", err)
		httpx.Error(w, r, http.StatusInternalServerError, "internal_error", "Something went wrong on our side", nil)
	}
}

type registerReq struct {
	FullName string `json:"full_name"`
	Phone    string `json:"phone"`
	Email    string `json:"email"`
	Password string `json:"password"`
}
type loginReq struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}
type refreshReq struct {
	RefreshToken string `json:"refresh_token"`
}
type forgotReq struct {
	Identifier string `json:"identifier"`
}
type verifyReq struct {
	Identifier string `json:"identifier"`
	Code       string `json:"code"`
}
type resetReq struct {
	ResetToken  string `json:"reset_token"`
	NewPassword string `json:"new_password"`
}
type changeReq struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func (h Handler) Register(w http.ResponseWriter, r *http.Request) {
	var in registerReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	u, t, err := h.Svc.Register(r.Context(), RegisterInput{FullName: in.FullName, Phone: in.Phone, Email: in.Email, Password: in.Password}, h.meta(r))
	if err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, AuthResponse{User: u, Tokens: t})
}

func (h Handler) Login(w http.ResponseWriter, r *http.Request) {
	var in loginReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	if len(in.Identifier) > 254 || len(in.Password) > 1024 || in.Identifier == "" || in.Password == "" {
		h.WriteError(w, r, ErrInvalidCredentials)
		return
	}
	u, t, err := h.Svc.Login(r.Context(), in.Identifier, in.Password, h.meta(r))
	if err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, AuthResponse{User: u, Tokens: t})
}

func (h Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var in refreshReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	u, t, err := h.Svc.Refresh(r.Context(), in.RefreshToken, h.meta(r))
	if err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, AuthResponse{User: u, Tokens: t})
}

func (h Handler) Logout(w http.ResponseWriter, r *http.Request) {
	c, _ := ClaimsFrom(r.Context())
	var in refreshReq
	if r.ContentLength != 0 && !httpx.DecodeJSON(w, r, &in) {
		return
	}
	if err := h.Svc.Logout(r.Context(), c, in.RefreshToken, h.meta(r)); err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.NoContent(w)
}

func (h Handler) LogoutAll(w http.ResponseWriter, r *http.Request) {
	c, _ := ClaimsFrom(r.Context())
	if err := h.Svc.LogoutAll(r.Context(), c.UserID, "logout_all", h.meta(r)); err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.NoContent(w)
}

func (h Handler) Me(w http.ResponseWriter, r *http.Request) {
	c, _ := ClaimsFrom(r.Context())
	u, err := h.Svc.Me(r.Context(), c.UserID)
	if err != nil || !u.IsActive {
		httpx.Error(w, r, http.StatusUnauthorized, "unauthenticated", "Sign in to continue", nil)
		return
	}
	httpx.JSON(w, http.StatusOK, u)
}

func (h Handler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	c, _ := ClaimsFrom(r.Context())
	var in changeReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	if err := h.Svc.ChangePassword(r.Context(), c, in.CurrentPassword, in.NewPassword, h.meta(r)); err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.NoContent(w)
}

func (h Handler) Sessions(w http.ResponseWriter, r *http.Request) {
	c, _ := ClaimsFrom(r.Context())
	list, err := h.Svc.Sessions(r.Context(), c)
	if err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"sessions": list})
}

func (h Handler) RevokeSession(w http.ResponseWriter, r *http.Request) {
	c, _ := ClaimsFrom(r.Context())
	id := r.PathValue("id")
	if _, err := uuid.Parse(id); err != nil {
		httpx.Error(w, r, http.StatusBadRequest, "invalid_id", "Invalid session id", nil)
		return
	}
	if err := h.Svc.RevokeSession(r.Context(), c, id, h.meta(r)); err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.NoContent(w)
}

type phoneVerifyReq struct {
	Code string `json:"code"`
}

func (h Handler) SendPhoneCode(w http.ResponseWriter, r *http.Request) {
	c, _ := ClaimsFrom(r.Context())
	if err := h.Svc.SendPhoneCode(r.Context(), c, h.meta(r)); err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]any{"message": "We sent a 6-digit code by SMS to your phone number.", "resend_after_seconds": 60})
}

func (h Handler) VerifyPhone(w http.ResponseWriter, r *http.Request) {
	c, _ := ClaimsFrom(r.Context())
	var in phoneVerifyReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	u, err := h.Svc.VerifyPhone(r.Context(), c, in.Code, h.meta(r))
	if err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, u)
}

func (h Handler) ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var in forgotReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	if err := h.Svc.RequestPasswordReset(r.Context(), in.Identifier, h.meta(r)); err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusAccepted, map[string]any{
		"message":              "If an account exists, we sent a 6-digit code by SMS to the phone number on it.",
		"resend_after_seconds": 60,
	})
}

func (h Handler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var in verifyReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	tok, err := h.Svc.VerifyResetOTP(r.Context(), in.Identifier, in.Code, h.meta(r))
	if err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"reset_token": tok, "expires_in": int(h.Svc.ResetTTL.Seconds())})
}

func (h Handler) ResetPassword(w http.ResponseWriter, r *http.Request) {
	var in resetReq
	if !httpx.DecodeJSON(w, r, &in) {
		return
	}
	if err := h.Svc.ResetPassword(r.Context(), in.ResetToken, in.NewPassword, h.meta(r)); err != nil {
		h.WriteError(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"message": "Password updated. Please sign in with your new password."})
}
