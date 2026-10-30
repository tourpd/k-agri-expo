/**
 * 글 한 줄 → 문제 페이지 찾기
 *
 * 쓰는 곳 세 군데:
 * - 농민이 직접 적은 질문 ("딸기 잎 끝이 타들어가요")
 * - 뉴스공장이 만든 영상 제목 (더보기에 넣을 링크 찾기)
 * - 포토닥터 진단 결과 (작물 + 증상)
 *
 * AI 없이 키워드로만 합니다. 빠르고 공짜고 예측 가능합니다. 모자라면 그때 AI를 붙입니다.
 */
import { CROPS, PROBLEMS, SYMPTOMS, type CropKey, type Problem, type SymptomKey } from "./catalog";
import { NEEDS, type Need } from "./needs";
import { cropGrade } from "./season";

export type MatchResult = {
  crop: CropKey | null;
  symptoms: SymptomKey[];
  problems: Array<{ problem: Problem; score: number }>;
  needs: Array<{ need: Need; score: number }>;
};

function norm(t: string) {
  return t.toLowerCase().replace(/\s+/g, " ").trim();
}

export function detectCrop(text: string): CropKey | null {
  const t = norm(text);
  let best: { key: CropKey; len: number } | null = null;
  for (const c of CROPS) {
    for (const a of c.aliases) {
      if (t.includes(a.toLowerCase()) && (!best || a.length > best.len)) best = { key: c.key, len: a.length };
    }
  }
  return best?.key ?? null;
}

export function detectSymptoms(text: string): SymptomKey[] {
  const t = norm(text);
  const hits: Array<{ key: SymptomKey; n: number }> = [];
  for (const s of SYMPTOMS) {
    const n = s.aliases.filter((a) => t.includes(a.toLowerCase())).length;
    if (n > 0) hits.push({ key: s.key, n });
  }
  return hits.sort((a, b) => b.n - a.n).map((h) => h.key);
}

export function matchText(text: string, limit = 3): MatchResult {
  const t = norm(text);
  const crop = detectCrop(t);
  const symptoms = detectSymptoms(t);

  const scored = PROBLEMS.map((p) => {
    let score = 0;
    if (crop && (p.crop === crop || p.alsoCrops?.includes(crop))) score += 5;
    if (crop && p.crop === "common") score += 1;
    if (!crop && p.crop === "common") score += 2;
    for (const s of p.symptoms) if (symptoms.includes(s)) score += 3;
    // 제목·요약·키워드 직접 일치
    const words = [p.title, p.summary, ...p.productKeywords].join(" ").toLowerCase();
    for (const token of t.split(/[\s,.·!?]+/).filter((w) => w.length >= 2)) {
      if (words.includes(token)) score += 1;
    }
    // 지금 시기 가산
    if (p.seasonal) score += 1;
    if (cropGrade(p.crop).grade === "now") score += 1;
    return { problem: p, score };
  })
    .filter((x) => x.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const needs = NEEDS.map((n) => {
    let score = 0;
    if (crop && n.crops.includes(crop)) score += 2;
    const words = [n.title, n.why, ...n.productKeywords].join(" ").toLowerCase();
    for (const token of t.split(/[\s,.·!?]+/).filter((w) => w.length >= 2)) {
      if (words.includes(token)) score += 2;
    }
    return { need: n, score };
  })
    .filter((x) => x.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return { crop, symptoms, problems: scored, needs };
}
