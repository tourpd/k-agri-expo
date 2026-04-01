import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CrmLeadRow = {
  id: string;
  name: string | null;
  phone: string | null;
  audience_type: string | null;
  source_channel: string | null;
  issue_key: string | null;
  crop_key: string | null;
  interest_topic: string | null;
  consult_text: string | null;
  recommended_booths: any[] | null;
  recommended_products: any[] | null;
  recommended_deals: any[] | null;
  lead_score: number | null;
  priority_rank: string | null;
  status: string | null;
  clicked_cta: string | null;
  inflow_page: string | null;
  created_at: string | null;
};

export async function listCrmLeads(options?: {
  sourceChannel?: string;
  issueKey?: string;
}) {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("deal_leads")
    .select(
      `
      id,
      name,
      phone,
      audience_type,
      source_channel,
      issue_key,
      crop_key,
      interest_topic,
      consult_text,
      recommended_booths,
      recommended_products,
      recommended_deals,
      lead_score,
      priority_rank,
      status,
      clicked_cta,
      inflow_page,
      created_at
    `
    )
    .order("created_at", { ascending: false });

  if (options?.sourceChannel) {
    query = query.eq("source_channel", options.sourceChannel);
  }

  if (options?.issueKey) {
    query = query.eq("issue_key", options.issueKey);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    throw new Error(`CRM 리드 조회 실패: ${error.message}`);
  }

  const rows = (data ?? []) as CrmLeadRow[];

  return sortHotFirst(rows);
}

export async function listIssueKeysForCrm(sourceChannel = "ai_consult") {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("deal_leads")
    .select("issue_key")
    .eq("source_channel", sourceChannel)
    .not("issue_key", "is", null);

  if (error) {
    throw new Error(`이슈 키 조회 실패: ${error.message}`);
  }

  const unique = Array.from(
    new Set((data ?? []).map((row: any) => row.issue_key).filter(Boolean))
  ) as string[];

  return unique.sort();
}

function priorityWeight(value: string | null | undefined) {
  switch (value) {
    case "VERY_HOT":
      return 4;
    case "HOT":
      return 3;
    case "WARM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 0;
  }
}

function sortHotFirst(rows: CrmLeadRow[]) {
  return [...rows].sort((a, b) => {
    const p = priorityWeight(b.priority_rank) - priorityWeight(a.priority_rank);
    if (p !== 0) return p;

    const score = (b.lead_score ?? 0) - (a.lead_score ?? 0);
    if (score !== 0) return score;

    return (
      new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
    );
  });
}