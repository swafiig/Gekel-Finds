package httpx

import (
	"net"
	"net/http"
	"strings"
)

// ClientIP returns the caller's IP. X-Forwarded-For is only honoured when the direct
// peer is a trusted proxy, and then the right-most address that is NOT a trusted proxy
// is used. This stops clients from spoofing their IP to dodge rate limits.
func ClientIP(r *http.Request, trusted []*net.IPNet) string {
	host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
	if err != nil {
		host = strings.TrimSpace(r.RemoteAddr)
	}
	peer := net.ParseIP(host)
	if peer == nil {
		return ""
	}
	if !inAny(peer, trusted) {
		return peer.String()
	}
	parts := strings.Split(strings.Join(r.Header.Values("X-Forwarded-For"), ","), ",")
	for i := len(parts) - 1; i >= 0; i-- {
		ip := net.ParseIP(strings.TrimSpace(parts[i]))
		if ip == nil {
			continue
		}
		if !inAny(ip, trusted) {
			return ip.String()
		}
	}
	return peer.String()
}

// IsHTTPS reports whether the request reached us over TLS (directly or via a trusted proxy).
func IsHTTPS(r *http.Request, trusted []*net.IPNet) bool {
	if r.TLS != nil {
		return true
	}
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	if ip := net.ParseIP(host); ip != nil && inAny(ip, trusted) {
		return strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https")
	}
	return false
}

func inAny(ip net.IP, nets []*net.IPNet) bool {
	for _, n := range nets {
		if n.Contains(ip) {
			return true
		}
	}
	return false
}
