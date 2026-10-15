package httpx

import (
	"net"
	"net/http"
	"testing"
)

func nets(t *testing.T, cidrs ...string) []*net.IPNet {
	var out []*net.IPNet
	for _, c := range cidrs {
		_, n, err := net.ParseCIDR(c)
		if err != nil {
			t.Fatal(err)
		}
		out = append(out, n)
	}
	return out
}

func req(remote string, xff ...string) *http.Request {
	r, _ := http.NewRequest("GET", "/", nil)
	r.RemoteAddr = remote
	for _, v := range xff {
		r.Header.Add("X-Forwarded-For", v)
	}
	return r
}

func TestClientIP(t *testing.T) {
	trusted := nets(t, "10.0.0.0/8", "::1/128")
	cases := []struct {
		name string
		r    *http.Request
		want string
	}{
		{"direct, XFF spoof ignored", req("203.0.113.9:5000", "1.2.3.4"), "203.0.113.9"},
		{"behind proxy", req("10.0.0.5:4000", "198.51.100.7"), "198.51.100.7"},
		{"spoofed left entry ignored", req("10.0.0.5:4000", "6.6.6.6, 198.51.100.7"), "198.51.100.7"},
		{"chain of trusted proxies", req("10.0.0.5:4000", "198.51.100.7, 10.1.1.1"), "198.51.100.7"},
		{"proxy but no XFF", req("10.0.0.5:4000"), "10.0.0.5"},
		{"ipv6 direct", req("[2001:db8::1]:443"), "2001:db8::1"},
		{"garbage XFF falls back", req("10.0.0.5:4000", "not-an-ip"), "10.0.0.5"},
	}
	for _, c := range cases {
		if got := ClientIP(c.r, trusted); got != c.want {
			t.Errorf("%s: got %q want %q", c.name, got, c.want)
		}
	}
	if got := ClientIP(req("10.0.0.5:4000", "1.1.1.1"), nil); got != "10.0.0.5" {
		t.Errorf("no trusted proxies configured: got %q", got)
	}
}
