import fs from "node:fs";
import path from "node:path";

export type KhosMemory = {
  path: string;
  source: string;
  text: string;
  score: number;
};

const ROOTS = [
  "K-HOS/HUMANITY_BLACK_BOX/001_HUMAN_SOUL",
];

const ALLOWED = new Set([".md", ".json", ".txt"]);

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const result: string[] = [];

  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true,
  })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      result.push(...walk(full));
      continue;
    }

    if (
      entry.isFile() &&
      ALLOWED.has(path.extname(entry.name).toLowerCase())
    ) {
      result.push(full);
    }
  }

  return result;
}

function tokens(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .map((x) => x.trim())
        .filter((x) => x.length >= 2)
    )
  );
}

function scoreDocument(
  queryTokens: string[],
  relativePath: string,
  text: string
) {
  if (!queryTokens.length) return 0;

  const haystack =
    `${relativePath}\n${text}`.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    if (!haystack.includes(token)) continue;

    score += relativePath
      .toLowerCase()
      .includes(token)
      ? 5
      : 1;

    const matches =
      haystack.split(token).length - 1;

    score += Math.min(matches, 5);
  }

  // AI Writer School: automatic LIVE retrieval uses the human-study
  // framework only. Derived lesson/question/archetype outputs remain
  // preserved in K-HOS but are not injected automatically.
  if (
    relativePath.includes("HUMANITY_BLACK_BOX/001_HUMAN_SOUL")
  ) {
    score += 6;
  }

  return score;
}

export function retrieveKhosCreativeMemory(
  query: string,
  limit = 8
): KhosMemory[] {
  const cwd = process.cwd();
  const queryTokens = tokens(query);
  const candidates: KhosMemory[] = [];

  for (const relativeRoot of ROOTS) {
    const absoluteRoot = path.join(cwd, relativeRoot);

    for (const absolutePath of walk(absoluteRoot)) {
      let text = "";

      try {
        text = fs.readFileSync(
          absolutePath,
          "utf8"
        );
      } catch {
        continue;
      }

      const relativePath =
        path.relative(cwd, absolutePath);

      const score = scoreDocument(
        queryTokens,
        relativePath,
        text
      );

      if (score <= 0) continue;

      candidates.push({
        path: relativePath,
        source: relativeRoot,
        text: text.slice(0, 12000),
        score,
      });
    }
  }

  return candidates
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.path.localeCompare(b.path)
    )
    .slice(0, Math.max(1, Math.min(limit, 12)));
}

export function formatKhosMemoryForPrompt(
  memories: KhosMemory[]
) {
  if (!memories.length) {
    return [
      "이번 요청과 직접 일치하는 K-HOS 인간 연구 기억을",
      "검색하지 못했다.",
      "없는 기억을 있다고 가정하지 말고",
      "일반적인 창작 사고와 조PD의 지시를 중심으로 작업한다.",
    ].join(" ");
  }

  return memories
    .map(
      (memory, index) => `
===== K-HOS HUMAN STUDY MEMORY ${index + 1} =====
PATH: ${memory.path}
RETRIEVAL_SCORE: ${memory.score}

${memory.text}
`.trim()
    )
    .join("\n\n");
}
