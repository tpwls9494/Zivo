import { useEffect } from "react";
import { useSearchStore } from "@/lib/store";

export default function App() {
  const { origin, destination, depart, ret, setField, loadDefaults } = useSearchStore();

  useEffect(() => {
    loadDefaults();
  }, [loadDefaults]);

  return (
    <div className="p-4 space-y-3 text-sm">
      <h1 className="text-lg font-semibold">Zivo</h1>
      <p className="text-xs text-gray-500">한일 노선 최저가 · 원터치 예약</p>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">출발</span>
          <input
            className="border rounded px-2 py-1"
            value={origin}
            onChange={(e) => setField("origin", e.target.value.toUpperCase())}
            placeholder="ICN"
            maxLength={3}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">도착</span>
          <input
            className="border rounded px-2 py-1"
            value={destination}
            onChange={(e) => setField("destination", e.target.value.toUpperCase())}
            placeholder="KIX"
            maxLength={3}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">가는 날</span>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={depart}
            onChange={(e) => setField("depart", e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">오는 날</span>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={ret}
            onChange={(e) => setField("ret", e.target.value)}
          />
        </label>
      </div>

      <button
        className="w-full bg-black text-white rounded py-2 disabled:opacity-40"
        disabled={!origin || !destination || !depart || !ret}
      >
        검색 (Day 3 구현 예정)
      </button>
    </div>
  );
}
