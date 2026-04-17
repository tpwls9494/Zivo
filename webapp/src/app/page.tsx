"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const AIRPORTS = [
  { code: "ICN", label: "서울 (ICN)" },
  { code: "GMP", label: "서울 김포 (GMP)" },
  { code: "KIX", label: "오사카 (KIX)" },
  { code: "NRT", label: "도쿄 나리타 (NRT)" },
  { code: "HND", label: "도쿄 하네다 (HND)" },
  { code: "FUK", label: "후쿠오카 (FUK)" },
  { code: "CTS", label: "삿포로 (CTS)" },
  { code: "OKA", label: "오키나와 (OKA)" },
];

export default function Home() {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];

  const [origin, setOrigin] = useState("ICN");
  const [destination, setDestination] = useState("KIX");
  const [depart, setDepart] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [pax, setPax] = useState(1);
  const [cabin, setCabin] = useState("economy");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!depart) return;
    const params = new URLSearchParams({
      origin,
      destination,
      depart,
      ...(returnDate ? { return: returnDate } : {}),
      pax: String(pax),
      cabin,
    });
    router.push(`/search?${params.toString()}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-2">Zivo ✈</h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          편도 조합으로 더 싸게 · 원터치로 더 빠르게
        </p>

        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                출발
              </label>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                도착
              </label>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                가는 날
              </label>
              <input
                type="date"
                min={today}
                value={depart}
                onChange={(e) => setDepart(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                오는 날 <span className="text-gray-400">(선택)</span>
              </label>
              <input
                type="date"
                min={depart || today}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                인원
              </label>
              <select
                value={pax}
                onChange={(e) => setPax(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}명
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                좌석
              </label>
              <select
                value={cabin}
                onChange={(e) => setCabin(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="economy">이코노미</option>
                <option value="premium_economy">프리미엄 이코노미</option>
                <option value="business">비즈니스</option>
                <option value="first">퍼스트</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mt-1"
          >
            항공권 검색
          </button>
        </form>

        <div className="text-center mt-6">
          <a href="/profile" className="text-sm text-gray-400 hover:text-gray-600">
            탑승자 프로필 관리
          </a>
        </div>
      </div>
    </main>
  );
}
