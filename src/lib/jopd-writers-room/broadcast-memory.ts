import fs from "fs";
import path from "path";

export type BroadcastMemory = {
  path: string;
  title: string;
  text: string;
  score: number;
  memoryType: "APPROVED_DNA";
};

const ROOT = path.join(
  process.cwd(),
  "jopd-studio",
  "broadcast-dna"
);

/*
 * WRITER MEMORY AUTHORITY
 *
 * studies/ = 연구실. RESEARCHED_NOW 및 미승인 연구 보관.
 * dna/     = Promotion Gate를 통과한 APPROVED_MEMORY만 보관.
 *
 * 수석작가는 studies/를 절대 직접 검색하지 않는다.
 * RETRIEVED는 승인된 dna/에서 나온 기억만 의미한다.
 */
const MEMORY_ROOTS = [
  {
    dir: path.join(ROOT, "dna"),
    type: "APPROVED_DNA" as const,
  },
];

const ALLOWED_EXTENSIONS = new Set([
  ".json",
  ".md",
  ".txt",
]);

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, {
    withFileTypes: true,
  })) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walk(full));
      continue;
    }

    if (
      entry.isFile() &&
      ALLOWED_EXTENSIONS.has(
        path.extname(entry.name).toLowerCase()
      )
    ) {
      results.push(full);
    }
  }

  return results;
}

function tokens(query: string): string[] {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
        .split(/\s+/)
        .map((item) => item.trim())
        .filter((item) => item.length >= 2)
    )
  ).slice(0, 80);
}

function scoreText(
  relativePath: string,
  text: string,
  queryTokens: string[]
): number {
  const haystack =
    `${relativePath}\n${text}`.toLowerCase();

  let score = 0;

  for (const token of queryTokens) {
    if (!haystack.includes(token)) continue;

    const occurrences =
      haystack.split(token).length - 1;

    score += Math.min(occurrences, 5);

    if (
      relativePath.toLowerCase().includes(token)
    ) {
      score += 3;
    }
  }

  /*
   * 이 검색기에 들어오는 파일은 모두
   * Promotion Gate를 통과한 승인 DNA여야 한다.
   */
  score += 2;

  return score;
}

function titleFromText(
  file: string,
  text: string
): string {
  if (path.extname(file).toLowerCase() === ".json") {
    try {
      const parsed = JSON.parse(text) as Record<
        string,
        unknown
      >;

      const identity =
        parsed.identity &&
        typeof parsed.identity === "object"
          ? (parsed.identity as Record<
              string,
              unknown
            >)
          : null;

      const candidates = [
        parsed.dna_name,
        parsed.title,
        identity?.title,
        identity?.program_or_brand,
      ];

      for (const value of candidates) {
        if (
          typeof value === "string" &&
          value.trim()
        ) {
          return value.trim();
        }
      }
    } catch {
      // JSON parsing failure does not make
      // the file unusable as text memory.
    }
  }

  const heading = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.startsWith("#"));

  if (heading) {
    return heading.replace(/^#+\s*/, "").trim();
  }

  return path.basename(
    file,
    path.extname(file)
  );
}

export function retrieveBroadcastMemory(
  query: string,
  limit = 8
): BroadcastMemory[] {
  const queryTokens = tokens(query);

  if (!queryTokens.length) return [];

  const candidates: BroadcastMemory[] = [];

  for (const root of MEMORY_ROOTS) {
    for (const file of walk(root.dir)) {
      let text = "";

      try {
        text = fs.readFileSync(file, "utf8");
      } catch {
        continue;
      }

      /*
       * 지나치게 큰 연구파일 하나가
       * 작가 context를 독점하지 않게 제한한다.
       */
      const excerpt = text.slice(0, 16000);

      const relativePath = path
        .relative(process.cwd(), file)
        .split(path.sep)
        .join("/");

      const score = scoreText(
        relativePath,
        excerpt,
        queryTokens
      );

      if (score <= 0) continue;

      candidates.push({
        path: relativePath,
        title: titleFromText(file, excerpt),
        text: excerpt,
        score,
        memoryType: root.type,
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

export function formatBroadcastMemoryForPrompt(
  memories: BroadcastMemory[]
): string {
  if (!memories.length) {
    return [
      "현재 요청과 관련된 승인 Broadcast DNA 기억이 검색되지 않았다.",
      "없는 방송 연구를 학습했다고 주장하지 말고,",
      "필요하면 BROADCAST HUNTER / RESEARCHER 조사 필요라고 명시한다.",
    ].join("\n");
  }

  return memories
    .map(
      (memory, index) => `
==================================================
BROADCAST MEMORY ${index + 1}
TYPE: ${memory.memoryType}
TITLE: ${memory.title}
PATH: ${memory.path}
RETRIEVAL_SCORE: ${memory.score}
==================================================
${memory.text}
`.trim()
    )
    .join("\n\n");
}
