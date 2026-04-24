import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }

  const cookieStore = await cookies();
  const deviceId = cookieStore.get("zivo-device-id")?.value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/kakao/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, device_id: deviceId ?? null }),
    });

    if (!res.ok) throw new Error(`Exchange failed: ${res.status}`);

    const data = await res.json() as {
      token: string;
      nickname: string | null;
      email: string | null;
    };

    // httpOnly JWT 쿠키 — JS 접근 불가
    cookieStore.set("zivo_token", data.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    // 닉네임 쿠키 — NavBar에서 읽기 위해 non-httpOnly
    cookieStore.set("zivo_nickname", data.nickname ?? "", {
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return NextResponse.redirect(`${origin}/`);
  } catch {
    return NextResponse.redirect(`${origin}/?auth=error`);
  }
}
