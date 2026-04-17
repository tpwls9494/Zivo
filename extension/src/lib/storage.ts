export interface StoredDefaults {
  origin?: string;
  destination?: string;
  deviceId?: string;
}

// 여권번호·여권만료일은 **저장 금지**. 백엔드 AES-256-GCM 저장소에만 존재.
export interface StoredProfileCache {
  passport_given_name?: string;
  passport_family_name?: string;
  birth_date?: string;
  gender?: "M" | "F";
  nationality?: string;
  phone?: string;
  default_origin?: string;
  preferred_cabin?: "economy" | "premium_economy" | "business" | "first";
  adults?: number;
  baggage_preference?: "carry_only" | "checked" | "any";
}

const KEY = "zivo:defaults";
const PROFILE_KEY = "zivo:profile";

export async function loadDefaults(): Promise<StoredDefaults | null> {
  const v = await chrome.storage.sync.get(KEY);
  return (v[KEY] as StoredDefaults | undefined) ?? null;
}

export async function saveDefaults(patch: Partial<StoredDefaults>): Promise<void> {
  const current = (await loadDefaults()) ?? {};
  await chrome.storage.sync.set({ [KEY]: { ...current, ...patch } });
}

export async function getOrCreateDeviceId(): Promise<string> {
  const current = (await loadDefaults()) ?? {};
  if (current.deviceId) return current.deviceId;
  const id = crypto.randomUUID();
  await saveDefaults({ deviceId: id });
  return id;
}

export async function loadProfileCache(): Promise<StoredProfileCache | null> {
  const v = await chrome.storage.sync.get(PROFILE_KEY);
  return (v[PROFILE_KEY] as StoredProfileCache | undefined) ?? null;
}

export async function saveProfileCache(patch: StoredProfileCache): Promise<void> {
  // 방어적 삭제: 여권번호/만료일은 여기에 들어오면 안 되지만 만약을 위해 스트립.
  const clean = { ...patch } as Record<string, unknown>;
  delete clean.passport_number;
  delete clean.passport_expiry;
  const current = (await loadProfileCache()) ?? {};
  await chrome.storage.sync.set({ [PROFILE_KEY]: { ...current, ...clean } });
}
