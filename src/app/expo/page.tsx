import React from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

const RESPONSIVE_CSS = `
@media (max-width: 1200px) {
  .expo-new-grid,
  .expo-problem-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 1024px) {
  .expo-topbar {
    align-items: flex-start !important;
  }

  .expo-new-grid,
  .expo-problem-grid,
  .expo-solution-grid {
    grid-template-columns: 1fr !important;
  }
}

@media (max-width: 768px) {
  .expo-section {
    padding: 18px 14px 0 !important;
  }

  .expo-topbar {
    padding: 16px 14px 8px !important;
    flex-direction: column !important;
    align-items: stretch !important;
  }

  .expo-header-right,
  .expo-top-actions {
    width: 100% !important;
    justify-content: flex-start !important;
  }

  .expo-top-actions {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 10px !important;
  }

  .expo-hero-wrap {
    padding: 18px 14px 0 !important;
  }

  .expo-hero-card {
    padding: 22px 18px !important;
    border-radius: 24px !important;
  }

  .expo-hero-buttons,
  .expo-promo-buttons {
    flex-direction: column !important;
    align-items: stretch !important;
  }

  .expo-hero-buttons a,
  .expo-promo-buttons a {
    width: 100% !important;
    box-sizing: border-box !important;
    text-align: center !important;
  }

  .expo-hero-media {
    min-height: 220px !important;
    border-radius: 22px !important;
  }

  .expo-section-head {
    align-items: flex-start !important;
  }

  .expo-new-grid,
  .expo-problem-grid,
  .expo-solution-grid,
  .expo-ai-input-wrap {
    grid-template-columns: 1fr !important;
  }

  .expo-logo-row {
    overflow-x: auto !important;
    flex-wrap: nowrap !important;
    padding-bottom: 4px !important;
  }

  .expo-logo-row a {
    flex: 0 0 auto !important;
  }

  .expo-footer {
    padding: 18px 14px 28px !important;
    flex-direction: column !important;
    align-items: flex-start !important;
  }
}

@media (max-width: 480px) {
  .expo-hero-card {
    padding: 18px 14px !important;
  }

  .expo-promo-card {
    padding: 20px 16px !important;
    border-radius: 24px !important;
  }

  .expo-problem-card,
  .expo-ai-card,
  .expo-new-card {
    padding: 18px 14px !important;
    border-radius: 22px !important;
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

export default async function ExpoIndexPage() {
  const supabase = await createSupabaseServerClient();

  const [
    { data: slotRows },
    { data: cmsRows },
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
      .order("section_key", { ascending: true })
      .order("slot_order", { ascending: true }),
    supabase.from("cms_settings").select("*").eq("id", 1).limit(1),
    getAutoHeroData(),
    getMonthlyConsultQuestions(),
    getExpoHotIssues(),
    getMonthlyProblemCards(4),
    getExpoProblemSectionData(),
    getHomeDeals(),
  ]);

  const slots = (slotRows ?? []) as HomeSlot[];
  const grouped = groupSlots(slots);
  const cms = ((cmsRows ?? [])[0] || null) as CmsSettings | null;

  const hero = grouped.hero?.[0] ?? null;
  const liveShow = grouped.live_show?.[0] ?? null;
  const newProducts = grouped.new_products ?? [];

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

      <section className="expo-section" style={{ padding: "18px 20px 0" }}>
        <ExpoCategoryEntrySection />
      </section>

      <ExpoHotIssuesSection items={hotIssues} />

      <ExpoLiveSection item={liveShow} />

      <ExpoDealsSection items={homeDeals} />

      <ExpoFarmerConsultSection questions={monthlyQuestionItems as any} />

      <ExpoProblemSection contents={problemContents as any} />

      <ExpoNewProductsSection items={newProducts} />

      <ExpoFooter />
    </main>
  );
}