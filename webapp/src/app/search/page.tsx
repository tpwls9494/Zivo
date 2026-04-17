"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState, Suspense } from "react";
import type { NormalizedOffer } from "@zivo/types";
import { api } from "@/lib/api";
import FlightCard from "@/components/FlightCard";
import ComboCard from "@/components/ComboCard";

const TABS = ["기본", "더 싼 옵션", "달력"] as const;
type Tab = (typeof TABS)[number];

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("기본");

  const origin = searchParams.get("origin") ?? "";
  const destination = searchParams.get("destination") ?? "";
  const depart = searchParams.get("depart") ?? "";
  const returnDate = searchParams.get("return") ?? "";
  const pax = Number(searchParams.get("pax") ?? "1");
  const cabin = searchParams.get("cabin") ?? "economy";

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["flights", origin, destination, depart, returnDate, pax, cabin],
    queryFn: () =>
      api.searchFlights({
        origin,
        destination,
        departure_date: depart,
        return_date: returnDate || undefined,
        passengers: pax,
        cabin_class: cabin,
      }),
    enabled: !!(origin && destination && depart),
    staleTime: 5 * 60 * 1000,
  });

  function handleBook(offer: NormalizedOffer) {
    router.push(`/book?offer_id=${offer.offer_id}`);
  }

  function handleComboBook(outbound: NormalizedOffer, inbound: NormalizedOffer) {
    router.push(
      `/book?offer_id=${outbound.offer_id}&combo_inbound_id=${inbound.offer_id}&combo=true`
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-gray-500 hover:text-gray-700"
        >
          ← 뒤로
        </button>
        <div className="flex-1 text-sm">
          <span className="font-semibold">{origin} → {destination}</span>
          <span className="text-gray-400 ml-2">
            {depart}{returnDate ? ` · 귀국 ${returnDate}` : ""} · {pax}명
          </span>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b border-gray-100 flex">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {tab === "더 싼 옵션" && data?.combos && data.combos.length > 0 && (
              <span className="ml-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
                {data.combos.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* 로딩 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">항공권을 검색하는 중...</p>
          </div>
        )}

        {/* 에러 */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center mt-4">
            <p className="text-red-600 font-medium mb-1">검색 중 오류가 발생했습니다</p>
            <p className="text-red-400 text-sm">
              {error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요"}
            </p>
          </div>
        )}

        {/* 기본 탭 */}
        {!isLoading && !isError && activeTab === "기본" && (
          <>
            {data?.cached && (
              <p className="text-xs text-gray-400 mb-3 text-right">캐시된 결과</p>
            )}
            {data?.offers && data.offers.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.offers.map((offer) => (
                  <FlightCard key={offer.offer_id} offer={offer} onBook={handleBook} />
                ))}
              </div>
            ) : data ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg mb-1">검색 결과가 없습니다</p>
                <p className="text-sm">다른 날짜나 구간을 시도해보세요</p>
              </div>
            ) : null}
          </>
        )}

        {/* 더 싼 옵션 탭 */}
        {!isLoading && !isError && activeTab === "더 싼 옵션" && (
          <>
            {/* 편도 조합 경고 배너 */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm text-amber-800">
              ⚠️ <strong>주의:</strong> 편도 조합은 두 편이 <strong>별개의 예약</strong>입니다.
              앞 편 지연·취소 시 뒷 편 항공사의 자동 보호가 적용되지 않습니다.
            </div>

            {data?.combos && data.combos.length > 0 ? (
              <div className="flex flex-col gap-4">
                {data.combos
                  .filter((c) => c.savings_krw >= 0)
                  .map((combo, i) => (
                    <ComboCard key={i} combo={combo} onBook={handleComboBook} />
                  ))}
              </div>
            ) : data ? (
              <div className="text-center py-16 text-gray-400">
                <p className="text-lg mb-1">절약 가능한 조합이 없습니다</p>
                <p className="text-sm">왕복 직항이 이미 최저가입니다</p>
              </div>
            ) : null}
          </>
        )}

        {/* 달력 탭 */}
        {activeTab === "달력" && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-1">달력 뷰는 준비 중입니다</p>
            <p className="text-sm">Day 14 이후 제공 예정</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
