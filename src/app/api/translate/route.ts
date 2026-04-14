import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function n(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = n(body.text);
    const targetLanguage = n(body.target_language) || "Korean";

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "text가 필요합니다." },
        { status: 400 }
      );
    }

    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Translate the user's text into ${targetLanguage}. Keep business tone clear and concise.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      translated: res.choices[0]?.message?.content || "",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "번역 실패",
      },
      { status: 500 }
    );
  }
}