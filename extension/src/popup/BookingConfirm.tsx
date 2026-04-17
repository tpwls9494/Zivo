import { useState } from "react";
import { api, type NormalizedOffer, type ComboOffer } from "@/lib/api";
import { useProfileStore } from "@/lib/store";

interface Props {
  offer: NormalizedOffer | null;
  combo: ComboOffer | null;
  onClose: () => void;
}

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function BookingConfirm({ offer, combo, onClose }: Props) {
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profile = useProfileStore();

  const isCombo = !!combo;
  const primaryOffer = combo ? combo.outbound : offer!;
  const totalKRW = combo ? combo.total_krw : offer!.total_krw;

  async function handleConfirm() {
    setBooking(true);
    setError(null);
    try {
      const res = await api.book({
        offer: primaryOffer,
        direction: isCombo ? "outbound" : "roundtrip",
        combo_inbound: isCombo ? combo!.inbound : undefined,
      });
      for (const b of res.bookings) {
        await chrome.tabs.create({ url: b.deep_link_url });
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBooking(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button onClick={onClose} className="text-gray-500 text-xs hover:text-black">
          ← 뒤로
        </button>
        <h2 className="font-semibold text-sm">탑승자 확인</h2>
      </div>

      {profile.exists ? (
        <div className="bg-gray-50 border rounded p-3 space-y-1 text-xs">
          <div className="font-medium text-gray-700 mb-1">탑승자</div>
          <div className="font-medium">
            {profile.passport_given_name} {profile.passport_family_name}
          </div>
          {profile.birth_date && (
            <div className="text-gray-500">생년월일: {profile.birth_date}</div>
          )}
          {profile.phone && <div className="text-gray-500">연락처: {profile.phone}</div>}
          {profile.passport_number_masked && (
            <div className="text-gray-500">여권: {profile.passport_number_masked}</div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-300 rounded p-3 text-xs text-yellow-800">
          프로필을 저장하면 항공사 예약 페이지에서 정보를 쉽게 확인할 수 있습니다.
        </div>
      )}

      <div className="border rounded p-3 space-y-2 text-xs">
        {isCombo ? (
          <>
            <div className="space-y-1">
              <div className="font-medium text-gray-700">가는편</div>
              <div className="flex justify-between">
                <span>
                  {combo!.outbound.carrier_iata} · {combo!.outbound.departure_iata}→
                  {combo!.outbound.arrival_iata}
                </span>
                <span>{formatKRW(combo!.outbound.total_krw)}</span>
              </div>
              <div className="text-gray-500">{formatDateTime(combo!.outbound.departure_at)}</div>
            </div>
            <div className="space-y-1">
              <div className="font-medium text-gray-700">오는편</div>
              <div className="flex justify-between">
                <span>
                  {combo!.inbound.carrier_iata} · {combo!.inbound.departure_iata}→
                  {combo!.inbound.arrival_iata}
                </span>
                <span>{formatKRW(combo!.inbound.total_krw)}</span>
              </div>
              <div className="text-gray-500">{formatDateTime(combo!.inbound.departure_at)}</div>
            </div>
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>합계</span>
              <span>{formatKRW(totalKRW)}</span>
            </div>
          </>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>
                {offer!.carrier_iata} · {offer!.departure_iata}→{offer!.arrival_iata}
              </span>
              <span className="font-semibold">{formatKRW(offer!.total_krw)}</span>
            </div>
            <div className="text-gray-500">{formatDateTime(offer!.departure_at)}</div>
          </div>
        )}
      </div>

      {isCombo && (
        <div className="bg-yellow-50 border border-yellow-300 rounded p-2 text-xs text-yellow-800">
          두 편이 별개 예약입니다. 앞 편 지연 시 뒷 편 항공사의 자동 보호가 적용되지 않습니다.
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        className="w-full bg-black text-white rounded py-2 disabled:opacity-40 text-sm font-medium"
        onClick={() => void handleConfirm()}
        disabled={booking}
      >
        {booking
          ? "예약 진행 중..."
          : isCombo
            ? "두 편 모두 예약하기"
            : "예약하기"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        {isCombo
          ? "항공사 예약 페이지 2개가 순차적으로 열립니다."
          : "항공사 예약 페이지가 새 탭에서 열립니다."}
      </p>
    </div>
  );
}
