import { NextResponse } from "next/server";
import { buildFarmerMartPrompt } from "@/lib/ai/farmer-mart-prompt";
import type { FarmerMartResult, FarmerMartSourceInput } from "@/lib/ai/farmer-mart-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeJsonParse(text: string): FarmerMartResult {
  const cleaned = text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();

  return JSON.parse(cleaned) as FarmerMartResult;
}



export async function GET() {

  return NextResponse.json({

    ok: true,

    name: "K-Agri Expo AI Farmer Mart API",

    method: "POST",

    message: "이 API는 브라우저 주소창이 아니라 POST 요청으로 농민마트 분석을 실행합니다.",

    sampleBody: {

      homepageUrl: "https://example.com",

      youtubeUrl: "https://youtube.com/@channel",

      blogUrl: "https://blog.naver.com/example",

      cafeUrl: "",

      storeUrl: "",

      productImageUrls: [],

      memo: "제품명, 대상작물, 효능, 사용법 등 추가 메모",

    },

  });

}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const input: FarmerMartSourceInput = {
      homepageUrl: body.homepageUrl || "",
      youtubeUrl: body.youtubeUrl || "",
      blogUrl: body.blogUrl || "",
      cafeUrl: body.cafeUrl || "",
      storeUrl: body.storeUrl || "",
      productImageUrls: Array.isArray(body.productImageUrls) ? body.productImageUrls : [],
      memo: body.memo || "",
    };

    const hasAnyInput =
      input.homepageUrl ||
      input.youtubeUrl ||
      input.blogUrl ||
      input.cafeUrl ||
      input.storeUrl ||
      input.memo ||
      input.productImageUrls?.length;

    if (!hasAnyInput) {
      return NextResponse.json(
        { ok: false, error: "분석할 홈페이지, 유튜브, 블로그, 카페, 이미지 또는 메모가 필요합니다." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY가 설정되어 있지 않습니다." },
        { status: 500 }
      );
    }

    const prompt = buildFarmerMartPrompt(input);

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "너는 한국 농민 대상 농자재·건강식품·미래식량 판매페이지를 만드는 AI MD다. 반드시 JSON만 반환한다.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errorText = await aiRes.text();
      return NextResponse.json(
        { ok: false, error: "AI 분석 API 호출 실패", detail: errorText },
        { status: 500 }
      );
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    let result: FarmerMartResult;

    try {
      result = safeJsonParse(content);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "AI 응답을 JSON으로 변환하지 못했습니다.",
          raw: content,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      analysis: result,
      pageCount: 1,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "농민마트 생성 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
