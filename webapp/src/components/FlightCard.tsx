import type { NormalizedOffer } from "@zivo/types";

interface Props {
  offer: NormalizedOffer;
  onBook?: (offer: NormalizedOffer) => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}시간 ${m > 0 ? `${m}분` : ""}`.trim();
}

export default function FlightCard({ offer, onBook }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-800">{offer.carrier}</span>
        <span className="text-xl font-bold text-blue-600">
          {offer.total_krw.toLocaleString()}원
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
        <span className="font-medium text-gray-900">{formatTime(offer.departure_at)}</span>
        <span className="text-gray-400">{offer.departure_iata}</span>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs text-gray-400">{formatDuration(offer.duration_minutes)}</span>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px bg-gray-200" />
            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <span className="text-xs text-gray-400">
            {offer.stops === 0 ? "직항" : `경유 ${offer.stops}회`}
          </span>
        </div>
        <span className="text-gray-400">{offer.arrival_iata}</span>
        <span className="font-medium text-gray-900">{formatTime(offer.arrival_at)}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          수하물 {offer.baggage_checked_kg > 0 ? `${offer.baggage_checked_kg}kg` : "없음"}
        </span>
        {onBook && (
          <button
            onClick={() => onBook(offer)}
            className="bg-blue-600 text-white text-sm px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
          >
            예약
          </button>
        )}
      </div>
    </div>
  );
}
