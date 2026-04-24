import type { ComboOffer, NormalizedOffer } from "@zivo/types";
import FlightCard from "./FlightCard";
import { Button } from "@/components/ui";

interface Props {
  combo: ComboOffer;
  onBook?: (outbound: NormalizedOffer, inbound: NormalizedOffer) => void;
}

export default function ComboCard({ combo, onBook }: Props) {
  const isHighSaving = combo.savings_pct >= 20;

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden ${
        isHighSaving ? "border-success-DEFAULT" : "border-border"
      }`}
    >
      {isHighSaving && (
        <div className="bg-success-DEFAULT text-white text-xs font-semibold px-4 py-1.5 text-center">
          {combo.savings_pct.toFixed(0)}% 절약 — {combo.savings_krw.toLocaleString()}원 저렴
        </div>
      )}
      {!isHighSaving && combo.savings_krw > 0 && (
        <div className="bg-primary-light text-primary-text text-xs font-medium px-4 py-1.5 text-center">
          {combo.savings_krw.toLocaleString()}원 절약
        </div>
      )}

      <div className="bg-white p-3 flex flex-col gap-2">
        <div className="text-xs font-medium text-fg-5 px-1">가는 편</div>
        <FlightCard offer={combo.outbound} />
        <div className="text-xs font-medium text-fg-5 px-1 mt-1">오는 편</div>
        <FlightCard offer={combo.inbound} />

        <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
          <div>
            <span className="text-xs text-fg-6">합계 </span>
            <span className="font-bold text-lg text-primary-DEFAULT">
              {combo.total_krw.toLocaleString()}원
            </span>
          </div>
          {onBook && (
            <Button
              variant={isHighSaving ? "success" : "primary"}
              size="sm"
              onClick={() => onBook(combo.outbound, combo.inbound)}
            >
              두 편 모두 예약
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
