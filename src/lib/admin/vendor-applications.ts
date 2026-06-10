import {
  EXPO_HALLS,
  getHallLabel,
  getHallMode,
  type ExpoHallId,
} from "@/lib/expo/hall-config";

export type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected";
export type PaymentStatus = "not_required" | "waiting" | "confirmed";
export type BoothProgressStatus =
  | "not_started"
  | "assigned"
  | "building"
  | "completed"
  | "failed";

export type VendorPlanType = "free" | "bronze" | "silver" | "gold" | "enterprise";
export type VendorBillingCycle = "monthly" | "yearly";

export type VendorApplicationSourceJson = {
  plan_type?: VendorPlanType | string;
  plan_name?: string;
  billing_cycle?: VendorBillingCycle | string;
  billing_label?: string;
  product_limit?: string;
  [key: string]: unknown;
};

export type VendorApplicationItem = {
  application_id?: string;
  id?: string;
  application_code?: string;
  order_code?: string;
  company_name?: string;
  representative_name?: string;
  ceo_name?: string;
  contact_name?: string;
  contact_email?: string;
  email?: string;
  contact_phone?: string;
  phone?: string;
  business_number?: string;
  amount_krw?: number;
  amount?: number;
  preferred_hall_1?: string;
  preferred_category?: string;
  application_status?: ApplicationStatus;
  payment_status?: PaymentStatus;
  booth_progress_status?: BoothProgressStatus;
  booth_type?: string;
  duration_key?: string;
  plan_type?: VendorPlanType | string;
  plan_name?: string;
  billing_cycle?: VendorBillingCycle | string;
  billing_label?: string;
  product_limit?: string;
  source_file_name?: string;
  source_extracted_json?: VendorApplicationSourceJson | null;
  rejection_reason?: string;
  created_at?: string | null;
  approved_at?: string | null;
};

export const HALL_LABELS: Record<string, string> = Object.fromEntries(
  Object.entries(EXPO_HALLS).map(([key, value]) => [key, value.label])
);

export const LEGACY_HALL_LABELS: Record<string, string> = {
  agri_inputs: "작물영양관",
  eco_friendly: "병해충솔루션관",
  machinery: "농기계·장비관",
  seeds_seedlings: "종자·육묘관",
  smart_farm: "스마트농업·AI관",
  future_insect: "미래식량·곤충관",
};

export const LEGACY_HALL_TO_NEW: Record<string, ExpoHallId> = {
  agri_inputs: "crop_nutrition",
  eco_friendly: "pest_solution",
  machinery: "machinery_equipment",
  seeds_seedlings: "seeds_seedlings",
  smart_farm: "smart_agri_ai",
  future_insect: "future_food_insect",
};

export const CATEGORY_LABELS: Record<string, string> = {
  fertilizer: "비료·영양제",
  nutrition: "작물영양제",
  calcium: "칼슘제",
  root_growth: "뿌리활착·활력제",
  seaweed_extract: "해조추출물",
  trace_element: "미량요소",
  soil_conditioner: "토양개량·활력제",
  organic_control: "친환경 병해충 관리",
  pest_control: "해충관리",
  disease_control: "병해관리",
  insect_repellent: "기피제",
  microbial_material: "미생물제",
  machinery: "농기계",
  drone: "농업용 드론",
  equipment: "농장 장비",
  automation: "자동화 장비",
  facility: "시설·하우스 자재",
  seed: "종자",
  seedling: "묘종",
  nursery: "육묘기술",
  variety: "품종",
  smart_farm: "스마트농업·센서·AI",
  sensor: "센서",
  irrigation_control: "관수제어",
  ai_camera: "AI카메라",
  diagnosis_ai: "병해진단 AI",
  insect_food: "식용곤충·곤충소재 식품",
  insect_bio: "곤충기반 바이오소재",
  alternative_protein: "대체단백",
  functional_food: "기능성식품",
  b2b_material: "B2B 원료",
  pesticide: "병해충·방제자재",
  eco_friendly: "친환경·유기농자재",
  other: "기타",
};

export function safe(v: unknown) {
  return String(v ?? "").trim();
}

export function getRowId(item?: VendorApplicationItem | null) {
  return safe(item?.application_id || item?.id);
}

export function getPlanType(item?: VendorApplicationItem | null) {
  return safe(item?.plan_type || item?.source_extracted_json?.plan_type);
}

export function getPlanName(item?: VendorApplicationItem | null) {
  const planType = getPlanType(item);
  const savedName = safe(item?.plan_name || item?.source_extracted_json?.plan_name);

  if (savedName) return savedName;

  switch (planType) {
    case "free":
      return "무료 체험";
    case "bronze":
      return "브론즈";
    case "silver":
      return "실버";
    case "gold":
      return "골드";
    case "enterprise":
      return "엔터프라이즈";
    default:
      return "";
  }
}

export function formatAmount(v?: number | null, planType?: string | null) {
  if (planType === "enterprise") return "별도 협의";

  const n = Number(v || 0);
  if (!n) return "0원";

  return `${n.toLocaleString()}원`;
}

export function formatDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 16);
  return d.toLocaleString("ko-KR").slice(0, 20);
}

export function normalizeHallId(v?: string | null): string {
  const raw = safe(v);
  if (!raw) return "";
  if (EXPO_HALLS[raw as ExpoHallId]) return raw;
  return LEGACY_HALL_TO_NEW[raw] || raw;
}

export function hallLabel(v?: string | null) {
  const raw = safe(v);
  if (!raw) return "-";

  const normalized = normalizeHallId(raw);
  return getHallLabel(normalized) || LEGACY_HALL_LABELS[raw] || raw;
}

export function hallMode(v?: string | null) {
  const normalized = normalizeHallId(v);
  return getHallMode(normalized);
}

export function categoryLabel(v?: string | null) {
  if (!v) return "-";
  return CATEGORY_LABELS[v] || v;
}

export function statusLabel(v?: string | null) {
  switch (v) {
    case "pending":
      return "대기";
    case "under_review":
      return "검토중";
    case "approved":
      return "승인";
    case "rejected":
      return "반려";
    case "not_required":
      return "입금불필요";
    case "waiting":
      return "입금대기";
    case "confirmed":
      return "입금확인";
    case "not_started":
      return "미시작";
    case "assigned":
      return "배정완료";
    case "building":
      return "구성중";
    case "completed":
      return "완료";
    case "failed":
      return "실패";
    default:
      return safe(v) || "-";
  }
}

export function badgeClass(value?: string | null) {
  if (value === "approved" || value === "confirmed" || value === "completed") {
    return "bg-green-100 text-green-800";
  }
  if (value === "pending" || value === "waiting") {
    return "bg-amber-100 text-amber-800";
  }
  if (value === "under_review" || value === "building" || value === "assigned") {
    return "bg-blue-100 text-blue-800";
  }
  if (value === "rejected" || value === "failed") {
    return "bg-red-100 text-red-800";
  }
  return "bg-neutral-100 text-neutral-700";
}

export function aiReview(item: VendorApplicationItem) {
  const reasons: string[] = [];
  const amount = Number(item.amount_krw || item.amount || 0);
  const planType = getPlanType(item);
  const normalizedHall = normalizeHallId(item.preferred_hall_1);
  const mode = hallMode(normalizedHall);

  if (!safe(item.company_name)) reasons.push("업체명 없음");
  if (!safe(item.business_number)) reasons.push("사업자번호 없음");
  if (!safe(item.contact_phone || item.phone)) reasons.push("전화번호 없음");
  if (!safe(item.contact_email || item.email)) reasons.push("이메일 없음");
  if (!safe(item.preferred_hall_1)) reasons.push("희망관 없음");
  if (!safe(item.preferred_category)) reasons.push("카테고리 없음");
  if (!safe(item.source_file_name)) reasons.push("사업자등록증 없음");

  if (
    planType !== "enterprise" &&
    amount > 0 &&
    item.payment_status !== "confirmed"
  ) {
    reasons.push("입금 미확인");
  }

  if (item.application_status === "rejected") reasons.push("반려 상태");

  if (normalizedHall && !EXPO_HALLS[normalizedHall as ExpoHallId]) {
    reasons.push("관 분류 확인필요");
  }

  if (item.application_status === "approved") {
    return {
      label: "승인완료",
      tone: "green",
      reason: "이미 승인됨",
      hallMode: mode,
    };
  }

  if (reasons.length === 0) {
    return {
      label: planType === "enterprise" ? "협의 승인 가능" : "자동승인 가능",
      tone: "green",
      reason:
        planType === "enterprise"
          ? `엔터프라이즈 · 운영 협의 후 진행 · ${hallLabel(normalizedHall)} 배정 가능`
          : `필수정보 정상 · ${hallLabel(normalizedHall)} 배정 가능`,
      hallMode: mode,
    };
  }

  if (reasons.includes("입금 미확인") && reasons.length === 1) {
    return {
      label: "입금대기",
      tone: "amber",
      reason: reasons.join(", "),
      hallMode: mode,
    };
  }

  if (reasons.includes("사업자등록증 없음")) {
    return {
      label: "서류누락",
      tone: "red",
      reason: reasons.join(", "),
      hallMode: mode,
    };
  }

  return {
    label: "확인필요",
    tone: "blue",
    reason: reasons.join(", "),
    hallMode: mode,
  };
}

export function aiBadgeClass(tone: string) {
  if (tone === "green") return "bg-green-100 text-green-800";
  if (tone === "red") return "bg-red-100 text-red-800";
  if (tone === "amber") return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}