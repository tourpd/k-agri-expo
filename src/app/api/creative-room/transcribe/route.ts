import { NextResponse } from "next/server";
import { writeFile, unlink, readFile } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function compressAudio(inputPath: string, outputPath: string) {
  await execFileAsync("ffmpeg", [
    "-y",
    "-i",
    inputPath,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "24k",
    outputPath,
  ]);
}

export async function POST(req: Request) {
  let inputPath = "";
  let outputPath = "";

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, message: "OPENAI_API_KEY가 없습니다." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "음성 파일이 없습니다." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const id = randomUUID();
    const ext = path.extname(file.name || ".m4a") || ".m4a";

    inputPath = `/tmp/${id}${ext}`;
    outputPath = `/tmp/${id}-compressed.mp3`;

    await writeFile(inputPath, buffer);

    await compressAudio(inputPath, outputPath);

    const compressedBuffer = await readFile(outputPath);
    const compressedFile = new File([compressedBuffer], "compressed.mp3", {
      type: "audio/mpeg",
    });

    const audioForm = new FormData();
    audioForm.append("file", compressedFile, "compressed.mp3");
    audioForm.append(
      "model",
      process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe"
    );
    audioForm.append("language", "ko");

    const transcribeRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: audioForm,
      }
    );

    const transcribeData = await transcribeRes.json();

    if (!transcribeRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            transcribeData?.error?.message ||
            "음성 글자 변환에 실패했습니다.",
        },
        { status: transcribeRes.status }
      );
    }

    const transcript = String(transcribeData.text || "");

    const summaryPrompt = `
아래 녹취록을 한국농수산TV AI 작가실용으로 정리하십시오.

정리 형식:

1. 제목 후보
2. 한 줄 요약
3. 핵심 인물
4. 감정선
5. 갈등 구조
6. 명언 후보
7. 웹툰 소재
8. 쇼츠 소재
9. 광고 소재
10. 교육자료 소재
11. 상세페이지 소재
12. 다음에 물어볼 질문

중요:
- 단순 요약하지 말고 방송작가가 소재 발굴하듯 정리하십시오.
- 웹툰 소재는 4컷/8컷 가능성을 구분하십시오.
- 쇼츠 소재는 첫 3초 후킹까지 제안하십시오.
- 제품이나 브랜드는 억지로 팔지 말고 이야기 속 PPL 가능성으로 정리하십시오.

녹취록:
${transcript}
`;

    const summaryRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "당신은 한국농수산TV AI 작가실의 구성작가입니다. 인터뷰 녹취를 웹툰, 쇼츠, 광고, 교육자료, 상세페이지 소재로 정리합니다.",
          },
          {
            role: "user",
            content: summaryPrompt,
          },
        ],
        temperature: 0.45,
      }),
    });

    const summaryData = await summaryRes.json();

    if (!summaryRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            summaryData?.error?.message || "작가노트 정리에 실패했습니다.",
        },
        { status: summaryRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      originalSize: buffer.length,
      compressedSize: compressedBuffer.length,
      transcript,
      summary:
        summaryData?.choices?.[0]?.message?.content ||
        "정리 결과를 만들지 못했습니다.",
    });
  } catch (error) {
    console.error("creative-room transcribe error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "서버 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  } finally {
    if (inputPath) {
      unlink(inputPath).catch(() => {});
    }

    if (outputPath) {
      unlink(outputPath).catch(() => {});
    }
  }
}
