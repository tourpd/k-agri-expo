import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/* 🔥 숫자만 */
function onlyDigits(phone: string) {
  return phone.replace(/\D/g, "");
}

/* 🔥 010-1234-5678 형태 */
function formatPhone(phone: string) {
  const d = onlyDigits(phone);
  if (d.length !== 11) return d;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const phoneRaw = String(body.phone || "").trim();
    const password = String(body.password || "").trim();

    if (!phoneRaw || !password) {
      return NextResponse.json({
        ok: false,
        error: "전화번호와 암호를 입력해주세요.",
      });
    }

    const phoneDigits = onlyDigits(phoneRaw);
    const phoneFormatted = formatPhone(phoneRaw);

    const supabase = createSupabaseAdminClient();

    /* 🔥 설정 가져오기 (암호 + 영상 URL 같이) */
    const { data: setting } = await supabase
      .from("live_event_settings")
      .select("live_password, live_url, video_url")
      .eq("id", "00000000-0000-0000-0000-000000000001")
      .single();

    if (!setting?.live_password) {
      return NextResponse.json({
        ok: false,
        error: "암호가 설정되지 않았습니다.",
      });
    }

    /* 🔥 암호 검증 */
    if (password !== setting.live_password) {
      return NextResponse.json({
        ok: false,
        error: "암호가 틀렸습니다.",
      });
    }

    /* 🔥 참여자 찾기 (포맷/숫자 둘 다 허용) */
    const { data: users, error } = await supabase
      .from("live_participants")
      .select("id, phone")
      .in("phone", [phoneDigits, phoneFormatted])
      .limit(1);

    const user = users?.[0];

    if (error || !user) {
      return NextResponse.json({
        ok: false,
        error: "사전 참여한 전화번호가 아닙니다.",
      });
    }

    /* 🔥 이미 인증된 사람 방지 (중복 클릭 방지) */
    await supabase
      .from("live_participants")
      .update({
        is_eligible: true,
      })
      .eq("id", user.id);

    /* 🔥 라이브 URL 결정 */
    const liveUrl =

  setting?.live_url && setting.live_url.trim()

    ? setting.live_url

    : setting?.video_url && setting.video_url.trim()

      ? setting.video_url

      : "/expo/live";

    return NextResponse.json({
      ok: true,
      live_url: liveUrl,
    });

  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: "server error",
    });
  }
}