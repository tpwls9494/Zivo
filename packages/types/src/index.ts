export interface UserDefaults {
  default_origin: string;
  preferred_cabin: "economy" | "premium_economy" | "business" | "first";
  adults: number;
  baggage_preference: "carry_only" | "checked" | "any";
}

export interface ProfilePayload {
  passport_given_name: string;
  passport_family_name: string;
  birth_date: string;
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
  return_at: string | null;  // 왕복 오퍼의 귀국 출발 시각
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
  adults?: number;
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

export interface PassengerItem {
  id: string;
  nickname: string;
  passport_given_name: string;
  passport_family_name: string;
  birth_date: string;
  gender: "M" | "F";
  nationality: string;
  phone: string;
  passport_number_masked: string | null;
  is_primary: boolean;
}

export interface PassengerPayload {
  nickname: string;
  passport_given_name: string;
  passport_family_name: string;
  birth_date: string;
  gender: "M" | "F";
  nationality: string;
  phone: string;
  passport_number?: string;
  passport_expiry?: string;
  is_primary?: boolean;
}
