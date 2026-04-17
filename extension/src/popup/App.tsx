import ProfileForm from "./ProfileForm";

export default function App() {
  function openWebApp() {
    void chrome.tabs.create({ url: "https://zivo.app" });
  }

  return (
    <div className="p-4 space-y-4 text-sm min-w-[360px] max-w-[420px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Zivo</h1>
          <p className="text-xs text-gray-500">한일 노선 최저가 · 원터치 예약</p>
        </div>
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
