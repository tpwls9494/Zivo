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
        <span className="text-xl font-bold text-primary">
          {offer.total_krw.toLocaleString()}원
        </span>
      </div>

      <div className="flex items-center gap-3 text-sm text-fg-4 mb-3">
        <span className="font-medium text-fg-1">{formatTime(offer.departure_at)}</span>
        <span className="text-fg-6">{offer.departure_iata}</span>
        <div className="flex-1 flex flex-col items-center">
          <span className="text-xs text-fg-6">{formatDuration(offer.duration_minutes)}</span>
          <div className="w-full flex items-center gap-1.5">
            <div className="flex-1 h-0.5 rounded-full bg-gradient-to-r from-border-input to-primary-mid" />
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
            <div className="flex-1 h-0.5 rounded-full bg-gradient-to-l from-border-input to-primary-mid" />
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
