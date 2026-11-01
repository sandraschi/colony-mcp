// Same-origin by default (vite proxy forwards /api + /mcp to the backend).
// Absolute backend URL only behind a Tauri gate (real browser tabs on
// http://goliath:10971 die on CORS with a hardcoded localhost URL).
declare const window: unknown;
function hasTauri(): boolean {
  const w = window as Record<string, unknown>;
  return "__TAURI__" in w || "__TAURI_INTERNALS__" in w;
}
export const API_BASE = hasTauri() ? "http://127.0.0.1:10970" : "";
