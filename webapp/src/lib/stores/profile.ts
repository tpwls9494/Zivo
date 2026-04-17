import { create } from "zustand";
import type { ProfilePayload, ProfileResponse, UserDefaults } from "@zivo/types";
import { api } from "../api";

const CACHE_KEY = "zivo:profile";

const DEFAULT_DEFAULTS: UserDefaults = {
  default_origin: "ICN",
  preferred_cabin: "economy",
  adults: 1,
  baggage_preference: "any",
};

interface ProfileState {
  passport_given_name: string;
  passport_family_name: string;
  birth_date: string;
  gender: "M" | "F";
  nationality: string;
  phone: string;
  passport_number: string;
  passport_expiry: string;
  passport_number_masked: string;
  defaults: UserDefaults;

  loading: boolean;
  saving: boolean;
  error: string;
  saved_at: string;

  setField: <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => void;
  setDefault: <K extends keyof UserDefaults>(key: K, value: UserDefaults[K]) => void;
  load: () => Promise<void>;
  save: () => Promise<void>;
}

function loadCache(): Partial<ProfileState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Partial<ProfileState>) : {};
  } catch {
    return {};
  }
}

function saveCache(state: ProfileState) {
  if (typeof window === "undefined") return;
  // 여권번호·만료일은 로컬에 저장하지 않음
  const { passport_number, passport_expiry, ...rest } = state;
  void passport_number;
  void passport_expiry;
  localStorage.setItem(CACHE_KEY, JSON.stringify(rest));
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  passport_given_name: "",
  passport_family_name: "",
  birth_date: "",
  gender: "M",
  nationality: "KR",
  phone: "",
  passport_number: "",
  passport_expiry: "",
  passport_number_masked: "",
  defaults: DEFAULT_DEFAULTS,
  loading: false,
  saving: false,
  error: "",
  saved_at: "",

  setField: (key, value) => set({ [key]: value } as Partial<ProfileState>),
  setDefault: (key, value) =>
    set((s) => ({ defaults: { ...s.defaults, [key]: value } })),

  load: async () => {
    const cached = loadCache();
    if (cached.passport_given_name) {
      set({ ...cached, loading: false });
    }
    set({ loading: true, error: "" });
    try {
      const data = await api.getProfile();
      if ("exists" in data && data.exists === false) {
        set({ loading: false, defaults: data.defaults ?? DEFAULT_DEFAULTS });
        return;
      }
      const p = data as ProfileResponse;
      const next: Partial<ProfileState> = {
        passport_given_name: p.passport_given_name ?? "",
        passport_family_name: p.passport_family_name ?? "",
        birth_date: p.birth_date ?? "",
        gender: p.gender ?? "M",
        nationality: p.nationality ?? "KR",
        phone: p.phone ?? "",
        passport_number_masked: p.passport_number_masked ?? "",
        defaults: p.defaults ?? DEFAULT_DEFAULTS,
        loading: false,
      };
      set(next);
      saveCache({ ...get(), ...next });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  save: async () => {
    const s = get();
    set({ saving: true, error: "" });
    try {
      const payload: ProfilePayload = {
        passport_given_name: s.passport_given_name,
        passport_family_name: s.passport_family_name,
        birth_date: s.birth_date,
        gender: s.gender,
        nationality: s.nationality,
        phone: s.phone,
        ...(s.passport_number ? { passport_number: s.passport_number } : {}),
        ...(s.passport_expiry ? { passport_expiry: s.passport_expiry } : {}),
        defaults: s.defaults,
      };
      const updated = await api.upsertProfile(payload);
      const next: Partial<ProfileState> = {
        passport_number_masked: updated.passport_number_masked ?? "",
        passport_number: "",
        passport_expiry: "",
        saving: false,
        saved_at: new Date().toISOString(),
      };
      set(next);
      saveCache({ ...get(), ...next });
    } catch (e) {
      set({ saving: false, error: String(e) });
    }
  },
}));
