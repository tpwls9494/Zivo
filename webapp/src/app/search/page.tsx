"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, Suspense, useEffect } from "react";
import type { NormalizedOffer } from "@zivo/types";
import { api } from "@/lib/api";
import FlightCard from "@/components/FlightCard";
import ComboCard from "@/components/ComboCard";
import { Spinner, FullPageSpinner, Banner, Tabs } from "@/components/ui";
import CalendarHeatmap from "@/components/CalendarHeatmap";

function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("기본");

  const origin = searchParams.get("origin") ?? "";
  const destination = searchParams.get("destination") ?? "";
  const depart = searchParams.get("depart") ?? "";
  const returnDate = searchParams.get("return") ?? "";
  const pax = Number(searchParams.get("pax") ?? "1");
  const cabin = searchParams.get("cabin") ?? "economy";

  // 검색 결과 로드 시 달력 데이터 백그라운드 프리패치 (탭 클릭 전에 미리 준비)
  useEffect(() => {
    if (!origin || !destination) return;
    const today = new Date();
    const fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const fromStr = localDateStr(fromDate);
    const toStr = localDateStr(toDate);
    void queryClient.prefetchQuery({
      queryKey: ["flexible", origin, destination, fromStr],
      queryFn: () =>
        api.request("/api/flights/search/flexible", {
          method: "POST",
          body: JSON.stringify({ origin, destination, from_date: fromStr, to_date: toStr, passengers: 1, cabin_class: "economy" }),
        }),
      staleTime: 1000 * 60 * 60,
    });
  }, [origin, destination, queryClient]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["flights", origin, destination, depart, returnDate, pax, cabin],
    queryFn: () =>
      api.searchFlights({
        origin,
        destination,
        departure_date: depart,
        return_date: returnDate || undefined,
        adults: pax,
      }),
    enabled: !!(origin && destination && depart),
    staleTime: 5 * 60 * 1000,
  });

  function handleBook(offer: NormalizedOffer) {
    sessionStorage.setItem("zivo_book_offers", JSON.stringify({ offer }));
    router.push(`/book?offer_id=${offer.offer_id}`);
  }

  function handleComboBook(outbound: NormalizedOffer, inbound: NormalizedOffer) {
    sessionStorage.setItem(
      "zivo_book_offers",
      JSON.stringify({ offer: outbound, comboInbound: inbound })
    );
    router.push(
      `/book?offer_id=${outbound.offer_id}&combo_inbound_id=${inbound.offer_id}&combo=true`
    );
  }

  const comboCount = data?.combos?.length ?? 0;

  return (
    <div className="min-h-screen bg-[--color-bg]">
      {/* 헤더 */}
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-fg-5 hover:text-fg-3 text-sm"
        >
          ← 뒤로
        </button>
        <div className="flex-1 text-sm">
          <span className="font-semibold text-fg-1">{origin} → {destination}</span>
          <span className="text-fg-6 ml-2">
            {depart}{returnDate ? ` · 귀국 ${returnDate}` : ""} · {pax}명
          </span>
        </div>
      </div>

      {/* 탭 */}
      <Tabs
        tabs={[
          { key: "기본", label: "기본" },
          { key: "더 싼 옵션", label: "더 싼 옵션", badge: comboCount },
          { key: "달력", label: "달력" },
        ]}
        onChange={setActiveTab}
      />

      <div className="max-w-2xl mx-auto p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Spinner />
            <p className="text-fg-5 text-sm">항공권을 검색하는 중...</p>
          </div>
        )}

        {isError && (
          <Banner variant="danger" className="mt-4 text-center">
            <p className="font-medium mb-1">검색 중 오류가 발생했습니다</p>
            <p className="text-sm opacity-80">
              {error instanceof Error ? error.message : "잠시 후 다시 시도해 주세요"}
            </p>
          </Banner>
        )}

        {!isLoading && !isError && activeTab === "기본" && (
          <>
            {data?.cached && (
              <p className="text-xs text-fg-6 mb-3 text-right">캐시된 결과</p>
            )}
            {data?.offers && data.offers.length > 0 ? (
              <div className="flex flex-col gap-3">
                {data.offers.map((offer) => (
                  <FlightCard key={offer.offer_id} offer={offer} onBook={handleBook} />
                ))}
              </div>
            ) : data ? (
              <div className="text-center py-16 text-fg-6">
                <p className="text-lg mb-1">검색 결과가 없습니다</p>
                <p className="text-sm">다른 날짜나 구간을 시도해보세요</p>
              </div>
            ) : null}
          </>
        )}

        {!isLoading && !isError && activeTab === "더 싼 옵션" && (
          <>
            <Banner variant="warning" className="mb-4">
              ⚠️ <strong>주의:</strong> 편도 조합은 두 편이 <strong>별개의 예약</strong>입니다.
              앞 편 지연·취소 시 뒷 편 항공사의 자동 보호가 적용되지 않습니다.
            </Banner>

            {data?.combos && data.combos.length > 0 ? (
              <div className="flex flex-col gap-4">
                {data.combos
                  .filter((c) => c.savings_krw >= 0)
                  .map((combo, i) => (
                    <ComboCard key={i} combo={combo} onBook={handleComboBook} />
                  ))}
              </div>
            ) : data ? (
              <div className="text-center py-16 text-fg-6">
                <p className="text-lg mb-1">절약 가능한 조합이 없습니다</p>
                <p className="text-sm">왕복 직항이 이미 최저가입니다</p>
              </div>
            ) : null}
          </>
        )}

        {activeTab === "달력" && (
          <CalendarHeatmap origin={origin} destination={destination} />
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <SearchResults />
    </Suspense>
  );
}
