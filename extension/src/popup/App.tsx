import { useEffect, useState } from "react";
import ProfileForm from "./ProfileForm";
import { api } from "@/lib/api";
import { getOrCreateDeviceId } from "@/lib/storage";

export default function App() {
  const [nickname, setNickname] = useState<string | null>(null);

  // 로그인 상태 확인 → 로그인 중이면 익스텐션 device ID 병합
  useEffect(() => {
    void (async () => {
      try {
        const me = await api.getMe();
        if (me.is_kakao_user) {
          setNickname(me.nickname ?? me.email ?? "로그인됨");
          const deviceId = await getOrCreateDeviceId();
          await api.mergeDevice(deviceId);
        }
      } catch {
        // 미로그인 상태 — 무시
      }
    })();
  }, []);

  function openWebApp() {
    void chrome.tabs.create({ url: "https://zivo-extension.vercel.app" });
  }

  return (
    <div className="p-4 space-y-4 text-sm min-w-[360px] max-w-[420px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Zivo</h1>
          <p className="text-xs text-gray-500">한일 노선 최저가 · 원터치 예약</p>
        </div>
        {nickname && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            {nickname}
          </span>
        )}
      </div>

      <button
        className="w-full bg-black text-white rounded py-2.5 font-medium hover:bg-gray-800 transition-colors"
        onClick={openWebApp}
      >
        Zivo 웹앱 열기 →
      </button>

      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-gray-700 mb-3">탑승자 프로필</p>
        <ProfileForm />
      </div>
    </div>
  );
}
