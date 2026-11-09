import "server-only";

import data from "@/data/organic-materials.json";
import type { Problem, SymptomKey } from "@/lib/problems/catalog";

/**
 * 유기농업자재 공시 목록 (국립농산물품질관리원, 2026-06-16 기준, 2,598건)
 * 출처: 공공데이터포털 "농림축산식품부 국립농산물품질관리원_유기농업자재현황" (이용허락 제한 없음)
 *
 * 들어 있는 것: 공시번호·상표명·자재구분·사업자·공시기관·연락처·제조장주소
 * 없는 것: 사용량·희석배수·대상작물 → 이건 기업이 등록하거나 카탈로그로 채웁니다.
 *
 * 쓰임새
 *  1) 문제 페이지: "이 문제에 공시된 친환경 자재 ○개" → 회사 전화 바로 연결
 *  2) /materials 검색 (이름·회사·자재구분)
 *  3) 기업 영업 명단 (관리자): 회사 675곳, 제품 수, 전화
 */
export type OrganicMaterial = {
  no: string; // 공시번호
  name: string; // 상표명(자재명)
  kind: string; // 자재구분
  company: string;
  cert_by: string; // 공시기관
  phone: string;
  addr: string;
};

export const ORGANIC_SOURCE = { label: "국립농산물품질관리원 유기농업자재 공시현황", asOf: "2026-06-16", url: "https://www.data.go.kr/data/15048671/fileData.do" };

const ALL = data as OrganicMaterial[];

export const MATERIAL_KINDS = ["충해관리용", "병해관리용", "병해충관리용", "토양개량 및 작물생육용", "작물생육용", "토양개량용"] as const;
export type MaterialKind = (typeof MATERIAL_KINDS)[number];

export const KIND_LABEL: Record<string, { short: string; icon: string }> = {
  충해관리용: { short: "벌레", icon: "🐛" },
  병해관리용: { short: "병", icon: "🦠" },
  병해충관리용: { short: "병·벌레", icon: "🧪" },
  "토양개량 및 작물생육용": { short: "토양·생육", icon: "🌱" },
  작물생육용: { short: "생육", icon: "📈" },
  토양개량용: { short: "토양", icon: "🪨" },
};

/** 증상 → 어울리는 자재구분 */
export function kindsForSymptoms(symptoms: SymptomKey[]): MaterialKind[] {
  const set = new Set<MaterialKind>();
  for (const s of symptoms) {
    if (s === "insects") { set.add("충해관리용"); set.add("병해충관리용"); }
    if (s === "spots" || s === "mold") { set.add("병해관리용"); set.add("병해충관리용"); }
    if (s === "root" || s === "growth" || s === "yellow-leaf" || s === "wilting") { set.add("토양개량 및 작물생육용"); set.add("작물생육용"); }
    if (s === "fruit-crack" || s === "poor-color") { set.add("작물생육용"); set.add("토양개량 및 작물생육용"); }
  }
  return Array.from(set);
}

function norm(t: string) {
  return t.toLowerCase().replace(/[\s()㈜(주)·\-]/g, "");
}

export function allMaterials() {
  return ALL;
}

export function materialsByKind(kind: string) {
  return ALL.filter((m) => m.kind === kind);
}

/** 이름·회사·자재구분으로 검색 */
export function searchMaterials(q: string, kind?: string, limit = 50): OrganicMaterial[] {
  const t = norm(q);
  let list = kind ? ALL.filter((m) => m.kind === kind) : ALL;
  if (t) list = list.filter((m) => norm(m.name).includes(t) || norm(m.company).includes(t) || norm(m.kind).includes(t));
  return list.slice(0, limit);
}

/** 문제와 어울리는 공시 자재: 이름에 핵심어가 든 것 먼저, 그다음 같은 자재구분 */
export function materialsForProblem(problem: Problem, limit = 6): { matched: OrganicMaterial[]; kinds: MaterialKind[]; total: number } {
  // 생리장해(칼슘 결핍 등)는 증상이 반점이어도 병해 자재가 아니라 생육 자재
  const physio = /칼슘|배꼽|고두|열과/.test((problem.mustKeywords ?? []).join(" "));
  const kinds: MaterialKind[] = physio ? ["작물생육용", "토양개량 및 작물생육용"] : kindsForSymptoms(problem.symptoms);
  if (!kinds.length) return { matched: [], kinds, total: 0 };
  const pool = ALL.filter((m) => kinds.includes(m.kind as MaterialKind));
  const keys = (problem.mustKeywords ?? problem.productKeywords).map(norm).filter((k) => k.length >= 2);
  const scored = pool
    .map((m) => ({ m, s: keys.reduce((acc, k) => acc + (norm(m.name).includes(k) ? 2 : 0), 0) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.m);
  return { matched: scored.slice(0, limit), kinds, total: pool.length };
}

export type CompanyRow = { company: string; phone: string; addr: string; products: number; kinds: Record<string, number>; sample: string[] };

/** 회사별 묶음 (영업 명단) */
export function companies(): CompanyRow[] {
  const map = new Map<string, CompanyRow>();
  for (const m of ALL) {
    const key = norm(m.company);
    const row = map.get(key) ?? { company: m.company, phone: m.phone, addr: m.addr, products: 0, kinds: {}, sample: [] };
    row.products += 1;
    row.kinds[m.kind] = (row.kinds[m.kind] ?? 0) + 1;
    if (row.sample.length < 5) row.sample.push(m.name);
    if (!row.phone && m.phone) row.phone = m.phone;
    map.set(key, row);
  }
  return Array.from(map.values()).sort((a, b) => b.products - a.products);
}

export function companyByName(name: string): CompanyRow | null {
  const t = norm(name);
  return companies().find((c) => norm(c.company) === t || norm(c.company).includes(t)) ?? null;
}
