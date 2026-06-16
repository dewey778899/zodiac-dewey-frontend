export const API_BASE = (() => {
  if (!location.port || location.port === "80" || location.port === "443") return "";
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    return location.port === "8080" ? "" : "http://localhost:8080";
  }
  if (
    location.hostname.startsWith("10.") ||
    location.hostname.startsWith("192.168.") ||
    location.hostname.startsWith("172.")
  ) {
    return `http://${location.hostname}:8080`;
  }
  return "";
})();

export const ADMIN_TOKEN_KEY = "zodiac_admin_token";

export async function api(path, options = {}, token = "") {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) headers["X-Admin-Token"] = token;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `请求失败 (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}
