"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Spinner, Button } from "@/components/ui";

interface DayPrice {
  date: string;
  min_krw: number | null;
}

interface Props {
  origin: string;
  destination: string;
}

function priceColor(price: number, min: number, max: number): string {
  if (max === min) return "bg-success-mid text-success-text";
  const ratio = (price - min) / (max - min);
  if (ratio < 0.33) return "bg-success-mid text-success-text";
  if (ratio < 0.66) return "bg-warning-mid text-warning-text";
  return "bg-danger-mid text-danger";
}

export default function CalendarHeatmap({ origin, destination }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const fromDate = new Date(year, month, 1);
  const toDate = new Date(year, month + 1, 0); // last day of month

  const { data, isLoading, isError } = useQuery({
    queryKey: ["flexible", origin, destination, fromDate.toISOString().split("T")[0]],
    queryFn: () =>
      api.request<{ prices: DayPrice[]; top3: DayPrice[] }>("/api/flights/search/flexible", {
        method: "POST",
        body: JSON.stringify({
          origin,
          destination,
          from_date: fromDate.toISOString().split("T")[0],
          to_date: toDate.toISOString().split("T")[0],
          passengers: 1,
          cabin_class: "economy",
        }),
      }),
    staleTime: 1000 * 60 * 60,
    enabled: !!(origin && destination),
  });

  const priceMap = new Map(data?.prices.map(p => [p.date, p.min_krw]) ?? []);
  const validPrices = (data?.prices ?? []).map(p => p.min_krw).filter((p): p is number => p !== null);
  const minPrice = validPrices.length ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length ? Math.max(...validPrices) : 0;

  const daysInMonth = toDate.getDate();
  const firstDayOfWeek = fromDate.getDay(); // 0=Sun

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  const monthLabel = new Date(year, month).toLocaleDateString("ko-KR", { year: "numeric", month: "long" });

  return (
    <div className="flex flex-col gap-4">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-border p-3">
        <Button variant="ghost" size="sm" onClick={prevMonth}>←</Button>
        <span className="font-semibold text-fg-1 text-sm">{monthLabel}</span>
        <Button variant="ghost" size="sm" onClick={nextMonth}>→</Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10"><Spinner /></div>
      )}

      {isError && (
        <p className="text-center text-fg-6 text-sm">가격 정보를 불러올 수 없습니다.</p>
      )}

      {/* Top 3 */}
      {data?.top3 && data.top3.length > 0 && (
        <div className="bg-success-light rounded-xl p-3">
          <p className="text-xs font-semibold text-success-text mb-2">이달의 최저가 TOP 3</p>
          <div className="flex gap-2 flex-wrap">
            {data.top3.map(p => (
              <span key={p.date} className="bg-white rounded-lg px-2 py-1 text-xs font-medium text-fg-1 border border-border">
                {p.date.slice(5)} — {p.min_krw?.toLocaleString()}원
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 달력 그리드 */}
      {!isLoading && (
        <div className="bg-white rounded-xl border border-border p-3">
          <div className="grid grid-cols-7 mb-1">
            {["일","월","화","수","목","금","토"].map(d => (
              <div key={d} className="text-center text-xs text-fg-6 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const price = priceMap.get(dateStr) ?? null;
              const colorClass = price ? priceColor(price, minPrice, maxPrice) : "text-fg-6";
              const isToday = dateStr === today.toISOString().split("T")[0];

              return (
                <div
                  key={dateStr}
                  className={`rounded-lg p-1 text-center ${price ? colorClass : ""} ${isToday ? "ring-1 ring-primary" : ""}`}
                >
                  <div className={`text-xs ${isToday ? "font-bold text-primary" : "text-fg-4"}`}>{day}</div>
                  {price && (
                    <div className="text-[10px] font-medium leading-tight">
                      {Math.round(price / 1000)}K
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2 justify-end items-center">
            <span className="w-3 h-3 rounded bg-success-mid inline-block" />
            <span className="text-xs text-fg-6">저렴</span>
            <span className="w-3 h-3 rounded bg-warning-mid inline-block ml-1" />
            <span className="text-xs text-fg-6">보통</span>
            <span className="w-3 h-3 rounded bg-danger-mid inline-block ml-1" />
            <span className="text-xs text-fg-6">비쌈</span>
          </div>
        </div>
      )}
    </div>
  );
}
