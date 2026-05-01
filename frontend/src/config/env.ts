const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

export const API_BASE_URL = trimTrailingSlashes(
  import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "",
);

export const API_PREFIX = API_BASE_URL ? `${API_BASE_URL}/api` : "/api";

export const APP_BASE_URL = (() => {
  const explicit = import.meta.env.VITE_APP_URL || import.meta.env.NEXT_PUBLIC_APP_URL || "";
  if (explicit) {
    return trimTrailingSlashes(explicit);
  }

  if (typeof window !== "undefined") {
    return trimTrailingSlashes(window.location.origin);
  }

  return "";
})();

export const DOCS_URL = (() => {
  const explicit = import.meta.env.VITE_DOCS_URL || import.meta.env.NEXT_PUBLIC_DOCS_URL || "";
  if (explicit) {
    return trimTrailingSlashes(explicit);
  }

  // Default to the same origin with /docs path
  if (typeof window !== "undefined") {
    return trimTrailingSlashes(window.location.origin);
  }

  return "https://corridor-flax.vercel.app";
})();

export const withApiPath = (path: string): string => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_PREFIX}${normalized}`;
};

export const WS_URL = (() => {
  const explicit = import.meta.env.VITE_WS_URL || "";
  if (explicit) {
    return trimTrailingSlashes(explicit);
  }

  if (API_BASE_URL) {
    try {
      const parsed = new URL(API_BASE_URL);
      const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${parsed.host}/ws`;
    } catch {
      // Fall through to same-origin computed value.
    }
  }

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
  }

  return "/ws";
})();
