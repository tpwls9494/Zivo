"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, CardForm, Input, Select, ZivoLogo, ZivoWordmark } from "@/components/ui";

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
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-[--color-bg]">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ZivoLogo size={36} />
          <ZivoWordmark height={32} />
        </div>
        <p className="text-center text-fg-5 text-sm mb-8">
          편도 조합으로 더 싸게 · 원터치로 더 빠르게
        </p>

        <form onSubmit={handleSearch}>
          <CardForm>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="출발"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              >
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>{a.label}</option>
                ))}
              </Select>
              <Select
                label="도착"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              >
                {AIRPORTS.map((a) => (
                  <option key={a.code} value={a.code}>{a.label}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="가는 날"
                type="date"
                min={today}
                value={depart}
                onChange={(e) => setDepart(e.target.value)}
                required
              />
              <Input
                label="오는 날 (선택)"
                type="date"
                min={depart || today}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="인원"
                value={pax}
                onChange={(e) => setPax(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}명</option>
                ))}
              </Select>
              <Select
                label="좌석"
                value={cabin}
                onChange={(e) => setCabin(e.target.value)}
              >
                <option value="economy">이코노미</option>
                <option value="premium_economy">프리미엄 이코노미</option>
                <option value="business">비즈니스</option>
                <option value="first">퍼스트</option>
              </Select>
            </div>

            <Button type="submit" variant="primary" size="lg">
              항공권 검색
            </Button>
          </CardForm>
        </form>

        <div className="text-center mt-6">
          <Button variant="link" size="sm" onClick={() => router.push("/profile")}>
            탑승자 프로필 관리
          </Button>
        </div>
      </div>
    </main>
  );
}
