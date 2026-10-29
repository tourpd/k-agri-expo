import fs from "fs";
import path from "path";
import crypto from "crypto";

export type DeepResearchEvidence = {
  sourceUrl: string;
  sourceTitle: string;
  workTitle: string;
  episodeTitle?: string | null;
  genre: string[];
  evidenceType:
    | "TRANSCRIPT"
    | "SUBTITLE"
    | "VIDEO_OBSERVATION"
    | "AUDIO_OBSERVATION"
    | "COMMENTS"
    | "CREATOR_INTERVIEW"
    | "OFFICIAL_DESCRIPTION"
    | "MULTIMODAL"
    | "YOUTUBE_PERFORMANCE";
  content: string;
  startMs?: number | null;
  endMs?: number | null;
  provenanceNote?: string | null;
};

export type DeepResearchRequest = {
  queueItemId?: string | null;
  evidence: DeepResearchEvidence[];
  researchQuestion: string;
};

export type DeepResearchResult = {
  researchId: string;
  createdAt: string;
  researchQuestion: string;
  queueItemId: string | null;
  truthClass: "RESEARCHED_NOW";
  model: string;
  evidenceCount: number;
  sourceUrls: string[];
  evidenceManifest: Array<{
    evidenceType: DeepResearchEvidence["evidenceType"];
    sourceUrl: string;
    sourceTitle: string;
    workTitle: string;
    episodeTitle: string | null;
    genre: string[];
    startMs: number | null;
    endMs: number | null;
    provenanceNote: string | null;
  }>;
  analysis: unknown;
};

const ROOT = path.join(
  process.cwd(),
  "jopd-studio",
  "broadcast-dna"
);

const PROMPT_FILE = path.join(
  ROOT,
  "BROADCAST_DEEP_RESEARCHER_PROMPT_V3.md"
);

const CONTRACT_FILE = path.join(
  ROOT,
  "DEEP_INTELLIGENCE_CONTRACT_V2.json"
);

const STUDIES_DIR = path.join(ROOT, "studies");

function extractOutputText(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const response = data as {
    output_text?: unknown;
    output?: Array<{
      content?: Array<{
        text?: unknown;
      }>;
    }>;
  };

  if (typeof response.output_text === "string") {
    return response.output_text.trim();
  }

  const pieces: string[] = [];

  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        pieces.push(content.text);
      }
    }
  }

  return pieces.join("\n").trim();
}

function stripJsonFence(value: string): string {
  const trimmed = value.trim();

  if (
    trimmed.startsWith("```json") &&
    trimmed.endsWith("```")
  ) {
    return trimmed.slice(7, -3).trim();
  }

  if (
    trimmed.startsWith("```") &&
    trimmed.endsWith("```")
  ) {
    return trimmed.slice(3, -3).trim();
  }

  return trimmed;
}

function validateRequest(request: DeepResearchRequest) {
  if (!request.researchQuestion?.trim()) {
    throw new Error("researchQuestion이 필요합니다.");
  }

  if (
    !Array.isArray(request.evidence) ||
    request.evidence.length === 0
  ) {
    throw new Error(
      "Deep Research는 실제 evidence 없이 실행할 수 없습니다."
    );
  }

  for (const [index, item] of request.evidence.entries()) {
    if (!item.sourceUrl?.trim()) {
      throw new Error(
        `evidence[${index}].sourceUrl이 없습니다.`
      );
    }

    if (!item.sourceTitle?.trim()) {
      throw new Error(
        `evidence[${index}].sourceTitle이 없습니다.`
      );
    }

    if (!item.workTitle?.trim()) {
      throw new Error(
        `evidence[${index}].workTitle이 없습니다.`
      );
    }

    if (!item.evidenceType) {
      throw new Error(
        `evidence[${index}].evidenceType이 없습니다.`
      );
    }

    if (!item.content?.trim()) {
      throw new Error(
        `evidence[${index}]의 실제 관찰 내용이 비어 있습니다.`
      );
    }
  }
}

function makeResearchId(request: DeepResearchRequest) {
  const fingerprint = JSON.stringify({
    q: request.researchQuestion,
    evidence: request.evidence.map((item) => ({
      url: item.sourceUrl,
      type: item.evidenceType,
      start: item.startMs ?? null,
      end: item.endMs ?? null,
      content: item.content,
    })),
  });

  return `research-${crypto
    .createHash("sha256")
    .update(fingerprint)
    .digest("hex")
    .slice(0, 16)}`;
}

function atomicWriteJson(
  filename: string,
  value: unknown
) {
  fs.mkdirSync(STUDIES_DIR, { recursive: true });

  const target = path.join(STUDIES_DIR, filename);
  const tmp = `${target}.tmp`;

  fs.writeFileSync(
    tmp,
    JSON.stringify(value, null, 2),
    "utf8"
  );

  fs.renameSync(tmp, target);

  return target;
}

function buildEvidencePacket(
  evidence: DeepResearchEvidence[]
): string {
  return evidence
    .map((item, index) => {
      return [
        `===== EVIDENCE ${index + 1} =====`,
        `WORK: ${item.workTitle}`,
        `EPISODE: ${item.episodeTitle || "UNKNOWN"}`,
        `SOURCE TITLE: ${item.sourceTitle}`,
        `SOURCE URL: ${item.sourceUrl}`,
        `TYPE: ${item.evidenceType}`,
        `GENRE: ${(item.genre || []).join(", ")}`,
        `START_MS: ${item.startMs ?? "UNKNOWN"}`,
        `END_MS: ${item.endMs ?? "UNKNOWN"}`,
        `PROVENANCE: ${item.provenanceNote || ""}`,
        "",
        "OBSERVED MATERIAL:",
        item.content.trim(),
      ].join("\n");
    })
    .join("\n\n");
}

export async function runDeepBroadcastResearch(
  request: DeepResearchRequest
): Promise<DeepResearchResult> {
  validateRequest(request);

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

  const researcherPrompt = fs.readFileSync(
    PROMPT_FILE,
    "utf8"
  );

  const contract = fs.readFileSync(
    CONTRACT_FILE,
    "utf8"
  );

  const evidencePacket = buildEvidencePacket(
    request.evidence
  );

  const instructions = `
${researcherPrompt}

==================================================
STRUCTURED RESEARCH EXECUTION RULE
==================================================

이번 실행에서는 제공된 EVIDENCE만 작품 사실의 근거로 사용한다.

모델의 기존 작품 지식을 실제 관찰 사실처럼 추가하지 않는다.

EVIDENCE가 지원하지 않는 내용은 UNKNOWN 또는 NOT_OBSERVED로 남긴다.

줄거리 요약으로 대체하지 않는다.

특히 "재미있다", "반전이라 웃기다", "감동적이다",
"캐릭터가 독특하다" 같은 일반론은 WHY IT WORKS로 인정하지 않는다.

Moment를 발견했다면 반드시:
BEFORE → SETUP → EXPECTATION → ESCALATION →
TRIGGER → REACTION → AFTER
의 인과관계를 가능한 범위에서 복원한다.

그리고:
PRIMARY_CAUSE
NECESSARY_CONDITION
AMPLIFIER
DECORATION
을 구분한다.

근거가 부족해 구분할 수 없으면 추측하지 말고
INSUFFICIENT_EVIDENCE라고 기록한다.

실제 제작자의 의도는 공식 근거가 있을 때만
OFFICIAL_CREATOR_INTENT라고 한다.

그 외에는 반드시
INFERRED_CREATIVE_INTENT라고 한다.

AUDIENCE_SIGNAL은 COMMENTS evidence가 있을 때만
실제 시청자 반응으로 기록한다.

원작 대사를 길게 복제하지 않는다.
대사의 기능과 창작 메커니즘을 추상화한다.

==================================================
OUTPUT CONTRACT
==================================================

반드시 JSON 하나만 출력한다.
Markdown 코드블록을 사용하지 않는다.

최상위 구조:

{
  "work": {},
  "research_question": "",
  "evidence_assessment": {},
  "scenes": [],
  "moments": [],
  "audience_intelligence": [],
  "creator_intent": {},
  "reusable_dna": [],
  "failure_conditions": [],
  "retrieval_tags": [],
  "research_gaps": [],
  "quality_gate": {}
}

각 moments 항목은 가능한 경우 반드시 포함한다:

{
  "moment_type": [],
  "start_ms": null,
  "end_ms": null,
  "before": {
    "situation": "",
    "audience_knows": [],
    "characters_know": [],
    "expectation": "",
    "emotion": ""
  },
  "setup": "",
  "escalation": [],
  "trigger": {
    "type": "",
    "action": "",
    "dialogue_function": "",
    "visual_event": "",
    "audio_event": ""
  },
  "reaction": {},
  "after": {},
  "primary_mechanism": "",
  "secondary_mechanisms": [],
  "primary_cause": "",
  "necessary_conditions": [],
  "amplifiers": [],
  "decorations": [],
  "why_it_works": "",
  "counterfactual_tests": [],
  "human_psychology": "",
  "evidence_refs": [],
  "confidence": "HIGH|MEDIUM|LOW"
}

quality_gate에는 최소한 다음을 판단한다:

{
  "has_real_evidence": true,
  "has_temporal_context": true,
  "has_before_context": true,
  "has_trigger_analysis": true,
  "has_causal_explanation": true,
  "has_counterfactual_reasoning": true,
  "has_failure_conditions": true,
  "has_reusable_dna": true,
  "eligible_for_memory_promotion": false,
  "promotion_reason": ""
}

근거가 부족한데 eligible_for_memory_promotion을
true로 만들지 않는다.

==================================================
DEEP INTELLIGENCE CONTRACT V2
==================================================

${contract}
`;

  /*
   * COST GOVERNOR — DEEP RESEARCH CACHE
   *
   * 동일 질문 + 동일 Evidence는 동일 researchId를 가진다.
   * 새 형식의 완전한 연구가 이미 저장돼 있으면
   * OpenAI를 다시 호출하지 않고 기존 결과를 재사용한다.
   *
   * evidenceManifest가 없는 legacy 연구는 독립 검증이
   * 불가능하므로 캐시 권위로 인정하지 않는다.
   */
  const researchId = makeResearchId(request);
  const cachedPath = path.join(
    STUDIES_DIR,
    `${researchId}.json`
  );

  if (fs.existsSync(cachedPath)) {
    try {
      const cached = JSON.parse(
        fs.readFileSync(cachedPath, "utf8")
      ) as DeepResearchResult;

      if (
        cached.researchId === researchId &&
        Array.isArray(cached.evidenceManifest) &&
        cached.evidenceManifest.length > 0
      ) {
        return cached;
      }
    } catch {
      /*
       * 손상되거나 legacy 형식인 캐시는 재사용하지 않는다.
       * 아래 정상 연구 경로로 진행한다.
       */
    }
  }

  const input = {
    researchQuestion:
      request.researchQuestion.trim(),
    queueItemId: request.queueItemId || null,
    evidence: evidencePacket,
  };

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
        instructions,
        input: JSON.stringify(input),
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Broadcast Deep Research 호출 실패: ${await response.text()}`
    );
  }

  const raw = await response.json();
  const outputText = extractOutputText(raw);

  if (!outputText) {
    throw new Error(
      "Broadcast Deep Research가 빈 응답을 반환했습니다."
    );
  }

  let analysis: unknown;

  try {
    analysis = JSON.parse(
      stripJsonFence(outputText)
    );
  } catch {
    throw new Error(
      "Broadcast Deep Research 응답이 유효한 JSON이 아닙니다."
    );
  }

  const createdAt = new Date().toISOString();

  const result: DeepResearchResult = {
    researchId,
    createdAt,
    researchQuestion:
      request.researchQuestion.trim(),
    queueItemId: request.queueItemId || null,
    truthClass: "RESEARCHED_NOW",
    model,
    evidenceCount: request.evidence.length,
    sourceUrls: [
      ...new Set(
        request.evidence.map((item) =>
          item.sourceUrl.trim()
        )
      ),
    ],
    evidenceManifest: request.evidence.map(
      (item) => ({
        evidenceType: item.evidenceType,
        sourceUrl: item.sourceUrl.trim(),
        sourceTitle: item.sourceTitle.trim(),
        workTitle: item.workTitle.trim(),
        episodeTitle:
          item.episodeTitle?.trim() || null,
        genre: [...item.genre],
        startMs: item.startMs ?? null,
        endMs: item.endMs ?? null,
        provenanceNote:
          item.provenanceNote?.trim() || null,
      })
    ),
    analysis,
  };

  atomicWriteJson(
    `${researchId}.json`,
    result
  );

  return result;
}
