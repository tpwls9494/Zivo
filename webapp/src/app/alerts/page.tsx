"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button, Banner, Card, Input, Select, Spinner } from "@/components/ui";

interface AlertItem {
  id: string;
  origin: string;
  destination: string;
  depart_date: string;
  return_date: string | null;
  target_krw: number;
  channel: string;
  enabled: boolean;
  last_notified_at: string | null;
}

const AIRPORTS = [
  { code: "ICN", label: "서울 (ICN)" },
  { code: "GMP", label: "서울 김포 (GMP)" },
  { code: "KIX", label: "오사카 (KIX)" },
  { code: "NRT", label: "도쿄 나리타 (NRT)" },
  { code: "HND", label: "도쿄 하네다 (HND)" },
  { code: "FUK", label: "후쿠오카 (FUK)" },
  { code: "CTS", label: "삿포로 (CTS)" },
  { code: "OKA", label: "오키나와 (OKA)" },
];

export default function AlertsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [origin, setOrigin] = useState("ICN");
  const [destination, setDestination] = useState("KIX");
  const [departDate, setDepartDate] = useState("");
  const [targetKrw, setTargetKrw] = useState("");
  const [channel, setChannel] = useState("email");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [formError, setFormError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.request<{ items: AlertItem[] }>("/api/alerts"),
  });

  const createMut = useMutation({
    mutationFn: (body: object) =>
      api.request("/api/alerts", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      setDepartDate("");
      setTargetKrw("");
      setFormError("");
    },
    onError: () => setFormError("알림 생성 실패. 다시 시도해주세요."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      api.request(`/api/alerts/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const krw = parseInt(targetKrw.replace(/,/g, ""), 10);
    if (!departDate || isNaN(krw) || krw <= 0) {
      setFormError("날짜와 목표 가격을 확인해주세요.");
      return;
    }
    if (channel === "email" && !notifyEmail) {
      setFormError("이메일 주소를 입력해주세요.");
      return;
    }
    createMut.mutate({
      origin, destination, depart_date: departDate, target_krw: krw, channel,
      notify_email: channel === "email" ? notifyEmail : undefined,
    });
  }

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-fg-5 hover:text-fg-3 text-sm">← 뒤로</button>
        <h1 className="font-semibold text-fg-1">가격 알림</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 flex flex-col gap-4">
        {/* 생성 폼 */}
        <Card>
          <h2 className="font-semibold text-fg-1 mb-3">새 알림 추가</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Select label="출발" value={origin} onChange={e => setOrigin(e.target.value)}>
                {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}
              </Select>
              <Select label="도착" value={destination} onChange={e => setDestination(e.target.value)}>
                {AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.label}</option>)}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="가는 날" type="date" min={today} value={departDate} onChange={e => setDepartDate(e.target.value)} required />
              <Select label="알림 채널" value={channel} onChange={e => setChannel(e.target.value)}>
                <option value="email">이메일</option>
                <option value="kakao">카카오톡</option>
              </Select>
            </div>
            {channel === "email" && (
              <Input
                label="알림 받을 이메일"
                type="email"
                value={notifyEmail}
                onChange={e => setNotifyEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
              />
            )}
            <Input
              label="목표 가격 (원)"
              type="number"
              min={1}
              value={targetKrw}
              onChange={e => setTargetKrw(e.target.value)}
              placeholder="200000"
              required
            />
            {formError && <Banner variant="danger">{formError}</Banner>}
            <Banner variant="info">
              목표 가격 이하 항공권이 나오면 알림을 보내드려요. 6시간마다 확인합니다.
            </Banner>
            <Button type="submit" variant="primary" disabled={createMut.isPending}>
              {createMut.isPending ? "추가 중..." : "알림 추가"}
            </Button>
          </form>
        </Card>

        {/* 목록 */}
        {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}
        {isError && <Banner variant="danger">알림 목록을 불러올 수 없습니다.</Banner>}

        {data?.items && data.items.length === 0 && (
          <p className="text-center text-fg-6 py-8 text-sm">등록된 알림이 없습니다.</p>
        )}

        {data?.items?.map((alert: AlertItem) => (
          <Card key={alert.id}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-fg-1">
                  {alert.origin} → {alert.destination}
                </p>
                <p className="text-sm text-fg-5 mt-0.5">{alert.depart_date}</p>
                <p className="text-sm text-primary font-semibold mt-1">
                  목표: {alert.target_krw.toLocaleString()}원 이하
                </p>
                {alert.last_notified_at && (
                  <p className="text-xs text-fg-6 mt-0.5">
                    마지막 알림: {new Date(alert.last_notified_at).toLocaleDateString("ko-KR")}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMut.mutate(alert.id)}
                disabled={deleteMut.isPending}
              >
                삭제
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
