"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { BookingItem } from "@zivo/types";
import { api } from "@/lib/api";
import { Badge, Banner, Button, Card, Spinner } from "@/components/ui";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function BookingCard({
  booking,
  onDelete,
  deleting,
}: {
  booking: BookingItem;
  onDelete: () => void;
  deleting: boolean;
}) {
  const dirVariant =
    booking.direction === "roundtrip" ? "blue" :
    booking.direction === "outbound" ? "indigo" : "purple";

  const dirLabel =
    booking.direction === "roundtrip" ? "왕복" :
    booking.direction === "outbound" ? "가는 편" : "오는 편";

  return (
    <Card>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Badge variant={dirVariant}>{dirLabel}</Badge>
          {booking.combo_group_id && (
            <span className="text-xs text-fg-6">편도 조합</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={booking.status === "confirmed" ? "green" : "gray"}>
            {booking.status}
          </Badge>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="text-xs text-fg-6 hover:text-red-500 disabled:opacity-40 transition-colors"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 my-2">
        <span className="font-semibold text-fg-1">{booking.origin}</span>
        <span className="text-fg-6">→</span>
        <span className="font-semibold text-fg-1">{booking.destination}</span>
        <span className="text-xs text-fg-6 ml-1">{booking.carrier_iata}</span>
      </div>

      <div className="text-sm text-fg-5 mb-2">
        {formatDate(String(booking.departure_at))} → {formatDate(String(booking.arrival_at))}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-bold text-primary">{booking.total_krw.toLocaleString()}원</span>
        {booking.created_at && (
          <span className="text-xs text-fg-6">
            {new Date(String(booking.created_at)).toLocaleDateString("ko-KR")} 예약
          </span>
        )}
      </div>
    </Card>
  );
}

export default function BookingsPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["bookings"],
    queryFn: api.listBookings,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      api.request(`/api/bookings/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings"] }),
  });

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-fg-5 hover:text-fg-3 text-sm">
          ← 뒤로
        </button>
        <h1 className="font-semibold text-fg-1">예약 이력</h1>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {isError && (
          <Banner variant="danger" className="text-center">
            이력을 불러올 수 없습니다.
          </Banner>
        )}

        {data && data.items.length === 0 && (
          <div className="text-center py-16 text-fg-6">
            <p className="text-lg mb-1">예약 이력이 없습니다</p>
            <Button variant="link" size="sm" className="mt-4" onClick={() => router.push("/")}>
              항공권 검색하기
            </Button>
          </div>
        )}

        {data && data.items.length > 0 && (
          <div className="flex flex-col gap-3">
            {data.items.map((booking) => (
              <BookingCard
                key={String(booking.id)}
                booking={booking}
                onDelete={() => {
                  if (confirm("이 예약 이력을 삭제할까요?")) {
                    deleteMut.mutate(String(booking.id));
                  }
                }}
                deleting={deleteMut.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
