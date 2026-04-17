import { useEffect } from "react";
import { useProfileStore } from "@/lib/store";

export default function ProfileForm() {
  const s = useProfileStore();

  useEffect(() => {
    void s.load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void s.save();
  };

  const disabled =
    !s.passport_given_name ||
    !s.passport_family_name ||
    !s.birth_date ||
    !s.phone ||
    s.saving;

  return (
    <form onSubmit={onSubmit} className="space-y-3 text-sm">
      {s.loading && <div className="text-xs text-gray-500">불러오는 중…</div>}

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">성 (영문)</span>
          <input
            className="border rounded px-2 py-1 uppercase"
            value={s.passport_family_name}
            onChange={(e) => s.setField("passport_family_name", e.target.value.toUpperCase())}
            placeholder="LEE"
            maxLength={64}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">이름 (영문)</span>
          <input
            className="border rounded px-2 py-1 uppercase"
            value={s.passport_given_name}
            onChange={(e) => s.setField("passport_given_name", e.target.value.toUpperCase())}
            placeholder="SEJIN"
            maxLength={64}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">생년월일</span>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={s.birth_date}
            onChange={(e) => s.setField("birth_date", e.target.value)}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">성별</span>
          <select
            className="border rounded px-2 py-1"
            value={s.gender}
            onChange={(e) => s.setField("gender", e.target.value as "M" | "F")}
          >
            <option value="M">남</option>
            <option value="F">여</option>
          </select>
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">국적 (3자)</span>
          <input
            className="border rounded px-2 py-1 uppercase"
            value={s.nationality}
            onChange={(e) =>
              s.setField("nationality", e.target.value.toUpperCase().slice(0, 3))
            }
            maxLength={3}
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">연락처</span>
          <input
            className="border rounded px-2 py-1"
            value={s.phone}
            onChange={(e) => s.setField("phone", e.target.value)}
            placeholder="+821012345678"
            maxLength={32}
          />
        </label>
      </div>

      <div className="border-t pt-2 space-y-2">
        <div className="text-xs font-semibold text-gray-700">여권 정보 (서버 암호화 저장)</div>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">
            여권번호
            {s.passport_number_masked && (
              <span className="ml-2 text-gray-400">저장됨: {s.passport_number_masked}</span>
            )}
          </span>
          <input
            className="border rounded px-2 py-1 font-mono"
            value={s.passport_number}
            onChange={(e) => s.setField("passport_number", e.target.value.toUpperCase())}
            placeholder={s.passport_number_masked ? "변경 시에만 입력" : "M12345678"}
            maxLength={20}
            autoComplete="off"
          />
        </label>
        <label className="flex flex-col">
          <span className="text-xs text-gray-600">여권 만료일</span>
          <input
            type="date"
            className="border rounded px-2 py-1"
            value={s.passport_expiry}
            onChange={(e) => s.setField("passport_expiry", e.target.value)}
          />
        </label>
        <p className="text-[10px] text-gray-500 leading-tight">
          여권번호·만료일은 AES-256 으로 암호화되어 서버에만 저장됩니다. 크롬 동기화에는 저장되지
          않습니다.
        </p>
      </div>

      <div className="border-t pt-2 space-y-2">
        <div className="text-xs font-semibold text-gray-700">검색 기본값</div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col">
            <span className="text-xs text-gray-600">기본 출발지</span>
            <input
              className="border rounded px-2 py-1 uppercase"
              value={s.defaults.default_origin}
              onChange={(e) =>
                s.setDefault("default_origin", e.target.value.toUpperCase().slice(0, 3))
              }
              maxLength={3}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-gray-600">성인</span>
            <input
              type="number"
              min={1}
              max={9}
              className="border rounded px-2 py-1"
              value={s.defaults.adults}
              onChange={(e) => s.setDefault("adults", Number(e.target.value) || 1)}
            />
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-gray-600">좌석 등급</span>
            <select
              className="border rounded px-2 py-1"
              value={s.defaults.preferred_cabin}
              onChange={(e) =>
                s.setDefault(
                  "preferred_cabin",
                  e.target.value as typeof s.defaults.preferred_cabin
                )
              }
            >
              <option value="economy">이코노미</option>
              <option value="premium_economy">프리미엄 이코노미</option>
              <option value="business">비즈니스</option>
              <option value="first">퍼스트</option>
            </select>
          </label>
          <label className="flex flex-col">
            <span className="text-xs text-gray-600">수하물</span>
            <select
              className="border rounded px-2 py-1"
              value={s.defaults.baggage_preference}
              onChange={(e) =>
                s.setDefault(
                  "baggage_preference",
                  e.target.value as typeof s.defaults.baggage_preference
                )
              }
            >
              <option value="any">상관없음</option>
              <option value="carry_only">기내만</option>
              <option value="checked">위탁 포함</option>
            </select>
          </label>
        </div>
      </div>

      {s.error && <div className="text-xs text-red-600">에러: {s.error}</div>}
      {s.saved_at && !s.error && (
        <div className="text-xs text-green-600">저장됨 ({new Date(s.saved_at).toLocaleTimeString()})</div>
      )}

      <button
        type="submit"
        disabled={disabled}
        className="w-full bg-black text-white rounded py-2 disabled:opacity-40"
      >
        {s.saving ? "저장 중…" : "프로필 저장"}
      </button>
    </form>
  );
}
