import type { ComboOffer, NormalizedOffer } from "@zivo/types";
import FlightCard from "./FlightCard";

interface Props {
  combo: ComboOffer;
  onBook?: (outbound: NormalizedOffer, inbound: NormalizedOffer) => void;
}

export default function ComboCard({ combo, onBook }: Props) {
  const isHighSaving = combo.savings_pct >= 20;

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden ${
        isHighSaving ? "border-green-300" : "border-gray-100"
      }`}
    >
      {isHighSaving && (
        <div className="bg-green-500 text-white text-xs font-semibold px-4 py-1.5 text-center">
          {combo.savings_pct.toFixed(0)}% 절약 — {combo.savings_krw.toLocaleString()}원 저렴
        </div>
      )}
      {!isHighSaving && combo.savings_krw > 0 && (
        <div className="bg-blue-50 text-blue-700 text-xs font-medium px-4 py-1.5 text-center">
          {combo.savings_krw.toLocaleString()}원 절약
        </div>
      )}

      <div className="bg-white p-3 flex flex-col gap-2">
        <div className="text-xs font-medium text-gray-500 px-1">가는 편</div>
        <FlightCard offer={combo.outbound} />
        <div className="text-xs font-medium text-gray-500 px-1 mt-1">오는 편</div>
        <FlightCard offer={combo.inbound} />

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
          <div>
            <span className="text-xs text-gray-400">합계 </span>
            <span className="font-bold text-lg text-blue-600">
              {combo.total_krw.toLocaleString()}원
            </span>
          </div>
          {onBook && (
            <button
              onClick={() => onBook(combo.outbound, combo.inbound)}
              className={`text-white text-sm px-4 py-2 rounded-lg transition-colors ${
                isHighSaving
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              두 편 모두 예약
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
