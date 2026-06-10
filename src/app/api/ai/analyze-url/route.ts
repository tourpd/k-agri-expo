import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60000);
}

function parseJson(text: string) {
  return JSON.parse(
    text
      .replace(/^```json/i, "")
      .replace(/^```/i, "")
      .replace(/```$/i, "")
      .trim()
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const urls = [
      body.homepageUrl,
      body.storeUrl,
      body.blogUrl,
      body.youtubeUrl,
    ]
      .map((v) => String(v || "").trim())
      .filter(Boolean);

    if (urls.length === 0) {
      return NextResponse.json(
        { ok: false, error: "분석할 URL이 없습니다." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY가 없습니다." },
        { status: 500 }
      );
    }

    const pages: { url: string; text: string }[] = [];

    for (const url of urls) {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 K-Agri-Expo AI Analyzer",
        },
      });

      const html = await res.text();

      pages.push({
        url,
        text: stripHtml(html),
      });
    }

    const prompt = `
너는 K-Agri Expo AI 판매자동화센터의 농자재/건강식품/쇼핑몰 제품 분석가다.

아래 URL 페이지 텍스트를 실제로 읽고, 페이지 안에서 발견되는 제품만 추출하라.
추측 금지.
상품명, 카테고리, 설명, 작물/대상, 해결문제, 판매전략을 정리하라.

반드시 JSON만 반환하라.

형식:
{
  "allProducts":[
    {
      "name":"",
      "category":"",
      "reason":"",
      "crops":[],
      "problems":[]
    }
  ],
  "onePick":{"name":"","reason":"","campaign":""},
  "tenPack":[{"name":"","reason":""}],
  "twentyPack":[{"name":"","reason":""}],
  "groupBuyRanking":[{"rank":1,"name":"","reason":""}],
  "contentStrategy":[""],
  "warnings":[""]
}

분석 자료:
${JSON.stringify(pages).slice(0, 90000)}
`;

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.1,
        input: prompt,
      }),
    });

    const aiJson = await aiRes.json();

    if (!aiRes.ok) {
      return NextResponse.json(
        { ok: false, error: "URL AI 분석 실패", detail: aiJson },
        { status: 500 }
      );
    }

    const outputText =
      aiJson.output_text ??
      aiJson.output?.[0]?.content?.[0]?.text ??
      "";

    const analysis = parseJson(outputText);

    return NextResponse.json({
      ok: true,
      source: "url",
      pageCount: pages.length,
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "URL 분석 실패",
      },
      { status: 500 }
    );
  }
}
