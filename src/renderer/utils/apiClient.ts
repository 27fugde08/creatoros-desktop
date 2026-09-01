// Centralized Native Desktop IPC & Local WebSocket Bridge Configuration

export const BACKEND_BASE_URL = "";
export const BACKEND_WS_URL = "ws://127.0.0.1:8765";

/**
 * Returns full API URL with base url prepended
 * @param path API endpoint path (e.g. "/api/ai/highlight" or "api/ai/highlight")
 */
export function getApiUrl(path: string = ""): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_BASE_URL}${normalizedPath}`;
}

/**
 * Unified API Fetch wrapper that automatically targets backend API routes
 * Handles JSON serialization, headers, and error parsing
 */
export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<{ ok: boolean; status: number; data: T; headers: Headers }> {
  const url = path.startsWith("http://") || path.startsWith("https://")
    ? path
    : getApiUrl(path);

  const defaultHeaders: Record<string, string> = {
    "Accept": "application/json",
  };

  if (options?.body && typeof options.body === "string" && !options.headers) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options?.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  let data: any = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data: data as T,
    headers: response.headers,
  };
}
