package main

import (
	"net/http"
	"os"
	"strings"
)

func trimURLBase(base string) string {
	return strings.TrimRight(strings.TrimSpace(base), "/")
}

func requestBaseURL(r *http.Request) string {
	scheme := "http"
	if proto := strings.TrimSpace(r.Header.Get("X-Forwarded-Proto")); proto != "" {
		scheme = proto
	} else if r.TLS != nil {
		scheme = "https"
	}
	return scheme + "://" + r.Host
}

func (h *Handler) appBaseURL(r *http.Request) string {
	if base := trimURLBase(os.Getenv("PUBLIC_APP_URL")); base != "" {
		return base
	}
	return requestBaseURL(r)
}
