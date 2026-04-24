import type {
  ProfilePayload,
  ProfileResponse,
  EmptyProfileResponse,
  SearchResponse,
  BookRequest,
  BookResponse,
  BookingsListResponse,
  PassengerItem,
  PassengerPayload,
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
  // 204 No Content (DELETE 등) — 바디 없으므로 json() 호출 안 함
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export { request };

export const api = {
  request,
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
  listPassengers: () => request<PassengerItem[]>("/api/passengers"),
  createPassenger: (body: PassengerPayload) =>
    request<PassengerItem>("/api/passengers", { method: "POST", body: JSON.stringify(body) }),
  updatePassenger: (id: string, body: PassengerPayload) =>
    request<PassengerItem>(`/api/passengers/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deletePassenger: (id: string) =>
    request<void>(`/api/passengers/${id}`, { method: "DELETE" }),
};
