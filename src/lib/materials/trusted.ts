import "server-only";

import type { Problem } from "@/lib/problems/catalog";
import { allMaterials, kindsForSymptoms, type MaterialKind, type OrganicMaterial } from "./organic";

/**
 * 검증 기업 × 나라 공시 제품
 *
 * 농민에게 쿠팡 제품을 소개할 때의 기준 (대표님 지시 2026-10-31)
 *  1) 국립농산물품질관리원 유기농업자재 '공시'를 받은 제품만 (나라 기준 합격)
 *  2) 그중에서도 아래 '검증 기업' 제품만
 *     - 대기업 계열: 팜한농(LG), 농협케미컬·남해화학·NH농우바이오(농협), 바이엘크롭사이언스
 *     - 주요 농자재 기업: 오랜 업력·공시 다수의 국내 대표 회사
 *     - 참여 기업: 엑스포 참여사(카탈로그 확인)
 *  목록은 대표님이 넣고 빼는 곳입니다. (여기에 없는 회사 제품은 소개하지 않음)
 */
export type TrustTier = "대기업 계열" | "주요 농자재 기업" | "참여 기업";

export const TRUSTED_COMPANIES: Array<{ match: string; short: string; tier: TrustTier }> = [
  { match: "팜한농", short: "팜한농", tier: "대기업 계열" },
  { match: "농협케미컬", short: "농협케미컬", tier: "대기업 계열" },
  { match: "남해화학", short: "남해화학", tier: "대기업 계열" },
  { match: "NH농우바이오", short: "농우바이오", tier: "대기업 계열" },
  { match: "바이엘크롭사이언스", short: "바이엘", tier: "대기업 계열" },
  { match: "㈜대유", short: "대유", tier: "주요 농자재 기업" },
  { match: "고려바이오㈜", short: "고려바이오", tier: "주요 농자재 기업" },
  { match: "한국삼공", short: "한국삼공", tier: "주요 농자재 기업" },
  { match: "㈜조비", short: "조비", tier: "주요 농자재 기업" },
  { match: "효성오앤비", short: "효성오앤비", tier: "주요 농자재 기업" },
  { match: "㈜누보", short: "누보", tier: "주요 농자재 기업" },
  { match: "㈜코리아아그로", short: "코리아아그로", tier: "주요 농자재 기업" },
  { match: "㈜그린아그로텍", short: "그린아그로텍", tier: "주요 농자재 기업" },
  { match: "㈜풍농", short: "풍농", tier: "주요 농자재 기업" },
  { match: "㈜한얼싸이언스", short: "한얼싸이언스", tier: "주요 농자재 기업" },
  { match: "㈜도프", short: "도프", tier: "참여 기업" },
  { match: "와성원예", short: "와성원예", tier: "참여 기업" },
  { match: "㈜부성바이오", short: "부성바이오", tier: "참여 기업" },
];

export type CertifiedPick = OrganicMaterial & { short: string; tier: TrustTier; keywordHit: boolean };

const TIER_RANK: Record<TrustTier, number> = { "참여 기업": 0, "대기업 계열": 1, "주요 농자재 기업": 2 };

function trustOf(company: string) {
  return TRUSTED_COMPANIES.find((t) => company.includes(t.match)) ?? null;
}

const TRUSTED_POOL: CertifiedPick[] = allMaterials()
  .map((m) => {
    const t = trustOf(m.company);
    return t ? { ...m, short: t.short, tier: t.tier, keywordHit: false } : null;
  })
  .filter((x): x is CertifiedPick => x !== null);

function norm(t: string) {
  return t.toLowerCase().replace(/[\s()·\-]/g, "");
}

/** 문제에 맞는 '검증 기업 공시 제품' — 이름에 핵심어가 든 것 먼저, 없으면 같은 자재구분(나라 분류) 중에서 */
export function certifiedForProblem(problem: Problem, limit = 3): { picks: CertifiedPick[]; kinds: MaterialKind[] } {
  if (problem.noProducts) return { picks: [], kinds: [] };
  const physio = /칼슘|배꼽|고두|열과/.test((problem.mustKeywords ?? []).join(" "));
  const kinds: MaterialKind[] = physio ? ["작물생육용", "토양개량 및 작물생육용"] : kindsForSymptoms(problem.symptoms);
  if (!kinds.length) return { picks: [], kinds };
  const keys = (problem.mustKeywords ?? problem.productKeywords).map(norm).filter((k) => k.length >= 2);
  const pool = TRUSTED_POOL.filter((m) => kinds.includes(m.kind as MaterialKind)).map((m) => ({ ...m, keywordHit: keys.some((k) => norm(m.name).includes(k)) }));
  // 생리장해(칼슘 등)는 이름에 핵심어가 있어야만 — 아무 생육제나 권하지 않음
  const usable = physio || problem.mustKeywords?.length ? pool.filter((m) => m.keywordHit) : pool;
  const seen = new Set<string>();
  const picks = usable
    .sort((a, b) => Number(b.keywordHit) - Number(a.keywordHit) || TIER_RANK[a.tier] - TIER_RANK[b.tier])
    .filter((m) => {
      // 같은 회사는 1개씩만 — 여러 회사를 보여 줌
      if (seen.has(m.short)) return false;
      seen.add(m.short);
      return true;
    })
    .slice(0, limit);
  return { picks, kinds };
}
