import type { NormalizedOffer } from "@zivo/types";
import { Button, Card } from "@/components/ui";

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
    <Card>
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-fg-2">{offer.carrier}</span>
        <span className="text-xl font-bold text-primary-DEFAULT">
          {offer.total_krw.toLocaleString()}원
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm text-fg-4 mb-3">
        <span className="font-medium text-fg-1">{formatTime(offer.departure_at)}</span>
        <span className="text-fg-6">{offer.departure_iata}</span>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs text-fg-6">{formatDuration(offer.duration_minutes)}</span>
          <div className="w-full flex items-center gap-1">
            <div className="flex-1 h-px bg-border-input" />
            <svg className="w-3 h-3 text-fg-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
            <div className="flex-1 h-px bg-border-input" />
          </div>
          <span className="text-xs text-fg-6">
            {offer.stops === 0 ? "직항" : `경유 ${offer.stops}회`}
          </span>
        </div>
        <span className="text-fg-6">{offer.arrival_iata}</span>
        <span className="font-medium text-fg-1">{formatTime(offer.arrival_at)}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-fg-6">
          수하물 {offer.baggage_checked_kg > 0 ? `${offer.baggage_checked_kg}kg` : "없음"}
        </span>
        {onBook && (
          <Button variant="primary" size="sm" onClick={() => onBook(offer)}>
            예약
          </Button>
        )}
      </div>
    </Card>
  );
}
