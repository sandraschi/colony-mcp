const TIMEOUT_MS = 30_000;

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const r = await fetch(url, { ...init, signal: controller.signal });
    if (!r.ok) {
      let detail = `HTTP ${r.status}`;
      try {
        const body = await r.json();
        detail = body.detail || body.error || body.message || detail;
      } catch {
        detail = (await r.text()) || detail;
      }
      throw new Error(detail);
    }
    return (await r.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}

export interface HealthResponse {
  status: string;
  port: number;
  version: string;
  safety_mode?: string;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  author_username: string;
  colony: string;
  score: number;
  created_at: string;
  post_type: string;
}

export interface Comment {
  id: string;
  body: string;
  author_username: string;
  score: number;
  parent_id: string | null;
  created_at: string;
}

export interface Colony {
  id: string;
  name: string;
  description: string;
  member_count: number;
}

export interface Conversation {
  username: string;
  last_message: string;
  unread_count: number;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
}
