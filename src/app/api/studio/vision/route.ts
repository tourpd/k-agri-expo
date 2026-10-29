import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

const ROOT = path.join(process.cwd(), ".jopd-media");
const FFMPEG = "/opt/homebrew/bin/ffmpeg";
const FFPROBE = "/opt/homebrew/bin/ffprobe";

type VisionFrame = {
  time: number;
  fileName: string;
  imageBase64?: string;
};

type VisionScene = {
  start: number;
  end: number;
  description: string;
  subjects: string[];
  actions: string[];
  locationType: string;
  shotType: string;
  visualQuality: string;
  editValue: string;
  recommendedUse: string[];
  keep: boolean;
  reason: string;
};

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function extractOutputText(data: unknown) {
  if (!data || typeof data !== "object") return "";

  const root = data as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{ text?: unknown }>;
    }>;
  };

  if (typeof root.output_text === "string") {
    return root.output_text;
  }

  const pieces: string[] = [];

  for (const item of root.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        pieces.push(content.text);
      }
    }
  }

  return pieces.join("\n");
}

function parseJson(text: string) {
  const cleaned = text
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  return JSON.parse(cleaned);
}

async function getSource(uploadId: string) {
  const dir = path.join(ROOT, uploadId);

  const metaRaw = await fs.readFile(
    path.join(dir, "meta.json"),
    "utf8"
  );

  const meta = JSON.parse(metaRaw) as {
    fileName: string;
  };

  const sourcePath = path.join(dir, meta.fileName);

  await fs.access(sourcePath);

  return {
    dir,
    sourcePath,
    fileName: meta.fileName,
  };
}

async function getDuration(sourcePath: string) {
  const { stdout } = await execFileAsync(
    FFPROBE,
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      sourcePath,
    ]
  );

  return Number(stdout.trim()) || 0;
}

/*
 * EYES 0.1
 *
 * 영상 전체를 매 프레임 AI에 보내지 않는다.
 * 먼저 일정 간격으로 화면을 샘플링한다.
 *
 * 짧은 영상은 촘촘하게,
 * 긴 영상은 최대 약 24장의 대표 화면을 본다.
 *
 * 다음 버전에서는 scene-change detector를 추가한다.
 */
function buildSampleTimes(duration: number) {
  if (duration <= 0) return [0];

  let interval = 5;

  if (duration <= 30) interval = 3;
  else if (duration <= 120) interval = 5;
  else if (duration <= 600) interval = 15;
  else interval = Math.max(20, duration / 24);

  const times: number[] = [];

  times.push(Math.min(0.5, duration * 0.1));

  for (
    let t = interval;
    t < duration - 0.5;
    t += interval
  ) {
    times.push(t);
  }

  if (duration > 2) {
    times.push(Math.max(0, duration - 1));
  }

  const unique = Array.from(
    new Set(
      times.map((x) =>
        Math.max(0, Math.min(duration, Number(x.toFixed(2))))
      )
    )
  );

  /*
   * 비용과 응답 크기 폭증 방지.
   */
  if (unique.length <= 24) return unique;

  const step = unique.length / 24;

  return Array.from({ length: 24 }, (_, i) => {
    return unique[Math.floor(i * step)];
  });
}

async function extractFrames(
  dir: string,
  sourcePath: string,
  times: number[]
) {
  const framesDir = path.join(dir, "vision-frames");

  await fs.rm(framesDir, {
    recursive: true,
    force: true,
  });

  await fs.mkdir(framesDir, {
    recursive: true,
  });

  const frames: VisionFrame[] = [];

  for (let i = 0; i < times.length; i++) {
    const time = times[i];

    const fileName =
      `frame-${String(i).padStart(3, "0")}-${Math.round(
        time * 1000
      )}.jpg`;

    const outputPath = path.join(framesDir, fileName);

    await execFileAsync(
      FFMPEG,
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-y",
        "-ss",
        String(time),
        "-i",
        sourcePath,
        "-frames:v",
        "1",
        "-vf",
        "scale='min(1280,iw)':-2",
        "-q:v",
        "3",
        outputPath,
      ]
    );

    const image = await fs.readFile(outputPath);

    frames.push({
      time,
      fileName,
      imageBase64: image.toString("base64"),
    });
  }

  return frames;
}

async function analyzeFrames(
  fileName: string,
  duration: number,
  frames: VisionFrame[]
) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 없음");
  }

  /*
   * 현재 프로젝트에 이미 설정되어 있는
   * Responses API용 모델을 우선 사용한다.
   *
   * 이미지 입력을 지원하지 않는 모델이면
   * 명시적으로 오류를 보여준다.
   * 임의의 모델명을 만들어 fallback하지 않는다.
   */
  const model =
    process.env.OPENAI_CRM_MODEL ||
    process.env.OPENAI_JOPD_MODEL;

  if (!model) {
    throw new Error(
      "OPENAI_CRM_MODEL 또는 OPENAI_JOPD_MODEL 설정 필요"
    );
  }

  const prompt = `
당신은 JOPD AI 방송국의 영상 편집감독이다.

지금부터 보는 이미지는
"${fileName}"이라는 실제 촬영 원본에서
시간순으로 추출한 대표 프레임이다.

영상 길이: ${duration.toFixed(2)}초

절대 규칙:

1. 화면에서 실제로 보이는 것만 기술한다.
2. 보이지 않는 인물, 장소, 물체, 사건을 추측하지 않는다.
3. 특정 작물/품종/지역을 화면만으로 확정할 수 없으면
   "확인 불가"라고 한다.
4. 음성 내용은 추측하지 않는다.
5. 이 분석은 방송 편집에 사용된다.
6. 예쁜 설명보다 "이 화면을 어디에 쓸 수 있는가"가 중요하다.
7. 인터뷰, 행동, 풍경, 디테일, 이동, 작업, 반응,
   표정, 인서트 가능성을 적극적으로 판단한다.
8. 흔들림, 초점 실패, 중복, 의미 없는 화면도 판단한다.
9. 이미지 사이에 보이지 않는 장면을 창작하지 않는다.
10. 이것은 대표 프레임 분석이므로
    정확한 컷 IN/OUT 확정이 아니라
    "편집 후보 구간"을 찾는 단계다.

다음 JSON만 출력한다.

{
  "visualSummary": "",
  "mainSubjects": [""],
  "visualStory": "",
  "bestUses": [""],
  "scenes": [
    {
      "start": 0,
      "end": 0,
      "description": "",
      "subjects": [""],
      "actions": [""],
      "locationType": "",
      "shotType": "INTERVIEW|BROLL|ACTION|LANDSCAPE|DETAIL|MOVEMENT|REACTION|UNKNOWN",
      "visualQuality": "HIGH|MEDIUM|LOW",
      "editValue": "HIGH|MEDIUM|LOW",
      "recommendedUse": [
        "OPENING|MAIN|BROLL|BRIDGE|TRANSITION|ENDING|HOLD|NONE"
      ],
      "keep": true,
      "reason": ""
    }
  ]
}

scene의 start/end는 제공된 프레임 시간들을 근거로
대략적인 후보 구간을 만든다.

실제 프레임 시간:
${frames.map((f) => f.time.toFixed(2)).join(", ")}
`;

  const content: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text: prompt,
    },
  ];

  for (const frame of frames) {
    content.push({
      type: "input_text",
      text: `SOURCE TIME ${frame.time.toFixed(2)} sec`,
    });

    content.push({
      type: "input_image",
      image_url:
        `data:image/jpeg;base64,${frame.imageBase64}`,
    });
  }

  const response = await fetch(
    "https://api.openai.com/v1/responses",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "user",
            content,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `JOPD EYES 비전 분석 실패: ${errorText}`
    );
  }

  const data: unknown = await response.json();

  const output = extractOutputText(data);

  if (!output.trim()) {
    throw new Error("JOPD EYES 응답 없음");
  }

  return parseJson(output) as {
    visualSummary?: string;
    mainSubjects?: string[];
    visualStory?: string;
    bestUses?: string[];
    scenes?: VisionScene[];
  };
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "JOPD EYES",
    version: "0.1.0",
    mode: "VISUAL_SOURCE_TRUTH",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      uploadId?: string;
    };

    const uploadId = safeId(
      String(body.uploadId || "")
    );

    if (!uploadId) {
      return NextResponse.json(
        {
          ok: false,
          error: "uploadId 없음",
        },
        { status: 400 }
      );
    }

    const {
      dir,
      sourcePath,
      fileName,
    } = await getSource(uploadId);

    const duration = await getDuration(sourcePath);

    if (!duration) {
      throw new Error("영상 길이를 읽을 수 없습니다.");
    }

    const times = buildSampleTimes(duration);

    const frames = await extractFrames(
      dir,
      sourcePath,
      times
    );

    if (!frames.length) {
      throw new Error("대표 프레임 추출 실패");
    }

    const vision = await analyzeFrames(
      fileName,
      duration,
      frames
    );

    const result = {
      uploadId,
      sourceName: fileName,
      duration,
      analyzedFrameCount: frames.length,
      frameTimes: frames.map((f) => f.time),
      visualSummary:
        String(vision.visualSummary || ""),
      mainSubjects: Array.isArray(vision.mainSubjects)
        ? vision.mainSubjects
        : [],
      visualStory:
        String(vision.visualStory || ""),
      bestUses: Array.isArray(vision.bestUses)
        ? vision.bestUses
        : [],
      scenes: Array.isArray(vision.scenes)
        ? vision.scenes
        : [],
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(dir, "vision.json"),
      JSON.stringify(result, null, 2)
    );

    return NextResponse.json({
      ok: true,
      engine: "JOPD EYES",
      ...result,
    });
  } catch (error) {
    console.error("[JOPD EYES]", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}
