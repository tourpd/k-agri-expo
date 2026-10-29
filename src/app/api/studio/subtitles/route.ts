import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Segment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

function srtTime(seconds: number) {
  const safe = Math.max(0, seconds);

  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor(
    (safe % 3600) / 60,
  );
  const secs = Math.floor(safe % 60);
  const millis = Math.floor(
    (safe - Math.floor(safe)) * 1000,
  );

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(secs).padStart(2, "0"),
  ].join(":") +
    "," +
    String(millis).padStart(3, "0");
}

function makeSrt(segments: Segment[]) {
  return segments
    .map(
      (segment, index) =>
        `${index + 1}
${srtTime(segment.start)} --> ${srtTime(segment.end)}
${segment.text.trim()}`,
    )
    .join("\n\n");
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "JOPD SUBTITLE ENGINE",
    version: "0.1.0",
    status: "ready",
    features: [
      "speech-to-text",
      "timestamps",
      "SRT",
    ],
  });
}

export async function POST(request: Request) {
  try {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "OPENAI_API_KEY가 없습니다.",
        },
        { status: 500 },
      );
    }

    const form =
      await request.formData();

    const file =
      form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "영상 또는 음성 파일이 필요합니다.",
        },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "빈 파일입니다.",
        },
        { status: 400 },
      );
    }

    const model =
      process.env.OPENAI_TRANSCRIBE_MODEL ||
      "whisper-1";

    const openaiForm =
      new FormData();

    openaiForm.append(
      "file",
      file,
      file.name,
    );

    openaiForm.append(
      "model",
      model,
    );

    openaiForm.append(
      "language",
      "ko",
    );

    // 타임코드가 필요한 자막이므로
    // verbose_json 형식 사용
    openaiForm.append(
      "response_format",
      "verbose_json",
    );

    openaiForm.append(
      "timestamp_granularities[]",
      "segment",
    );

    const response =
      await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${apiKey}`,
          },

          body: openaiForm,
        },
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "[JOPD SUBTITLE OPENAI]",
        data,
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            data?.error?.message ||
            "음성 인식에 실패했습니다.",
        },
        {
          status: response.status,
        },
      );
    }

    const rawSegments =
      Array.isArray(data?.segments)
        ? data.segments
        : [];

    let segments: Segment[] =
      rawSegments
        .map(
          (
            item: any,
            index: number,
          ) => ({
            id: index + 1,

            start:
              typeof item?.start ===
              "number"
                ? item.start
                : 0,

            end:
              typeof item?.end ===
              "number"
                ? item.end
                : 0,

            text:
              typeof item?.text ===
              "string"
                ? item.text.trim()
                : "",
          }),
        )
        .filter(
          (item: Segment) =>
            item.text.length > 0,
        );

    // 모델이 segments를 주지 않는 경우
    // 최소한 전체 텍스트라도 반환
    if (
      segments.length === 0 &&
      typeof data?.text === "string" &&
      data.text.trim()
    ) {
      segments = [
        {
          id: 1,
          start: 0,
          end:
            typeof data?.duration ===
            "number"
              ? data.duration
              : 0,
          text: data.text.trim(),
        },
      ];
    }

    const srt =
      makeSrt(segments);

    return NextResponse.json({
      ok: true,

      engine:
        "JOPD SUBTITLE ENGINE",

      version: "0.1.0",

      model,

      file: {
        name: file.name,
        size: file.size,
        type: file.type,
      },

      text:
        typeof data?.text === "string"
          ? data.text
          : segments
              .map(
                (item) =>
                  item.text,
              )
              .join(" "),

      duration:
        typeof data?.duration ===
        "number"
          ? data.duration
          : null,

      segments,

      srt,
    });
  } catch (error) {
    console.error(
      "[JOPD SUBTITLE ERROR]",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "자동 자막 생성 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
