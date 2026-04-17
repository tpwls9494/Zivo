import { useEffect, useState } from "react";
import { useSearchStore } from "@/lib/store";
import { api, type NormalizedOffer, type ComboOffer, type SearchResponse } from "@/lib/api";
import ProfileForm from "./ProfileForm";

type MainTab = "search" | "profile";
type ResultTab = "roundtrip" | "combo" | "calendar";

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function OfferCard({ offer }: { offer: NormalizedOffer }) {
  return (
    <div className="border rounded p-2 space-y-1">
      <div className="flex justify-between items-center">
        <span className="font-medium text-xs">{offer.carrier_iata} · {offer.carrier}</span>
        <span className="font-semibold text-sm">{formatKRW(offer.total_krw)}</span>
      </div>
      <div className="text-xs text-gray-600 flex gap-2">
        <span>{formatDate(offer.departure_at)} {formatTime(offer.departure_at)}</span>
        <span>→</span>
        <span>{formatTime(offer.arrival_at)}</span>
        <span className="ml-auto">{Math.floor(offer.duration_minutes / 60)}h {offer.duration_minutes % 60}m</span>
      </div>
      <div className="text-xs text-gray-500 flex gap-2">
        <span>{offer.stops === 0 ? "직항" : `${offer.stops}회 경유`}</span>
        {offer.baggage_checked_kg > 0 && <span>수하물 {offer.baggage_checked_kg}kg</span>}
      </div>
    </div>
  );
}

function ComboCard({ combo }: { combo: ComboOffer }) {
  const bigSavings = combo.savings_pct >= 20;
  return (
    <div className={`border rounded p-2 space-y-2 ${bigSavings ? "border-green-400 bg-green-50" : ""}`}>
      <div className="flex justify-between items-start">
        <div className="text-xs text-gray-500">가는편 + 오는편 조합</div>
        <div className="text-right">
          <div className="font-semibold text-sm">{formatKRW(combo.total_krw)}</div>
          {combo.savings_krw > 0 && (
            <div className={`text-xs font-medium ${bigSavings ? "text-green-600" : "text-blue-600"}`}>
              {formatKRW(combo.savings_krw)} 절약 ({combo.savings_pct.toFixed(0)}%)
            </div>
          )}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-xs font-medium text-gray-700">가는편</div>
        <OfferCard offer={combo.outbound} />
        <div className="text-xs font-medium text-gray-700 pt-1">오는편</div>
        <OfferCard offer={combo.inbound} />
      </div>
    </div>
  );
}

export default function App() {
  const [mainTab, setMainTab] = useState<MainTab>("search");
  const [resultTab, setResultTab] = useState<ResultTab>("roundtrip");
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { origin, destination, depart, ret, setField, loadDefaults } = useSearchStore();

  useEffect(() => {
    void loadDefaults();
  }, [loadDefaults]);

  async function handleSearch() {
    if (!origin || !destination || !depart || !ret) return;
    setSearching(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const res = await api.searchFlights({
        origin,
        destination,
        departure_date: depart,
        return_date: ret,
        adults: 1,
      });
      setSearchResult(res);
      setResultTab("roundtrip");
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : String(e));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="p-4 space-y-3 text-sm min-w-[360px] max-w-[420px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Zivo</h1>
          <p className="text-xs text-gray-500">한일 노선 최저가 · 원터치 예약</p>
        </div>
      </div>

      {/* 메인 탭: 검색 / 프로필 */}
      <div className="flex border-b text-xs">
        <button
          className={`px-3 py-2 ${mainTab === "search" ? "border-b-2 border-black font-semibold" : "text-gray-500"}`}
          onClick={() => setMainTab("search")}
        >
          검색
        </button>
        <button
          className={`px-3 py-2 ${mainTab === "profile" ? "border-b-2 border-black font-semibold" : "text-gray-500"}`}
          onClick={() => setMainTab("profile")}
        >
          프로필
        </button>
      </div>

      {mainTab === "profile" && <ProfileForm />}

      {mainTab === "search" && (
        <>
          {/* 검색 폼 */}
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
            disabled={!origin || !destination || !depart || !ret || searching}
            onClick={() => void handleSearch()}
          >
            {searching ? "검색 중..." : "검색"}
          </button>

          {searchError && (
            <p className="text-xs text-red-500">{searchError}</p>
          )}

          {/* 결과 섹션 */}
          {searchResult && (
            <div className="space-y-2">
              {/* 결과 탭: 기본 / 더 싼 옵션 / 달력 */}
              <div className="flex border-b text-xs">
                <button
                  className={`px-3 py-2 ${resultTab === "roundtrip" ? "border-b-2 border-black font-semibold" : "text-gray-500"}`}
                  onClick={() => setResultTab("roundtrip")}
                >
                  기본
                </button>
                <button
                  className={`px-3 py-2 ${resultTab === "combo" ? "border-b-2 border-black font-semibold" : "text-gray-500"}`}
                  onClick={() => setResultTab("combo")}
                >
                  더 싼 옵션
                  {searchResult.combos.length > 0 && (
                    <span className="ml-1 bg-blue-500 text-white rounded-full text-[10px] px-1">
                      {searchResult.combos.length}
                    </span>
                  )}
                </button>
                <button
                  className={`px-3 py-2 ${resultTab === "calendar" ? "border-b-2 border-black font-semibold" : "text-gray-500"}`}
                  onClick={() => setResultTab("calendar")}
                >
                  달력
                </button>
              </div>

              {/* 기본 탭: 왕복 결과 */}
              {resultTab === "roundtrip" && (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {searchResult.offers.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">검색 결과가 없습니다.</p>
                  ) : (
                    searchResult.offers.map((offer) => (
                      <OfferCard key={offer.offer_id} offer={offer} />
                    ))
                  )}
                  {searchResult.cached && (
                    <p className="text-xs text-gray-400 text-right">캐시 응답</p>
                  )}
                </div>
              )}

              {/* 더 싼 옵션 탭: 편도 조합 */}
              {resultTab === "combo" && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {/* 경고 배너 — 항상 표시 */}
                  <div className="bg-yellow-50 border border-yellow-300 rounded p-2 text-xs text-yellow-800">
                    두 편이 별개 예약입니다. 앞 편 지연 시 뒷 편 항공사의 자동 보호가 적용되지 않습니다.
                  </div>

                  {searchResult.combos.length === 0 ? (
                    <p className="text-xs text-gray-500 text-center py-4">
                      왕복 대비 더 저렴한 편도 조합이 없습니다.
                    </p>
                  ) : (
                    searchResult.combos.map((combo, i) => (
                      <ComboCard key={`${combo.outbound.offer_id}-${combo.inbound.offer_id}-${i}`} combo={combo} />
                    ))
                  )}
                </div>
              )}

              {/* 달력 탭: 플레이스홀더 */}
              {resultTab === "calendar" && (
                <div className="py-8 text-center text-xs text-gray-400">
                  달력 뷰는 Day 7+에서 지원 예정입니다.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
