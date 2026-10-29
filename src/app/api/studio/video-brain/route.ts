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

type Frame = {
  time: number;
  fileName: string;
  base64: string;
};

function safeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function responseText(data: unknown) {
  if (!data || typeof data !== "object") return "";

  const root = data as {
    output_text?: string;
    output?: Array<{
      content?: Array<{
        text?: string;
      }>;
    }>;
  };

  if (root.output_text) return root.output_text;

  return (root.output || [])
    .flatMap((x) => x.content || [])
    .map((x) => x.text || "")
    .join("\n");
}

function parseJson(text: string) {
  let cleaned = text.trim();

  cleaned = cleaned
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/\s*```$/, "")
    .trim();

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first >= 0 && last > first) {
    cleaned = cleaned.slice(first, last + 1);
  }

  return JSON.parse(cleaned);
}

async function sourceInfo(uploadId: string) {
  const dir = path.join(ROOT, uploadId);

  const meta = await readJson<{
    fileName: string;
  }>(path.join(dir, "meta.json"));

  if (!meta?.fileName) {
    throw new Error("원본 meta.json을 찾을 수 없습니다.");
  }

  const sourcePath = path.join(dir, meta.fileName);

  await fs.access(sourcePath);

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

  return {
    dir,
    sourcePath,
    sourceName: meta.fileName,
    duration: Number(stdout.trim()) || 0,
  };
}

/*
 * 1단계: 전체 촬영본을 빠르게 훑는다.
 *
 * 고정 5초 간격만 사용하는 방식이 아니다.
 * 짧은 영상은 촘촘하게 보고,
 * 긴 영상은 전체 흐름을 잃지 않는 범위에서 샘플링한다.
 *
 * 이후 2단계에서는 중요한 구간을 다시 촘촘하게 본다.
 */
function overviewTimes(duration: number) {
  if (duration <= 0) return [0];

  let interval: number;

  if (duration <= 15) interval = 1.5;
  else if (duration <= 30) interval = 2;
  else if (duration <= 60) interval = 3;
  else if (duration <= 180) interval = 5;
  else if (duration <= 600) interval = 10;
  else interval = Math.max(15, duration / 50);

  const result: number[] = [0.25];

  for (let t = interval; t < duration - 0.5; t += interval) {
    result.push(Number(t.toFixed(2)));
  }

  if (duration > 1) {
    result.push(Number(Math.max(0, duration - 0.5).toFixed(2)));
  }

  const unique = [...new Set(
    result.map((x) =>
      Math.max(0, Math.min(duration, x))
    )
  )];

  /*
   * 한 요청에 이미지가 지나치게 많아지는 것을 방지.
   * 중요한 구간은 후속 정밀 관찰에서 다시 본다.
   */
  if (unique.length <= 50) return unique;

  const picked: number[] = [];

  for (let i = 0; i < 50; i++) {
    const index = Math.min(
      unique.length - 1,
      Math.round((i * (unique.length - 1)) / 49)
    );

    picked.push(unique[index]);
  }

  return [...new Set(picked)];
}

async function extractFrames(
  dir: string,
  sourcePath: string,
  times: number[]
) {
  const outDir = path.join(dir, "video-brain", "overview");

  await fs.rm(outDir, {
    recursive: true,
    force: true,
  });

  await fs.mkdir(outDir, {
    recursive: true,
  });

  const frames: Frame[] = [];

  for (let i = 0; i < times.length; i++) {
    const time = times[i];

    const fileName =
      `frame-${String(i).padStart(3, "0")}-${Math.round(
        time * 1000
      )}.jpg`;

    const output = path.join(outDir, fileName);

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
      fileName,
      base64: image.toString("base64"),
    });
  }

  return frames;
}

async function callVision(
  sourceName: string,
  duration: number,
  frames: Frame[],
  transcript: {
    text?: string;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  } | null
) {
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

  const transcriptSegments = Array.isArray(transcript?.segments)
    ? transcript!.segments!
    : [];

  const transcriptForPrompt = transcriptSegments
    .map(
      (s) =>
        `[${Number(s.start).toFixed(2)}-${Number(
          s.end
        ).toFixed(2)}] ${String(s.text || "")}`
    )
    .join("\n")
    .slice(0, 30000);

  const instruction = `
당신은 JOPD VIDEO BRAIN이다.

당신의 임무는 영상을 예쁘게 설명하는 것이 아니다.

조PD가 무작위로 촬영해 온 원본을
실제 방송 제작 전에 파악하는
베테랑 다큐멘터리 PD처럼 행동한다.

현재 단계는 "1차 촬영본 파악"이다.

아직 최종 방송 순서를 정하지 말고,
아직 원본을 마음대로 잘라 붙이지 말고,
먼저 이 원본 하나를 제대로 이해하라.

SOURCE
파일명: ${sourceName}
길이: ${duration.toFixed(2)}초

==================================================
A. SOURCE TRUTH
==================================================

관찰한 사실과 추론을 절대로 섞지 않는다.

OBSERVED:
실제 프레임에서 직접 확인한 것.

AUDIO:
전사 결과에 기록된 것.
전사는 오류 또는 환각일 수 있다.

INFERRED:
촬영 의도나 상황에 대한 추론.

UNKNOWN:
현재 자료로 확인할 수 없는 것.

특정 인물 이름, 장소, 작물, 품종,
물량, 목적, 사건을 화면만 보고 만들어내지 않는다.

==================================================
B. 사람처럼 시간의 흐름을 본다
==================================================

각 프레임을 독립된 사진으로만 보지 말고
시간순으로 비교한다.

무엇이 등장하는가?
무엇이 사라지는가?
사람이 무엇을 시작하는가?
행동이 어떻게 변하는가?
카메라는 무엇을 따라가는가?
전체→중간→디테일 같은 촬영 흐름이 있는가?
표정이나 반응의 변화가 있는가?
이동이 있는가?
같은 장면을 반복해서 확보했는가?

대표 프레임 사이에서 확인할 수 없는 사건은
상상하지 않는다.

==================================================
C. "왜 이걸 찍었을까?"
==================================================

이것이 매우 중요하다.

조PD가 촬영 당시
왜 카메라를 켰는지 추론한다.

예:
- 인물 소개
- 현장 증명
- 물량 보여주기
- 이동 과정
- 장소 전환
- 작업 과정
- 인터뷰 답변
- 질문
- 결과 증명
- 디테일 확보
- 분위기
- 감정/반응
- 편집용 인서트
- 오프닝 확보
- 엔딩 확보

단, 촬영 의도는 사실이 아니다.

반드시
intentHypothesis
intentEvidence
intentConfidence

로 분리한다.

==================================================
D. 오디오를 맹신하지 않는다
==================================================

아래 전사는 음성인식 결과일 뿐이다.

전사:
${transcriptForPrompt || "(전사 없음)"}

전사에 문장이 있다고 해서
실제 사람이 말했다고 자동 확정하지 않는다.

화면상 발화 상황과 명백하게 충돌하거나,
영상 맥락과 매우 부자연스럽거나,
짧은 무음/환경음 영상에 상투적인 문장이
갑자기 생성된 것으로 의심되면

audioVisualConsistency:
MATCH | UNCERTAIN | CONFLICT

중 하나로 표시한다.

CONFLICT라고 판단해도
전사 원문 자체를 삭제하거나 고쳐 쓰지 않는다.

==================================================
E. 방송 재료로서 평가한다
==================================================

다음을 찾는다.

- 핵심 인터뷰
- 질문
- 답변
- 행동
- 현장성
- 증거 화면
- 감정
- 반응
- 디테일
- B-roll
- 장소 소개
- 이동
- 연결 화면
- 한 템포 쉬어갈 화면
- 오프닝 후보
- 엔딩 후보
- 중복
- 흔들림/초점/사용 어려움

중요:

"말이 없다 = 쓸모없다"가 아니다.

말이 없는 영상도
강력한 B-roll이나 전환 장면일 수 있다.

==================================================
F. 편집 후보를 찾는다
==================================================

현재는 최종 프레임 단위 IN/OUT을 확정하는 단계가 아니다.

대신 다시 자세히 볼 가치가 있는 구간을 찾는다.

예:
{
  "start": 42,
  "end": 58,
  "reason": "인물이 물체를 들어 설명하는 행동이 시작됨",
  "priority": "HIGH"
}

이 구간은 다음 정밀 분석 단계에서
더 촘촘하게 다시 본다.

==================================================
G. 결과 JSON
==================================================

JSON 이외의 글은 출력하지 않는다.

{
  "sourceUnderstanding": {
    "oneLine": "",
    "detailedSummary": "",
    "observedFacts": [""],
    "unknowns": [""]
  },

  "visualFlow": [
    {
      "start": 0,
      "end": 0,
      "observed": "",
      "people": "",
      "action": "",
      "cameraIntent": "",
      "visualRole": ""
    }
  ],

  "shootingIntent": {
    "intentHypothesis": [""],
    "intentEvidence": [""],
    "intentConfidence": "HIGH|MEDIUM|LOW"
  },

  "audioReview": {
    "transcriptUseful": true,
    "audioVisualConsistency": "MATCH|UNCERTAIN|CONFLICT",
    "suspiciousTranscript": [""],
    "reason": ""
  },

  "storyIngredients": {
    "people": [""],
    "places": [""],
    "events": [""],
    "questions": [""],
    "answers": [""],
    "facts": [""],
    "numbers": [""],
    "emotions": [""],
    "strongVisuals": [""]
  },

  "broadcastValue": {
    "possibleRoles": [
      "OPENING",
      "MAIN",
      "INTERVIEW",
      "QUESTION",
      "ANSWER",
      "BROLL",
      "EVIDENCE",
      "BRIDGE",
      "BREATH",
      "TRANSITION",
      "ENDING"
    ],
    "strength": "HIGH|MEDIUM|LOW",
    "reason": ""
  },

  "reinspectRanges": [
    {
      "start": 0,
      "end": 0,
      "reason": "",
      "priority": "HIGH|MEDIUM|LOW"
    }
  ],

  "editorNote": ""
}
`;

  const content: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text: instruction,
    },
  ];

  for (const frame of frames) {
    content.push({
      type: "input_text",
      text: `ACTUAL SOURCE FRAME @ ${frame.time.toFixed(2)} sec`,
    });

    content.push({
      type: "input_image",
      image_url: `data:image/jpeg;base64,${frame.base64}`,
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
      `VIDEO BRAIN 분석 실패: ${error}`
    );
  }

  const data: unknown = await response.json();
  const text = responseText(data);

  if (!text.trim()) {
    throw new Error("VIDEO BRAIN 응답 없음");
  }

  return parseJson(text);
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "JOPD VIDEO BRAIN",
    version: "1.0.0",
    stage: "SOURCE UNDERSTANDING",
    principle:
      "촬영순서와 방송순서를 분리하고 먼저 원본을 이해한다.",
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
      sourceName,
      duration,
    } = await sourceInfo(uploadId);

    if (!duration) {
      throw new Error("원본 영상 길이 확인 실패");
    }

    const transcript = await readJson<{
      text?: string;
      segments?: Array<{
        start: number;
        end: number;
        text: string;
      }>;
    }>(path.join(dir, "transcript.json"));

    const times = overviewTimes(duration);

    const frames = await extractFrames(
      dir,
      sourcePath,
      times
    );

    const understanding = await callVision(
      sourceName,
      duration,
      frames,
      transcript
    );

    const result = {
      uploadId,
      sourceName,
      duration,
      frameCount: frames.length,
      frameTimes: times,
      stage: "SOURCE_UNDERSTANDING",
      understanding,
      createdAt: new Date().toISOString(),
    };

    const brainDir = path.join(
      dir,
      "video-brain"
    );

    await fs.mkdir(brainDir, {
      recursive: true,
    });

    await fs.writeFile(
      path.join(
        brainDir,
        "source-understanding.json"
      ),
      JSON.stringify(result, null, 2)
    );

    return NextResponse.json({
      ok: true,
      engine: "JOPD VIDEO BRAIN",
      ...result,
    });
  } catch (error) {
    console.error("[JOPD VIDEO BRAIN]", error);

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
