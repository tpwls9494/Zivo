const DEVICE_ID_KEY = "zivo-device-id";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  const id = existing ?? crypto.randomUUID();
  if (!existing) localStorage.setItem(DEVICE_ID_KEY, id);
  // Route Handler에서도 읽을 수 있도록 쿠키에도 저장
  document.cookie = `${DEVICE_ID_KEY}=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  return id;
}
