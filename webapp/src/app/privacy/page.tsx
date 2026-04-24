import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 — Zivo",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-sm text-gray-700 leading-relaxed">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">개인정보처리방침</h1>
      <p className="text-gray-400 mb-8">최종 업데이트: 2026-04-25</p>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-2">개요</h2>
        <p>
          Zivo는 한국–일본 노선의 최저가 항공권 조합을 탐색하고, 항공사 예약 폼에 탑승자 정보를
          자동 입력해주는 서비스입니다(웹앱 + 크롬 익스텐션).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-3">수집하는 정보</h2>

        <h3 className="font-medium text-gray-800 mb-1">로컬 저장 (chrome.storage.sync / localStorage)</h3>
        <ul className="list-disc ml-5 mb-4 space-y-1">
          <li>여권 영문명 (이름·성)</li>
          <li>생년월일</li>
          <li>연락처</li>
          <li>자주 이용하는 노선</li>
        </ul>
        <p className="text-red-600 font-medium mb-4">
          여권번호와 여권 만료일은 로컬 저장소에 절대 저장되지 않습니다.
        </p>

        <h3 className="font-medium text-gray-800 mb-1">서버 저장 (암호화)</h3>
        <ul className="list-disc ml-5 space-y-1">
          <li>여권번호 — AES-256-GCM 암호화 후 데이터베이스에 저장. 평문은 서버 외부로 전달되지 않습니다.</li>
          <li>여권 만료일 — AES-256-GCM 암호화 저장.</li>
          <li>임의 생성된 기기 UUID (계정 없이 프로필 식별용).</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-2">수집하지 않는 정보</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li>카드번호, CVV 등 결제 정보 — 결제는 항공사/OTA 페이지에서 직접 처리됩니다.</li>
          <li>익스텐션이 동작하는 항공사 예약 페이지 외의 브라우징 기록.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-2">자동완성 동작 방식</h2>
        <p className="mb-2">
          익스텐션은 아래 항공사 예약 사이트에서만 content script를 실행합니다.
        </p>
        <p className="text-gray-500 text-xs leading-6">
          koreanair.com · flyasiana.com · jal.co.jp · ana.co.jp ·
          jejuair.net · jinair.com · airbusan.com · twayair.com ·
          flypeach.com · jetstar.com
        </p>
        <p className="mt-2">
          해당 페이지가 열리면 chrome.storage.sync에 저장된 프로필을 읽어 탑승자 폼을 자동 입력합니다.
          자동완성 중에는 어떤 데이터도 외부로 전송되지 않습니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-2">제3자 공유</h2>
        <p>
          개인정보를 판매·임대·공유하지 않습니다. 항공편 검색 쿼리는 오퍼 조회 목적으로만
          Duffel 항공 API에 전달됩니다.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-2">데이터 삭제</h2>
        <p>
          익스텐션을 제거하면 chrome.storage.sync 데이터가 자동 삭제됩니다.
          서버 저장 데이터 삭제를 요청하려면 아래 이메일로 문의해주세요.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-2">보안</h2>
        <ul className="list-disc ml-5 space-y-1">
          <li>민감 필드 전체 AES-256-GCM 암호화 저장</li>
          <li>모든 통신 TLS 1.3</li>
          <li>여권번호·생체정보 평문 로그 기록 없음</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-gray-900 mb-2">문의</h2>
        <p>
          개인정보 관련 문의 및 삭제 요청:{" "}
          <a href="mailto:youngg662@naver.com" className="text-blue-600 underline">
            youngg662@naver.com
          </a>
        </p>
      </section>
    </div>
  );
}
