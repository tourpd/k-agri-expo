import { createSupabaseServerClient } from "@/lib/supabase/server";

type CmsHeroSettingsRow = {
  id: number;
  hero_mode?: string | null;
  hero_auto_window_days?: number | null;
  hero_auto_min_leads?: number | null;
  hero_auto_min_share?: number | null;
  hero_auto_min_gap?: number | null;
};

type LeadIssueRow = {
  issue_key: string | null;
  recommended_deals: any[] | null;
  recommended_booths: any[] | null;
};

export type AutoHeroResult = {
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  badge_text: string;
  source_issue_key: string | null;
  source_count: number;
};

export type AutoHeroDecision = {
  shouldUseAutoHero: boolean;
  reason: string;
  totalLeads: number;
  windowDays: number;
  topIssueKey: string | null;
  topIssueCount: number;
  secondIssueCount: number;
  topIssueShare: number;
  gapFromSecond: number;
  recommendedDealCount: number;
  recommendedBoothCount: number;
  hero: AutoHeroResult | null;
};

const DEFAULT_WINDOW_DAYS = 7;
const DEFAULT_MIN_LEADS = 20;
const DEFAULT_MIN_SHARE = 0.35;
const DEFAULT_MIN_GAP = 8;
const MIN_RECOMMENDED_ASSETS = 1;

function clampWindowDays(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_WINDOW_DAYS;
  return Math.min(30, Math.max(1, Math.floor(n)));
}

function clampMinLeads(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_MIN_LEADS;
  return Math.max(1, Math.floor(n));
}

function clampMinShare(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_MIN_SHARE;
  return Math.min(0.95, Math.max(0.05, n));
}

function clampMinGap(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return DEFAULT_MIN_GAP;
  return Math.max(0, Math.floor(n));
}

function issueLabel(issueKey: string | null) {
  switch (issueKey) {
    case "thrips":
      return "총채벌레";
    case "downy_mildew":
      return "노균병";
    case "enlargement":
      return "비대 불량";
    case "growth":
      return "생육 불량";
    case "aphid":
      return "진딧물";
    case "calcium":
      return "칼슘 결핍";
    case "general":
      return "농민 주요 상담";
    default:
      return "농민 주요 상담";
  }
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function pickTopAssets(rows: LeadIssueRow[]) {
  let topDeal: any | null = null;
  let topBooth: any | null = null;

  for (const row of rows) {
    if (!topDeal && Array.isArray(row.recommended_deals) && row.recommended_deals.length > 0) {
      topDeal = row.recommended_deals[0];
    }
    if (!topBooth && Array.isArray(row.recommended_booths) && row.recommended_booths.length > 0) {
      topBooth = row.recommended_booths[0];
    }
    if (topDeal && topBooth) break;
  }

  const recommendedDealCount = rows.reduce((acc, row) => {
    return acc + (Array.isArray(row.recommended_deals) ? row.recommended_deals.length : 0);
  }, 0);

  const recommendedBoothCount = rows.reduce((acc, row) => {
    return acc + (Array.isArray(row.recommended_booths) ? row.recommended_booths.length : 0);
  }, 0);

  return {
    topDeal,
    topBooth,
    recommendedDealCount,
    recommendedBoothCount,
  };
}

function buildAutoHero(issueKey: string | null, count: number, topDeal: any | null, topBooth: any | null, windowDays: number): AutoHeroResult {
  const label = issueLabel(issueKey);

  return {
    title: `지금 농민들이 가장 많이 찾는 ${label} 해결`,
    subtitle: `최근 ${windowDays}일 AI 상담 기준 ${label} 문의 집중`,
    description: topDeal
      ? `최근 상담 데이터 기준으로 ${label} 관련 문의가 가장 많습니다. 지금 바로 확인할 수 있는 추천 딜과 연결해 드립니다.`
      : `최근 상담 데이터 기준으로 ${label} 관련 문의가 가장 많습니다. 관련 부스와 제품 흐름으로 바로 연결해 드립니다.`,
    button_text: topDeal ? "지금 추천 딜 보기" : "추천 부스 보기",
    button_link: topDeal?.deal_url || topBooth?.booth_url || "/expo/booths",
    secondary_button_text: topBooth ? "관련 부스 보기" : "전체 상담 보기",
    secondary_button_link: topBooth?.booth_url || "/admin/crm",
    badge_text: `HOT ISSUE · ${label}`,
    source_issue_key: issueKey,
    source_count: count,
  };
}

async function getHeroSettings(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>) {
  const { data, error } = await supabase
    .from("cms_settings")
    .select("id, hero_mode, hero_auto_window_days, hero_auto_min_leads, hero_auto_min_share, hero_auto_min_gap")
    .eq("id", 1)
    .single();

  if (error) {
    throw new Error(`cms_settings 조회 실패: ${error.message}`);
  }

  return (data ?? null) as CmsHeroSettingsRow | null;
}

export async function getAutoHeroDecision(): Promise<AutoHeroDecision> {
  const supabase = await createSupabaseServerClient();
  const settings = await getHeroSettings(supabase);

  const windowDays = clampWindowDays(settings?.hero_auto_window_days);
  const minLeads = clampMinLeads(settings?.hero_auto_min_leads);
  const minShare = clampMinShare(settings?.hero_auto_min_share);
  const minGap = clampMinGap(settings?.hero_auto_min_gap);

  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - windowDays);

  const { data, error } = await supabase
    .from("deal_leads")
    .select("issue_key,recommended_deals,recommended_booths")
    .eq("source_channel", "ai_consult")
    .gte("created_at", from.toISOString())
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`자동 히어로용 리드 조회 실패: ${error.message}`);
  }

  const rows = (data ?? []) as LeadIssueRow[];
  const totalLeads = rows.length;

  if (totalLeads < minLeads) {
    return {
      shouldUseAutoHero: false,
      reason: `최근 ${windowDays}일 상담 수가 ${totalLeads}건으로 최소 기준 ${minLeads}건보다 적습니다.`,
      totalLeads,
      windowDays,
      topIssueKey: null,
      topIssueCount: 0,
      secondIssueCount: 0,
      topIssueShare: 0,
      gapFromSecond: 0,
      recommendedDealCount: 0,
      recommendedBoothCount: 0,
      hero: null,
    };
  }

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.issue_key || "general";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const sortedIssues = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  const top = sortedIssues[0] ?? [null, 0];
  const second = sortedIssues[1] ?? [null, 0];

  const topIssueKey = top[0];
  const topIssueCount = top[1];
  const secondIssueCount = second[1] ?? 0;
  const topIssueShare = totalLeads > 0 ? topIssueCount / totalLeads : 0;
  const gapFromSecond = topIssueCount - secondIssueCount;

  if (topIssueShare < minShare) {
    return {
      shouldUseAutoHero: false,
      reason: `1위 이슈 점유율이 ${formatPercent(topIssueShare)}로 최소 기준 ${formatPercent(minShare)}보다 낮습니다.`,
      totalLeads,
      windowDays,
      topIssueKey,
      topIssueCount,
      secondIssueCount,
      topIssueShare,
      gapFromSecond,
      recommendedDealCount: 0,
      recommendedBoothCount: 0,
      hero: null,
    };
  }

  if (gapFromSecond < minGap) {
    return {
      shouldUseAutoHero: false,
      reason: `1위와 2위 이슈 격차가 ${gapFromSecond}건으로 최소 기준 ${minGap}건보다 작습니다.`,
      totalLeads,
      windowDays,
      topIssueKey,
      topIssueCount,
      secondIssueCount,
      topIssueShare,
      gapFromSecond,
      recommendedDealCount: 0,
      recommendedBoothCount: 0,
      hero: null,
    };
  }

  const issueRows = rows.filter((r) => (r.issue_key || "general") === topIssueKey);
  const { topDeal, topBooth, recommendedDealCount, recommendedBoothCount } = pickTopAssets(issueRows);

  if (recommendedDealCount + recommendedBoothCount < MIN_RECOMMENDED_ASSETS) {
    return {
      shouldUseAutoHero: false,
      reason: "연결 가능한 추천 딜/부스 자산이 부족하여 자동 히어로를 만들지 않습니다.",
      totalLeads,
      windowDays,
      topIssueKey,
      topIssueCount,
      secondIssueCount,
      topIssueShare,
      gapFromSecond,
      recommendedDealCount,
      recommendedBoothCount,
      hero: null,
    };
  }

  const hero = buildAutoHero(
    topIssueKey,
    topIssueCount,
    topDeal,
    topBooth,
    windowDays
  );

  return {
    shouldUseAutoHero: true,
    reason: `최근 ${windowDays}일 동안 ${issueLabel(topIssueKey)} 이슈가 ${topIssueCount}건으로 가장 강하게 나타났습니다.`,
    totalLeads,
    windowDays,
    topIssueKey,
    topIssueCount,
    secondIssueCount,
    topIssueShare,
    gapFromSecond,
    recommendedDealCount,
    recommendedBoothCount,
    hero,
  };
}

export async function getAutoHeroData(): Promise<AutoHeroResult | null> {
  const decision = await getAutoHeroDecision();
  return decision.shouldUseAutoHero ? decision.hero : null;
}