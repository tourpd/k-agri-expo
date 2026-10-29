import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = path.join(
  process.cwd(),
  "jopd-studio",
  "writers-room"
);

const CREATIVE_MEMORY_FILE = path.join(
  ROOT,
  "jopd-creative-memory.json"
);

const WORKS_DIR = path.join(ROOT, "works");

export type JopdDecision =
  | "SELECT"
  | "REJECT"
  | "MODIFY"
  | "COMBINE";

export type CreativeDecisionMemory = {
  id: string;
  createdAt: string;
  authority: "JOPD";
  decision: JopdDecision;
  workId: string | null;
  target: string;
  instruction: string;
  reason: string | null;
  source: "EXPLICIT_JOPD_DECISION";
};

export type JopdCreativeMemory = {
  version: "JOPD_CREATIVE_MEMORY_V1";
  authority: "JOPD_ONLY";
  decisions: CreativeDecisionMemory[];
};

export type WorkMemory = {
  version: "JOPD_WORK_MEMORY_V1";
  workId: string;
  title: string;
  status:
    | "DEVELOPING"
    | "JOPD_APPROVED"
    | "ARCHIVED";
  updatedAt: string;

  creativeIntent: string[];
  approvedCanon: string[];
  createdCandidates: string[];
  rejected: string[];
  modifications: string[];
  combinations: string[];

  characters: string[];
  relationships: string[];
  scenes: string[];
  approvedDialogue: string[];
  props: string[];
  facts: string[];
  researchNeeded: string[];
  unresolved: string[];
  callbacks: string[];
};

function atomicWriteJson(
  target: string,
  value: unknown
) {
  fs.mkdirSync(path.dirname(target), {
    recursive: true,
  });

  const temp = `${target}.tmp-${process.pid}`;

  fs.writeFileSync(
    temp,
    JSON.stringify(value, null, 2),
    "utf8"
  );

  fs.renameSync(temp, target);
}

function emptyCreativeMemory(): JopdCreativeMemory {
  return {
    version: "JOPD_CREATIVE_MEMORY_V1",
    authority: "JOPD_ONLY",
    decisions: [],
  };
}

export function loadJopdCreativeMemory():
  JopdCreativeMemory {
  if (!fs.existsSync(CREATIVE_MEMORY_FILE)) {
    return emptyCreativeMemory();
  }

  const parsed = JSON.parse(
    fs.readFileSync(CREATIVE_MEMORY_FILE, "utf8")
  ) as JopdCreativeMemory;

  if (
    parsed.version !== "JOPD_CREATIVE_MEMORY_V1" ||
    parsed.authority !== "JOPD_ONLY" ||
    !Array.isArray(parsed.decisions)
  ) {
    throw new Error(
      "JOPD Creative Memory 계약이 올바르지 않습니다."
    );
  }

  return parsed;
}

export function recordJopdDecision(input: {
  decision: JopdDecision;
  workId?: string | null;
  target: string;
  instruction: string;
  reason?: string | null;
}): CreativeDecisionMemory {
  const target = input.target.trim();
  const instruction = input.instruction.trim();
  const workId = input.workId?.trim() || null;

  if (!target) {
    throw new Error("JOPD decision target이 필요합니다.");
  }

  if (!instruction) {
    throw new Error(
      "JOPD의 명시적 창작 지시가 필요합니다."
    );
  }

  if (!workId) {
    throw new Error(
      "JOPD decision에는 workId가 필요합니다."
    );
  }

  const memory = loadJopdCreativeMemory();
  const work = loadWorkMemory(workId);

  if (!work) {
    throw new Error(
      `존재하지 않는 Work Memory: ${workId}`
    );
  }

  const item: CreativeDecisionMemory = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    authority: "JOPD",
    decision: input.decision,
    workId,
    target,
    instruction,
    reason: input.reason?.trim() || null,
    source: "EXPLICIT_JOPD_DECISION",
  };

  /*
   * Work Memory에는 조PD의 실제 결정을 작품 상태로 반영한다.
   * AI 자기평가나 추론은 이 함수에 들어올 수 없다.
   */
  const workEntry = [
    target,
    instruction,
    item.reason ? `이유: ${item.reason}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  switch (input.decision) {
    case "SELECT":
      work.approvedCanon.push(workEntry);
      break;

    case "REJECT":
      work.rejected.push(workEntry);
      break;

    case "MODIFY":
      work.modifications.push(workEntry);
      break;

    case "COMBINE":
      work.combinations.push(workEntry);
      break;

    default: {
      const neverDecision: never = input.decision;
      throw new Error(
        `지원하지 않는 JOPD decision: ${neverDecision}`
      );
    }
  }

  work.updatedAt = item.createdAt;
  memory.decisions.push(item);

  /*
   * 두 저장소 중 하나가 실패하면 이전 파일 내용으로 복구한다.
   * Creative Memory와 Work Memory가 서로 다른 상태로 남지 않게 한다.
   */
  const workFile = workPath(workId);

  const oldCreativeBytes =
    fs.existsSync(CREATIVE_MEMORY_FILE)
      ? fs.readFileSync(CREATIVE_MEMORY_FILE)
      : null;

  const oldWorkBytes =
    fs.existsSync(workFile)
      ? fs.readFileSync(workFile)
      : null;

  try {
    atomicWriteJson(workFile, work);
    atomicWriteJson(CREATIVE_MEMORY_FILE, memory);
  } catch (error) {
    if (oldWorkBytes) {
      fs.writeFileSync(workFile, oldWorkBytes);
    } else if (fs.existsSync(workFile)) {
      fs.unlinkSync(workFile);
    }

    if (oldCreativeBytes) {
      fs.writeFileSync(
        CREATIVE_MEMORY_FILE,
        oldCreativeBytes
      );
    } else if (fs.existsSync(CREATIVE_MEMORY_FILE)) {
      fs.unlinkSync(CREATIVE_MEMORY_FILE);
    }

    throw error;
  }

  return item;
}

function workPath(workId: string) {
  return path.join(
    WORKS_DIR,
    `${workId}.json`
  );
}

export function createWorkMemory(input: {
  workId: string;
  title: string;
  creativeIntent?: string[];
}): WorkMemory {
  const workId = input.workId.trim();
  const title = input.title.trim();

  if (!workId || !title) {
    throw new Error(
      "workId와 title이 필요합니다."
    );
  }

  const target = workPath(workId);

  if (fs.existsSync(target)) {
    throw new Error(
      `Work Memory가 이미 존재합니다: ${workId}`
    );
  }

  const work: WorkMemory = {
    version: "JOPD_WORK_MEMORY_V1",
    workId,
    title,
    status: "DEVELOPING",
    updatedAt: new Date().toISOString(),

    creativeIntent: input.creativeIntent || [],
    approvedCanon: [],
    createdCandidates: [],
    rejected: [],
    modifications: [],
    combinations: [],

    characters: [],
    relationships: [],
    scenes: [],
    approvedDialogue: [],
    props: [],
    facts: [],
    researchNeeded: [],
    unresolved: [],
    callbacks: [],
  };

  atomicWriteJson(target, work);

  return work;
}

export function loadWorkMemory(
  workId: string
): WorkMemory | null {
  const target = workPath(workId);

  if (!fs.existsSync(target)) {
    return null;
  }

  const parsed = JSON.parse(
    fs.readFileSync(target, "utf8")
  ) as WorkMemory;

  if (
    parsed.version !== "JOPD_WORK_MEMORY_V1" ||
    parsed.workId !== workId
  ) {
    throw new Error(
      `Work Memory 계약 오류: ${workId}`
    );
  }

  return parsed;
}

export function formatJopdMemoryForPrompt(
  creative: JopdCreativeMemory,
  work: WorkMemory | null
): string {
  const decisions = creative.decisions.slice(-50);

  return [
    "===== JOPD CREATIVE AUTHORITY MEMORY =====",
    "Only explicit JOPD decisions below are authoritative.",
    JSON.stringify(decisions, null, 2),
    "",
    "===== CURRENT WORK MEMORY =====",
    work
      ? JSON.stringify(work, null, 2)
      : "[NO ACTIVE WORK MEMORY]",
    "",
    "RULE:",
    "CREATED candidates are not canon.",
    "Only JOPD-approved material may become approved canon.",
    "Never promote AI preference or self-score to canon.",
  ].join("\n");
}
