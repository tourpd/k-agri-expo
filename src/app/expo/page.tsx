import React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAutoHeroData } from "@/lib/expo/hero-auto";
import { getMonthlyConsultQuestions } from "@/lib/expo/consult-queries";
import { getExpoHotIssues } from "@/lib/expo/hot-issues";
import { getMonthlyProblemCards } from "@/lib/expo/problem-cards";
import { getExpoProblemSectionData } from "@/lib/expo/problem-queries";
import { getHomeDeals } from "@/lib/expo/home-deals";

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

const RESPONSIVE_CSS = `
/* =========================
   기본 공통
========================= */
.expo-home * {
  box-sizing: border-box;
}

.expo-home img,
.expo-home iframe,
.expo-home video {
  max-width: 100%;
  height: auto;
}

.expo-home a,
.expo-home button {
  -webkit-tap-highlight-color: transparent;
}

.expo-home {
  overflow-x: hidden;
}

.expo-home section {
  scroll-margin-top: 84px;
}

/* =========================
   Desktop / Tablet
========================= */
@media (max-width: 1280px) {
  .expo-new-grid,
  .expo-problem-grid,
  .expo-solution-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

/* =========================
   Tablet
========================= */
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

  .expo-logo-row {
    overflow-x: auto !important;
    flex-wrap: nowrap !important;
    gap: 10px !important;
    padding-bottom: 6px !important;
    scrollbar-width: none;
  }

  .expo-logo-row::-webkit-scrollbar {
    display: none;
  }

  .expo-logo-row a {
    flex: 0 0 auto !important;
  }
}

/* =========================
   Mobile main
========================= */
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
    box-sizing: border-box !important;
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

  .expo-hero-card h2,
  .expo-hero-card .expo-hero-subtitle {
    font-size: clamp(22px, 6vw, 30px) !important;
    line-height: 1.2 !important;
  }

  .expo-hero-card p,
  .expo-promo-card p,
  .expo-live-card p,
  .expo-ai-card p {
    font-size: 14px !important;
    line-height: 1.7 !important;
  }

  .expo-hero-buttons,
  .expo-promo-buttons {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 8px !important;
    width: 100% !important;
  }

  .expo-hero-buttons a,
  .expo-promo-buttons a {
    width: 100% !important;
    min-height: 46px !important;
    padding: 12px 10px !important;
    text-align: center !important;
    justify-content: center !important;
    font-size: 14px !important;
    border-radius: 14px !important;
    box-sizing: border-box !important;
  }

  .expo-hero-media {
    min-height: 180px !important;
    border-radius: 18px !important;
  }

  .expo-section-head {
    align-items: flex-start !important;
    gap: 8px !important;
  }

  .expo-section-head h2,
  .expo-section-title {
    font-size: clamp(28px, 7vw, 38px) !important;
    line-height: 1.15 !important;
    letter-spacing: -0.03em !important;
  }

  .expo-section-head p,
  .expo-section-desc {
    font-size: 13px !important;
    line-height: 1.7 !important;
  }

  .expo-category-grid,
  .expo-entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
  }

  .expo-category-card,
  .expo-entry-card {
    min-height: 168px !important;
    padding: 14px 12px !important;
    border-radius: 18px !important;
  }

  .expo-category-card h3,
  .expo-entry-card h3 {
    font-size: 15px !important;
    line-height: 1.35 !important;
  }

  .expo-category-card p,
  .expo-entry-card p {
    font-size: 12px !important;
    line-height: 1.55 !important;
  }

  .expo-hotissues-wrap,
  .expo-live-wrap,
  .expo-deals-wrap,
  .expo-ai-wrap,
  .expo-problem-wrap,
  .expo-new-wrap {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }

  .expo-problem-grid,
  .expo-new-grid,
  .expo-solution-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 10px !important;
  }

  .expo-problem-card,
  .expo-ai-card,
  .expo-new-card {
    padding: 16px 14px !important;
    border-radius: 18px !important;
  }

  .expo-live-card,
  .expo-promo-card {
    padding: 18px 16px !important;
    border-radius: 22px !important;
  }

  .expo-live-main,
  .expo-live-grid,
  .expo-ai-input-wrap {
    grid-template-columns: 1fr !important;
  }

  .expo-live-video,
  .expo-video-frame,
  .expo-youtube-wrap {
    min-height: 220px !important;
    border-radius: 18px !important;
  }

  .expo-deal-grid {
    grid-template-columns: 1fr !important;
    gap: 12px !important;
  }

  .expo-footer {
    padding: 20px 12px 28px !important;
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 10px !important;
  }
}

/* =========================
   Small mobile
========================= */
@media (max-width: 560px) {
  .expo-hero-buttons,
  .expo-promo-buttons {
    grid-template-columns: 1fr !important;
  }

  .expo-category-grid,
  .expo-entry-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }

  .expo-category-card,
  .expo-entry-card {
    min-height: 156px !important;
    padding: 12px 10px !important;
  }

  .expo-problem-grid,
  .expo-new-grid,
  .expo-solution-grid {
    grid-template-columns: 1fr !important;
  }
}

/* =========================
   Very small mobile
========================= */
@media (max-width: 390px) {
  .expo-section {
    padding-left: 10px !important;
    padding-right: 10px !important;
  }

  .expo-hero-wrap {
    padding-left: 10px !important;
    padding-right: 10px !important;
  }

  .expo-hero-card {
    padding: 16px 14px !important;
  }

  .expo-topbar {
    padding-left: 10px !important;
    padding-right: 10px !important;
  }

  .expo-category-grid,
  .expo-entry-grid {
    gap: 8px !important;
  }

  .expo-category-card,
  .expo-entry-card {
    min-height: 148px !important;
    border-radius: 16px !important;
  }

  .expo-category-card h3,
  .expo-entry-card h3 {
    font-size: 14px !important;
  }

  .expo-category-card p,
  .expo-entry-card p {
    font-size: 11px !important;
  }

  .expo-live-card,
  .expo-promo-card,
  .expo-problem-card,
  .expo-ai-card,
  .expo-new-card {
    border-radius: 18px !important;
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

type ExpoHomeSlotRow = {
  id: string;
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

type HomeSlotWithLink = HomeSlot & {
  link_url?: string | null;
  badge?: string | null;
  meta_1?: string | null;
  meta_2?: string | null;
};

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

  if (booth?.booth_id) {
    return `/expo/booths/${encodeURIComponent(booth.booth_id)}`;
  }

  if (booth?.slug) {
    return `/expo/booths/${encodeURIComponent(booth.slug)}`;
  }

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

export default async function ExpoIndexPage() {
  const supabase = createSupabaseAdminClient();

  const [
    { data: slotRows, error: slotError },
    { data: cmsRows, error: cmsError },
    autoHeroData,
    monthlyQuestions,
    hotIssues,
    monthlyProblemCards,
    problemSectionData,
    homeDeals,
  ] = await Promise.all([
    supabase
      .from("expo_home_slots")
      .select("*")
      .eq("is_active", true)
      .order("slot_order", { ascending: true }),
    supabase.from("cms_settings").select("*").eq("id", 1).limit(1),
    getAutoHeroData(),
    getMonthlyConsultQuestions(),
    getExpoHotIssues(),
    getMonthlyProblemCards(4),
    getExpoProblemSectionData(),
    getHomeDeals(),
  ]);

  if (slotError) {
    console.error("[expo/page] expo_home_slots query error:", slotError);
  }

  if (cmsError) {
    console.error("[expo/page] cms_settings query error:", cmsError);
  }

  const rawSlotRows = (slotRows ?? []) as ExpoHomeSlotRow[];

  const boothIds = Array.from(
    new Set(
      rawSlotRows
        .map((row) => row.booth_id)
        .filter((id): id is string => !!id)
    )
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
  const liveShow = grouped.live_show?.[0] ?? null;

  const autoNewProducts =
    grouped.new_products?.length > 0
      ? grouped.new_products
      : grouped.featured ?? [];

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

      <section className="expo-section" style={{ padding: "16px 20px 0" }}>
        <ExpoCategoryEntrySection />
      </section>

      <ExpoHotIssuesSection items={hotIssues} />

      <ExpoLiveSection item={liveShow} />

      <ExpoDealsSection items={homeDeals} />

      <ExpoFarmerConsultSection questions={monthlyQuestionItems as any} />

      <ExpoProblemSection contents={problemContents as any} />

      <ExpoNewProductsSection items={autoNewProducts} />

      <ExpoFooter />
    </main>
  );
}