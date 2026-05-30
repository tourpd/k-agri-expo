// src/app/api/admin/farmer-transcribe/route.ts
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rawFfmpegPath = typeof ffmpegStatic === "string" ? ffmpegStatic : "";
const fixedFfmpegPath = rawFfmpegPath.startsWith("/ROOT/")
  ? rawFfmpegPath.replace("/ROOT", process.cwd())
  : rawFfmpegPath;

if (fixedFfmpegPath) {
  ffmpeg.setFfmpegPath(fixedFfmpegPath);
}

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function phoneOnly(v: unknown) {
  return safe(v).replace(/[^0-9]/g, "");
}

function phoneFromFileName(fileName: string) {
  const digits = phoneOnly(fileName);
  const match = digits.match(/01[0-9][0-9]{7,8}/);
  return match?.[0] || "";
}

function extractJson(text: string) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start < 0 || end < 0) {
    throw new Error("JSON 응답을 찾지 못했습니다.");
  }

  return JSON.parse(cleaned.slice(start, end + 1));
}

function fallback(transcript: string, detectedPhone = "") {
  return {
    success: true,
    detected_phone: detectedPhone,
    transcript,
    summary: transcript.slice(0, 120) || "상담 내용 없음",
    stage: "상담중",
    next_contact_at: "",
    repurchase_score: 50,
    recommended_product: "",
    action: "추가 상담 필요",
    crop: "",
    farm_size: "",
    used_products: [],
    interest_products: [],
    satisfaction: "보통",
    objections: [],
    purchase_signal: "보통",
    money_signal: "보통",
    manager_memo: transcript.slice(0, 500),
  };
}

function convertToMp3(inputPath: string, outputPath: string) {
  return new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .audioCodec("libmp3lame")
      .audioBitrate("128k")
      .format("mp3")
      .on("end", () => resolve())
      .on("error", reject)
      .save(outputPath);
  });
}

async function transcribeMp3(apiKey: string, mp3Path: string) {
  const mp3Buffer = await fs.readFile(mp3Path);

  const audioFile = new File([mp3Buffer], "farmer-call.mp3", {
    type: "audio/mpeg",
  });

  const audioForm = new FormData();
  audioForm.append("file", audioFile);
  audioForm.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
  audioForm.append("language", "ko");
  audioForm.append("response_format", "json");

  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: audioForm,
  });

  const data = await res.json();

  return {
    ok: res.ok,
    data,
  };
}

export async function POST(req: Request) {
  let tmpDir = "";
  let inputPath = "";
  let outputPath = "";

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY가 없습니다." },
        { status: 500 }
      );
    }

    if (!fixedFfmpegPath) {
      return NextResponse.json(
        { success: false, error: "ffmpeg 실행 파일 경로를 찾지 못했습니다." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "음성파일이 없습니다." },
        { status: 400 }
      );
    }

    const farmerName = safe(formData.get("farmer_name"));
    const rawPhone = phoneOnly(formData.get("phone"));
    const fileNamePhone = phoneFromFileName(file.name);
    const detectedPhone = rawPhone || fileNamePhone;

    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "farmer-call-"));
    inputPath = path.join(tmpDir, "input.m4a");
    outputPath = path.join(tmpDir, "output.mp3");

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(inputPath, buffer);

    console.log("업로드 파일명:", file.name);
    console.log("업로드 파일타입:", file.type);
    console.log("업로드 파일크기:", file.size);
    console.log("감지 전화번호:", detectedPhone || "-");
    console.log("임시 입력파일:", inputPath);
    console.log("임시 출력파일:", outputPath);
    console.log("사용 ffmpeg:", fixedFfmpegPath);

    await convertToMp3(inputPath, outputPath);

    console.log("ffmpeg mp3 변환 완료");

    const transcribe = await transcribeMp3(apiKey, outputPath);

    if (!transcribe.ok) {
      return NextResponse.json(
        {
          success: false,
          error: transcribe.data?.error?.message || "음성 텍스트 변환 실패",
        },
        { status: 500 }
      );
    }

    const transcript = safe(transcribe.data.text);

    if (!transcript) {
      return NextResponse.json(
        { success: false, error: "음성에서 텍스트를 추출하지 못했습니다." },
        { status: 500 }
      );
    }

    const prompt = `
너는 한국농수산TV의 농자재 상담 CRM 분석가다.
목표는 단순 요약이 아니라 "돈이 될 농민인지", "무엇을 팔아야 하는지", "언제 다시 연락해야 하는지"를 판단하는 것이다.

농민명: ${farmerName || "-"}
전화번호: ${detectedPhone || "-"}
오늘 날짜: ${today()}

통화 녹취:
${transcript}

아래 기준으로 분석하라.

재구매 점수 기준:
- "다시 살게요", "몇 개 보내줘요", "언제 필요해요", "가격 얼마예요", "써보니 좋다" → 점수 높임
- "비싸요", "효과 모르겠어요", "아직 남았어요", "나중에요", "전화하지 마세요" → 점수 낮춤
- 구매 의사, 면적, 작물, 사용 제품, 관심상품이 명확할수록 점수 높임

CRM 단계 기준:
- 신규: 정보만 있고 상담 진행 전
- 상담중: 문의 또는 설명 단계
- 견적발송: 가격/수량/견적 논의
- 구매완료: 구매 또는 주문 완료
- 재구매관리: 사용 후 만족, 재구매 가능성 있음
- VIP: 반복구매 또는 대면적/고가 가능성 큼
- 휴면: 관심 낮음 또는 장기 미응답

반드시 JSON만 출력하라.

형식:
{
  "summary": "상담 핵심 한 줄",
  "stage": "신규 | 상담중 | 견적발송 | 구매완료 | 재구매관리 | VIP | 휴면 중 하나",
  "next_contact_at": "YYYY-MM-DD 또는 빈 문자열",
  "repurchase_score": 0부터 100 사이 숫자,
  "recommended_product": "가장 먼저 제안할 상품명",
  "action": "담당자가 다음에 해야 할 행동 한 줄",

  "crop": "작물명 또는 빈 문자열",
  "farm_size": "재배면적 또는 빈 문자열",
  "used_products": ["이미 사용한 제품"],
  "interest_products": ["관심 보인 제품"],
  "satisfaction": "만족 | 보통 | 불만 | 미확인 중 하나",
  "objections": ["가격 부담", "효과 의심", "잔량 있음", "미응답", "기타 불만"],
  "purchase_signal": "높음 | 보통 | 낮음",
  "money_signal": "높음 | 보통 | 낮음",
  "manager_memo": "CRM에 저장할 운영 메모. 구매 가능성, 관심상품, 다음 연락 포인트 포함"
}
`;

    const aiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_CRM_MODEL || "gpt-4.1-mini",
        input: prompt,
        store: false,
      }),
    });

    const aiData = await aiRes.json();

    if (!aiRes.ok) {
      console.error("OpenAI CRM analysis error:", aiData);
      return NextResponse.json(fallback(transcript, detectedPhone));
    }

    const outputText =
      aiData?.output_text ||
      aiData?.output?.[0]?.content?.[0]?.text ||
      "";

    const parsed = extractJson(outputText);

    return NextResponse.json({
      success: true,
      detected_phone: detectedPhone,
      transcript,

      summary: safe(parsed.summary),
      stage: safe(parsed.stage) || "상담중",
      next_contact_at: safe(parsed.next_contact_at),
      repurchase_score: Number(parsed.repurchase_score || 50),
      recommended_product: safe(parsed.recommended_product),
      action: safe(parsed.action),

      crop: safe(parsed.crop),
      farm_size: safe(parsed.farm_size),
      used_products: Array.isArray(parsed.used_products) ? parsed.used_products : [],
      interest_products: Array.isArray(parsed.interest_products)
        ? parsed.interest_products
        : [],
      satisfaction: safe(parsed.satisfaction) || "미확인",
      objections: Array.isArray(parsed.objections) ? parsed.objections : [],
      purchase_signal: safe(parsed.purchase_signal) || "보통",
      money_signal: safe(parsed.money_signal) || "보통",
      manager_memo: safe(parsed.manager_memo),
    });
  } catch (e: any) {
    console.error("farmer-transcribe error:", e);

    return NextResponse.json(
      {
        success: false,
        error: e?.message || "음성 AI CRM 생성 실패",
      },
      { status: 500 }
    );
  } finally {
    try {
      if (tmpDir) await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}