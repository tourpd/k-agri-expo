// src/app/api/enter/route.ts
import { NextResponse } from "next/server";

function normPhone(s: string) {
  // 숫자만 남기기
  return s.replace(/[^\d]/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const phoneRaw = String(body?.phone || "").trim();
    const phone = normPhone(phoneRaw);
    const region = String(body?.region || "").trim();
    const crop = String(body?.crop || "").trim();
    const role = String(body?.role || "farmer").trim();
    const next = String(body?.next || "/expo").trim();

    if (!name || name.length < 2) {
      return new NextResponse("이름을 2글자 이상 입력해 주십시오.", { status: 400 });
    }
    if (!phone || phone.length < 10) {
      return new NextResponse("전화번호를 정확히 입력해 주십시오.", { status: 400 });
    }

    // ✅ 대표님 요구: 등록=입장, 다운로드 허용
    const session = {
      v: 1,
      name,
      phone,
      region,
      crop,
      role, // farmer | buyer
      allowDownloads: true,
      enteredAt: new Date().toISOString(),
    };

    const res = NextResponse.json({ ok: true, next });

    // ✅ 쿠키 90일 (재입장 시 입력 반복 최소화)
    res.cookies.set("kagri_entry", JSON.stringify(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90,
    });

    return res;
  } catch (e: any) {
    return new NextResponse(e?.message || "server error", { status: 500 });
  }
}