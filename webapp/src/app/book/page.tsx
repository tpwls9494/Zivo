"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect, useRef, Suspense } from "react";
import type { NormalizedOffer, PassengerItem, ProfileResponse } from "@zivo/types";
import { api } from "@/lib/api";
import { Button, Banner, CardForm, FullPageSpinner, Input, Select } from "@/components/ui";

function BookForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const offerId = searchParams.get("offer_id") ?? "";
  const comboInboundId = searchParams.get("combo_inbound_id") ?? "";
  const isCombo = searchParams.get("combo") === "true";

  const { data: profileData } = useQuery({
    queryKey: ["profile"],
    queryFn: api.getProfile,
  });

  const { data: passengers } = useQuery({
    queryKey: ["passengers"],
    queryFn: api.listPassengers,
  });

  const profile =
    profileData && "passport_given_name" in profileData
      ? (profileData as ProfileResponse)
      : null;

  const [selectedPassengerId, setSelectedPassengerId] = useState<string>("__profile__");
  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [phone, setPhone] = useState("");
  const [nationality, setNationality] = useState("KR");
  const [priceChanged, setPriceChanged] = useState(false);
  const [newPrice, setNewPrice] = useState<number | null>(null);
  const [offer, setOffer] = useState<NormalizedOffer | null>(null);
  const [comboInbound, setComboInbound] = useState<NormalizedOffer | null>(null);
  const [adults, setAdults] = useState(1);

  // 최초 1회만 자동 채우기 — 이후 사용자가 수정한 값을 덮어쓰지 않음
  const hasFilled = useRef(false);
  useEffect(() => {
    if (hasFilled.current) return;
    if (passengers && passengers.length > 0) {
      hasFilled.current = true;
      const primary = passengers.find((p) => p.is_primary) ?? passengers[0];
      setSelectedPassengerId(primary.id);
      fillFromPassenger(primary);
    } else if (passengers !== undefined && profile) {
      // passengers 로드 완료(빈 배열)이고 profile이 있을 때
      hasFilled.current = true;
      fillFromProfile(profile);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passengers, profile]);

  function fillFromPassenger(p: PassengerItem) {
    setGivenName(p.passport_given_name);
    setFamilyName(p.passport_family_name);
    setBirthDate(p.birth_date);
    setGender(p.gender);
    setPhone(p.phone);
    setNationality(p.nationality === "KOR" ? "KR" : p.nationality);
  }

  function fillFromProfile(p: ProfileResponse) {
    setGivenName(p.passport_given_name ?? "");
    setFamilyName(p.passport_family_name ?? "");
    setBirthDate(p.birth_date ?? "");
    setGender(p.gender ?? "M");
    setPhone(p.phone ?? "");
    setNationality(p.nationality ?? "KR");
  }

  function handlePassengerSelect(id: string) {
    setSelectedPassengerId(id);
    if (id === "__profile__") {
      if (profile) fillFromProfile(profile);
    } else {
      const p = passengers?.find((x) => x.id === id);
      if (p) fillFromPassenger(p);
    }
  }

  useEffect(() => {
    const stored = sessionStorage.getItem("zivo_book_offers");
    if (stored) {
      const parsed = JSON.parse(stored) as {
        offer: NormalizedOffer;
        comboInbound?: NormalizedOffer;
        adults?: number;
      };
      setOffer(parsed.offer);
      if (parsed.comboInbound) setComboInbound(parsed.comboInbound);
      if (parsed.adults) setAdults(parsed.adults);
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
      adults,
    });
  }

  if (!offerId) {
    return (
      <div className="text-center py-20 text-fg-6">
        <p>잘못된 접근입니다.</p>
        <Button variant="link" size="sm" className="mt-4" onClick={() => router.push("/")}>
          홈으로
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-fg-5 hover:text-fg-3 text-sm">
          ← 뒤로
        </button>
        <h1 className="font-semibold text-fg-1">탑승자 정보 확인</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 flex flex-col gap-4">
        {offer && (
          <Banner variant="info">
            <div className="font-semibold mb-1">
              {isCombo ? "편도 조합 예약" : "왕복 예약"}
            </div>
            <div className="text-sm">
              {offer.departure_iata} → {offer.arrival_iata} · {offer.carrier}
            </div>
            {comboInbound && (
              <div className="text-sm">
                {comboInbound.departure_iata} → {comboInbound.arrival_iata} · {comboInbound.carrier}
              </div>
            )}
            <div className="font-bold mt-1">
              {(offer.total_krw + (comboInbound?.total_krw ?? 0)).toLocaleString()}원
            </div>
          </Banner>
        )}

        {!offer && (
          <Banner variant="warning">
            검색 결과 페이지에서 예약 버튼을 눌러주세요. (오퍼 정보 없음)
          </Banner>
        )}

        {isCombo && (
          <Banner variant="warning">
            ⚠️ 편도 조합은 두 편이 <strong>별개의 예약</strong>입니다. 앞 편 지연 시 뒷 편 항공사의 자동 보호가 적용되지 않습니다.
          </Banner>
        )}

        {/* 가격 변동 다이얼로그 */}
        {priceChanged && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h2 className="font-bold text-lg text-fg-1 mb-2">가격이 변동되었습니다</h2>
              <p className="text-fg-4 text-sm mb-4">
                조회 시점과 가격이 달라졌습니다.
                {newPrice && (
                  <span className="block font-semibold text-fg-1 mt-1">
                    변동된 가격: {newPrice.toLocaleString()}원
                  </span>
                )}
              </p>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={() => setPriceChanged(false)}>
                  취소
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setPriceChanged(false);
                    doBook();
                  }}
                >
                  변동된 가격으로 예약
                </Button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <CardForm>
            <h2 className="font-semibold text-fg-1">탑승자 정보</h2>

            {/* 탑승자 선택기 */}
            {passengers && passengers.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {passengers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePassengerSelect(p.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      selectedPassengerId === p.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-fg-3 border-border hover:border-blue-400"
                    }`}
                  >
                    {p.nickname}
                    {p.is_primary && " ★"}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="영문 성 (Family)"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
                placeholder="HONG"
              />
              <Input
                label="영문 이름 (Given)"
                value={givenName}
                onChange={(e) => setGivenName(e.target.value)}
                required
                placeholder="GILDONG"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="생년월일"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
              />
              <Select
                label="성별"
                value={gender}
                onChange={(e) => setGender(e.target.value as "M" | "F")}
              >
                <option value="M">남성</option>
                <option value="F">여성</option>
              </Select>
            </div>

            <Input
              label="연락처"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="010-0000-0000"
            />

            <Select
              label="국적"
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
            >
              <option value="KR">대한민국</option>
              <option value="JP">일본</option>
              <option value="US">미국</option>
              <option value="OTHER">기타</option>
            </Select>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={bookMutation.isPending || !offer}
            >
              {bookMutation.isPending ? "예약 처리 중..." : "예약하기"}
            </Button>
          </CardForm>
        </form>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <BookForm />
    </Suspense>
  );
}
