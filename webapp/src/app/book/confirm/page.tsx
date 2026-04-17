"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { BookResponse } from "@zivo/types";

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
        <div className="text-center text-gray-400">
          <p>예약 결과가 없습니다.</p>
          <button onClick={() => router.push("/")} className="mt-4 text-blue-600 underline text-sm">
            홈으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="font-semibold text-center">예약 완료</h1>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-4 text-center">
          <div className="text-3xl mb-2">✅</div>
          <p className="font-bold text-green-800 text-lg">예약이 접수되었습니다</p>
          <p className="text-green-600 text-sm mt-1">
            아래 버튼으로 항공사 페이지에서 결제를 완료해 주세요
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {result.bookings.map((booking, i) => (
            <div key={String(booking.booking_id)} className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wide">
                    {booking.direction === "roundtrip"
                      ? "왕복"
                      : booking.direction === "outbound"
                      ? "가는 편"
                      : "오는 편"}
                  </span>
                  <p className="text-xs text-gray-400 mt-0.5">
                    예약 ID: {String(booking.booking_id).slice(0, 8)}...
                  </p>
                </div>
                {result.bookings.length > 1 && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {i + 1} / {result.bookings.length}
                  </span>
                )}
              </div>

              <a
                href={booking.deep_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-blue-600 text-white text-center py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                항공사 페이지에서 결제 완료하기 →
              </a>
            </div>
          ))}
        </div>

        {result.bookings.length > 1 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4 text-xs text-amber-800">
            ⚠️ 두 편은 <strong>별개의 예약</strong>입니다. 각각 결제를 완료해 주세요.
            앞 편 지연 시 뒷 편 항공사의 자동 보호가 적용되지 않습니다.
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => router.push("/bookings")}
            className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium hover:bg-gray-50"
          >
            예약 이력 보기
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 bg-gray-800 text-white rounded-xl py-3 text-sm font-medium hover:bg-gray-900"
          >
            새 검색
          </button>
        </div>
      </div>
    </div>
  );
}
