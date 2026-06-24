import React from "react";
import Link from "next/link";
import BoothVisitTracker from "@/components/expo/BoothVisitTracker";
import LeadCaptureTracker from "@/components/expo/LeadCaptureTracker";
import BoothInquiryForm from "@/components/expo/BoothInquiryForm";
import BoothProductCard from "@/components/expo/booth/BoothProductCard";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RecentInquiry = {
  inquiry_id: string;
  farmer_name: string | null;
  phone: string | null;
  message: string | null;
  created_at: string | null;
};

type AdminBoothOps = {
  inquiryCount: number;
  leadCount: number;
  recentInquiries: RecentInquiry[];
};

type BoothRow = {
  booth_id?: string | null;
  vendor_id?: string | null;
  vendor_user_id?: string | null;

  name?: string | null;
  title?: string | null;
  intro?: string | null;
  description?: string | null;

  region?: string | null;
  category_primary?: string | null;
  category_secondary?: string | null;

  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;

  hall_id?: string | null;
  hall_code?: string | null;
  assigned_hall?: string | null;

  slot_code?: string | null;
  assigned_slot_code?: string | null;

  logo_url?: string | null;
  thumbnail_url?: string | null;
  cover_image_url?: string | null;
  banner_url?: string | null;

  youtube_url?: string | null;
  video_url?: string | null;
  youtube_link?: string | null;

  website_url?: string | null;
  kakao_url?: string | null;
  open_kakao_url?: string | null;

  booth_type?: string | null;
  plan_type?: string | null;

  consult_enabled?: boolean | null;
  kakao_enabled?: boolean | null;
  phone_bridge_enabled?: boolean | null;

  status?: string | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
  is_published?: boolean | null;
};

type SlotRow = {
  hall_id?: string | null;
  slot_id?: string | null;
  booth_id?: string | null;
};

type ProductRow = {
  id?: string | number | null;
  product_id?: string | number | null;
  booth_id?: string | null;

  name?: string | null;
  title?: string | null;
  description?: string | null;

  image_url?: string | null;
  image_file_url?: string | null;
  thumbnail_url?: string | null;

  price_krw?: number | null;
  sale_price_krw?: number | null;
  price_text?: string | null;

  youtube_url?: string | null;

  catalog_url?: string | null;
  catalog_file_url?: string | null;
  catalog_filename?: string | null;

  headline_text?: string | null;
  urgency_text?: string | null;
  cta_text?: string | null;

  point_1?: string | null;
  point_2?: string | null;
  point_3?: string | null;

  is_active?: boolean | null;
  status?: string | null;
  sort_order?: number | null;
  created_at?: string | null;
};

type DealRow = {
  id?: string | number | null;
  deal_id?: string | number | null;
  booth_id?: string | null;
  title?: string | null;
  description?: string | null;
  expo_price_text?: string | null;
  stock_text?: string | null;
  deadline_at?: string | null;
  price_original_krw?: number | null;
  price_sale_krw?: number | null;
  image_url?: string | null;
  is_active?: boolean | null;
  status?: string | null;
  created_at?: string | null;
};

type PageParams = { id: string };

type PageProps = {
  params: Promise<PageParams> | PageParams;
};

function isUuid(v: string) {
  return /^[0-9a-f-]{36}$/i.test(v);
}

function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

function fmtDeadline(v?: string | null) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")} 마감`;
}

function fmtDateTime(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
}

function shortText(v: string | null | undefined, max = 72) {
  const s = safe(v, "");
  if (!s) return "내용 없음";
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function toYoutubeEmbedUrl(url?: string | null) {
  const value = safe(url, "");
  if (!value) return "";

  if (value.includes("/embed/")) return value;

  const watchMatch = value.match(/[?&]v=([^&]+)/);
  if (watchMatch?.[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}`;
  }

  const shortMatch = value.match(/youtu\.be\/([^?&/]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}`;
  }

  return "";
}

function resolveBoothName(booth: BoothRow) {
  return safe(booth.name ?? booth.title, "부스");
}

function resolveBoothId(booth: BoothRow) {
  return safe(booth.booth_id, "");
}

function resolveVendorUserId(booth: BoothRow) {
  return safe(booth.vendor_user_id ?? booth.vendor_id, "");
}

function normalizeHallId(v?: string | null) {
  const hall = safe(v, "");
  if (!hall) return "";
  if (hall === "agri_inputs") return "agri-inputs";
  if (hall === "smart_farm") return "smartfarm";
  if (hall === "eco_friendly") return "eco-friendly";
  if (hall === "future_insect") return "future-insect";
  return hall;
}

function normalizeHallLabel(hallId?: string | null) {
  const hall = normalizeHallId(hallId);
  if (!hall) return "-";
  if (hall === "agri-inputs") return "농자재관";
  if (hall === "machines" || hall === "agri-machinery") return "농기계관";
  if (hall === "seeds") return "종자관";
  if (hall === "smartfarm") return "스마트팜관";
  if (hall === "eco-friendly" || hall === "eco") return "친환경관";
  if (hall === "future-insect" || hall === "future-food") return "미래식량관";
  return hall;
}

function normalizeSlotCode(v?: string | null) {
  const slot = safe(v, "");
  if (!slot) return "-";
  const raw = slot.toUpperCase().replace(/\s+/g, "");
  const m = raw.match(/^([A-Z])[-_]?0*([0-9]+)$/);
  if (!m) return raw;
  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

function resolveImageUrl(booth: BoothRow) {
  return (
    safe(booth.banner_url, "") ||
    safe(booth.cover_image_url, "") ||
    safe(booth.thumbnail_url, "") ||
    safe(booth.logo_url, "")
  );
}

function productPriceText(product: ProductRow) {
  if (safe(product.price_text, "")) return safe(product.price_text, "");
  if (typeof product.sale_price_krw === "number") {
    return `${product.sale_price_krw.toLocaleString("ko-KR")}원`;
  }
  if (typeof product.price_krw === "number") {
    return `${product.price_krw.toLocaleString("ko-KR")}원`;
  }
  return "가격 문의";
}

function productOriginalPriceText(product: ProductRow) {
  if (
    typeof product.price_krw === "number" &&
    typeof product.sale_price_krw === "number" &&
    product.price_krw > product.sale_price_krw
  ) {
    return `${product.price_krw.toLocaleString("ko-KR")}원`;
  }
  return "";
}

function productDiscountPercent(product: ProductRow) {
  if (
    typeof product.price_krw === "number" &&
    typeof product.sale_price_krw === "number" &&
    product.price_krw > 0 &&
    product.price_krw > product.sale_price_krw
  ) {
    return Math.round(
      ((product.price_krw - product.sale_price_krw) / product.price_krw) * 100
    );
  }
  return 0;
}

function productDiscountAmount(product: ProductRow) {
  if (
    typeof product.price_krw === "number" &&
    typeof product.sale_price_krw === "number" &&
    product.price_krw > product.sale_price_krw
  ) {
    return product.price_krw - product.sale_price_krw;
  }
  return 0;
}

function formatWon(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  return `${value.toLocaleString("ko-KR")}원`;
}

function productImage(product: ProductRow) {
  return (
    safe(product.image_file_url, "") ||
    safe(product.image_url, "") ||
    safe(product.thumbnail_url, "")
  );
}

function boothTypeLabel(v?: string | null) {
  const value = safe(v, "").toLowerCase();
  if (value === "brand") return "브랜드형";
  if (value === "promo") return "특가형";
  return "대표상품형";
}

function boothPlanLabel(v?: string | null) {
  const value = safe(v, "").toLowerCase();
  if (value === "premium") return "프리미엄 부스";
  if (value === "general" || value === "basic") return "기본 부스";
  return "무료 부스";
}

function isPublicOpen(booth: BoothRow, isAdmin: boolean) {
  if (isAdmin) return true;
  return (
    booth.is_public === true &&
    booth.is_active === true &&
    booth.is_published === true
  );
}

function isConsultOpen(booth: BoothRow) {
  return booth.consult_enabled !== false;
}

function getProductHook(product: ProductRow) {
  if (safe(product.headline_text, "")) return safe(product.headline_text, "");

  const name = safe(product.name ?? product.title, "").toLowerCase();

  if (name.includes("켈팍")) return "정식 후 활착과 초기 생육 회복용";
  if (name.includes("멸규니")) return "병해 스트레스 관리용";
  if (name.includes("싹쓰리충")) return "총채벌레·해충 대응용";

  return "지금 확인해볼 대표 상품";
}

function getProductCta(product: ProductRow) {
  if (safe(product.cta_text, "")) return safe(product.cta_text, "");
  return "가격과 사용법을 바로 문의해보십시오.";
}

function getProductPoints(product: ProductRow) {
  const points = [
    safe(product.point_1, ""),
    safe(product.point_2, ""),
    safe(product.point_3, ""),
  ].filter(Boolean);

  if (points.length > 0) return points.slice(0, 3);

  const name = safe(product.name ?? product.title, "").toLowerCase();

  if (name.includes("켈팍")) return ["활착", "생육회복", "초기관리"];
  if (name.includes("싹쓰리충")) return ["해충대응", "사용시기", "작물상담"];
  if (name.includes("멸규니")) return ["병해관리", "작물활력", "현장적용"];
  return ["생육관리", "활력보강", "상담가능"];
}

function getProductBody(product: ProductRow) {
  if (safe(product.description, "")) return safe(product.description, "");

  const name = safe(product.name ?? product.title, "").toLowerCase();

  if (name.includes("켈팍")) {
    return "활착이 약하거나 초기 생육 회복이 더딜 때 확인하기 좋은 상품입니다.";
  }
  if (name.includes("멸규니")) {
    return "병해 스트레스가 의심될 때 점검하기 좋은 상품입니다.";
  }
  if (name.includes("싹쓰리충")) {
    return "해충 발생 전후 사용 방법을 상담받기 좋은 상품입니다.";
  }

  return "작물과 시기에 맞춰 확인할 수 있는 대표 상품입니다.";
}

function getEventBadge(product: ProductRow) {
  const discount = productDiscountPercent(product);
  if (discount > 0) return `${discount}% 할인`;

  const urgency = safe(product.urgency_text, "");
  const cta = safe(product.cta_text, "");

  if (urgency.includes("공동구매") || cta.includes("공동구매")) return "공동특가";
  if (urgency.includes("한정")) return "한정특가";
  if (cta.includes("이벤트")) return "이벤트";
  if (urgency.includes("특가")) return "특가";
  return "추천";
}

function getStockText(product: ProductRow) {
  const urgency = safe(product.urgency_text, "");
  if (!urgency) return "상담 가능";
  return urgency;
}

function toTime(v?: string | null) {
  if (!v) return 0;
  const t = new Date(v).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function sortProducts(rows: ProductRow[]) {
  return [...rows].sort((a, b) => {
    const aOrder =
      typeof a.sort_order === "number" && Number.isFinite(a.sort_order)
        ? a.sort_order
        : 9999;
    const bOrder =
      typeof b.sort_order === "number" && Number.isFinite(b.sort_order)
        ? b.sort_order
        : 9999;

    if (aOrder !== bOrder) return aOrder - bOrder;

    const byDiscount = productDiscountPercent(b) - productDiscountPercent(a);
    if (byDiscount !== 0) return byDiscount;

    const byCreatedAt = toTime(b.created_at) - toTime(a.created_at);
    if (byCreatedAt !== 0) return byCreatedAt;

    return safe(a.name ?? a.title, "").localeCompare(
      safe(b.name ?? b.title, ""),
      "ko"
    );
  });
}

function resolveCatalogHref(product: ProductRow) {
  return safe(product.catalog_file_url, "") || safe(product.catalog_url, "");
}

function resolveDealPriceText(deal: DealRow) {
  if (safe(deal.expo_price_text, "")) return safe(deal.expo_price_text, "");
  if (typeof deal.price_sale_krw === "number") {
    return `${deal.price_sale_krw.toLocaleString("ko-KR")}원`;
  }
  return "특가 문의";
}

function resolveDealOriginalPriceText(deal: DealRow) {
  if (
    typeof deal.price_original_krw === "number" &&
    typeof deal.price_sale_krw === "number" &&
    deal.price_original_krw > deal.price_sale_krw
  ) {
    return `${deal.price_original_krw.toLocaleString("ko-KR")}원`;
  }
  return "";
}

function resolveDealDiscountPercent(deal: DealRow) {
  if (
    typeof deal.price_original_krw === "number" &&
    typeof deal.price_sale_krw === "number" &&
    deal.price_original_krw > 0 &&
    deal.price_original_krw > deal.price_sale_krw
  ) {
    return Math.round(
      ((deal.price_original_krw - deal.price_sale_krw) / deal.price_original_krw) * 100
    );
  }
  return 0;
}

async function loadAdminBoothOps(
  boothId: string,
  isAdmin: boolean
): Promise<AdminBoothOps> {
  if (!isAdmin || !boothId) {
    return {
      inquiryCount: 0,
      leadCount: 0,
      recentInquiries: [],
    };
  }

  try {
    const supabase = createSupabaseAdminClient();

    let inquiryCount = 0;
    let recentInquiries: RecentInquiry[] = [];

    try {
      const [{ count }, recent] = await Promise.all([
        supabase
          .from("expo_inquiries")
          .select("*", { count: "exact", head: true })
          .eq("booth_id", boothId),
        supabase
          .from("expo_inquiries")
          .select("inquiry_id,farmer_name,phone,message,created_at")
          .eq("booth_id", boothId)
          .order("created_at", { ascending: false })
          .limit(3),
      ]);

      inquiryCount = count ?? 0;

      if (!recent.error) {
        recentInquiries = (recent.data ?? []) as RecentInquiry[];
      }
    } catch (e) {
      console.error("[admin-booth-ops] expo_inquiries error:", e);
    }

    let leadCount = 0;
    try {
      const { count } = await supabase
        .from("booth_leads")
        .select("*", { count: "exact", head: true })
        .eq("booth_id", boothId);

      leadCount = count ?? 0;
    } catch (e) {
      console.error("[admin-booth-ops] booth_leads error:", e);
    }

    return {
      inquiryCount,
      leadCount,
      recentInquiries,
    };
  } catch (e) {
    console.error("[admin-booth-ops] createSupabaseAdminClient error:", e);
    return {
      inquiryCount: 0,
      leadCount: 0,
      recentInquiries: [],
    };
  }
}

async function loadSlotInfo(boothId: string): Promise<SlotRow | null> {
  if (!boothId) return null;

  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("hall_booth_slots")
      .select("hall_id, slot_id, booth_id")
      .eq("booth_id", boothId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[booth-detail] hall_booth_slots error:", error);
      return null;
    }

    return (data ?? null) as SlotRow | null;
  } catch (e) {
    console.error("[booth-detail] hall_booth_slots exception:", e);
    return null;
  }
}

async function loadBoothByAnyId(rawId: string): Promise<BoothRow | null> {
  if (!rawId) return null;

  const supabase = createSupabaseAdminClient();

  try {
    const byBoothId = await supabase
      .from("booths")
      .select("*")
      .eq("booth_id", rawId)
      .maybeSingle();

    if (!byBoothId.error && byBoothId.data) {
      return byBoothId.data as BoothRow;
    }
  } catch (e) {
    console.error("[booth-detail] booth_id query error:", e);
  }

  if (!isUuid(rawId)) return null;

  try {
    const byVendorId = await supabase
      .from("booths")
      .select("*")
      .eq("vendor_id", rawId)
      .limit(1)
      .maybeSingle();

    if (!byVendorId.error && byVendorId.data) {
      return byVendorId.data as BoothRow;
    }
  } catch (e) {
    console.error("[booth-detail] vendor_id query error:", e);
  }

  try {
    const byVendorUserId = await supabase
      .from("booths")
      .select("*")
      .eq("vendor_user_id", rawId)
      .limit(1)
      .maybeSingle();

    if (!byVendorUserId.error && byVendorUserId.data) {
      return byVendorUserId.data as BoothRow;
    }
  } catch (e) {
    console.error("[booth-detail] vendor_user_id query error:", e);
  }

  return null;
}

async function loadProducts(boothId: string): Promise<ProductRow[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_products")
      .select("*")
      .eq("booth_id", boothId)
      .order("sort_order", { ascending: true });

    if (!error) {
      return ((data ?? []) as ProductRow[]).filter(
        (p) => p.is_active == null || p.is_active === true
      );
    }

    const fallback = await supabase
      .from("products")
      .select("*")
      .eq("booth_id", boothId)
      .order("sort_order", { ascending: true });

    if (!fallback.error) {
      return ((fallback.data ?? []) as ProductRow[]).filter(
        (p) => p.is_active == null || p.is_active === true
      );
    }

    console.error("[booth-detail] products fallback error:", fallback.error);
    return [];
  } catch (e) {
    console.error("[booth-detail] products load exception:", e);
    return [];
  }
}

async function loadDeals(boothId: string): Promise<DealRow[]> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from("expo_deals")
      .select("*")
      .eq("booth_id", boothId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error) {
      return ((data ?? []) as DealRow[]).filter(
        (d) => d.is_active == null || d.is_active === true
      );
    }

    const fallback = await supabase
      .from("booth_deals")
      .select("*")
      .eq("booth_id", boothId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!fallback.error) {
      return ((fallback.data ?? []) as DealRow[]).filter(
        (d) => d.is_active == null || d.is_active === true
      );
    }

    console.error("[booth-detail] deals fallback error:", fallback.error);
    return [];
  } catch (e) {
    console.error("[booth-detail] deals load exception:", e);
    return [];
  }
}

export default async function ExpoBoothDetailPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const rawId = decodeURIComponent(resolvedParams?.id ?? "").trim();

  if (!rawId || rawId === "[id]") {
    return (
      <main style={pageWrap}>
        <h1 style={titleStyle}>잘못된 부스 주소입니다.</h1>
        <div style={meta}>부스 ID가 전달되지 않았습니다.</div>
        <div style={{ marginTop: 16 }}>
          <Link href="/expo" style={btnGhost}>
            엑스포 홈
          </Link>
        </div>
      </main>
    );
  }

  const isAdmin = await isAdminAuthenticated();
  const booth = await loadBoothByAnyId(rawId);

  if (!booth) {
    return (
      <main style={pageWrap}>
        <h1 style={titleStyle}>부스를 찾을 수 없습니다.</h1>
        <div style={meta}>입력값: {rawId}</div>
        <div style={{ marginTop: 16 }}>
          <Link href="/expo" style={btnGhost}>
            엑스포 홈
          </Link>
        </div>
      </main>
    );
  }

  if (!isPublicOpen(booth, isAdmin)) {
    return (
      <main style={pageWrap}>
        <h1 style={titleStyle}>이 부스는 아직 공개 준비 중입니다.</h1>
        <div style={meta}>공개 설정이 완료되면 고객 화면에서 볼 수 있습니다.</div>
        <div style={{ marginTop: 16 }}>
          <Link href="/expo" style={btnGhost}>
            엑스포 홈
          </Link>
        </div>
      </main>
    );
  }

  const resolvedBoothId = resolveBoothId(booth);
  const slotRow = await loadSlotInfo(resolvedBoothId);

  const hallId =
    normalizeHallId(slotRow?.hall_id) ||
    normalizeHallId(booth.hall_id) ||
    normalizeHallId(booth.hall_code) ||
    normalizeHallId(booth.assigned_hall) ||
    "";

  const normalizedSlotCodeFromSlot = normalizeSlotCode(slotRow?.slot_id);
  const normalizedSlotCodeFromBooth =
    normalizeSlotCode(booth.slot_code) ||
    normalizeSlotCode(booth.assigned_slot_code);

  const slotCode =
    normalizedSlotCodeFromSlot !== "-"
      ? normalizedSlotCodeFromSlot
      : normalizedSlotCodeFromBooth !== "-"
      ? normalizedSlotCodeFromBooth
      : "-";

  const [loadedProducts, deals, adminOps] = await Promise.all([
    loadProducts(resolvedBoothId),
    loadDeals(resolvedBoothId),
    loadAdminBoothOps(resolvedBoothId, isAdmin),
  ]);

  const products = sortProducts(loadedProducts);
  const featuredProduct = products[0] ?? null;

  const description = safe(booth.description, "업체 설명이 없습니다.");
  const intro = safe(booth.intro, "대표 상품과 특가를 확인해보십시오.");

  const youtubeUrl =
    booth.youtube_url ?? booth.video_url ?? booth.youtube_link ?? null;
  const embedUrl = toYoutubeEmbedUrl(youtubeUrl);
  const heroImageUrl = resolveImageUrl(booth);

  const adminBoothManageHref = `/admin/booths?q=${encodeURIComponent(
    resolvedBoothId
  )}`;
  const adminInquiryHref = `/vendor/inquiries?booth_id=${encodeURIComponent(
    resolvedBoothId
  )}`;
  const adminLeadsHref = `/admin/leads`;
  const adminBoothEditHref = `/expo/vendor/booth-editor?booth_id=${encodeURIComponent(
    resolvedBoothId
  )}`;

  return (
    <main style={pageWrap}>
      <BoothVisitTracker boothId={resolvedBoothId} />
      <LeadCaptureTracker boothId={resolvedBoothId} landingType="booth" />

      <style>{RESPONSIVE_CSS}</style>

      {isAdmin ? (
        <section style={adminBar}>
          <div style={adminTopRow}>
            <div>
              <div style={adminEyebrow}>ADMIN MODE</div>
              <div style={adminTitle}>운영자 부스 검수 / 운영 바</div>
              <div style={adminDesc}>
                관리자 전용 화면입니다. 문의 현황과 운영 상태를 빠르게 확인할 수 있습니다.
              </div>
            </div>

            <div style={adminBtnWrap}>
              <Link href={adminBoothManageHref} style={adminPrimaryBtn}>
                관리자 부스관리
              </Link>
              <Link href={adminBoothEditHref} style={adminGhostBtn}>
                부스 편집
              </Link>
              <Link href={adminInquiryHref} style={adminGhostBtn}>
                문의 보기
              </Link>
              <Link href={adminLeadsHref} style={adminGhostBtn}>
                리드 보기
              </Link>
              <Link href="/expo/admin" style={adminGhostBtn}>
                엑스포 관리자
              </Link>
            </div>
          </div>

          <div style={adminMetaGrid}>
            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>booth_id</div>
              <div style={adminMetaValueMono}>{resolvedBoothId}</div>
            </div>
            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>부스 상태</div>
              <div style={adminMetaValue}>{safe(booth.status, "미설정")}</div>
            </div>
            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>부스 타입</div>
              <div style={adminMetaValue}>{boothTypeLabel(booth.booth_type)}</div>
            </div>
            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>부스 등급</div>
              <div style={adminMetaValue}>{boothPlanLabel(booth.plan_type)}</div>
            </div>
            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>전시장</div>
              <div style={adminMetaValue}>{normalizeHallLabel(hallId)}</div>
            </div>
            <div style={adminMetaCard}>
              <div style={adminMetaLabel}>슬롯</div>
              <div style={adminMetaValue}>{slotCode}</div>
            </div>
            <div style={adminMetaCardStrong}>
              <div style={adminMetaLabel}>문의 수</div>
              <div style={adminMetaValueBig}>{adminOps.inquiryCount}건</div>
            </div>
            <div style={adminMetaCardStrong}>
              <div style={adminMetaLabel}>리드 수</div>
              <div style={adminMetaValueBig}>{adminOps.leadCount}건</div>
            </div>
          </div>

          {adminOps.recentInquiries.length > 0 ? (
            <div style={adminRecentWrap}>
              <div style={adminRecentTitle}>최근 문의 3건</div>
              <div style={adminRecentGrid}>
                {adminOps.recentInquiries.map((item, idx) => (
                  <div key={`${item.inquiry_id}-${idx}`} style={adminRecentCard}>
                    <div style={adminRecentName}>
                      {safe(item.farmer_name, "이름 없음")} · {safe(item.phone, "연락처 없음")}
                    </div>
                    <div style={adminRecentMessage}>{shortText(item.message, 90)}</div>
                    <div style={adminRecentTime}>{fmtDateTime(item.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section style={topNav}>
        <div style={topNavMeta}>
          <div style={boothBadge}>EXPO BOOTH</div>
          <div style={meta}>
            {normalizeHallLabel(hallId)} · {slotCode} · {safe(booth.category_primary, "카테고리")}
          </div>
          <div style={metaPillsRow}>
            <span style={metaPill}>{boothTypeLabel(booth.booth_type)}</span>
            <span style={metaPill}>{boothPlanLabel(booth.plan_type)}</span>
          </div>
        </div>

        <div style={headerActions}>
          {hallId ? (
            <Link href={`/expo/hall/${hallId}`} style={btnGhost}>
              전시장으로
            </Link>
          ) : (
            <Link href="/expo" style={btnGhost}>
              엑스포 홈
            </Link>
          )}
        </div>
      </section>

      <section style={heroCard} className="hero-two-col">
        <div style={heroTextWrap}>
          <div style={heroEyebrow}>농민 특가 / 대표 상품</div>
          <h1 style={heroTitle}>{resolveBoothName(booth)}</h1>
          <div style={heroSubTitle}>{intro}</div>

          {featuredProduct ? (
            <div style={heroPricePanel}>
              <div style={heroPriceTopRow}>
                <span style={heroHotBadge}>{getEventBadge(featuredProduct)}</span>
                {productDiscountPercent(featuredProduct) > 0 ? (
                  <span style={heroDiscountBadge}>
                    {productDiscountPercent(featuredProduct)}% 할인
                  </span>
                ) : null}
              </div>

              <div style={heroProductName}>
                {safe(featuredProduct.name ?? featuredProduct.title, "대표 상품")}
              </div>

              {productOriginalPriceText(featuredProduct) ? (
                <div style={heroOriginalPrice}>
                  정상가 {productOriginalPriceText(featuredProduct)}
                </div>
              ) : null}

              <div style={heroSalePrice}>{productPriceText(featuredProduct)}</div>

              {productDiscountAmount(featuredProduct) > 0 ? (
                <div style={heroSavings}>
                  공동특가 혜택 · {formatWon(productDiscountAmount(featuredProduct))} 절감
                </div>
              ) : null}
            </div>
          ) : null}

          <div style={heroBtnRow}>
            <a href="#products" style={heroPrimaryBtn}>
              상품 보기
            </a>
            {isConsultOpen(booth) ? (
              <a href="#inquiry-request" style={heroSecondaryBtn}>
                문의 남기기
              </a>
            ) : null}
          </div>
        </div>

        <div style={heroImageWrap}>
          {heroImageUrl ? (
            <img src={heroImageUrl} alt={resolveBoothName(booth)} style={heroImage} />
          ) : (
            <div style={heroImageEmpty}>대표 이미지 준비 중</div>
          )}
        </div>
      </section>

      {deals.length > 0 ? (
        <section style={{ marginTop: 28 }}>
          <div style={sectionHeadRow}>
            <div>
              <div style={sectionEyebrow}>SPECIAL PRICE</div>
              <h2 style={sectionMainTitle}>지금 특가</h2>
            </div>
          </div>

          <div style={dealGrid}>
            {deals.map((d, idx) => {
              const dealDiscount = resolveDealDiscountPercent(d);

              return (
                <div key={String(d.deal_id ?? d.id ?? idx)} style={dealCard}>
                  <div style={dealTopRow}>
                    <div style={dealBadge}>
                      {dealDiscount > 0 ? `${dealDiscount}% 할인` : "특가"}
                    </div>
                    {safe(d.stock_text, "") ? (
                      <div style={dealStockBadge}>{safe(d.stock_text, "")}</div>
                    ) : null}
                  </div>

                  {safe(d.image_url, "") ? (
                    <img
                      src={safe(d.image_url, "")}
                      alt={safe(d.title, "특가")}
                      style={dealImage}
                    />
                  ) : null}

                  <div style={dealTitle}>{safe(d.title, "EXPO 특가")}</div>

                  {resolveDealOriginalPriceText(d) ? (
                    <div style={dealOriginalPrice}>
                      정상가 {resolveDealOriginalPriceText(d)}
                    </div>
                  ) : null}

                  <div style={price}>{resolveDealPriceText(d)}</div>

                  {dealDiscount > 0 &&
                  typeof d.price_original_krw === "number" &&
                  typeof d.price_sale_krw === "number" ? (
                    <div style={dealDiscountText}>
                      {formatWon(d.price_original_krw - d.price_sale_krw)} 절감
                    </div>
                  ) : null}

                  {safe(d.description, "") ? (
                    <div style={dealDescription}>{safe(d.description, "")}</div>
                  ) : null}

                  <div style={dealMeta}>
                    {fmtDeadline(d.deadline_at) ? fmtDeadline(d.deadline_at) : "행사 진행중"}
                  </div>

                  {isConsultOpen(booth) ? (
                    <div style={cardActionRow}>
                      <a href="#inquiry-request" style={cardPrimaryBtn}>
                        이 특가 문의하기
                      </a>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {featuredProduct ? (
        <section style={featureWrap}>
          <div style={sectionHeadRow}>
            <div>
              <div style={sectionEyebrow}>BEST ITEM</div>
              <h2 style={sectionMainTitle}>대표 상품</h2>
            </div>
          </div>

          <div style={featureCard} className="feature-two-col">
            <div style={featureImageWrap}>
              {productImage(featuredProduct) ? (
                <img
                  src={productImage(featuredProduct)}
                  alt={safe(featuredProduct.name ?? featuredProduct.title, "대표 상품")}
                  style={featureImage}
                />
              ) : (
                <div style={featureImageEmpty}>대표 상품 이미지 없음</div>
              )}
            </div>

            <div style={featureBody}>
              <div style={featureBadge}>{getEventBadge(featuredProduct)}</div>

              <div style={featureTitle}>
                {safe(featuredProduct.name ?? featuredProduct.title, "대표 상품")}
              </div>

              <div style={featureHeadline}>{getProductHook(featuredProduct)}</div>

              <div style={featurePriceWrap}>
                {productOriginalPriceText(featuredProduct) ? (
                  <div style={featureOriginalPrice}>
                    정상가 {productOriginalPriceText(featuredProduct)}
                  </div>
                ) : null}

                <div style={featurePrice}>{productPriceText(featuredProduct)}</div>

                {productDiscountPercent(featuredProduct) > 0 ? (
                  <div style={discountCallout}>
                    {productDiscountPercent(featuredProduct)}% 할인 ·{" "}
                    {formatWon(productDiscountAmount(featuredProduct))} 절감
                  </div>
                ) : null}

                <div style={featureCtaText}>{getProductCta(featuredProduct)}</div>
              </div>

              <div style={featurePoints}>
                {getProductPoints(featuredProduct).map((point, idx) => (
                  <div key={`${point}-${idx}`} style={featurePointItem}>
                    ✓ {point}
                  </div>
                ))}
              </div>

              <div style={featureDesc}>{getProductBody(featuredProduct)}</div>

              <div style={featureBtnRow}>
                {isConsultOpen(booth) ? (
                  <a href="#inquiry-request" style={ctaPrimary}>
                    문의하기
                  </a>
                ) : null}

                {safe(featuredProduct.youtube_url, "") ? (
                  <a
                    href={safe(featuredProduct.youtube_url, "")}
                    target="_blank"
                    rel="noreferrer"
                    style={ctaSecondary}
                  >
                    영상 보기
                  </a>
                ) : null}

                {resolveCatalogHref(featuredProduct) ? (
                  <a
                    href={resolveCatalogHref(featuredProduct)}
                    target="_blank"
                    rel="noreferrer"
                    style={ctaGhost}
                  >
                    카탈로그
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {embedUrl ? (
        <section style={videoSection}>
          <div style={sectionHeadRow}>
            <div>
              <div style={sectionEyebrow}>VIDEO</div>
              <h2 style={sectionMainTitle}>영상 소개</h2>
            </div>
          </div>

          <div style={videoFrameWrap}>
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title={`${resolveBoothName(booth)} 영상`}
              style={videoFrame}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </section>
      ) : null}

      <section id="products" style={{ marginTop: 28 }}>
        <div style={sectionHeadRow}>
          <div>
            <div style={sectionEyebrow}>ALL PRODUCTS</div>
            <h2 style={sectionMainTitle}>전체 상품</h2>
          </div>
        </div>

        {products.length === 0 ? (
          <div style={emptyBox}>등록된 제품이 없습니다.</div>
        ) : (
          <div style={productCardGrid}>
            {products.map((p, idx) => {
              const catalogHref = resolveCatalogHref(p);

              return (
                <BoothProductCard
                  key={String(p.product_id ?? p.id ?? idx)}
                  name={safe(p.name ?? p.title, "제품명 없음")}
                  description={getProductBody(p)}
                  priceText={productPriceText(p)}
                  originalPriceText={productOriginalPriceText(p)}
                  imageUrl={productImage(p)}
                  inquiryHref="#inquiry-request"
                  catalogHref={catalogHref || undefined}
                  hookText={getProductHook(p)}
                  urgencyText={
                    productDiscountPercent(p) > 0
                      ? `공동특가 ${productDiscountPercent(p)}% 할인 · ${formatWon(
                          productDiscountAmount(p)
                        )} 절감`
                      : getStockText(p)
                  }
                  ctaText={getProductCta(p)}
                  points={getProductPoints(p)}
                  youtubeUrl={safe(p.youtube_url, "") || undefined}
                  eventBadge={getEventBadge(p)}
                  stockText=""
                />
              );
            })}
          </div>
        )}
      </section>

      {isConsultOpen(booth) ? (
        <section id="inquiry-request" style={{ marginTop: 28 }}>
          <div style={sectionHeadRow}>
            <div>
              <div style={sectionEyebrow}>QUICK INQUIRY</div>
              <h2 style={sectionMainTitle}>빠른 문의</h2>
            </div>
          </div>

          <div style={leadIntroBox}>
            가격, 공동구매, 사용법, 대량구매 문의를 남기시면 됩니다.
          </div>

          <div style={{ marginTop: 14 }}>
            <BoothInquiryForm
              boothId={resolvedBoothId}
              vendorId={resolveVendorUserId(booth)}
              hallId={safe(hallId, "")}
              slotCode={slotCode}
            />
          </div>
        </section>
      ) : null}

      <section style={{ marginTop: 28, marginBottom: 40 }}>
        <div style={sectionHeadRow}>
          <div>
            <div style={sectionEyebrow}>ABOUT</div>
            <h2 style={sectionMainTitle}>부스 소개</h2>
          </div>
        </div>

        <section style={infoBoxWrap}>
          <div style={infoCard}>
            <div style={sectionTitle}>한 줄 소개</div>
            <div style={introText}>{intro}</div>
          </div>

          <div style={infoCard}>
            <div style={sectionTitle}>상세 소개</div>
            <div style={descBox}>{description}</div>
          </div>
        </section>
      </section>

      {isConsultOpen(booth) ? (
        <div style={stickyCtaWrap}>
          <div style={stickyCtaInner}>
            <a href="#inquiry-request" style={stickyCtaBtn}>
              문의하기
            </a>
          </div>
        </div>
      ) : null}
    </main>
  );
}

const RESPONSIVE_CSS = `
@media (max-width: 860px) {
  .feature-two-col {
    grid-template-columns: 1fr !important;
  }
}
@media (max-width: 768px) {
  .hero-two-col {
    grid-template-columns: 1fr !important;
  }
}
`;

const pageWrap: React.CSSProperties = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: "16px 14px 92px",
  background: "#fff",
  minHeight: "100vh",
};

const topNav: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const topNavMeta: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const adminBar: React.CSSProperties = {
  marginBottom: 18,
  border: "1px solid #dbeafe",
  background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)",
  borderRadius: 18,
  padding: 16,
  boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
};

const adminTopRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
};

const adminEyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#2563eb",
  letterSpacing: 0.4,
};

const adminTitle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 20,
  fontWeight: 950,
  color: "#0f172a",
};

const adminDesc: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#475569",
  maxWidth: 720,
};

const adminBtnWrap: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const adminPrimaryBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  background: "#0f172a",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 13,
};

const adminGhostBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#fff",
  color: "#0f172a",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 13,
};

const adminMetaGrid: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 10,
};

const adminMetaCard: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid #dbeafe",
  background: "#fff",
  padding: 12,
};

const adminMetaCardStrong: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid #bfdbfe",
  background: "#dbeafe",
  padding: 12,
};

const adminMetaLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  color: "#64748b",
};

const adminMetaValue: React.CSSProperties = {
  marginTop: 6,
  fontSize: 15,
  fontWeight: 900,
  color: "#0f172a",
};

const adminMetaValueBig: React.CSSProperties = {
  marginTop: 6,
  fontSize: 22,
  fontWeight: 950,
  color: "#0f172a",
};

const adminMetaValueMono: React.CSSProperties = {
  marginTop: 6,
  fontSize: 12,
  fontWeight: 800,
  color: "#0f172a",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  wordBreak: "break-all",
  lineHeight: 1.6,
};

const adminRecentWrap: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 14,
  border: "1px solid #dbeafe",
  background: "#fff",
  padding: 14,
};

const adminRecentTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 950,
  color: "#0f172a",
};

const adminRecentGrid: React.CSSProperties = {
  marginTop: 10,
  display: "grid",
  gap: 10,
};

const adminRecentCard: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  padding: 12,
};

const adminRecentName: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  color: "#0f172a",
};

const adminRecentMessage: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#334155",
};

const adminRecentTime: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  color: "#64748b",
};

const headerActions: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const boothBadge: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#16a34a",
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  margin: "4px 0",
  color: "#111",
};

const meta: React.CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  lineHeight: 1.6,
};

const metaPillsRow: React.CSSProperties = {
  marginTop: 4,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const metaPill: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: 12,
  fontWeight: 900,
};

const heroCard: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.1fr 0.9fr",
  gap: 18,
  marginTop: 10,
  marginBottom: 18,
  borderRadius: 22,
  border: "1px solid #dcfce7",
  background: "linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)",
  padding: 18,
};

const heroTextWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const heroEyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#15803d",
  letterSpacing: 0.4,
};

const heroTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 34,
  lineHeight: 1.2,
  fontWeight: 950,
  color: "#0f172a",
};

const heroSubTitle: React.CSSProperties = {
  fontSize: 15,
  lineHeight: 1.8,
  color: "#334155",
};

const heroPricePanel: React.CSSProperties = {
  marginTop: 4,
  padding: 16,
  borderRadius: 18,
  background: "#ffffff",
  border: "2px solid #fecaca",
  boxShadow: "0 10px 24px rgba(220,38,38,0.08)",
};

const heroPriceTopRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const heroHotBadge: React.CSSProperties = {
  display: "inline-flex",
  padding: "7px 10px",
  borderRadius: 999,
  background: "#111827",
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
};

const heroDiscountBadge: React.CSSProperties = {
  display: "inline-flex",
  padding: "7px 10px",
  borderRadius: 999,
  background: "#dc2626",
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
};

const heroProductName: React.CSSProperties = {
  marginTop: 12,
  fontSize: 20,
  fontWeight: 950,
  lineHeight: 1.4,
  color: "#111827",
};

const heroOriginalPrice: React.CSSProperties = {
  marginTop: 10,
  fontSize: 14,
  color: "#94a3b8",
  textDecoration: "line-through",
  fontWeight: 800,
};

const heroSalePrice: React.CSSProperties = {
  marginTop: 4,
  fontSize: 38,
  lineHeight: 1.1,
  fontWeight: 950,
  color: "#dc2626",
};

const heroSavings: React.CSSProperties = {
  marginTop: 8,
  fontSize: 15,
  fontWeight: 900,
  color: "#b91c1c",
};

const heroBtnRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const heroPrimaryBtn: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 14,
  background: "#16a34a",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 950,
  fontSize: 14,
};

const heroSecondaryBtn: React.CSSProperties = {
  padding: "14px 16px",
  borderRadius: 14,
  background: "#fff",
  color: "#166534",
  border: "1px solid #16a34a",
  textDecoration: "none",
  fontWeight: 950,
  fontSize: 14,
};

const heroImageWrap: React.CSSProperties = {
  borderRadius: 18,
  overflow: "hidden",
  background: "#fff",
  border: "1px solid #bbf7d0",
  minHeight: 260,
};

const heroImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const heroImageEmpty: React.CSSProperties = {
  minHeight: 260,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  background: "#f8fafc",
  fontWeight: 800,
};

const sectionHeadRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-end",
  gap: 12,
  flexWrap: "wrap",
};

const sectionEyebrow: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#16a34a",
  letterSpacing: 0.4,
};

const sectionMainTitle: React.CSSProperties = {
  marginTop: 6,
  fontSize: 22,
  fontWeight: 950,
  color: "#0f172a",
};

const featureWrap: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 24,
};

const featureCard: React.CSSProperties = {
  marginTop: 14,
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: 16,
};

const featureImageWrap: React.CSSProperties = {
  borderRadius: 16,
  overflow: "hidden",
  background: "#fff",
  border: "1px solid #e5e7eb",
  minHeight: 260,
};

const featureImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const featureImageEmpty: React.CSSProperties = {
  minHeight: 260,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontWeight: 800,
  background: "#f8fafc",
};

const featureBody: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const featureBadge: React.CSSProperties = {
  display: "inline-flex",
  alignSelf: "flex-start",
  padding: "7px 10px",
  borderRadius: 999,
  background: "#dc2626",
  color: "#fff",
  fontSize: 12,
  fontWeight: 900,
};

const featureTitle: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1.25,
  fontWeight: 950,
  color: "#111827",
};

const featureHeadline: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#166534",
  lineHeight: 1.7,
};

const featurePriceWrap: React.CSSProperties = {
  borderRadius: 14,
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  padding: 14,
};

const featureOriginalPrice: React.CSSProperties = {
  fontSize: 14,
  color: "#94a3b8",
  textDecoration: "line-through",
  fontWeight: 800,
};

const featurePrice: React.CSSProperties = {
  marginTop: 4,
  fontSize: 30,
  color: "#dc2626",
  fontWeight: 950,
  lineHeight: 1.15,
};

const discountCallout: React.CSSProperties = {
  marginTop: 8,
  fontSize: 14,
  color: "#b91c1c",
  fontWeight: 900,
};

const featureCtaText: React.CSSProperties = {
  marginTop: 8,
  fontSize: 13,
  lineHeight: 1.7,
  color: "#475569",
};

const featurePoints: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const featurePointItem: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "#0f172a",
  lineHeight: 1.7,
};

const featureDesc: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.8,
  color: "#334155",
  whiteSpace: "pre-wrap",
};

const featureBtnRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 4,
};

const videoSection: React.CSSProperties = {
  marginBottom: 24,
};

const videoFrameWrap: React.CSSProperties = {
  marginTop: 14,
  borderRadius: 18,
  overflow: "hidden",
  background: "#0f172a",
  boxShadow: "0 14px 34px rgba(15,23,42,0.08)",
  aspectRatio: "16 / 9",
};

const videoFrame: React.CSSProperties = {
  width: "100%",
  height: "100%",
  border: "none",
  display: "block",
};

const ctaPrimary: React.CSSProperties = {
  padding: "12px 14px",
  background: "#15803d",
  color: "#fff",
  borderRadius: 12,
  textDecoration: "none",
  fontWeight: 900,
  textAlign: "center",
  fontSize: 14,
};

const ctaSecondary: React.CSSProperties = {
  padding: "12px 14px",
  border: "1px solid #16a34a",
  borderRadius: 12,
  textDecoration: "none",
  color: "#15803d",
  background: "#fff",
  fontWeight: 900,
  textAlign: "center",
  fontSize: 14,
};

const ctaGhost: React.CSSProperties = {
  padding: "12px 14px",
  border: "1px solid #bbf7d0",
  borderRadius: 12,
  textDecoration: "none",
  color: "#166534",
  background: "#fff",
  fontWeight: 900,
  textAlign: "center",
  fontSize: 14,
};

const dealGrid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
};

const dealCard: React.CSSProperties = {
  border: "2px solid #fdba74",
  padding: 16,
  borderRadius: 18,
  color: "#111",
  background: "#fff7ed",
  display: "block",
  boxShadow: "0 12px 28px rgba(249,115,22,0.10)",
};

const dealTopRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const dealImage: React.CSSProperties = {
  width: "100%",
  height: 220,
  objectFit: "cover",
  borderRadius: 14,
  display: "block",
  background: "#fff",
  border: "1px solid #fed7aa",
  marginTop: 12,
  marginBottom: 12,
};

const dealBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 12px",
  borderRadius: 999,
  background: "#dc2626",
  color: "#fff",
  fontSize: 13,
  fontWeight: 900,
};

const dealStockBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 12px",
  borderRadius: 999,
  background: "#fff",
  color: "#9a3412",
  border: "1px solid #fdba74",
  fontSize: 12,
  fontWeight: 900,
};

const dealTitle: React.CSSProperties = {
  marginTop: 8,
  fontWeight: 950,
  fontSize: 22,
  lineHeight: 1.4,
};

const dealDescription: React.CSSProperties = {
  marginTop: 10,
  fontSize: 14,
  color: "#444",
  lineHeight: 1.8,
  whiteSpace: "pre-wrap",
};

const dealOriginalPrice: React.CSSProperties = {
  marginTop: 12,
  fontSize: 15,
  color: "#94a3b8",
  textDecoration: "line-through",
  fontWeight: 800,
};

const price: React.CSSProperties = {
  marginTop: 6,
  fontWeight: 950,
  fontSize: 34,
  color: "#dc2626",
  lineHeight: 1.1,
};

const dealDiscountText: React.CSSProperties = {
  marginTop: 6,
  fontSize: 14,
  color: "#b91c1c",
  fontWeight: 900,
};

const dealMeta: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  color: "#7c2d12",
  lineHeight: 1.7,
  fontWeight: 800,
};

const cardActionRow: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const cardPrimaryBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  background: "#111827",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 14,
};

const productCardGrid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gap: 14,
};

const leadIntroBox: React.CSSProperties = {
  marginTop: 12,
  padding: 14,
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.8,
};

const infoBoxWrap: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
};

const infoCard: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  padding: 16,
  borderRadius: 16,
  background: "#fafafa",
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 8,
  color: "#111827",
  fontSize: 15,
};

const introText: React.CSSProperties = {
  lineHeight: 1.85,
  color: "#111827",
  whiteSpace: "pre-wrap",
  fontSize: 14,
};

const descBox: React.CSSProperties = {
  lineHeight: 1.85,
  color: "#111827",
  whiteSpace: "pre-wrap",
  fontSize: 14,
};

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #ddd",
  borderRadius: 12,
  textDecoration: "none",
  color: "#111",
  background: "#fff",
  fontWeight: 900,
  fontSize: 13,
};

const emptyBox: React.CSSProperties = {
  marginTop: 12,
  padding: 16,
  borderRadius: 12,
  background: "#f8fafc",
  color: "#64748b",
  border: "1px solid #e5e7eb",
  fontSize: 14,
  lineHeight: 1.7,
};

const stickyCtaWrap: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 60,
  padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
  background: "rgba(255,255,255,0.96)",
  backdropFilter: "blur(10px)",
  borderTop: "1px solid #e5e7eb",
};

const stickyCtaInner: React.CSSProperties = {
  maxWidth: 420,
  margin: "0 auto",
};

const stickyCtaBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: 52,
  borderRadius: 14,
  background: "#16a34a",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 950,
  fontSize: 16,
};