import { create } from "zustand";
import {
  loadDefaults as loadFromStorage,
  saveDefaults,
  loadProfileCache,
  saveProfileCache,
} from "./storage";
import { api, type ProfilePayload, type UserDefaults } from "./api";

type SearchFields = "origin" | "destination" | "depart" | "ret";

interface SearchState {
  origin: string;
  destination: string;
  depart: string;
  ret: string;
  setField: (field: SearchFields, value: string) => void;
  loadDefaults: () => Promise<void>;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  origin: "ICN",
  destination: "",
  depart: "",
  ret: "",
  setField: (field, value) => {
    set({ [field]: value } as Pick<SearchState, SearchFields>);
    void saveDefaults({
      origin: get().origin,
      destination: get().destination,
    });
  },
  loadDefaults: async () => {
    const saved = await loadFromStorage();
    if (saved) set(saved);
  },
}));

const DEFAULT_USER_DEFAULTS: UserDefaults = {
  default_origin: "ICN",
  preferred_cabin: "economy",
  adults: 1,
  baggage_preference: "any",
};

export interface ProfileFormState {
  passport_given_name: string;
  passport_family_name: string;
  birth_date: string;
  gender: "M" | "F";
  nationality: string;
  phone: string;
  passport_number: string;
  passport_expiry: string;
  defaults: UserDefaults;
  passport_number_masked: string | null;
  // UI state
  loading: boolean;
  saving: boolean;
  error: string | null;
  saved_at: number | null;
  exists: boolean;

  setField: <K extends keyof Omit<ProfileFormState, "defaults" | "setField" | "setDefault" | "load" | "save">>(
    key: K,
    value: ProfileFormState[K]
  ) => void;
  setDefault: <K extends keyof UserDefaults>(key: K, value: UserDefaults[K]) => void;
  load: () => Promise<void>;
  save: () => Promise<void>;
}

export const useProfileStore = create<ProfileFormState>((set, get) => ({
  passport_given_name: "",
  passport_family_name: "",
  birth_date: "",
  gender: "M",
  nationality: "KOR",
  phone: "",
  passport_number: "",
  passport_expiry: "",
  defaults: DEFAULT_USER_DEFAULTS,
  passport_number_masked: null,
  loading: false,
  saving: false,
  error: null,
  saved_at: null,
  exists: false,

  setField: (key, value) => {
    set({ [key]: value } as Partial<ProfileFormState>);
  },
  setDefault: (key, value) => {
    set({ defaults: { ...get().defaults, [key]: value } });
  },

  load: async () => {
    set({ loading: true, error: null });
    try {
      // 1) 로컬 캐시 즉시 복원 (오프라인/첫 페인트)
      const cached = await loadProfileCache();
      if (cached) {
        set({
          passport_given_name: cached.passport_given_name ?? "",
          passport_family_name: cached.passport_family_name ?? "",
          birth_date: cached.birth_date ?? "",
          gender: cached.gender ?? "M",
          nationality: cached.nationality ?? "KOR",
          phone: cached.phone ?? "",
          defaults: {
            default_origin: cached.default_origin ?? DEFAULT_USER_DEFAULTS.default_origin,
            preferred_cabin: cached.preferred_cabin ?? DEFAULT_USER_DEFAULTS.preferred_cabin,
            adults: cached.adults ?? DEFAULT_USER_DEFAULTS.adults,
            baggage_preference:
              cached.baggage_preference ?? DEFAULT_USER_DEFAULTS.baggage_preference,
          },
        });
      }

      // 2) 서버 fetch → 최신으로 덮어쓰기
      const res = await api.getProfile();
      if ("exists" in res && res.exists === false) {
        set({
          exists: false,
          defaults: res.defaults,
          passport_number_masked: null,
        });
      } else {
        const p = res as Exclude<typeof res, { exists: false }>;
        set({
          exists: true,
          passport_given_name: p.passport_given_name,
          passport_family_name: p.passport_family_name,
          birth_date: p.birth_date,
          gender: p.gender,
          nationality: p.nationality,
          phone: p.phone,
          passport_number_masked: p.passport_number_masked ?? null,
          defaults: p.defaults ?? DEFAULT_USER_DEFAULTS,
          // 여권번호·만료일은 서버에서 평문 돌려주지 않음 → 입력칸은 비워 둠
          passport_number: "",
          passport_expiry: "",
        });
        // 3) 서버 응답에서 민감정보 제외하고 로컬 캐시 갱신
        await saveProfileCache({
          passport_given_name: p.passport_given_name,
          passport_family_name: p.passport_family_name,
          birth_date: p.birth_date,
          gender: p.gender,
          nationality: p.nationality,
          phone: p.phone,
          default_origin: p.defaults?.default_origin,
          preferred_cabin: p.defaults?.preferred_cabin,
          adults: p.defaults?.adults,
          baggage_preference: p.defaults?.baggage_preference,
        });
      }
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ loading: false });
    }
  },

  save: async () => {
    const s = get();
    set({ saving: true, error: null });
    try {
      const payload: ProfilePayload = {
        passport_given_name: s.passport_given_name.trim(),
        passport_family_name: s.passport_family_name.trim(),
        birth_date: s.birth_date,
        gender: s.gender,
        nationality: s.nationality.trim().toUpperCase() || "KOR",
        phone: s.phone.trim(),
        defaults: s.defaults,
      };
      if (s.passport_number.trim()) payload.passport_number = s.passport_number.trim();
      if (s.passport_expiry) payload.passport_expiry = s.passport_expiry;

      const res = await api.upsertProfile(payload);

      // 민감정보 제외하고 캐시 저장
      await saveProfileCache({
        passport_given_name: res.passport_given_name,
        passport_family_name: res.passport_family_name,
        birth_date: res.birth_date,
        gender: res.gender,
        nationality: res.nationality,
        phone: res.phone,
        default_origin: res.defaults?.default_origin,
        preferred_cabin: res.defaults?.preferred_cabin,
        adults: res.defaults?.adults,
        baggage_preference: res.defaults?.baggage_preference,
      });

      set({
        exists: true,
        passport_number: "", // 저장 후 입력칸 비움 (재노출 방지)
        passport_expiry: "",
        passport_number_masked: res.passport_number_masked ?? null,
        defaults: res.defaults ?? DEFAULT_USER_DEFAULTS,
        saved_at: Date.now(),
      });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : String(e) });
    } finally {
      set({ saving: false });
    }
  },
}));
