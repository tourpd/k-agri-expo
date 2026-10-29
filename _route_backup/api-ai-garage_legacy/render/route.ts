import { NextResponse } from "next/server";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const body = await req.json();
  const prompt = body.prompt || "";

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, error: "OPENAI_API_KEY 없음" }, { status: 500 });
  }

  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    quality: "medium",
    n: 1
  });

  const b64 = result.data?.[0]?.b64_json;
  if (!b64) {
    return NextResponse.json({ ok: false, error: "이미지 생성 실패" }, { status: 500 });
  }

  const dir = path.join(process.cwd(), "public/mobility/pv5/generated");
  fs.mkdirSync(dir, { recursive: true });

  const file = `${Date.now()}.png`;
  fs.writeFileSync(path.join(dir, file), Buffer.from(b64, "base64"));

  return NextResponse.json({
    ok: true,
    url: `/mobility/pv5/generated/${file}`
  });
}
