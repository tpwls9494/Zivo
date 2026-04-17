export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Zivo</h1>
        <p className="text-gray-600 mb-8">한일 노선 최저가 항공권 — 편도 조합으로 더 싸게, 원터치로 더 빠르게</p>
        <div className="flex gap-4 justify-center">
          <a
            href="/search"
            className="rounded-lg bg-blue-600 text-white px-6 py-3 font-semibold hover:bg-blue-700 transition-colors"
          >
            항공권 검색
          </a>
          <a
            href="/profile"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold hover:bg-gray-50 transition-colors"
          >
            프로필 관리
          </a>
        </div>
      </div>
    </main>
  );
}
