"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfileStore } from "@/lib/stores/profile";

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
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.push("/")} className="text-gray-500 hover:text-gray-700">
          ← 뒤로
        </button>
        <h1 className="font-semibold">프로필 관리</h1>
      </div>

      <div className="max-w-lg mx-auto p-4">
        {s.loading && (
          <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800">탑승자 정보</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">성 (영문)</label>
              <input
                value={s.passport_family_name}
                onChange={(e) => s.setField("passport_family_name", e.target.value.toUpperCase())}
                placeholder="LEE"
                maxLength={64}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">이름 (영문)</label>
              <input
                value={s.passport_given_name}
                onChange={(e) => s.setField("passport_given_name", e.target.value.toUpperCase())}
                placeholder="SEJIN"
                maxLength={64}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">생년월일</label>
              <input
                type="date"
                value={s.birth_date}
                onChange={(e) => s.setField("birth_date", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">성별</label>
              <select
                value={s.gender}
                onChange={(e) => s.setField("gender", e.target.value as "M" | "F")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="M">남성</option>
                <option value="F">여성</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">국적</label>
              <input
                value={s.nationality}
                onChange={(e) => s.setField("nationality", e.target.value.toUpperCase().slice(0, 3))}
                maxLength={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">연락처</label>
              <input
                type="tel"
                value={s.phone}
                onChange={(e) => s.setField("phone", e.target.value)}
                placeholder="+821012345678"
                maxLength={32}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 여권 정보 */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-700 text-sm mb-3">여권 정보 (서버 암호화 저장)</h3>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  여권번호
                  {s.passport_number_masked && (
                    <span className="ml-2 text-gray-400">저장됨: {s.passport_number_masked}</span>
                  )}
                </label>
                <input
                  value={s.passport_number}
                  onChange={(e) => s.setField("passport_number", e.target.value.toUpperCase())}
                  placeholder={s.passport_number_masked ? "변경 시에만 입력" : "M12345678"}
                  maxLength={20}
                  autoComplete="off"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">여권 만료일</label>
                <input
                  type="date"
                  value={s.passport_expiry}
                  onChange={(e) => s.setField("passport_expiry", e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-xs text-gray-400">
                여권번호·만료일은 AES-256으로 암호화되어 서버에만 저장됩니다. 로컬 저장소에는 저장되지 않습니다.
              </p>
            </div>
          </div>

          {/* 검색 기본값 */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-medium text-gray-700 text-sm mb-3">검색 기본값</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">기본 출발지</label>
                <input
                  value={s.defaults.default_origin}
                  onChange={(e) => s.setDefault("default_origin", e.target.value.toUpperCase().slice(0, 3))}
                  maxLength={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">성인 수</label>
                <input
                  type="number"
                  min={1}
                  max={9}
                  value={s.defaults.adults}
                  onChange={(e) => s.setDefault("adults", Number(e.target.value) || 1)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">좌석 등급</label>
                <select
                  value={s.defaults.preferred_cabin}
                  onChange={(e) => s.setDefault("preferred_cabin", e.target.value as typeof s.defaults.preferred_cabin)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="economy">이코노미</option>
                  <option value="premium_economy">프리미엄 이코노미</option>
                  <option value="business">비즈니스</option>
                  <option value="first">퍼스트</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">수하물</label>
                <select
                  value={s.defaults.baggage_preference}
                  onChange={(e) => s.setDefault("baggage_preference", e.target.value as typeof s.defaults.baggage_preference)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="any">상관없음</option>
                  <option value="carry_only">기내만</option>
                  <option value="checked">위탁 포함</option>
                </select>
              </div>
            </div>
          </div>

          {s.error && <p className="text-sm text-red-600">오류: {s.error}</p>}
          {s.saved_at && !s.error && (
            <p className="text-sm text-green-600">
              저장됨 ({new Date(s.saved_at).toLocaleTimeString("ko-KR")})
            </p>
          )}

          <button
            type="submit"
            disabled={disabled}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {s.saving ? "저장 중..." : "프로필 저장"}
          </button>
        </form>
      </div>
    </div>
  );
}
