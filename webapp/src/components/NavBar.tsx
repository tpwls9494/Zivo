"use client";

import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { ZivoLogo, ZivoWordmark } from "@/components/ui";

const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? "";

function kakaoLoginUrl() {
  const redirectUri = `${window.location.origin}/auth/kakao/callback`;
  const params = new URLSearchParams({
    client_id: KAKAO_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
  });
  return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`;
}

export default function NavBar() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: me } = useQuery({
    queryKey: ["auth/me"],
    queryFn: api.getMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  async function handleLogout() {
    await api.logout();
    queryClient.clear();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-border px-4 py-2 flex items-center justify-between">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5"
      >
        <ZivoLogo size={24} />
        <ZivoWordmark height={20} />
      </button>

      <div className="flex items-center gap-3">
        {me?.is_kakao_user ? (
          <>
            <span className="text-sm text-fg-4">
              {me.nickname ?? me.email ?? "로그인됨"}
            </span>
            <button
              onClick={handleLogout}
              className="text-xs text-fg-6 hover:text-fg-3 underline"
            >
              로그아웃
            </button>
          </>
        ) : (
          <a
            href={kakaoLoginUrl()}
            className="flex items-center gap-1.5 bg-[#FEE500] text-[#191919] text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#F0D800] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.64 5.18 4.08 6.6l-.78 2.88c-.07.25.21.45.43.3L9.1 18.6c.94.27 1.93.42 2.9.42 5.52 0 10-3.48 10-7.8C22 6.48 17.52 3 12 3z" />
            </svg>
            카카오로 로그인
          </a>
        )}

        <button
          onClick={() => router.push("/profile")}
          className="text-xs text-fg-5 hover:text-fg-3"
        >
          프로필
        </button>
        <button
          onClick={() => router.push("/bookings")}
          className="text-xs text-fg-5 hover:text-fg-3"
        >
          예약이력
        </button>
      </div>
    </nav>
  );
}
