"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/lib/stores/profile";
import { Button, Banner, CardForm, Input, Select, Spinner } from "@/components/ui";

export default function ProfilePage() {
  const router = useRouter();
  const s = useProfileStore();

  useEffect(() => {
    void s.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disabled =
    !s.passport_given_name || !s.passport_family_name || !s.birth_date || !s.phone || s.saving;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    void s.save();
  }

  return (
    <div className="min-h-screen bg-[--color-bg]">
      <div className="bg-white border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-fg-5 hover:text-fg-3 text-sm">
          ← 뒤로
        </button>
        <h1 className="font-semibold text-fg-1">프로필 관리</h1>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {s.loading && (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <CardForm>
            <h2 className="font-semibold text-fg-1">탑승자 정보</h2>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="성 (영문)"
                value={s.passport_family_name}
                onChange={(e) => s.setField("passport_family_name", e.target.value.toUpperCase())}
                placeholder="LEE"
                maxLength={64}
                className="uppercase"
              />
              <Input
                label="이름 (영문)"
                value={s.passport_given_name}
                onChange={(e) => s.setField("passport_given_name", e.target.value.toUpperCase())}
                placeholder="SEJIN"
                maxLength={64}
                className="uppercase"
              />
              <Input
                label="생년월일"
                type="date"
                value={s.birth_date}
                onChange={(e) => s.setField("birth_date", e.target.value)}
              />
              <Select
                label="성별"
                value={s.gender}
                onChange={(e) => s.setField("gender", e.target.value as "M" | "F")}
              >
                <option value="M">남성</option>
                <option value="F">여성</option>
              </Select>
              <Input
                label="국적"
                value={s.nationality}
                onChange={(e) => s.setField("nationality", e.target.value.toUpperCase().slice(0, 3))}
                maxLength={3}
                className="uppercase"
              />
              <Input
                label="연락처"
                type="tel"
                value={s.phone}
                onChange={(e) => s.setField("phone", e.target.value)}
                placeholder="+821012345678"
                maxLength={32}
              />
            </div>

            {/* 여권 정보 */}
            <div className="border-t border-border pt-4 flex flex-col gap-3">
              <h3 className="font-medium text-fg-3 text-sm">여권 정보 (서버 암호화 저장)</h3>
              <Input
                label={
                  s.passport_number_masked
                    ? `여권번호 — 저장됨: ${s.passport_number_masked}`
                    : "여권번호"
                }
                value={s.passport_number}
                onChange={(e) => s.setField("passport_number", e.target.value.toUpperCase())}
                placeholder={s.passport_number_masked ? "변경 시에만 입력" : "M12345678"}
                maxLength={20}
                autoComplete="off"
                className="font-mono uppercase"
              />
              <Input
                label="여권 만료일"
                type="date"
                value={s.passport_expiry}
                onChange={(e) => s.setField("passport_expiry", e.target.value)}
              />
              <p className="text-xs text-fg-6">
                여권번호·만료일은 AES-256으로 암호화되어 서버에만 저장됩니다. 로컬 저장소에는 저장되지 않습니다.
              </p>
            </div>

            {/* 검색 기본값 */}
            <div className="border-t border-border pt-4 flex flex-col gap-3">
              <h3 className="font-medium text-fg-3 text-sm">검색 기본값</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="기본 출발지"
                  value={s.defaults.default_origin}
                  onChange={(e) => s.setDefault("default_origin", e.target.value.toUpperCase().slice(0, 3))}
                  maxLength={3}
                  className="uppercase"
                />
                <Input
                  label="성인 수"
                  type="number"
                  min={1}
                  max={9}
                  value={s.defaults.adults}
                  onChange={(e) => s.setDefault("adults", Number(e.target.value) || 1)}
                />
                <Select
                  label="좌석 등급"
                  value={s.defaults.preferred_cabin}
                  onChange={(e) => s.setDefault("preferred_cabin", e.target.value as typeof s.defaults.preferred_cabin)}
                >
                  <option value="economy">이코노미</option>
                  <option value="premium_economy">프리미엄 이코노미</option>
                  <option value="business">비즈니스</option>
                  <option value="first">퍼스트</option>
                </Select>
                <Select
                  label="수하물"
                  value={s.defaults.baggage_preference}
                  onChange={(e) => s.setDefault("baggage_preference", e.target.value as typeof s.defaults.baggage_preference)}
                >
                  <option value="any">상관없음</option>
                  <option value="carry_only">기내만</option>
                  <option value="checked">위탁 포함</option>
                </Select>
              </div>
            </div>

            {s.error && (
              <Banner variant="danger">오류: {s.error}</Banner>
            )}
            {s.saved_at && !s.error && (
              <Banner variant="success">
                저장됨 ({new Date(s.saved_at).toLocaleTimeString("ko-KR")})
              </Banner>
            )}

            <Button type="submit" variant="primary" size="lg" disabled={disabled}>
              {s.saving ? "저장 중..." : "프로필 저장"}
            </Button>
          </CardForm>
        </form>
      </div>
    </div>
  );
}
