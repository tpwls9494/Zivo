"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import type { NormalizedOffer, ProfileResponse } from "@zivo/types";
import { api } from "@/lib/api";

function BookForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const offerId = searchParams.get("offer_id") ?? "";
  const comboInboundId = searchParams.get("combo_inbound_id") ?? "";
  const isCombo = searchParams.get("combo") === "true";

  // 프로필 조회
  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: api.getProfile,
  });

  const profile =
    profileData && "passport_given_name" in profileData
      ? (profileData as ProfileResponse)
      : null;

  // 폼 상태 (프로필에서 prefill)
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("KR");

  // 가격 변동 상태
  const [priceChanged, setPriceChanged] = useState(false);
  const [newPrice, setNewPrice] = useState<number | null>(null);

  useEffect(() => {
    if (profile) {
      setGivenName(profile.passport_given_name ?? "");
      setFamilyName(profile.passport_family_name ?? "");
      setBirthDate(profile.birth_date ?? "");
      setGender(profile.gender ?? "M");
      setPhone(profile.phone ?? "");
      setNationality(profile.nationality ?? "KR");
    }
  }, [profile]);

  // 검색 결과에서 오퍼를 URL state로 넘기기 어려우므로 sessionStorage 활용
  const [offer, setOffer] = useState<NormalizedOffer | null>(null);
  const [comboInbound, setComboInbound] = useState<NormalizedOffer | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("zivo_book_offers");
    if (stored) {
      const parsed = JSON.parse(stored) as {
        offer: NormalizedOffer;
        comboInbound?: NormalizedOffer;
      };
      setOffer(parsed.offer);
      if (parsed.comboInbound) setComboInbound(parsed.comboInbound);
    }
  }, []);

  const bookMutation = useMutation({
    mutationFn: api.book,
    onSuccess: (data) => {
      sessionStorage.setItem("zivo_book_result", JSON.stringify(data));
      router.push("/book/confirm");
    },
    onError: (err: Error & { status?: number; body?: string }) => {
      if (err.status === 409) {
        try {
          const body = JSON.parse(err.body ?? "{}");
          if (body.detail?.code === "PRICE_CHANGED") {
            setNewPrice(body.detail.new_price_krw ?? null);
            setPriceChanged(true);
            return;
          }
        } catch {}
      }
      alert(`예약 실패: ${err.message}`);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!offer) return;
    doBook();
  }

  function doBook() {
    if (!offer) return;
    bookMutation.mutate({
      offer,
      direction: isCombo ? "outbound" : "roundtrip",
      combo_inbound: comboInbound ?? undefined,
      combo_group_id: undefined,
    });
  }

  if (!offerId) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>잘못된 접근입니다.</p>
        <button onClick={() => router.push("/")} className="mt-4 text-blue-600 underline text-sm">
          홈으로
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">
          ← 뒤로
        </button>
        <h1 className="font-semibold">탑승자 정보 확인</h1>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {/* 오퍼 요약 */}
        {offer && (
          <div className="bg-blue-50 rounded-xl p-4 mb-4 text-sm">
            <div className="font-semibold text-blue-800 mb-1">
              {isCombo ? "편도 조합 예약" : "왕복 예약"}
            </div>
            <div className="text-blue-700">
              {offer.departure_iata} → {offer.arrival_iata} · {offer.carrier}
            </div>
            {comboInbound && (
              <div className="text-blue-700">
                {comboInbound.departure_iata} → {comboInbound.arrival_iata} · {comboInbound.carrier}
              </div>
            )}
            <div className="font-bold text-blue-900 mt-1">
              {(
                offer.total_krw + (comboInbound?.total_krw ?? 0)
              ).toLocaleString()}원
            </div>
          </div>
        )}

        {!offer && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 text-sm text-amber-800">
            검색 결과 페이지에서 예약 버튼을 눌러주세요. (오퍼 정보 없음)
          </div>
        )}

        {isCombo && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800">
            ⚠️ 편도 조합은 두 편이 <strong>별개의 예약</strong>입니다. 앞 편 지연 시 뒷 편 항공사의 자동 보호가 적용되지 않습니다.
          </div>
        )}

        {/* 가격 변동 다이얼로그 */}
        {priceChanged && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h2 className="font-bold text-lg mb-2">가격이 변동되었습니다</h2>
              <p className="text-gray-600 text-sm mb-4">
                조회 시점과 가격이 달라졌습니다.
                {newPrice && (
                  <span className="block font-semibold text-gray-900 mt-1">
                    변동된 가격: {newPrice.toLocaleString()}원
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPriceChanged(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    setPriceChanged(false);
                    doBook();
                  }}
                  className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm hover:bg-blue-700"
                >
                  변동된 가격으로 예약
                </button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">탑승자 정보</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">영문 성 (Family)</label>
              <input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                placeholder="HONG"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">영문 이름 (Given)</label>
              <input
                value={givenName}
                onChange={(e) => setGivenName(e.target.value)}
                required
                placeholder="GILDONG"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">생년월일</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">성별</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "M" | "F")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="M">남성</option>
                <option value="F">여성</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">연락처</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="010-0000-0000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">국적</label>
            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="KR">대한민국</option>
              <option value="JP">일본</option>
              <option value="US">미국</option>
              <option value="OTHER">기타</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={bookMutation.isPending || !offer}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
          >
            {bookMutation.isPending ? "예약 처리 중..." : "예약하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BookForm />
    </Suspense>
  );
}
