import React from "react";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAutoHeroData } from "@/lib/expo/hero-auto";
import { getMonthlyConsultQuestions } from "@/lib/expo/consult-queries";
import { getExpoHotIssues } from "@/lib/expo/hot-issues";
import { getMonthlyProblemCards } from "@/lib/expo/problem-cards";
import { getExpoProblemSectionData } from "@/lib/expo/problem-queries";
import { getHomeDeals } from "@/lib/expo/home-deals";
import ExpoPromotionHero from "@/components/expo/ExpoPromotionHero";

import ExpoTopBar from "@/components/expo/ExpoTopBar";
import ExpoHeroSection from "@/components/expo/ExpoHeroSection";
import ExpoCategoryEntrySection from "@/components/expo/ExpoCategoryEntrySection";
import ExpoHotIssuesSection from "@/components/expo/ExpoHotIssuesSection";
import ExpoLiveSection from "@/components/expo/ExpoLiveSection";
import ExpoDealsSection from "@/components/expo/ExpoDealsSection";
import ExpoFarmerConsultSection from "@/components/expo/ExpoFarmerConsultSection";
import ExpoProblemSection from "@/components/expo/ExpoProblemSection";
import ExpoNewProductsSection from "@/components/expo/ExpoNewProductsSection";
import ExpoFooter from "@/components/expo/ExpoFooter";

import type { CmsSettings, HomeSlot } from "@/types/expo-home";
import { groupSlots } from "@/lib/expo/home-utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const RESPONSIVE_CSS = `
.expo-home * { box-sizing: border-box; }
.expo-home img,
.expo-home iframe,
.expo-home video { max-width: 100%; }
.expo-home a,
.expo-home button { -webkit-tap-highlight-color: transparent; }
.expo-home { overflow-x: hidden; }
.expo-home section { scroll-margin-top: 84px; }

@media (max-width: 1280px) {
  .expo-new-grid,
  .expo-problem-grid,
  .expo-solution-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 1024px) {
  .expo-section {
    padding-left: 16px !important;
    padding-right: 16px !important;
  }

  .expo-topbar {
    padding: 14px 16px 8px !important;
    align-items: flex-start !important;
  }

  .expo-topbar,
  .expo-section-head {
    gap: 12px !important;
  }

  .expo-header-right,
  .expo-top-actions {
    flex-wrap: wrap !important;
  }

  .expo-hero-wrap {
    padding: 14px 16px 0 !important;
  }

  .expo-hero-card,
  .expo-promo-card,
  .expo-live-card,
  .expo-ai-card,
  .expo-problem-card,
  .expo-new-card {
    border-radius: 24px !important;
  }

  .expo-hero-card {
    padding: 22px 20px !important;
  }

  .expo-hero-buttons,
  .expo-promo-buttons {
    gap: 10px !important;
    flex-wrap: wrap !important;
  }
}

@media (max-width: 768px) {
  .expo-section {
    padding: 14px 12px 0 !important;
  }

  .expo-topbar {
    padding: 12px 12px 8px !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 10px !important;
  }

  .expo-header-right {
    width: 100% !important;
  }

  .expo-top-actions {
    width: 100% !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 8px !important;
    justify-content: stretch !important;
  }

  .expo-top-actions a:first-child {
    grid-column: 1 / -1 !important;
  }

  .expo-top-actions a,
  .expo-top-actions button {
    width: 100% !important;
    min-height: 42px !important;
    padding: 10px 12px !important;
    border-radius: 14px !important;
    font-size: 13px !important;
    text-align: center !important;
    justify-content: center !important;
    white-space: nowrap !important;
  }

  .expo-hero-wrap {
    padding: 12px 12px 0 !important;
  }

  .expo-hero-card {
    padding: 18px 16px !important;
    border-radius: 22px !important;
  }

  .expo-hero-card h1 {
    font-size: clamp(34px, 9vw, 52px) !important;
    line-height: 1.05 !important;
    letter-spacing: -0.04em !important;
  }

  .expo-hero-buttons,
  .expo-promo-buttons {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 8px !important;
    width: 100% !important;
  }

  .expo-category-grid,
  .expo-entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
  }

  .expo-live-main,
  .expo-live-grid,
  .expo-ai-input-wrap,
  .expo-promotion-hero {
    grid-template-columns: 1fr !important;
  }

  .expo-deal-grid,
  .expo-promotion-subgrid {
    grid-template-columns: 1fr !important;
  }

  .expo-promotion-title {
    font-size: 38px !important;
  }
}

@media (max-width: 560px) {
  .expo-problem-grid,
  .expo-new-grid,
  .expo-solution-grid {
    grid-template-columns: 1fr !important;
  }
}
`;

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    color: "#0f172a",
  },
};

type ExpoPromotion = {
  id: string;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  promo_type: string | null;
  media_type?: string | null;
  image_url: string | null;
  video_url: string | null;
  button_text: string | null;
  button_link: string | null;
  badge: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
  starts_at?: string | null;
  ends_at?: string | null;

  title_size?: number | null;
  subtitle_size?: number | null;
  description_size?: number | null;
  button_size?: number | null;
  image_scale?: number | string | null;
  card_radius?: number | null;
  card_padding?: number | null;
  title_color?: string | null;
  subtitle_color?: string | null;
  description_color?: string | null;
  button_bg?: string | null;
  button_text_color?: string | null;
  background?: string | null;

  card_title_size?: number | null;
  card_subtitle_size?: number | null;
  card_button_bg?: string | null;
  card_button_text_color?: string | null;
  card_bg?: string | null;
  card_radius_small?: number | null;
};

type ExpoHomeSlotRow = {
  id: string;
  content?: any;
  section_key?: string | null;
  slot_type?: string | null;
  slot_order?: number | null;
  booth_id?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  badge?: string | null;
  meta_1?: string | null;
  meta_2?: string | null;
  is_active?: boolean | null;
};

type BoothLite = {
  booth_id: string;
  name?: string | null;
  title?: string | null;
  slug?: string | null;
  intro?: string | null;
  company_name?: string | null;
  website_url?: string | null;
  youtube_url?: string | null;
  brochure_url?: string | null;
  category_primary?: string | null;
  hall_code?: string | null;
};

type LiveEvent = {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  prize_text?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  live_url?: string | null;
  live_date_label?: string | null;
  live_datetime?: string | null;
  sponsor_logo_url?: string | null;
  partner_logo_url?: string | null;
  sponsor_name?: string | null;
  partner_name?: string | null;
  feature_1?: string | null;
  feature_2?: string | null;
  feature_3?: string | null;
  feature_4?: string | null;
  cta_label?: string | null;
  cta_link?: string | null;
  secondary_cta_label?: string | null;
  secondary_cta_link?: string | null;
  participant_label?: string | null;
  participant_threshold?: string | number | null;
  sponsor_logo_size?: string | number | null;
  partner_logo_size?: string | number | null;
  main_image_scale?: string | number | null;
  dday_font_size?: string | number | null;
  participant_font_size?: string | number | null;
  status?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  created_at?: string | null;
  locked_at?: string | null;
  ended_at?: string | null;
};

type LivePrize = {
  id: string;
  event_id?: string | null;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  sponsor?: string | null;
  quantity?: number | null;
  total_winners?: number | null;
  is_active?: boolean | null;
  deleted_at?: string | null;
  display_group?: string | null;
  draw_type?: string | null;
  sort_order?: number | null;
  preview_note?: string | null;
  product_price?: string | null;
  product_cta?: string | null;
};

type HomeSlotWithLink = HomeSlot & {
  link_url?: string | null;
  badge?: string | null;
  meta_1?: string | null;
  meta_2?: string | null;
};

function JointGroupBuyBanner() {
  return (
    <section className="expo-section" style={{ padding: "18px 20px 0" }}>
      <Link
        href="/expo/health/joint"
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          display: "block",
          textDecoration: "none",
        }}
      >
        <img
          src="/images/health-joint-gonggu.png"
          alt="농민 관절건강 공동구매"
          style={{
            width: "100%",
            display: "block",
            borderRadius: 28,
            boxShadow: "0 18px 45px rgba(15,23,42,0.18)",
          }}
        />
      </Link>
    </section>
  );
}

function safe(v: unknown, fallback = "") {
  const s = String(v || "").trim();
  return s || fallback;
}

function n(v: unknown, fallback: number) {
  const value = Number(v);
  return Number.isFinite(value) ? value : fallback;
}

function toYoutubeEmbed(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";

  if (v.includes("youtube.com/embed/")) return v;

  if (v.includes("youtu.be/")) {
    const id = v.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  if (v.includes("watch?v=")) {
    const id = v.split("watch?v=")[1]?.split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  return "";
}

function normalizeSlotSection(slot: ExpoHomeSlotRow): string {
  if (slot.section_key) return String(slot.section_key);

  switch (slot.slot_type) {
    case "hero":
      return "hero";
    case "live":
    case "live_show":
      return "live_show";
    case "new":
    case "new_products":
      return "new_products";
    case "featured":
      return "featured";
    case "event":
      return "event";
    default:
      return "new_products";
  }
}

function buildBoothLink(booth?: BoothLite, slot?: ExpoHomeSlotRow): string {
  const slotLink = typeof slot?.link_url === "string" ? slot.link_url.trim() : "";
  if (slotLink) return slotLink;
  if (booth?.booth_id) return `/expo/booths/${encodeURIComponent(booth.booth_id)}`;
  if (booth?.slug) return `/expo/booths/${encodeURIComponent(booth.slug)}`;
  return "#";
}

function mapExpoSlotToHomeSlot(
  slot: ExpoHomeSlotRow,
  boothMap: Record<string, BoothLite>
): HomeSlotWithLink {
  const booth = slot.booth_id ? boothMap[slot.booth_id] : undefined;

  const boothName =
    booth?.name ||
    booth?.title ||
    booth?.company_name ||
    slot.title ||
    "신규 입점 업체";

  const boothIntro =
    booth?.intro ||
    slot.subtitle ||
    slot.description ||
    "지금 확인하세요";

  return {
    ...(slot as unknown as HomeSlot),
    section_key: normalizeSlotSection(slot),
    title: slot.title || boothName,
    subtitle: slot.subtitle || boothIntro,
    description: slot.description || boothIntro,
    image_url: slot.image_url || null,
    link_url: buildBoothLink(booth, slot),
    badge: slot.badge || "NEW",
    meta_1: slot.meta_1 || booth?.category_primary || null,
    meta_2: slot.meta_2 || booth?.hall_code || null,
  };
}

function pickMainPrize(prizes: LivePrize[]) {
  if (!prizes.length) return null;
  return (
    prizes.find((p) => p.display_group === "big") ||
    prizes.find((p) => p.display_group === "general") ||
    [...prizes].sort(
      (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0)
    )[0]
  );
}

function addCacheBuster(url?: string | null) {
  if (!url) return "";
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${Date.now()}`;
}

async function getManagedLiveShowContent(
  supabase: ReturnType<typeof createSupabaseAdminClient>
) {
  const { data, error } = await supabase
    .from("expo_home_slots")
    .select("content")
    .eq("section_key", "live_show")
    .eq("is_active", true)
    .order("slot_order", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[expo/page] managed live_show query error:", error);
    return null;
  }

  return data?.content || null;
}

function buildCurrentLiveShow({
  event,
  prize,
  participantCount,
}: {
  event: LiveEvent | null;
  prize: LivePrize | null;
  participantCount: number;
}) {
  if (!event?.id) return null;

  const prizeTitle = prize?.title || event.prize_text || "오늘의 라이브 경품";
  const prizeQty = Number(prize?.quantity || prize?.total_winners || 0);

  return {
    id: event.id,
    event_id: event.id,
    section_key: "live_show",
    slot_type: "live_show",
    slot_order: 1,
    is_active: true,
    title: event.title || "K-Agri Expo 라이브 경품 이벤트",
    subtitle:
      event.subtitle ||
      prize?.product_price ||
      (prizeQty > 0 ? `${prizeTitle} ${prizeQty}명 무료 추첨` : "무료 추첨"),
    description:
      event.description ||
      prize?.description ||
      prize?.preview_note ||
      "사전 참여 후 방송 중 실시간 추첨을 통해 최종 당첨자를 선정합니다.",
    prize_text: event.prize_text || prizeTitle,
    prize_title: prizeTitle,
    featured_title: event.prize_text || prizeTitle,
    featured_desc:
      prize?.preview_note ||
      prize?.description ||
      event.description ||
      "현재 방송 중인 대표 경품입니다.",
    featured_video_url: event.video_url || prize?.video_url || "",
    video_url: event.video_url || prize?.video_url || "",
    image_url:
      event.image_url || (prize?.image_url ? addCacheBuster(prize.image_url) : ""),
    prize_image_url:
      event.image_url || (prize?.image_url ? addCacheBuster(prize.image_url) : ""),
    date_text:
      event.live_date_label ||
      (event.start_at || event.end_at ? "일정 확정" : "일정 준비중"),
    live_date_label:
      event.live_date_label ||
      (event.start_at || event.end_at ? "일정 확정" : "일정 준비중"),
    live_datetime: event.live_datetime || event.start_at || "",
    participant_label: event.participant_label || "참여 농가",
    participant_count_auto: participantCount,
    participant_threshold: event.participant_threshold || 50,
    participant_text: `참여 농가 ${participantCount.toLocaleString("ko-KR")}명`,
    cta_label: event.cta_label || "무료 추첨 참여하기",
    cta_link: event.cta_link || `/expo/live/join?event_id=${event.id}`,
    secondary_cta_label: event.secondary_cta_label || "제품 영상 보기",
    secondary_cta_link:
      event.secondary_cta_link || event.video_url || prize?.video_url || "/expo/live",
    sponsor_name: event.sponsor_name || prize?.sponsor || "K-Agri LIVE",
    partner_name: event.partner_name || "K-Agri Expo",
    sponsor_logo_url: event.sponsor_logo_url || "",
    partner_logo_url: event.partner_logo_url || "",
    sponsor_logo_size: event.sponsor_logo_size || 64,
    partner_logo_size: event.partner_logo_size || 42,
    main_image_scale: event.main_image_scale || 1.15,
    dday_font_size: event.dday_font_size || 54,
    participant_font_size: event.participant_font_size || 32,
    feature_1: event.feature_1 || "돌 많은 밭에서도 강력한 분쇄력",
    feature_2: event.feature_2 || "역회전 구조로 토양 깊이 파쇄",
    feature_3: event.feature_3 || "방송 중 실시간 당첨자 공개",
    feature_4: event.feature_4 || "전화 확인 후 최종 당첨 확정",
    meta_1: event.sponsor_name || prize?.sponsor || "K-Agri LIVE",
    meta_2: prize?.draw_type || "live",
    badge: "🔥 LIVE EVENT",
    event_badge: "🔥 LIVE EVENT",
    prize_id: prize?.id || null,
  };
}

function mergeManagedLiveShow({
  base,
  managed,
  participantCount,
}: {
  base: any;
  managed: any;
  participantCount: number;
}) {
  if (!base && !managed) return null;

  const participantLabel =
    managed?.participant_label || base?.participant_label || "참여 농가";

  const participantThreshold = Number(
    managed?.participant_threshold || base?.participant_threshold || 50
  );

  return {
    ...(base || {}),
    ...(managed || {}),
    event_badge:
      managed?.event_badge ||
      managed?.badge ||
      base?.event_badge ||
      base?.badge ||
      "🔥 LIVE EVENT",
    badge:
      managed?.event_badge ||
      managed?.badge ||
      base?.badge ||
      "🔥 LIVE EVENT",
    title: managed?.title || base?.title || "K-Agri Expo 라이브 경품 이벤트",
    subtitle: managed?.subtitle || base?.subtitle || "무료 추첨 이벤트",
    prize_text:
      managed?.prize_text ||
      base?.prize_text ||
      base?.prize_title ||
      base?.featured_title ||
      "오늘의 대표 경품",
    prize_title:
      managed?.prize_text ||
      managed?.prize_title ||
      base?.prize_title ||
      base?.featured_title ||
      "오늘의 대표 경품",
    description:
      managed?.description ||
      base?.description ||
      "사전 참여 후 방송 중 실시간 추첨을 통해 최종 당첨자를 선정합니다.",
    date_text:
      managed?.live_date_label ||
      managed?.date_text ||
      base?.date_text ||
      "일정 준비중",
    live_date_label:
      managed?.live_date_label ||
      managed?.date_text ||
      base?.live_date_label ||
      base?.date_text ||
      "일정 준비중",
    live_datetime: managed?.live_datetime || base?.live_datetime || "",
    participant_label: participantLabel,
    participant_count_auto: participantCount,
    participant_threshold: participantThreshold,
    participant_text: `${participantLabel} ${participantCount.toLocaleString("ko-KR")}명`,
    featured_title:
      managed?.featured_title ||
      managed?.prize_text ||
      base?.featured_title ||
      base?.prize_title ||
      "오늘의 대표 경품",
    featured_desc:
      managed?.featured_desc ||
      base?.featured_desc ||
      base?.description ||
      "현재 방송 중인 대표 경품입니다.",
    featured_video_url:
      managed?.featured_video_url ||
      managed?.video_url ||
      base?.featured_video_url ||
      base?.video_url ||
      "",
    video_url:
      managed?.video_url ||
      managed?.featured_video_url ||
      base?.video_url ||
      base?.featured_video_url ||
      "",
    image_url:
      managed?.image_url ||
      managed?.prize_image_url ||
      base?.image_url ||
      base?.prize_image_url ||
      "",
    prize_image_url:
      managed?.image_url ||
      managed?.prize_image_url ||
      base?.prize_image_url ||
      base?.image_url ||
      "",
    sponsor_logo_url:
      managed?.sponsor_logo_url ||
      managed?.brand_logo_url ||
      base?.sponsor_logo_url ||
      "",
    partner_logo_url:
      managed?.partner_logo_url ||
      managed?.ppl_logo_url ||
      base?.partner_logo_url ||
      "",
    sponsor_name:
      managed?.sponsor_name || base?.sponsor_name || base?.meta_1 || "",
    partner_name: managed?.partner_name || base?.partner_name || "K-Agri Expo",
    sponsor_logo_size:
      managed?.sponsor_logo_size || base?.sponsor_logo_size || 64,
    partner_logo_size:
      managed?.partner_logo_size || base?.partner_logo_size || 42,
    main_image_scale:
      managed?.main_image_scale || base?.main_image_scale || 1.15,
    dday_font_size: managed?.dday_font_size || base?.dday_font_size || 54,
    participant_font_size:
      managed?.participant_font_size || base?.participant_font_size || 32,
    feature_1:
      managed?.feature_1 ||
      base?.feature_1 ||
      "돌 많은 밭에서도 강력한 분쇄력",
    feature_2:
      managed?.feature_2 ||
      base?.feature_2 ||
      "역회전 구조로 토양 깊이 파쇄",
    feature_3:
      managed?.feature_3 ||
      base?.feature_3 ||
      "방송 중 실시간 당첨자 공개",
    feature_4:
      managed?.feature_4 ||
      base?.feature_4 ||
      "전화 확인 후 최종 당첨 확정",
    cta_label: managed?.cta_label || base?.cta_label || "무료 추첨 참여하기",
    cta_link: managed?.cta_link || base?.cta_link || "/expo/live/join",
    secondary_cta_label:
      managed?.secondary_cta_label || base?.secondary_cta_label || "제품 영상 보기",
    secondary_cta_link:
      managed?.secondary_cta_link ||
      managed?.video_url ||
      base?.secondary_cta_link ||
      base?.video_url ||
      "/expo/live",
    meta_1: managed?.sponsor_name || base?.meta_1 || "K-Agri LIVE",
    meta_2: base?.meta_2 || "live",
    event_id: base?.event_id || managed?.event_id || null,
    prize_id: base?.prize_id || managed?.prize_id || null,
  };
}

function PromoTypeLabel({ type }: { type?: string | null }) {
  const map: Record<string, string> = {
    live: "라이브 이벤트",
    giveaway: "무료 경품",
    sample: "샘플 증정",
    discount: "할인 행사",
    health: "건강식품",
    alert: "긴급 알림",
    special: "특별 기획",
  };

  return <>{map[String(type || "")] || "이벤트"}</>;
}

function ExpoPromotionsSection({
  promotions,
}: {
  promotions: ExpoPromotion[];
}) {
  if (!promotions.length) return null;

  const featured = promotions.find((item) => item.is_featured) || promotions[0];
  const cards = promotions.filter((item) => item.id !== featured.id);

  const featuredEmbed = toYoutubeEmbed(featured.video_url);
  const featuredMediaType = safe(featured.media_type, "image");
  const featuredImageScale = n(featured.image_scale, 1);

  return (
    <section className="expo-section" style={{ padding: "24px 20px 0" }}>
      <div
        className="expo-promotion-hero"
        style={{
          ...PROMO.hero,
          borderRadius: n(featured.card_radius, 36),
          padding: n(featured.card_padding, 30),
          background:
            featured.background ||
            "linear-gradient(135deg, #020617 0%, #0f2f52 48%, #065f46 100%)",
        }}
      >
        <div style={PROMO.left}>
          <div style={PROMO.badge}>
            {featured.badge || <PromoTypeLabel type={featured.promo_type} />}
          </div>

          <h2
            className="expo-promotion-title"
            style={{
              ...PROMO.title,
              fontSize: n(featured.title_size, 58),
              color: featured.title_color || "#ffffff",
            }}
          >
            {featured.title || "대표 이벤트"}
          </h2>

          {featured.subtitle ? (
            <div
              style={{
                ...PROMO.subtitle,
                fontSize: n(featured.subtitle_size, 30),
                color: featured.subtitle_color || "#111827",
              }}
            >
              {featured.subtitle}
            </div>
          ) : null}

          {featured.description ? (
            <p
              style={{
                ...PROMO.description,
                fontSize: n(featured.description_size, 17),
                color:
                  featured.description_color ||
                  "rgba(255,255,255,0.82)",
              }}
            >
              {featured.description}
            </p>
          ) : null}

          <a
            href={featured.button_link || "#"}
            style={{
              ...PROMO.mainButton,
              fontSize: n(featured.button_size, 22),
              background: featured.button_bg || "#facc15",
              color: featured.button_text_color || "#111827",
            }}
          >
            {featured.button_text || "이벤트 참여하기"}
          </a>
        </div>

        <div style={PROMO.media}>
          {featuredMediaType !== "image" && featuredEmbed ? (
            <iframe
              src={featuredEmbed}
              title={featured.title || "대표 이벤트"}
              allowFullScreen
              style={PROMO.video}
            />
          ) : featured.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featured.image_url}
              alt={featured.title || "대표 이벤트"}
              style={{
                ...PROMO.image,
                transform: `scale(${featuredImageScale})`,
              }}
            />
          ) : featuredEmbed ? (
            <iframe
              src={featuredEmbed}
              title={featured.title || "대표 이벤트"}
              allowFullScreen
              style={PROMO.video}
            />
          ) : (
            <div style={PROMO.empty}>대표 이벤트 이미지</div>
          )}
        </div>
      </div>

      {cards.length > 0 ? (
        <div style={PROMO.grid} className="expo-promotion-subgrid">
          {cards.map((item) => {
            const embed = toYoutubeEmbed(item.video_url);
            const mediaType = safe(item.media_type, "image");

            return (
              <a
                key={item.id}
                href={item.button_link || "#"}
                style={{
                  ...PROMO.card,
                  background: item.card_bg || "#ffffff",
                  borderRadius: n(item.card_radius_small, 26),
                }}
              >
                <div style={PROMO.cardBadge}>
                  {item.badge || <PromoTypeLabel type={item.promo_type} />}
                </div>

                <div style={PROMO.cardImageBox}>
                  {mediaType !== "image" && embed ? (
                    <iframe
                      src={embed}
                      title={item.title || "이벤트 영상"}
                      allowFullScreen
                      style={PROMO.cardVideo}
                    />
                  ) : item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image_url}
                      alt={item.title || "이벤트"}
                      style={{
                        ...PROMO.cardImage,
                        transform: `scale(${n(item.image_scale, 1)})`,
                      }}
                    />
                  ) : (
                    <div style={PROMO.cardEmpty}>이미지</div>
                  )}
                </div>

                <h3
                  style={{
                    ...PROMO.cardTitle,
                    fontSize: n(item.card_title_size, 24),
                  }}
                >
                  {item.title}
                </h3>

                {item.subtitle ? (
                  <p
                    style={{
                      ...PROMO.cardSubtitle,
                      fontSize: n(item.card_subtitle_size, 15),
                    }}
                  >
                    {item.subtitle}
                  </p>
                ) : null}

                <div
                  style={{
                    ...PROMO.cardButton,
                    background: item.card_button_bg || "#111827",
                    color: item.card_button_text_color || "#ffffff",
                  }}
                >
                  {item.button_text || "자세히 보기"}
                </div>
              </a>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default async function ExpoIndexPage() {
  const supabase = createSupabaseAdminClient();

  const [
    { data: slotRows, error: slotError },
    { data: cmsRows, error: cmsError },
    { data: currentEvent, error: currentEventError },
    { data: promotionRows, error: promotionError },
    autoHeroData,
    monthlyQuestions,
    hotIssues,
    monthlyProblemCards,
    problemSectionData,
    homeDeals,
    managedLiveContent,
  ] = await Promise.all([
    supabase
      .from("expo_home_slots")
      .select("*")
      .eq("is_active", true)
      .order("slot_order", { ascending: true }),

    supabase.from("cms_settings").select("*").eq("id", 1).limit(1),

    supabase
      .from("live_events")
      .select("*")
      .eq("status", "live")
      .order("locked_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<LiveEvent>(),

    supabase
      .from("expo_promotions")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    getAutoHeroData(),
    getMonthlyConsultQuestions(),
    getExpoHotIssues(),
    getMonthlyProblemCards(4),
    getExpoProblemSectionData(),
    getHomeDeals(),
    getManagedLiveShowContent(supabase),
  ]);

  if (slotError) console.error("[expo/page] expo_home_slots query error:", slotError);
  if (cmsError) console.error("[expo/page] cms_settings query error:", cmsError);
  if (currentEventError) console.error("[expo/page] live_events query error:", currentEventError);
  if (promotionError) console.error("[expo/page] expo_promotions query error:", promotionError);

  const eventIdForCount =
    currentEvent?.id || String((managedLiveContent as any)?.event_id || "").trim();

  const { data: currentPrizes, error: currentPrizesError } = currentEvent?.id
    ? await supabase
        .from("live_prizes")
        .select("*")
        .eq("event_id", currentEvent.id)
        .eq("is_active", true)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true })
    : { data: [] as LivePrize[], error: null };

  if (currentPrizesError) {
    console.error("[expo/page] live_prizes query error:", currentPrizesError);
  }

  const { count: participantCountRaw, error: participantCountError } =
    eventIdForCount
      ? await supabase
          .from("live_participants")
          .select("id", { count: "exact", head: true })
          .eq("event_id", eventIdForCount)
      : { count: 0, error: null };

  if (participantCountError) {
    console.error("[expo/page] live_participants count error:", participantCountError);
  }

  const participantCount = Number(participantCountRaw || 0);
  const rawSlotRows = (slotRows ?? []) as ExpoHomeSlotRow[];

  const boothIds = Array.from(
    new Set(rawSlotRows.map((row) => row.booth_id).filter((id): id is string => !!id))
  );

  let boothMap: Record<string, BoothLite> = {};

  if (boothIds.length > 0) {
    const { data: boothRows, error: boothError } = await supabase
      .from("booths")
      .select(`
        booth_id,
        name,
        title,
        slug,
        intro,
        company_name,
        website_url,
        youtube_url,
        brochure_url,
        category_primary,
        hall_code
      `)
      .in("booth_id", boothIds);

    if (boothError) {
      console.error("[expo/page] booths query error:", boothError);
    } else {
      boothMap = Object.fromEntries(
        ((boothRows ?? []) as BoothLite[]).map((booth) => [booth.booth_id, booth])
      );
    }
  }

  const mappedSlots: HomeSlotWithLink[] = rawSlotRows.map((slot) =>
    mapExpoSlotToHomeSlot(slot, boothMap)
  );

  const grouped = groupSlots(mappedSlots as HomeSlot[]);
  const cms = ((cmsRows ?? [])[0] || null) as CmsSettings | null;

  const hero = grouped.hero?.[0] ?? null;
  const slotLive = grouped.live_show?.[0] ?? null;

  const currentMainPrize = pickMainPrize((currentPrizes ?? []) as LivePrize[]);

  const currentLiveShow = buildCurrentLiveShow({
    event: (currentEvent ?? null) as LiveEvent | null,
    prize: currentMainPrize,
    participantCount,
  });

  const liveShow = mergeManagedLiveShow({
    base: currentLiveShow ?? slotLive ?? null,
    managed: managedLiveContent,
    participantCount,
  });

  const promotions = (promotionRows ?? []) as ExpoPromotion[];

  const autoNewProducts =
    grouped.new_products?.length > 0 ? grouped.new_products : grouped.featured ?? [];

  const heroMode =
    typeof (cms as any)?.hero_mode === "string"
      ? String((cms as any).hero_mode)
      : "manual";

  const useAutoHero = heroMode === "auto" && !!autoHeroData;

  const heroTitle = useAutoHero ? autoHeroData.title : "K-Agri 365 EXPO";
  const heroSubtitle = useAutoHero
    ? autoHeroData.subtitle
    : "농민을 위한 연중무휴 농업 엑스포";
  const heroDescription = useAutoHero
    ? autoHeroData.description
    : "지금 필요한 농자재 · 농사 상담 · 경품 · 특가를 한 번에";

  const problemContents =
    monthlyProblemCards.length > 0
      ? monthlyProblemCards.map((item) => ({
          id: item.id,
          title: item.title,
          link_url: item.link_url,
          summary: item.summary ?? "",
        }))
      : problemSectionData.contents;

  const monthlyQuestionItems = (monthlyQuestions ?? []).map((item: any) => ({
    title: item.title ?? item.question ?? item.label ?? "",
    description: item.description ?? item.summary ?? "",
    href: item.href ?? item.link_url ?? "#",
  }));

  return (
    <main style={S.page} className="expo-home">
      <style>{RESPONSIVE_CSS}</style>

      <ExpoTopBar />

      <ExpoHeroSection
        hero={hero}
        cms={cms}
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        heroDescription={heroDescription}
      />

      <JointGroupBuyBanner />


      <section className="expo-section" style={{ padding: "16px 20px 0" }}>
        <ExpoCategoryEntrySection />
      </section>

      <ExpoHotIssuesSection items={hotIssues} />

      {promotions.length > 0 ? (
  <ExpoPromotionHero
    item={promotions.find((item) => item.is_featured) || promotions[0]}
    mode="public"
  />
) : liveShow ? (
  <ExpoLiveSection item={liveShow as any} />
) : null}

      <ExpoDealsSection items={homeDeals} />

      <ExpoFarmerConsultSection questions={monthlyQuestionItems as any} />

      <ExpoProblemSection contents={problemContents as any} />

      <ExpoNewProductsSection items={autoNewProducts} />

      <ExpoFooter />
    </main>
  );
}

const PROMO: Record<string, React.CSSProperties> = {
  hero: {
    maxWidth: 1160,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 28,
    color: "#ffffff",
    boxShadow: "0 24px 70px rgba(15,23,42,0.18)",
  },

  left: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 0,
  },

  badge: {
    width: "fit-content",
    padding: "9px 15px",
    borderRadius: 999,
    background: "#16a34a",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 950,
  },

  title: {
    margin: "18px 0 0",
    lineHeight: 1.04,
    fontWeight: 950,
    letterSpacing: "-0.06em",
    wordBreak: "keep-all",
  },

  subtitle: {
    marginTop: 18,
    padding: "15px 18px",
    borderRadius: 18,
    background: "linear-gradient(135deg,#facc15,#f97316)",
    lineHeight: 1.2,
    fontWeight: 950,
    wordBreak: "keep-all",
  },

  description: {
    margin: "18px 0 0",
    lineHeight: 1.65,
    fontWeight: 750,
    wordBreak: "keep-all",
  },

  mainButton: {
    marginTop: 24,
    minHeight: 62,
    borderRadius: 18,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
  },

  media: {
    minHeight: 320,
    borderRadius: 28,
    overflow: "hidden",
    background: "#ffffff",
    display: "grid",
    placeItems: "center",
  },

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  video: {
    width: "100%",
    aspectRatio: "16 / 9",
    border: 0,
    display: "block",
  },

  empty: {
    color: "#64748b",
    fontWeight: 900,
  },

  grid: {
    maxWidth: 1160,
    margin: "18px auto 0",
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },

  card: {
    minHeight: 260,
    padding: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 32px rgba(15,23,42,0.06)",
    textDecoration: "none",
    color: "#111827",
    display: "flex",
    flexDirection: "column",
  },

  cardBadge: {
    width: "fit-content",
    padding: "7px 12px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    fontSize: 13,
    fontWeight: 950,
  },

  cardImageBox: {
    marginTop: 14,
    height: 140,
    borderRadius: 18,
    overflow: "hidden",
    background: "#f8fafc",
  },

  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  cardVideo: {
    width: "100%",
    height: "100%",
    border: 0,
    display: "block",
  },

  cardEmpty: {
    height: "100%",
    display: "grid",
    placeItems: "center",
    color: "#94a3b8",
    fontWeight: 900,
  },

  cardTitle: {
    margin: "15px 0 0",
    lineHeight: 1.2,
    fontWeight: 950,
    letterSpacing: "-0.04em",
    wordBreak: "keep-all",
  },

  cardSubtitle: {
    margin: "8px 0 0",
    color: "#4b5563",
    lineHeight: 1.5,
    fontWeight: 750,
    wordBreak: "keep-all",
  },

  cardButton: {
    marginTop: "auto",
    minHeight: 48,
    borderRadius: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: 950,
  },
};