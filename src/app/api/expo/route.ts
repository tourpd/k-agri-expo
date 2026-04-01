// src/app/api/expo/entry/route.ts
import { NextResponse } from "next/server";

type EntryPayload = {
  name: string;
  phone: string;
  region?: string;
  crop?: string;
  role?: "farmer" | "buyer";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EntryPayload;

    const name = (body.name ?? "").trim();
    const phoneRaw = (body.phone ?? "").trim();
    const phone = phoneRaw.replace(/[^0-9]/g, ""); // 숫자만
    const region = (body.region ?? "").trim();
    const crop = (body.crop ?? "").trim();
    const role = body.role === "buyer" ? "buyer" : "farmer";

    if (!name || !phone) {
      return NextResponse.json({ ok: false, error: "이름/전화번호는 필수입니다." }, { status: 400 });
    }

    // ✅ 서버에서 체크할 “입장 정보” (과하게 길게 저장하지 마세요)
    const entry = {
      name,
      phone,
      region,
      crop,
      role,
      at: new Date().toISOString(),
      allowDownloads: true, // ✅ 여기서 true까지 같이
    };

    const res = NextResponse.json({ ok: true, entry });

    // ✅ 핵심: /expo 서버가 읽을 “쿠키”를 확실히 심는다
    // - path: "/"  (전역)
    // - sameSite: "lax" (보통 안전)
    // - secure: dev에서는 false, prod에서는 true 권장
    const isProd = process.env.NODE_ENV === "production";

    res.cookies.set("kagri_expo_entry", JSON.stringify(entry), {
      httpOnly: true,       // 서버에서만 읽어도 되므로 true 권장
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30일
    });

    // ✅ 다운로드 허용 플래그도 쿠키로 별도 제공(서버에서 조건 체크용)
    res.cookies.set("kagri_allow_downloads", "true", {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "서버 오류" },
      { status: 500 }
    );
  }
}