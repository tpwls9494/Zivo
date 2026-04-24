"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookResponse } from "@zivo/types";
import { Button, Banner, Badge, Card } from "@/components/ui";

const DIRECTION_LABEL: Record<string, string> = {
  roundtrip: "왕복",
  outbound: "가는 편",
  inbound: "오는 편",
};

export default function BookConfirmPage() {
  const router = useRouter();
  const [result, setResult] = useState<BookResponse | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("zivo_book_result");
    if (stored) {
      setResult(JSON.parse(stored) as BookResponse);
      sessionStorage.removeItem("zivo_book_result");
    }
  }, []);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-fg-6">
          <p>예약 결과가 없습니다.</p>
          <Button variant="link" size="sm" className="mt-4" onClick={() => router.push("/")}>
            홈으로
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <div className="bg-white border-b border-border px-4 py-3">
        <h1 className="font-semibold text-center text-fg-1">예약 완료</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 flex flex-col gap-4">
        <Banner variant="success" className="text-center py-5">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-bold text-lg">예약이 접수되었습니다</p>
          <p className="text-sm opacity-80 mt-1">
            아래 버튼으로 항공사 페이지에서 결제를 완료해 주세요
          </p>
        </Banner>

        <div className="flex flex-col gap-3">
          {result.bookings.map((booking, i) => (
            <Card key={String(booking.booking_id)}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={booking.direction === "roundtrip" ? "blue" : booking.direction === "outbound" ? "indigo" : "purple"}>
                    {DIRECTION_LABEL[booking.direction] ?? booking.direction}
                  </Badge>
                  <span className="text-xs text-fg-6">
                    ID: {String(booking.booking_id).slice(0, 8)}...
                  </span>
                </div>
                {result.bookings.length > 1 && (
                  <Badge variant="gray">{i + 1} / {result.bookings.length}</Badge>
                )}
              </div>

              <a
                href={booking.deep_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-primary text-white text-center py-3 rounded-xl font-semibold hover:bg-primary-hover transition-colors text-sm"
              >
                항공사 페이지에서 결제 완료하기 →
              </a>
            </Card>
          ))}
        </div>

        {result.bookings.length > 1 && (
          <Banner variant="warning">
            ⚠️ 두 편은 <strong>별개의 예약</strong>입니다. 각각 결제를 완료해 주세요.
            앞 편 지연 시 뒷 편 항공사의 자동 보호가 적용되지 않습니다.
          </Banner>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => router.push("/bookings")}>
            예약 이력 보기
          </Button>
          <Button variant="primary" onClick={() => router.push("/")}>
            새 검색
          </Button>
        </div>
      </div>
    </div>
  );
}
