import type {
  ProfilePayload,
  ProfileResponse,
  EmptyProfileResponse,
} from "@zivo/types";
import { getOrCreateDeviceId } from "./storage";

export type {
  UserDefaults,
  ProfilePayload,
  ProfileResponse,
  EmptyProfileResponse,
} from "@zivo/types";

const API_BASE =
  import.meta.env.VITE_API_BASE ??
  (import.meta.env.DEV ? "http://localhost:8000" : "https://api.zivo.app");

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const deviceId = await getOrCreateDeviceId();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include", // JWT 쿠키 자동 포함
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": deviceId,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  getProfile: () => request<ProfileResponse | EmptyProfileResponse>("/api/profile"),
  upsertProfile: (body: ProfilePayload) =>
    request<ProfileResponse>("/api/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  getMe: () =>
    request<{ user_id: string; nickname: string | null; email: string | null; is_kakao_user: boolean }>("/api/auth/me"),
  mergeDevice: (deviceId: string) =>
    request<{ ok: boolean }>("/api/auth/merge-device", {
      method: "POST",
      body: JSON.stringify({ device_id: deviceId }),
    }),
};
