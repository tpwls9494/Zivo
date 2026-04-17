"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { BookingItem } from "@zivo/types";
import { api } from "@/lib/api";

const DIRECTION_LABEL: Record<string, { label: string; color: string }> = {
  roundtrip: { label: "왕복", color: "bg-blue-100 text-blue-700" },
  outbound: { label: "가는 편", color: "bg-indigo-100 text-indigo-700" },
  inbound: { label: "오는 편", color: "bg-purple-100 text-purple-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function BookingCard({ booking }: { booking: BookingItem }) {
  const dir = DIRECTION_LABEL[booking.direction] ?? { label: booking.direction, color: "bg-gray-100 text-gray-700" };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dir.color}`}>
            {dir.label}
          </span>
          {booking.combo_group_id && (
            <span className="ml-1 text-xs text-gray-400">편도 조합</span>
          )}
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            booking.status === "confirmed"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {booking.status}
        </span>
      </div>

      <div className="flex items-center gap-2 my-2">
        <span className="font-semibold text-gray-900">{booking.origin}</span>
        <span className="text-gray-300">→</span>
        <span className="font-semibold text-gray-900">{booking.destination}</span>
        <span className="text-xs text-gray-400 ml-1">{booking.carrier_iata}</span>
      </div>

      <div className="text-sm text-gray-500 mb-2">
        {formatDate(String(booking.departure_at))} → {formatDate(String(booking.arrival_at))}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-bold text-blue-600">{booking.total_krw.toLocaleString()}원</span>
        {booking.created_at && (
          <span className="text-xs text-gray-400">
            {new Date(String(booking.created_at)).toLocaleDateString("ko-KR")} 예약
          </span>
        )}
      </div>
    </div>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookings"],
    queryFn: api.listBookings,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-gray-500 hover:text-gray-700">
          ← 뒤로
        </button>
        <h1 className="font-semibold">예약 이력</h1>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {isLoading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600 text-sm">이력을 불러올 수 없습니다.</p>
          </div>
        )}

        {data && data.items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">예약 이력이 없습니다</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 text-blue-600 text-sm underline"
            >
              항공권 검색하기
            </button>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="flex flex-col gap-3">
            {data.items.map((booking) => (
              <BookingCard key={String(booking.id)} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
