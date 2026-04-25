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

// 웹앱(vercel/localhost)이 저장한 쿠키에서 device ID를 읽어 동기화.
// 동일 ID를 쓰면 웹앱에서 저장한 프로필을 익스텐션이 그대로 사용.
async function _readWebappDeviceId(): Promise<string | null> {
  const COOKIE_NAME = "zivo-device-id";
  const urls = [
    "https://zivo-extension.vercel.app",
    "http://localhost:3000",
  ];
  for (const url of urls) {
    try {
      const cookie = await chrome.cookies.get({ url, name: COOKIE_NAME });
      if (cookie?.value) return cookie.value;
    } catch {
      // cookies API 미지원 환경(테스트 등) 무시
    }
  }
  return null;
}

export async function getOrCreateDeviceId(): Promise<string> {
  // 웹앱 쿠키를 항상 먼저 확인 — 웹앱과 동일한 user로 연결하기 위해 기존 ID보다 우선
  const webappId = await _readWebappDeviceId();
  if (webappId) {
    const current = (await loadDefaults()) ?? {};
    if (current.deviceId !== webappId) {
      await saveDefaults({ deviceId: webappId });
    }
    return webappId;
  }

  // 웹앱 미방문 → 기존 ID 유지 또는 새로 생성
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
