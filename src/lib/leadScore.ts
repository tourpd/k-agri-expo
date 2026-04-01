// src/lib/leadScore.ts

export type LeadLike = {
  source?: string | null;
  landing_type?: string | null;
  message?: string | null;
  phone?: string | null;
  email?: string | null;
  region?: string | null;
  crop?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  status?: string | null;
  created_at?: string | null;

  // CRM 운영 확장용
  memo?: string | null;
  call_count?: number | null;
  last_called_at?: string | null;
};

export type LeadGrade = "HOT" | "WARM" | "MILD" | "COLD";

const SCORE = {
  SOURCE_YOUTUBE: 10,
  SOURCE_OTHER: 5,

  LANDING_BOOTH: 15,
  LANDING_DEAL: 20,
  LANDING_CONSULT: 25,

  MESSAGE_EXISTS: 30,
  MESSAGE_LEN_30: 5,
  MESSAGE_LEN_80: 5,

  PHONE_EXISTS: 20,
  EMAIL_EXISTS: 10,

  REGION_EXISTS: 5,
  CROP_EXISTS: 5,

  PRODUCT_EXISTS: 10,

  STATUS_CONTACTED: 15,
  STATUS_CLOSED_PENALTY: 20,

  MEMO_EXISTS: 5,

  CALL_ONCE: 8,
  CALL_MULTI: 5,

  RECENT_1DAY: 15,
  RECENT_3DAY: 10,
  RECENT_7DAY: 5,

  RECENT_CALL_1DAY: 5,
  RECENT_CALL_3DAY: 3,
} as const;

function norm(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function lower(v: unknown) {
  return norm(v).toLowerCase();
}

function hasYoutubeSource(source: string) {
  return (
    source.includes("youtube") ||
    source.includes("yt") ||
    source.includes("shorts")
  );
}

function getLandingScore(landingType: string) {
  if (
    landingType === "consult" ||
    landingType === "ai-consult" ||
    landingType === "counsel"
  ) {
    return SCORE.LANDING_CONSULT;
  }

  if (
    landingType === "deal" ||
    landingType === "product-deal" ||
    landingType === "expo-deal"
  ) {
    return SCORE.LANDING_DEAL;
  }

  if (
    landingType === "booth" ||
    landingType === "expo-booth" ||
    landingType === "detail"
  ) {
    return SCORE.LANDING_BOOTH;
  }

  return 0;
}

function getRecencyScore(createdAt?: string | null) {
  if (!createdAt) return 0;

  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return 0;

  const diffMs = Date.now() - created.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) return SCORE.RECENT_1DAY;
  if (diffDays <= 3) return SCORE.RECENT_3DAY;
  if (diffDays <= 7) return SCORE.RECENT_7DAY;
  return 0;
}

function getRecentCallScore(lastCalledAt?: string | null) {
  if (!lastCalledAt) return 0;

  const called = new Date(lastCalledAt);
  if (Number.isNaN(called.getTime())) return 0;

  const diffMs = Date.now() - called.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 1) return SCORE.RECENT_CALL_1DAY;
  if (diffDays <= 3) return SCORE.RECENT_CALL_3DAY;
  return 0;
}

export function calcLeadScore(lead: LeadLike) {
  let score = 0;

  const source = lower(lead.source);
  const landingType = lower(lead.landing_type);
  const message = norm(lead.message);
  const phone = norm(lead.phone);
  const email = norm(lead.email);
  const region = norm(lead.region);
  const crop = norm(lead.crop);
  const productId = norm(lead.product_id);
  const productName = norm(lead.product_name);
  const status = lower(lead.status);
  const memo = norm(lead.memo);
  const callCount = Number(lead.call_count ?? 0);

  if (source) {
    score += hasYoutubeSource(source)
      ? SCORE.SOURCE_YOUTUBE
      : SCORE.SOURCE_OTHER;
  }

  score += getLandingScore(landingType);

  if (message) {
    score += SCORE.MESSAGE_EXISTS;

    if (message.length >= 30) score += SCORE.MESSAGE_LEN_30;
    if (message.length >= 80) score += SCORE.MESSAGE_LEN_80;
  }

  if (phone) score += SCORE.PHONE_EXISTS;
  if (email) score += SCORE.EMAIL_EXISTS;

  if (region) score += SCORE.REGION_EXISTS;
  if (crop) score += SCORE.CROP_EXISTS;

  if (productId || productName) {
    score += SCORE.PRODUCT_EXISTS;
  }

  if (status === "contacted") {
    score += SCORE.STATUS_CONTACTED;
  }

  if (memo) {
    score += SCORE.MEMO_EXISTS;
  }

  if (callCount >= 1) {
    score += SCORE.CALL_ONCE;
  }

  if (callCount >= 2) {
    score += SCORE.CALL_MULTI;
  }

  score += getRecencyScore(lead.created_at);
  score += getRecentCallScore(lead.last_called_at);

  if (status === "closed") {
    score -= SCORE.STATUS_CLOSED_PENALTY;
  }

  if (score < 0) score = 0;

  return score;
}

export function calcPriorityRank(score: number, status?: string | null) {
  const s = lower(status);

  if (s === "closed") return 9999;

  if (score >= 80) return 1;
  if (score >= 60) return 2;
  if (score >= 40) return 3;
  if (score >= 20) return 4;
  return 5;
}

export function getLeadGrade(score: number): LeadGrade {
  if (score >= 80) return "HOT";
  if (score >= 60) return "WARM";
  if (score >= 40) return "MILD";
  return "COLD";
}