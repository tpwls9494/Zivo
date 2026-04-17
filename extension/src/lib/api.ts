import { getOrCreateDeviceId } from "./storage";

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? "http://localhost:8000" : "https://api.zivo.app");

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

export interface UserDefaults {
  default_origin: string;
  preferred_cabin: "economy" | "premium_economy" | "business" | "first";
  adults: number;
  baggage_preference: "carry_only" | "checked" | "any";
}

export interface ProfilePayload {
  passport_given_name: string;
  passport_family_name: string;
  birth_date: string; // YYYY-MM-DD
  gender: "M" | "F";
  nationality: string;
  phone: string;
  passport_number?: string;
  passport_expiry?: string;
  defaults?: UserDefaults;
}

export interface ProfileResponse {
  passport_given_name: string;
  passport_family_name: string;
  birth_date: string;
  gender: "M" | "F";
  nationality: string;
  phone: string;
  passport_number_masked?: string;
  passport_expiry?: string;
  defaults?: UserDefaults;
}

export interface EmptyProfileResponse {
  exists: false;
  defaults: UserDefaults;
}

export interface NormalizedOffer {
  offer_id: string;
  carrier: string;
  carrier_iata: string;
  departure_iata: string;
  arrival_iata: string;
  departure_at: string;
  arrival_at: string;
  duration_minutes: number;
  stops: number;
  baggage_checked_kg: number;
  total_krw: number;
}

export interface ComboOffer {
  outbound: NormalizedOffer;
  inbound: NormalizedOffer;
  total_krw: number;
  savings_krw: number;
  savings_pct: number;
  is_same_carrier: boolean;
}

export interface SearchResponse {
  offers: NormalizedOffer[];
  combos: ComboOffer[];
  baseline_roundtrip_krw: number | null;
  cached: boolean;
}

export interface BookRequest {
  offer: NormalizedOffer;
  direction?: string;
  combo_inbound?: NormalizedOffer;
  combo_group_id?: string;
}

export interface BookingDetail {
  booking_id: string;
  direction: string;
  deep_link_url: string;
  combo_group_id: string | null;
}

export interface BookResponse {
  bookings: BookingDetail[];
}

export interface BookingItem {
  id: string;
  direction: string;
  carrier_iata: string;
  origin: string;
  destination: string;
  departure_at: string;
  arrival_at: string;
  total_krw: number;
  status: string;
  combo_group_id: string | null;
  created_at: string | null;
}

export interface BookingsListResponse {
  items: BookingItem[];
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  searchFlights: (body: unknown) =>
    request<SearchResponse>("/api/flights/search", { method: "POST", body: JSON.stringify(body) }),
  getProfile: () => request<ProfileResponse | EmptyProfileResponse>("/api/profile"),
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
};
