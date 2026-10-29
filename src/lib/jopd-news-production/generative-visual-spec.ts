import fs from "fs";

export type GenerativeVisualType =
  | "TITLE_CARD"
  | "DATA_GRAPHIC"
  | "ACTION_CARD"
  | "EXPLAINER_CG";

export type GenerativeVisualSpec = {
  beatId: string;
  segmentId: string;
  startSeconds: number;
  endSeconds: number;

  visualType: GenerativeVisualType;
  purpose: string;

  factIds: string[];
  evidenceRequired: boolean;

  narration: string;

  /**
   * Only source-grounded text may enter these fields.
   * Renderer may shorten wording, but must not invent facts/numbers.
   */
  sourceFacts: Array<{
    factId: string;
    text: string;
  }>;

  productionInstruction: {
    format: "1920x1080";
    motion: boolean;
    layoutGoal: string;
    emphasis: string[];
    sourceLabelRequired: boolean;
  };
};

function readJson(path: string): any {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function collectFacts(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.facts)) return raw.facts;
  if (Array.isArray(raw?.items)) return raw.items;
  return [];
}

function factText(fact: any): string {
  return String(
    fact?.statement ??
    fact?.text ??
    fact?.claim ??
    fact?.content ??
    fact?.fact ??
    "",
  ).trim();
}

function chooseVisualType(
  selectedKind: string,
  purpose: string,
): GenerativeVisualType {
  if (selectedKind === "TITLE_CARD") return "TITLE_CARD";
  if (selectedKind === "ACTION_CARD") return "ACTION_CARD";

  const p = purpose.toLowerCase();

  if (
    p.includes("절차") ||
    p.includes("과정") ||
    p.includes("구조") ||
    p.includes("방식") ||
    p.includes("계산") ||
    p.includes("흐름")
  ) {
    return "EXPLAINER_CG";
  }

  return "DATA_GRAPHIC";
}

export function buildGenerativeVisualSpecs(input: {
  visualDirectorPath: string;
  visualAssetRealityPath: string;
  articlePath: string;
  factsPath: string;
}) {
  const director = readJson(input.visualDirectorPath);
  const reality = readJson(input.visualAssetRealityPath);
  const article = readJson(input.articlePath);
  const factsRaw = readJson(input.factsPath);

  const facts = collectFacts(factsRaw);

  const factById = new Map(
    facts.map((fact: any) => [
      String(fact.factId ?? fact.id ?? ""),
      fact,
    ]),
  );

  const directorBeatById = new Map(
    (director.beats || []).map((beat: any) => [
      beat.beatId,
      beat,
    ]),
  );

  const articleSegments =
    article.segments ||
    article.article?.segments ||
    [];

  const segmentById = new Map(
    articleSegments.map((segment: any) => [
      String(segment.segmentId ?? segment.id ?? ""),
      segment,
    ]),
  );

  const specs: GenerativeVisualSpec[] = [];

  for (const assetBeat of reality.beats || []) {
    if (assetBeat.status !== "READY_TO_GENERATE") continue;

    const beat: any = directorBeatById.get(assetBeat.beatId);
    if (!beat) {
      throw new Error(
        `GENERATIVE_VISUAL_SPEC: missing director beat ${assetBeat.beatId}`,
      );
    }

    const segment: any =
      segmentById.get(assetBeat.segmentId) || {};

    const sourceFacts = (assetBeat.factIds || []).map(
      (factId: string) => {
        const fact = factById.get(factId);

        if (!fact) {
          throw new Error(
            `GENERATIVE_VISUAL_SPEC: missing FACT ${factId}`,
          );
        }

        const text = factText(fact);

        if (!text) {
          throw new Error(
            `GENERATIVE_VISUAL_SPEC: empty FACT text ${factId}`,
          );
        }

        return { factId, text };
      },
    );

    const selectedKind = String(assetBeat.selectedKind || "");

    specs.push({
      beatId: assetBeat.beatId,
      segmentId: assetBeat.segmentId,
      startSeconds: beat.relativeStartSeconds,
      endSeconds: beat.relativeEndSeconds,

      visualType: chooseVisualType(
        selectedKind,
        String(beat.purpose || ""),
      ),

      purpose: String(beat.purpose || ""),
      factIds: [...(assetBeat.factIds || [])],
      evidenceRequired: Boolean(assetBeat.evidenceRequired),

      narration: String(
        segment.narration ??
        segment.text ??
        "",
      ).trim(),

      sourceFacts,

      productionInstruction: {
        format: "1920x1080",
        motion:
          selectedKind === "DATA_GRAPHIC" ||
          selectedKind === "ACTION_CARD",
        layoutGoal:
          "시청자가 내레이션의 핵심을 즉시 이해하도록 한 화면에 한 메시지만 전달한다.",
        emphasis: sourceFacts.map((item: { factId: string; text: string }) => item.text),
        sourceLabelRequired:
          Boolean(assetBeat.evidenceRequired),
      },
    });
  }

  if (specs.length === 0) {
    throw new Error(
      "GENERATIVE_VISUAL_SPEC: READY_TO_GENERATE beat가 없습니다.",
    );
  }

  return {
    version: "K_AGRI_ACTION_NEWS_GENERATIVE_VISUAL_SPEC_V1",
    newsId: "NEWS-001",

    policy: {
      sourceGroundedOnly: true,
      inventedFactsForbidden: true,
      inventedNumbersForbidden: true,
      syntheticInterviewForbidden: true,
      explanatoryGraphicsAllowed: true,
      motionGraphicsAllowed: true,
    },

    specs,

    summary: {
      total: specs.length,
      titleCards: specs.filter(
        (x) => x.visualType === "TITLE_CARD",
      ).length,
      dataGraphics: specs.filter(
        (x) => x.visualType === "DATA_GRAPHIC",
      ).length,
      actionCards: specs.filter(
        (x) => x.visualType === "ACTION_CARD",
      ).length,
      explainerCg: specs.filter(
        (x) => x.visualType === "EXPLAINER_CG",
      ).length,
    },
  };
}
