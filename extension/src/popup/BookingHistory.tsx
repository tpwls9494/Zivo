import { useEffect, useState } from "react";
import { api, type BookingItem } from "@/lib/api";

function formatKRW(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function DirectionBadge({ direction }: { direction: string }) {
  const label =
    direction === "roundtrip" ? "왕복" : direction === "outbound" ? "가는편" : "오는편";
  const color =
    direction === "roundtrip"
      ? "bg-blue-100 text-blue-700"
      : "bg-purple-100 text-purple-700";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${color}`}>{label}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "redirected"
      ? "text-gray-400"
      : status === "confirmed"
        ? "text-green-600"
        : "text-red-400";
  return (
    <span className={`text-[10px] ${color}`}>
      {status === "redirected" ? "예약 링크 오픈" : status === "confirmed" ? "확인됨" : "취소됨"}
    </span>
  );
}

export default function BookingHistory() {
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listBookings()
      .then((res) => setItems(res.items))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-xs text-gray-400 text-center py-6">불러오는 중...</p>;
  }

  if (error) {
    return <p className="text-xs text-red-500 text-center py-4">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-gray-400">예약 이력이 없습니다.</p>
        <p className="text-xs text-gray-300 mt-1">검색 후 예약하면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {items.map((item) => (
        <div key={item.id} className="border rounded p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-xs">{item.carrier_iata}</span>
              <span className="text-xs text-gray-500">
                {item.origin}→{item.destination}
              </span>
              <DirectionBadge direction={item.direction} />
            </div>
            <span className="font-semibold text-xs">{formatKRW(item.total_krw)}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {formatDate(item.departure_at)} {formatTime(item.departure_at)}
            </span>
            <StatusBadge status={item.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
