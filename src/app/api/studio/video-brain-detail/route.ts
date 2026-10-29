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

type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

type ReinspectRange = {
  start: number;
  end: number;
  reason?: string;
  priority?: string;
};

type Frame = {
  time: number;
  base64: string;
};

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(
      await fs.readFile(file, "utf8")
    ) as T;
  } catch {
    return null;
  }
}

function extractResponseText(data: unknown) {
  if (!data || typeof data !== "object") return "";

  const root = data as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
  };

  if (typeof root.output_text === "string") {
    return root.output_text;
  }

  return (root.output || [])
    .flatMap((x) => x.content || [])
    .map((x) => x.text || "")
    .join("\n");
}

function parseJson(text: string) {
  let cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  const a = cleaned.indexOf("{");
  const b = cleaned.lastIndexOf("}");

  if (a >= 0 && b > a) {
    cleaned = cleaned.slice(a, b + 1);
  }

  return JSON.parse(cleaned);
}

function detailTimes(start: number, end: number) {
  const duration = Math.max(0, end - start);

  /*
   * 기본 2초.
   * 아주 짧은 구간은 1초.
   * 한 구간당 최대 약 45프레임.
   */
  let step = duration <= 20 ? 1 : 2;

  if (duration / step > 45) {
    step = duration / 45;
  }

  const result: number[] = [];

  for (let t = start; t <= end; t += step) {
    result.push(Number(t.toFixed(2)));
  }

  if (
    result.length === 0 ||
    Math.abs(result[result.length - 1] - end) > 0.5
  ) {
    result.push(Number(end.toFixed(2)));
  }

  return result;
}

async function extractFrames(
  sourcePath: string,
  outputDir: string,
  times: number[]
) {
  await fs.rm(outputDir, {
    recursive: true,
    force: true,
  });

  await fs.mkdir(outputDir, {
    recursive: true,
  });

  const frames: Frame[] = [];

  for (let i = 0; i < times.length; i++) {
    const time = times[i];

    const output = path.join(
      outputDir,
      `detail-${String(i).padStart(3, "0")}.jpg`
    );

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
        "scale='min(960,iw)':-2",
        "-q:v",
        "4",
        output,
      ]
    );

    const image = await fs.readFile(output);

    frames.push({
      time,
      base64: image.toString("base64"),
    });
  }

  return frames;
}

function relevantTranscript(
  segments: TranscriptSegment[],
  start: number,
  end: number
) {
  return segments
    .filter(
      (s) =>
        s.end >= start - 2 &&
        s.start <= end + 2
    )
    .map(
      (s) =>
        `[${s.start.toFixed(2)}-${s.end.toFixed(
          2
        )}] ${s.text}`
    )
    .join("\n");
}

async function analyzeRange(args: {
  sourceName: string;
  range: ReinspectRange;
  frames: Frame[];
  transcriptText: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY 없음");
  }

  const model =
    process.env.OPENAI_CRM_MODEL ||
    process.env.OPENAI_JOPD_MODEL;

  if (!model) {
    throw new Error(
      "OPENAI_CRM_MODEL 또는 OPENAI_JOPD_MODEL 없음"
    );
  }

  const {
    sourceName,
    range,
    frames,
    transcriptText,
  } = args;

  const prompt = `
당신은 JOPD VIDEO BRAIN의
정밀 재관찰 편집 분석기다.

SOURCE:
${sourceName}

정밀 관찰 범위:
${range.start.toFixed(2)} ~ ${range.end.toFixed(2)}초

1차 분석에서 다시 볼 이유:
${range.reason || "중요 구간"}

==================================================
절대 원칙
==================================================

이 단계의 목적은
"화면을 설명하는 것"이 아니라
실제 편집에 쓸 수 있는 구간을 좁히는 것이다.

하지만 SOURCE TRUTH를 절대로 희생하지 않는다.

데이터를 반드시 네 층으로 분리한다.

1. VISION_FACT
실제 제공된 프레임에서 직접 보이는 사실.

2. AUDIO_EVIDENCE
제공된 음성 전사에서 확인되는 내용.
단, 전사는 음성인식 오류가 있을 수 있다.

3. CONTEXT
VISION과 AUDIO를 함께 봤을 때
합리적으로 연결되는 내용.

4. PD_INFERENCE
촬영자가 왜 이 장면을 찍었는지,
방송에서 어떻게 쓰려 했는지에 대한 추론.

PD_INFERENCE를 사실처럼 쓰지 않는다.

==================================================
시간 흐름
==================================================

프레임들을 시간순으로 비교한다.

찾아야 하는 것:

- 사람이 말하기 시작하는 순간
- 질문하는 상황
- 답변하는 상황
- 사람이 행동을 시작하는 순간
- 행동이 끝나는 순간
- 물건을 들어 보여주는 순간
- 손이나 물체의 디테일
- 표정 또는 반응 변화
- 카메라가 이동하기 시작하는 순간
- 구도가 안정되는 순간
- 작업 시작/종료
- 새로운 장면으로 넘어가는 순간
- 쓸 만한 무대사 B-roll
- 한 템포 쉬어갈 수 있는 화면
- 앞뒤 장면 연결에 좋은 화면
- 반복되는 부분
- 화면상 사용하기 어려운 부분

==================================================
음성 전사
==================================================

이 구간의 기존 전사:

${transcriptText || "(전사 없음)"}

전사를 절대 원음 그 자체라고 가정하지 않는다.

특히 화면상 발화 정황이 약한데
상투적인 문장이 나타나거나,
맥락과 맞지 않는 문장이 있으면

TRANSCRIPT_SUSPECT

로 표시한다.

전사 내용을 임의로 고쳐 쓰지 않는다.

==================================================
촬영 의도
==================================================

반드시 질문한다.

"조PD는 왜 이 순간을 계속 찍었을까?"

예:

인터뷰 답변 확보
현장 증명
제품/작물 디테일
작업과정 증명
인물 반응
정보 전달
물량 표현
이동
장소전환
B-roll
오프닝
엔딩
편집 연결용
여운

촬영 의도는 추론이므로
근거와 확신도를 붙인다.

==================================================
편집 후보
==================================================

이번 단계에서는
후보 IN/OUT을 제안할 수 있다.

단, 2초 샘플링만으로
프레임 정확도의 편집점을 확정했다고
주장하면 안 된다.

후보 구간을 최대한 좁히고,

precisionNeeded=true

인 경우 다음 단계에서
그 주변을 0.25~0.5초 단위로
다시 검사해야 한다.

KEEP 이유뿐 아니라
CUT 이유도 기록한다.

==================================================
JSON ONLY
==================================================

{
  "rangeSummary": "",

  "timelineObservations": [
    {
      "start": 0,
      "end": 0,
      "visionFact": "",
      "audioEvidence": "",
      "context": "",
      "pdInference": "",
      "avConsistency": "MATCH|UNCERTAIN|CONFLICT"
    }
  ],

  "moments": [
    {
      "time": 0,
      "type": "QUESTION|ANSWER|ACTION_START|ACTION_END|DETAIL|REACTION|BROLL|TRANSITION|BREATH|INTERVIEW|OTHER",
      "observed": "",
      "whyUseful": ""
    }
  ],

  "editCandidates": [
    {
      "start": 0,
      "end": 0,
      "decision": "KEEP|CUT|REVIEW",
      "role": "OPENING|MAIN|QUESTION|ANSWER|INTERVIEW|BROLL|EVIDENCE|BRIDGE|BREATH|TRANSITION|ENDING",
      "reason": "",
      "shootingIntent": "",
      "intentConfidence": "HIGH|MEDIUM|LOW",
      "precisionNeeded": true
    }
  ],

  "transcriptWarnings": [
    {
      "start": 0,
      "end": 0,
      "text": "",
      "reason": ""
    }
  ],

  "bestCandidate": {
    "start": 0,
    "end": 0,
    "role": "",
    "reason": "",
    "precisionNeeded": true
  },

  "editorNote": ""
}
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
      text:
        `ACTUAL SOURCE FRAME @ ` +
        `${frame.time.toFixed(2)} sec`,
    });

    content.push({
      type: "input_image",
      image_url:
        `data:image/jpeg;base64,${frame.base64}`,
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
    const error = await response.text();

    throw new Error(
      `정밀 영상분석 실패: ${error}`
    );
  }

  const data: unknown = await response.json();

  const text = extractResponseText(data);

  if (!text.trim()) {
    throw new Error("정밀 분석 응답 없음");
  }

  return parseJson(text);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "JOPD VIDEO BRAIN DETAIL",
    version: "1.1.0",
    stage: "PRECISION REINSPECTION",
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

    const dir = path.join(ROOT, uploadId);

    const meta = await readJson<{
      fileName: string;
    }>(path.join(dir, "meta.json"));

    if (!meta?.fileName) {
      throw new Error("meta.json 없음");
    }

    const sourcePath = path.join(
      dir,
      meta.fileName
    );

    await fs.access(sourcePath);

    const brain = await readJson<{
      understanding?: {
        reinspectRanges?: ReinspectRange[];
      };
    }>(
      path.join(
        dir,
        "video-brain",
        "source-understanding.json"
      )
    );

    if (!brain) {
      throw new Error(
        "VIDEO BRAIN 1.0 분석 결과가 없습니다."
      );
    }

    const ranges =
      brain.understanding?.reinspectRanges || [];

    if (!ranges.length) {
      throw new Error(
        "정밀 재관찰 대상 구간이 없습니다."
      );
    }

    const transcript = await readJson<{
      segments?: TranscriptSegment[];
    }>(path.join(dir, "transcript.json"));

    const segments = Array.isArray(
      transcript?.segments
    )
      ? transcript!.segments!
      : [];

    const detailRoot = path.join(
      dir,
      "video-brain",
      "detail"
    );

    await fs.mkdir(detailRoot, {
      recursive: true,
    });

    const analyses = [];

    /*
     * 우선순위 HIGH부터 최대 3개.
     * 한 원본에 AI 호출이 폭증하는 것을 방지한다.
     */
    const selectedRanges = [...ranges]
      .sort((a, b) => {
        const score = (x?: string) =>
          x === "HIGH"
            ? 3
            : x === "MEDIUM"
              ? 2
              : 1;

        return score(b.priority) - score(a.priority);
      })
      .slice(0, 3);

    for (let i = 0; i < selectedRanges.length; i++) {
      const range = selectedRanges[i];

      const start = Math.max(
        0,
        Number(range.start || 0)
      );

      const end = Math.max(
        start,
        Number(range.end || start)
      );

      const times = detailTimes(start, end);

      const frameDir = path.join(
        detailRoot,
        `range-${String(i).padStart(2, "0")}`
      );

      const frames = await extractFrames(
        sourcePath,
        frameDir,
        times
      );

      const transcriptText = relevantTranscript(
        segments,
        start,
        end
      );

      const analysis = await analyzeRange({
        sourceName: meta.fileName,
        range: {
          ...range,
          start,
          end,
        },
        frames,
        transcriptText,
      });

      analyses.push({
        range: {
          ...range,
          start,
          end,
        },
        frameCount: frames.length,
        frameTimes: times,
        analysis,
      });
    }

    const result = {
      uploadId,
      sourceName: meta.fileName,
      stage: "PRECISION_REINSPECTION",
      analyses,
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(
        dir,
        "video-brain",
        "precision-analysis.json"
      ),
      JSON.stringify(result, null, 2)
    );

    return NextResponse.json({
      ok: true,
      engine: "JOPD VIDEO BRAIN DETAIL",
      ...result,
    });
  } catch (error) {
    console.error(
      "[JOPD VIDEO BRAIN DETAIL]",
      error
    );

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
