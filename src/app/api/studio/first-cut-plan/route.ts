import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = path.join(process.cwd(), ".jopd-media");

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath: string) {
  return JSON.parse(
    await fs.readFile(filePath, "utf8")
  );
}

function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  const chunks: string[] = [];

  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (
        content?.type === "output_text" &&
        typeof content?.text === "string"
      ) {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join("\n");
}

function cleanJsonText(text: string) {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");
}

function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number
) {
  return startA < endB && endA > startB;
}

/*
 * SOURCE 구간 안에 BLOCK 음성이 있으면
 * 영상 전체를 버리지 않고 안전한 세부구간으로 분할한다.
 *
 * 예:
 * SOURCE 57~120
 * BLOCK 60~61, 66~68, 85~87
 *
 * =>
 * 57~60
 * 61~66
 * 68~85
 * 87~120
 */
function subtractBlockedRanges(
  sourceStart: number,
  sourceEnd: number,
  blocked: Array<{
    start: number;
    end: number;
  }>
) {
  const relevant = blocked
    .map((item) => ({
      start: Math.max(
        sourceStart,
        Number(item.start)
      ),
      end: Math.min(
        sourceEnd,
        Number(item.end)
      ),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.start) &&
        Number.isFinite(item.end) &&
        item.end > item.start
    )
    .sort(
      (a, b) => a.start - b.start
    );

  const merged: Array<{
    start: number;
    end: number;
  }> = [];

  for (const item of relevant) {
    const last =
      merged[merged.length - 1];

    if (
      last &&
      item.start <= last.end
    ) {
      last.end = Math.max(
        last.end,
        item.end
      );
    } else {
      merged.push({ ...item });
    }
  }

  const safe: Array<{
    start: number;
    end: number;
  }> = [];

  let cursor = sourceStart;

  for (const item of merged) {
    if (item.start > cursor) {
      safe.push({
        start: cursor,
        end: item.start,
      });
    }

    cursor = Math.max(
      cursor,
      item.end
    );
  }

  if (cursor < sourceEnd) {
    safe.push({
      start: cursor,
      end: sourceEnd,
    });
  }

  // 너무 짧은 조각은 편집 가치가 낮으므로 제거
  return safe.filter(
    (item) =>
      item.end - item.start >= 1.0
  );
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    engine: "JOPD FIRST CUT PLAN",
    version: "1.1.0",
    stage: "EDITORIAL STORY DESIGN",
    principle:
      "촬영순서가 아니라 방송 이야기 순서로 구성한다. 실제 SOURCE만 SOURCE 장면으로 사용한다.",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const directorIntent =
      typeof body?.directorIntent === "string"
        ? body.directorIntent.trim()
        : "";

    const masterPath = path.join(
      ROOT,
      "jopd-source-master.json"
    );

    const manifestPath = path.join(
      ROOT,
      "jopd-source-manifest.json"
    );

    if (!(await exists(masterPath))) {
      throw new Error(
        "jopd-source-master.json 없음"
      );
    }

    if (!(await exists(manifestPath))) {
      throw new Error(
        "jopd-source-manifest.json 없음"
      );
    }

    const sourceMaster = await readJson(masterPath);
    const manifest = await readJson(manifestPath);

    const master = sourceMaster.master || {};
    const sources = manifest.sources || [];

    if (sources.length !== 10) {
      throw new Error(
        `대표 SOURCE가 10개가 아닙니다: ${sources.length}`
      );
    }

    const sourceMap = new Map<
      string,
      {
        sourceName: string;
        uploadId: string;
        duration: number | null;
      }
    >();

    for (const source of sources) {
      const sourceName = String(
        source.sourceName || ""
      );

      const uploadId = String(
        source.uploadId || ""
      );

      let duration: number | null = null;

      const brainPath = path.join(
        ROOT,
        uploadId,
        "video-brain",
        "source-understanding.json"
      );

      if (await exists(brainPath)) {
        const brain = await readJson(brainPath);

        const d = Number(brain.duration);

        if (Number.isFinite(d) && d > 0) {
          duration = d;
        }
      }

      sourceMap.set(sourceName, {
        sourceName,
        uploadId,
        duration,
      });
    }

    const authoritativeBlockedAudio =
      Array.isArray(master.blockedAudio)
        ? master.blockedAudio
        : [];

    /*
     * FIRST CUT PLAN에는 SOURCE MASTER의 전체 판단을
     * 전달하되 BLOCK 음성은 별도 금지목록으로 명확하게
     * 분리한다.
     *
     * SOURCE MASTER의 SOURCE_AUDIO_CANDIDATE도
     * 사실확정이 아니라 편집 후보일 뿐이다.
     */
    const editorialInput = {
      directorIntent:
        directorIntent || null,

      shootSummary:
        master.shootSummary || "",

      whatWasActuallyShot:
        master.whatWasActuallyShot || [],

      strongVisuals:
        master.strongVisuals || [],

      people:
        master.people || [],

      places:
        master.places || [],

      actionsAndEvents:
        master.actionsAndEvents || [],

      shootingIntentInferences:
        master.shootingIntentInferences || [],

      storyIngredients:
        master.storyIngredients || [],

      questionsAndAnswers:
        master.questionsAndAnswers || [],

      numbersAndFactsCandidates:
        master.numbersAndFactsCandidates || [],

      gapsInMaterial:
        master.gapsInMaterial || [],

      unknowns:
        master.unknowns || [],

      editorialInventory:
        master.editorialInventory || [],

      sourceBySource:
        master.sourceBySource || [],

      sourceRegistry: Array.from(
        sourceMap.values()
      ),

      blockedAudio:
        authoritativeBlockedAudio,
    };

    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY가 없습니다."
      );
    }

    const model =
      process.env.OPENAI_CRM_MODEL ||
      process.env.OPENAI_JOPD_MODEL;

    if (!model) {
      throw new Error(
        "OPENAI_CRM_MODEL 또는 OPENAI_JOPD_MODEL이 없습니다."
      );
    }

    const systemPrompt = `
당신은 JOPD FIRST CUT PLAN이다.

당신은 단순 요약 AI가 아니다.
당신의 역할은 방송 PD와 구성작가다.

이미 SOURCE MASTER가 10개의 실제 촬영본을
분석해 놓았다.

당신의 임무는 그 촬영물을
촬영된 파일 순서대로 나열하는 것이 아니라,
현재 실제로 존재하는 SOURCE를 이용해서
가장 흥미롭고 이해하기 쉬운
1차 방송 구성안을 만드는 것이다.

==================================================
절대 원칙
==================================================

1. 촬영순서와 방송순서는 완전히 다르다.

파일명 시간순으로 나열하지 마라.

이야기에 필요하다면
뒤에서 찍은 영상을 앞에 사용할 수 있고,
앞에서 찍은 영상을 뒤에 사용할 수 있다.

2. SOURCE 장면을 창작하지 마라.

실제 SOURCE로 확인된 장면만
kind="SOURCE"로 만들 수 있다.

3. 실제 SOURCE 장면에는 반드시 다음을 넣어라.

sourceName
sourceStart
sourceEnd

4. sourceStart/sourceEnd는 SOURCE MASTER와
VIDEO BRAIN에서 제시된 실제 후보구간을 우선 사용한다.

확실한 구간이 없으면 억지로 초를 만들지 말고
precisionNeeded=true로 표시한다.

5. BLOCK 음성은 절대로 사용하지 마라.

BLOCK 구간과 겹치는 음성을
인터뷰,
원음,
내레이션 근거,
정보자막,
사실 주장으로 사용하면 안 된다.

중요:
긴 SOURCE 안에 BLOCK 구간 하나가 있다고 해서
그 SOURCE 전체를 버리거나 전체 음소거하지 않는다.

코드가 BLOCK을 제외한 안전한 세부구간으로
자동 분할할 수 있다.

따라서 좋은 화면과 좋은 발화는 최대한 살리고,
BLOCK된 짧은 부분만 제거하는 방향으로 구성한다.

화면 자체가 필요하지만 음성을 쓸 수 없는 경우에는:
audioMode="MUTE_OR_REPLACE"

6. SOURCE_AUDIO_CANDIDATE는
실제 사실 확인 완료가 아니다.

방송에서 사실로 단정하지 마라.

7. NEEDS_CONFIRMATION 항목도
확인 전에는 사실 내레이션이나
정보자막으로 확정하지 마라.

8. 사실은 창작하지 않는다.
표현은 제작할 수 있다.

9. SOURCE에 없는 내용이 방송상 필요하다면
SOURCE인 척 만들지 말고 별도 블록으로 분리한다.

허용 kind:

SOURCE
NARRATION
BREATH
GRAPHIC
LOCATION_ZOOM
RESEARCH_NEEDED
EXTERNAL_INSERT
AI_VISUAL

10. AI_VISUAL은 최후의 수단이다.

기존 SOURCE →
그래픽/지도 →
확인된 외부자료 →
추가촬영 →
AI_VISUAL

순으로 생각한다.

11. 외부 영상은 저작권 확인 전
실제 사용 확정하지 않는다.

rightsStatus="CHECK_REQUIRED"

12. 여운을 중요하게 생각한다.

인터뷰와 정보가 계속 붙지 않도록
필요한 곳에는 BREATH를 넣어라.

13. 좋은 방송에는
오프닝,
질문 또는 목표,
진행,
사람,
현장 증거,
변화,
감정,
결과 또는 다음 기대
가 필요하다.

하지만 SOURCE에 없는 사건을
억지로 만들어서는 안 된다.

14. 클라이맥스가 실제 SOURCE에 없으면
없다고 인정한다.

15. 엔딩도 SOURCE에 없다면
검증된 사실 + 제작 가능한 내레이션 +
SOURCE 화면으로 설계할 수 있다.

==================================================
조PD 연출의도
==================================================

directorIntent가 비어 있지 않으면
그것은 최상위 편집 방향이다.

하지만 directorIntent 안에
SOURCE에서 확인되지 않은 역사,
지리,
숫자,
제품 효능,
사실 주장이 있으면
SOURCE 사실로 바꾸지 마라.

반드시 다음 중 하나로 분리한다.

RESEARCH_NEEDED
EDITORIAL_MESSAGE
NARRATION_DRAFT

==================================================
구성 방식
==================================================

먼저 이 촬영물의 가장 강한 이야기를 한 문장으로 정한다.

그 다음 방송을
6~12개의 의미 있는 STORY BLOCK으로 구성한다.

각 블록은 단순히 영상 하나가 아니다.

예:

오프닝
문제 제기
이동
도착
현장 확인
사람
핵심 질문
답변
작업
결과
여운
엔딩

실제 촬영물에 맞게 결정한다.

==================================================
SOURCE BLOCK 규칙
==================================================

SOURCE 블록은 다음을 포함한다.

order
kind
title
storyPurpose
sourceName
sourceStart
sourceEnd
estimatedDuration
visual
audioMode
audioCandidate
audioSafety
whyThisShot
transitionIn
transitionOut
holdAfter
precisionNeeded
confidence

audioMode 허용값:

ORIGINAL
MUTE_OR_REPLACE
DETACH_AND_MOVE
MIX_WITH_NARRATION
NONE

audioSafety 허용값:

SAFE_CANDIDATE
NEEDS_REVIEW
BLOCKED_AUDIO_AVOIDED
NO_DIALOGUE_NEEDED

==================================================
제작 블록 규칙
==================================================

NARRATION이면:
narrationDraft
narrationPurpose
factStatus

BREATH이면:
duration
visualSourceSuggestion

GRAPHIC이면:
graphicInstruction
factStatus

LOCATION_ZOOM이면:
targetLocation
visualInstruction
factStatus

RESEARCH_NEEDED이면:
researchQuestion
whyNeeded

EXTERNAL_INSERT이면:
searchQuery
rightsStatus

AI_VISUAL이면:
visualInstruction
disclosure

==================================================
출력 JSON
==================================================

JSON만 출력한다.

{
  "titleDirection": "",
  "oneLineStory": "",
  "editorialGoal": "",
  "directorIntentUsed": "",
  "estimatedProgramDuration": 0,

  "openingStrategy": {
    "hook": "",
    "reason": ""
  },

  "centralQuestion": "",

  "storyArc": {
    "beginning": "",
    "middle": "",
    "end": ""
  },

  "blocks": [
    {
      "order": 1,
      "kind": "SOURCE",
      "title": "",
      "storyPurpose": "",
      "sourceName": "",
      "sourceStart": 0,
      "sourceEnd": 0,
      "estimatedDuration": 0,
      "visual": "",
      "audioMode": "ORIGINAL",
      "audioCandidate": "",
      "audioSafety": "SAFE_CANDIDATE",
      "whyThisShot": "",
      "transitionIn": "",
      "transitionOut": "",
      "holdAfter": 0,
      "precisionNeeded": false,
      "confidence": "HIGH"
    }
  ],

  "climax": {
    "status": "FOUND | WEAK | MISSING",
    "description": ""
  },

  "ending": {
    "status": "SOURCE_SUPPORTED | PRODUCED | MISSING",
    "description": ""
  },

  "researchNeeded": [],

  "missingMaterial": [],

  "editorNotes": [],

  "approvalQuestion":
    "이 구성으로 2차 가편을 만들까요?"
}

==================================================
마지막 검수
==================================================

출력 전 반드시 확인한다.

- SOURCE 파일명이 sourceRegistry에 실제 존재하는가?
- sourceStart < sourceEnd인가?
- SOURCE duration을 넘지 않는가?
- BLOCK 음성을 사용하지 않았는가?
- 촬영순서대로 기계적으로 배열하지 않았는가?
- SOURCE와 제작물이 구분되어 있는가?
- 확인되지 않은 사실을 단정하지 않았는가?
- 각 장면을 왜 쓰는지 설명되어 있는가?
- 다음 단계에서 실제 편집 가능한 구조인가?

다시 말한다.

당신의 목표는
"촬영내용 요약"이 아니다.

목표는:

"현재 실제로 확보된 촬영물로
가장 좋은 방송을 어떻게 만들 것인가?"

이다.
`;

    const userPrompt = `
다음은 JOPD SOURCE MASTER가 정리한
실제 촬영물 통합 자료다.

이 자료만을 근거로
1차 방송 구성안을 만들어라.

촬영 파일 순서에 얽매이지 마라.

조PD 연출의도가 있으면
그 방향을 우선하되,
SOURCE에서 확인되지 않은 사실은
RESEARCH_NEEDED로 분리하라.

SOURCE 장면에는 반드시
실제 sourceName과 후보 IN/OUT을 넣어라.

BLOCK 음성은 사용하지 마라.

INPUT:
${JSON.stringify(editorialInput)}
`;

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${apiKey}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        `OpenAI Responses API 실패 ${response.status}: ${errorText}`
      );
    }

    const data = await response.json();

    const outputText =
      extractOutputText(data);

    if (!outputText) {
      throw new Error(
        "FIRST CUT PLAN 응답이 비어 있습니다."
      );
    }

    let plan: any;

    try {
      plan = JSON.parse(
        cleanJsonText(outputText)
      );
    } catch {
      await fs.writeFile(
        path.join(
          ROOT,
          "first-cut-plan-invalid-output.txt"
        ),
        outputText,
        "utf8"
      );

      throw new Error(
        "FIRST CUT PLAN JSON 파싱 실패. 원문 저장 완료."
      );
    }

    /*
     * ------------------------------------------------
     * CODE SAFETY VALIDATION
     * AI 판단보다 코드 검사가 우선한다.
     * ------------------------------------------------
     */

    const validationErrors: string[] = [];
    const validationWarnings: string[] = [];

    const blocks = Array.isArray(plan.blocks)
      ? plan.blocks
      : [];

    const expandedBlocks: any[] = [];

    for (const originalBlock of blocks) {
      if (
        originalBlock.kind !== "SOURCE"
      ) {
        expandedBlocks.push(
          originalBlock
        );
        continue;
      }

      const sourceName = String(
        originalBlock.sourceName || ""
      );

      const start = Number(
        originalBlock.sourceStart
      );

      const end = Number(
        originalBlock.sourceEnd
      );

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        end <= start
      ) {
        expandedBlocks.push(
          originalBlock
        );
        continue;
      }

      const blockedForSource =
        authoritativeBlockedAudio
          .filter(
            (item: any) =>
              item.sourceName ===
                sourceName &&
              overlaps(
                start,
                end,
                Number(item.start || 0),
                Number(item.end || 0)
              )
          );

      /*
       * ORIGINAL 음성을 쓰려는 SOURCE에
       * BLOCK이 포함되면 안전구간으로 분할.
       */
      if (
        blockedForSource.length > 0 &&
        (
          originalBlock.audioMode ===
            "ORIGINAL" ||
          originalBlock.audioMode ===
            "DETACH_AND_MOVE"
        )
      ) {
        const safeRanges =
          subtractBlockedRanges(
            start,
            end,
            blockedForSource
          );

        if (safeRanges.length === 0) {
          expandedBlocks.push({
            ...originalBlock,
            audioMode:
              "MUTE_OR_REPLACE",
            audioSafety:
              "BLOCKED_AUDIO_AVOIDED",
            automaticSafetyNote:
              "전체 후보구간에 BLOCK 위험이 있어 원음 사용 금지",
          });

          continue;
        }

        safeRanges.forEach(
          (range, index) => {
            expandedBlocks.push({
              ...originalBlock,

              title:
                safeRanges.length > 1
                  ? `${originalBlock.title} (${index + 1}/${safeRanges.length})`
                  : originalBlock.title,

              sourceStart:
                range.start,

              sourceEnd:
                range.end,

              estimatedDuration:
                Number(
                  (
                    range.end -
                    range.start
                  ).toFixed(3)
                ),

              audioSafety:
                "SAFE_CANDIDATE",

              automaticSafetyNote:
                "AUDIO TRUTH BLOCK 구간을 코드가 자동 제거함",

              parentSourceRange: {
                start,
                end,
              },
            });
          }
        );

        continue;
      }

      expandedBlocks.push(
        originalBlock
      );
    }

    /*
     * 자동분할 결과를 실제 PLAN에 반영한다.
     * order도 방송순서 기준으로 다시 부여한다.
     */
    expandedBlocks.forEach(
      (block, index) => {
        block.order = index + 1;
      }
    );

    plan.blocks = expandedBlocks;

    for (const block of expandedBlocks) {
      if (block.kind !== "SOURCE") {
        continue;
      }

      const sourceName =
        String(block.sourceName || "");

      const source =
        sourceMap.get(sourceName);

      if (!source) {
        validationErrors.push(
          `존재하지 않는 SOURCE: ${sourceName}`
        );
        continue;
      }

      const start =
        Number(block.sourceStart);

      const end =
        Number(block.sourceEnd);

      if (
        !Number.isFinite(start) ||
        !Number.isFinite(end) ||
        start < 0 ||
        end <= start
      ) {
        validationErrors.push(
          `${sourceName}: 잘못된 IN/OUT ${start}~${end}`
        );
        continue;
      }

      if (
        source.duration !== null &&
        end > source.duration + 0.25
      ) {
        validationErrors.push(
          `${sourceName}: OUT ${end}초가 원본 길이 ${source.duration}초를 초과`
        );
      }

      const blockedOverlaps =
        authoritativeBlockedAudio.filter(
          (item: any) =>
            item.sourceName === sourceName &&
            overlaps(
              start,
              end,
              Number(item.start || 0),
              Number(item.end || 0)
            )
        );

      if (blockedOverlaps.length > 0) {
        if (
          block.audioMode === "ORIGINAL" ||
          block.audioMode ===
            "DETACH_AND_MOVE"
        ) {
          validationErrors.push(
            `${sourceName} ${start}~${end}: BLOCK 음성과 겹치는데 audioMode=${block.audioMode}`
          );
        } else {
          block.audioSafety =
            "BLOCKED_AUDIO_AVOIDED";

          validationWarnings.push(
            `${sourceName} ${start}~${end}: BLOCK 음성과 겹침. 원음 사용 금지`
          );
        }
      }

      block.uploadId =
        source.uploadId;

      block.sourceDuration =
        source.duration;
    }

    /*
     * 잘못된 SOURCE 계획을 그대로 다음 단계로
     * 넘기지 않는다.
     */
    const readyForApproval =
      validationErrors.length === 0;

    const result = {
      engine: "JOPD FIRST CUT PLAN",
      version: "1.1.0",
      stage: "EDITORIAL STORY DESIGN",

      sourceMasterVersion:
        sourceMaster.version || null,

      readyForApproval,

      validation: {
        errors: validationErrors,
        warnings: validationWarnings,
      },

      plan,

      createdAt:
        new Date().toISOString(),
    };

    const outputPath = path.join(
      ROOT,
      "jopd-first-cut-plan.json"
    );

    await fs.writeFile(
      outputPath,
      JSON.stringify(
        result,
        null,
        2
      ),
      "utf8"
    );

    return NextResponse.json({
      ok: true,
      outputPath:
        ".jopd-media/jopd-first-cut-plan.json",
      result,
    });
  } catch (error) {
    console.error(
      "JOPD FIRST CUT PLAN ERROR",
      error
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR",
      },
      {
        status: 500,
      }
    );
  }
}
