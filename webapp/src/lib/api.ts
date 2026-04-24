import type {
  ProfilePayload,
  ProfileResponse,
  EmptyProfileResponse,
  SearchResponse,
  BookRequest,
  BookResponse,
  BookingsListResponse,
} from "@zivo/types";
import { getOrCreateDeviceId } from "./deviceId";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const deviceId = getOrCreateDeviceId();
  const res = await fetch(path, {
    ...init,
    credentials: "include", // JWT 쿠키 자동 포함
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": deviceId,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    const err = Object.assign(new Error(`API ${res.status}: ${text}`), {
      status: res.status,
      body: text,
    });
    throw err;
  }
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  searchFlights: (body: unknown) =>
    request<SearchResponse>("/api/flights/search", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getProfile: () =>
    request<ProfileResponse | EmptyProfileResponse>("/api/profile"),
  upsertProfile: (body: ProfilePayload) =>
    request<ProfileResponse>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  book: (body: BookRequest) =>
    request<BookResponse>("/api/flights/book", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  listBookings: () => request<BookingsListResponse>("/api/bookings"),
  getMe: () => request<{ user_id: string; nickname: string | null; email: string | null; is_kakao_user: boolean }>("/api/auth/me"),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
};
