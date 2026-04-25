"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PassengerItem, PassengerPayload, ProfileResponse } from "@zivo/types";
import { api } from "@/lib/api";
import { Button, Banner, CardForm, Input, Select, Spinner } from "@/components/ui";

const EMPTY_FORM: PassengerPayload = {
  nickname: "나",
  passport_given_name: "",
  passport_family_name: "",
  birth_date: "",
  gender: "M",
  nationality: "KOR",
  phone: "",
  passport_number: "",
  passport_expiry: "",
  is_primary: false,
};

function PassengerForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial: PassengerPayload;
  onSave: (p: PassengerPayload) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState<PassengerPayload>(initial);
  const set = (k: keyof PassengerPayload, v: string | boolean) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <CardForm>
      <Input label="별명" value={form.nickname} onChange={(e) => set("nickname", e.target.value)} maxLength={32} placeholder="나, 배우자, 엄마 …" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="성 (영문)" value={form.passport_family_name} onChange={(e) => set("passport_family_name", e.target.value.toUpperCase())} placeholder="LEE" maxLength={64} className="uppercase" />
        <Input label="이름 (영문)" value={form.passport_given_name} onChange={(e) => set("passport_given_name", e.target.value.toUpperCase())} placeholder="SEJIN" maxLength={64} className="uppercase" />
        <Input label="생년월일" type="date" value={form.birth_date} onChange={(e) => set("birth_date", e.target.value)} />
        <Select label="성별" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
          <option value="M">남성</option>
          <option value="F">여성</option>
        </Select>
        <Input label="연락처" type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+821012345678" maxLength={32} />
        <Input label="국적" value={form.nationality} onChange={(e) => set("nationality", e.target.value.toUpperCase().slice(0, 3))} maxLength={3} className="uppercase" />
      </div>
      <div className="border-t border-border pt-4 flex flex-col gap-3">
        <p className="text-xs text-fg-5">여권 정보 (서버 암호화 저장 · 선택)</p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="여권번호" value={form.passport_number ?? ""} onChange={(e) => set("passport_number", e.target.value.toUpperCase())} placeholder="M12345678" maxLength={20} autoComplete="off" className="font-mono uppercase" />
          <Input label="여권 만료일" type="date" value={form.passport_expiry ?? ""} onChange={(e) => set("passport_expiry", e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-fg-3 cursor-pointer">
        <input type="checkbox" checked={!!form.is_primary} onChange={(e) => set("is_primary", e.target.checked)} />
        기본 탑승자로 설정
      </label>
      {error && <Banner variant="danger">{error}</Banner>}
      <div className="flex gap-2">
        <Button type="button" variant="primary" size="md" disabled={saving || !form.passport_given_name || !form.passport_family_name || !form.birth_date || !form.phone} onClick={() => onSave(form)}>
          {saving ? "저장 중…" : "저장"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onCancel}>취소</Button>
      </div>
    </CardForm>
  );
}

function PassengerCard({ p, onEdit, onDelete }: { p: PassengerItem; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-fg-1">{p.nickname}</span>
          {p.is_primary && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">기본</span>}
        </div>
        <p className="text-sm text-fg-3">{p.passport_family_name} {p.passport_given_name}</p>
        <p className="text-xs text-fg-5">{p.birth_date} · {p.gender === "M" ? "남성" : "여성"} · {p.phone}</p>
        {p.passport_number_masked && <p className="text-xs text-fg-5 font-mono">여권 {p.passport_number_masked}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onEdit}>수정</Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>삭제</Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"list" | "add" | { edit: PassengerItem }>("list");
  const [mutError, setMutError] = useState("");

  const { data: passengers, isLoading } = useQuery({
    queryKey: ["passengers"],
    queryFn: api.listPassengers,
  });

  // 익스텐션에서 저장한 구형 프로필 확인 (passengers 비어있을 때만)
  const { data: oldProfileData } = useQuery({
    queryKey: ["profile"],
    queryFn: api.getProfile,
    enabled: passengers !== undefined && passengers.length === 0,
  });
  const oldProfile =
    oldProfileData && "passport_given_name" in oldProfileData
      ? (oldProfileData as ProfileResponse)
      : null;

  const importMut = useMutation({
    mutationFn: () =>
      api.createPassenger({
        nickname: "나",
        passport_given_name: oldProfile?.passport_given_name ?? "",
        passport_family_name: oldProfile?.passport_family_name ?? "",
        birth_date: oldProfile?.birth_date ?? "",
        gender: (oldProfile?.gender ?? "M") as "M" | "F",
        nationality: oldProfile?.nationality ?? "KOR",
        phone: oldProfile?.phone ?? "",
        is_primary: true,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["passengers"] }),
  });

  const createMut = useMutation({
    mutationFn: api.createPassenger,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["passengers"] }); setMode("list"); setMutError(""); },
    onError: () => setMutError("저장 실패. 다시 시도해주세요."),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: PassengerPayload }) => api.updatePassenger(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["passengers"] }); setMode("list"); setMutError(""); },
    onError: () => setMutError("저장 실패. 다시 시도해주세요."),
  });

  const deleteMut = useMutation({
    mutationFn: api.deletePassenger,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["passengers"] }),
  });

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-fg-5 hover:text-fg-3 text-sm">← 뒤로</button>
          <h1 className="font-semibold text-fg-1">탑승자 관리</h1>
        </div>
        {mode === "list" && (
          <Button variant="primary" size="sm" onClick={() => { setMode("add"); setMutError(""); }}>
            + 탑승자 추가
          </Button>
        )}
      </div>

      <div className="max-w-lg mx-auto p-4 flex flex-col gap-3">
        {mode === "add" && (
          <PassengerForm
            initial={{ ...EMPTY_FORM, is_primary: !passengers?.length }}
            onSave={(p) => createMut.mutate(p)}
            onCancel={() => setMode("list")}
            saving={saving}
            error={mutError}
          />
        )}

        {typeof mode === "object" && "edit" in mode && (
          <PassengerForm
            initial={{
              nickname: mode.edit.nickname,
              passport_given_name: mode.edit.passport_given_name,
              passport_family_name: mode.edit.passport_family_name,
              birth_date: mode.edit.birth_date,
              gender: mode.edit.gender,
              nationality: mode.edit.nationality,
              phone: mode.edit.phone,
              passport_number: "",
              passport_expiry: "",
              is_primary: mode.edit.is_primary,
            }}
            onSave={(p) => updateMut.mutate({ id: mode.edit.id, body: p })}
            onCancel={() => setMode("list")}
            saving={saving}
            error={mutError}
          />
        )}

        {mode === "list" && (
          <>
            {isLoading && <div className="flex justify-center py-8"><Spinner size="sm" /></div>}
            {!isLoading && !passengers?.length && (
              <div className="flex flex-col gap-3">
                {/* 익스텐션에서 저장한 프로필이 있으면 가져오기 배너 표시 */}
                {oldProfile && (
                  <Banner variant="info">
                    <p className="font-medium mb-1">크롬 익스텐션에 저장된 정보가 있습니다</p>
                    <p className="text-sm mb-2">
                      {oldProfile.passport_family_name} {oldProfile.passport_given_name} · {oldProfile.phone}
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={importMut.isPending}
                      onClick={() => importMut.mutate()}
                    >
                      {importMut.isPending ? "가져오는 중..." : "탑승자로 가져오기"}
                    </Button>
                  </Banner>
                )}
                <div className="text-center py-8 text-fg-5">
                  <p className="mb-3">저장된 탑승자가 없습니다.</p>
                  <Button variant="primary" size="md" onClick={() => setMode("add")}>첫 탑승자 추가</Button>
                </div>
              </div>
            )}
            {passengers?.map((p) => (
              <PassengerCard
                key={p.id}
                p={p}
                onEdit={() => { setMode({ edit: p }); setMutError(""); }}
                onDelete={() => { if (confirm(`${p.nickname} 탑승자를 삭제할까요?`)) deleteMut.mutate(p.id); }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
