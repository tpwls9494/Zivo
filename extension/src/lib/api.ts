import { getOrCreateDeviceId } from "./storage";

const API_BASE = import.meta.env.DEV ? "http://localhost:8000" : "https://api.zivo.app";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const deviceId = await getOrCreateDeviceId();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": deviceId,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  searchFlights: (body: unknown) =>
    request("/api/flights/search", { method: "POST", body: JSON.stringify(body) }),
  getProfile: () => request("/api/profile"),
  upsertProfile: (body: unknown) =>
    request("/api/profile", { method: "PUT", body: JSON.stringify(body) }),
};
