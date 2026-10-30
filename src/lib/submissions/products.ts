import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CropKey } from "@/lib/problems/catalog";
import { CROPS } from "@/lib/problems/catalog";
import type { DoseRule, PartnerProduct } from "@/lib/problems/partner-catalog";

/**
 * 기업이 직접 올린 제품 (expo_product_submissions)
 * - 승인(approved)된 것만 농민에게 보입니다.
 * - 계산기·문제 페이지에서는 카탈로그 제품(PartnerProduct)과 같은 모양으로 바꿔 씁니다. id는 "s:<uuid>".
 * - 표가 아직 없으면(SQL 미적용) 조용히 빈 배열.
 */
export type SubmissionRow = {
  id: string;
  status: "pending" | "approved" | "rejected";
  company_name: string;
  company_phone: string;
  company_email: string | null;
  contact_name: string | null;
  homepage_url: string | null;
  product_name: string;
  product_group: string | null;
  feature: string | null;
  ingredients: string | null;
  crops: string[];
  uses: string[];
  problem_slugs: string[];
  dose_rules: DoseRule[];
  timing: string | null;
  cautions: string[];
  packages: string[];
  price_krw: number | null;
  buy_url: string | null;
  image_url: string | null;
  organic_cert_no: string | null;
  sellable: boolean;
  admin_memo: string | null;
  approved_at: string | null;
  created_at: string;
};

export const SUBMISSION_PREFIX = "s:";

let cache: { at: number; rows: SubmissionRow[] } | null = null;
const TTL = 60 * 1000;

export async function approvedSubmissions(): Promise<SubmissionRow[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.rows;
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("expo_product_submissions")
      .select("*")
      .eq("status", "approved")
      .order("approved_at", { ascending: false })
      .limit(500);
    if (error) {
      // 표가 없으면 42P01 — 조용히
      if (!/does not exist|42P01|schema cache/i.test(error.message)) console.error("[submissions] list error", error.message);
      return [];
    }
    const rows = (data ?? []) as SubmissionRow[];
    cache = { at: Date.now(), rows };
    return rows;
  } catch {
    return [];
  }
}

export function invalidateSubmissionCache() {
  cache = null;
}

export async function submissionsForProblem(slug: string, limit = 2) {
  const rows = await approvedSubmissions();
  return rows.filter((r) => r.problem_slugs?.includes(slug)).slice(0, limit);
}

export async function submissionById(id: string): Promise<SubmissionRow | null> {
  const clean = id.startsWith(SUBMISSION_PREFIX) ? id.slice(SUBMISSION_PREFIX.length) : id;
  const rows = await approvedSubmissions();
  const hit = rows.find((r) => r.id === clean);
  if (hit) return hit;
  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("expo_product_submissions").select("*").eq("id", clean).eq("status", "approved").maybeSingle();
    return (data as SubmissionRow | null) ?? null;
  } catch {
    return null;
  }
}

export async function searchSubmissions(q: string, limit = 10) {
  const t = q.trim().toLowerCase().replace(/[\s-]/g, "");
  if (!t) return [];
  const rows = await approvedSubmissions();
  return rows
    .filter((r) => [r.product_name, r.company_name, r.product_group ?? "", ...(r.uses ?? []), ...(r.crops ?? [])].join(" ").toLowerCase().replace(/[\s-]/g, "").includes(t))
    .slice(0, limit);
}

function parsePackage(label: string): { label: string; ml?: number; g?: number } {
  const m = label.replace(/\s/g, "").match(/^([\d.]+)(ml|mL|L|l|g|kg|KG)$/);
  if (!m) return { label };
  const n = parseFloat(m[1]);
  const u = m[2].toLowerCase();
  if (u === "ml") return { label, ml: n };
  if (u === "l") return { label, ml: n * 1000 };
  if (u === "g") return { label, g: n };
  return { label, g: n * 1000 };
}

function cropKeysFromNames(names: string[]): CropKey[] {
  const keys = new Set<CropKey>();
  for (const n of names) {
    for (const c of CROPS) {
      if (c.aliases.some((a) => n.includes(a)) || n.includes(c.label)) keys.add(c.key);
    }
  }
  return Array.from(keys);
}

/** 계산기·문제 페이지용 공통 모양으로 */
export function submissionToPartner(r: SubmissionRow): PartnerProduct & { companyName: string; companyPhone: string; buyUrl: string | null; imageUrl: string | null } {
  return {
    id: `${SUBMISSION_PREFIX}${r.id}`,
    company: "dof", // 타입 호환용 — 회사 정보는 companyName/companyPhone 을 쓰세요
    name: r.product_name,
    group: r.product_group ?? "기업 등록 제품",
    packages: (r.packages ?? []).map(parsePackage),
    feature: r.feature ?? "",
    ingredients: r.ingredients ?? undefined,
    crops: r.crops ?? [],
    cropKeys: cropKeysFromNames(r.crops ?? []),
    uses: r.uses ?? [],
    problems: r.problem_slugs ?? [],
    doses: (r.dose_rules ?? []).length ? r.dose_rules : [{ kind: "text", text: "사용량은 기업에 문의하세요." }],
    timing: r.timing ?? "",
    cautions: r.cautions ?? [],
    organicCertNo: r.organic_cert_no ?? undefined,
    source: { label: `${r.company_name} 등록 자료`, page: 0 },
    href: r.homepage_url ?? undefined,
    sellable: r.sellable !== false,
    companyName: r.company_name,
    companyPhone: r.company_phone,
    buyUrl: r.buy_url,
    imageUrl: r.image_url,
  };
}
