import React from "react";
import Link from "next/link";
import { getPublicBooths } from "@/lib/expoPublic";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import BillboardBoard from "@/components/expo/BillboardBoard";
import PhotoDoctorBanner from "@/components/expo/PhotoDoctorBanner";

export const dynamic = "force-dynamic";

type HomeSlot = {
  id: string;
  section_key: string;
  slot_order: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  badge_text: string | null;
  button_text: string | null;
  link_type: string | null;
  link_value: string | null;
  price_text: string | null;
  stock_text: string | null;
  event_text: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

type CmsSettings = {
  id: number;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_button_text: string | null;
  hero_button_link: string | null;
  hero_secondary_button_text: string | null;
  hero_secondary_button_link: string | null;
  hero_video_url: string | null;
};

function safeText(v: unknown, fallback: string) {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

function resolveLink(linkType?: string | null, linkValue?: string | null) {
  const type = safeText(linkType, "custom");
  const value = safeText(linkValue, "");

  switch (type) {
    case "booth":
      return value ? `/expo/booths/${value}` : "/expo/booths";
    case "hall":
      return value ? `/expo/hall/${value}` : "/expo";
    case "event":
      return value || "/expo/event";
    case "live":
      return value || "/expo/live";
    case "external":
      return value || "/expo";
    case "custom":
    default:
      return value || "/expo";
  }
}

function isExternalLink(linkType?: string | null, linkValue?: string | null) {
  return safeText(linkType, "") === "external" && !!safeText(linkValue, "");
}

function groupSlots(slots: HomeSlot[]) {
  const grouped: Record<string, HomeSlot[]> = {};

  for (const slot of slots) {
    if (!slot.is_active) continue;
    if (!grouped[slot.section_key]) grouped[slot.section_key] = [];
    grouped[slot.section_key].push(slot);
  }

  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0));
  }

  return grouped;
}

function toEmbedUrl(url?: string | null) {
  const value = safeText(url, "");
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

function HeroMedia({
  imageUrl,
  videoUrl,
  title,
}: {
  imageUrl?: string | null;
  videoUrl?: string | null;
  title: string;
}) {
  const embedUrl = toEmbedUrl(videoUrl);
  const image = safeText(imageUrl, "");

  if (embedUrl) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        style={S.heroIframe}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    );
  }

  const video = safeText(videoUrl, "");
  if (video) {
    return (
      <video
        src={video}
        autoPlay
        muted
        loop
        playsInline
        poster={image || undefined}
        style={S.heroVideo}
      />
    );
  }

  if (image) {
    return <img src={image} alt={title} style={S.heroImage} />;
  }

  return <div style={S.heroEmpty}>대표 이미지/영상이 아직 등록되지 않았습니다.</div>;
}

function ActionLink({
  href,
  external,
  style,
  children,
}: {
  href: string;
  external: boolean;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" style={style}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} style={style}>
      {children}
    </Link>
  );
}

const RESPONSIVE_CSS = `
@media (max-width: 1200px) {
  .expo-booth-grid,
  .expo-new-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
}

@media (max-width: 1024px) {
  .expo-topbar {
    align-items: flex-start !important;
  }

  .expo-booth-grid,
  .expo-new-grid,
  .expo-problem-grid {
    grid-template-columns: 1fr !important;
  }

  .expo-solution-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
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

  .expo-booth-grid,
  .expo-new-grid,
  .expo-problem-grid,
  .expo-solution-grid {
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

  .expo-ai-input-wrap {
    grid-template-columns: 1fr !important;
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
  .expo-booth-card,
  .expo-new-card {
    padding: 18px 14px !important;
    border-radius: 22px !important;
  }
}
`;

export default async function ExpoIndexPage() {
  const supabase = await createSupabaseServerClient();

  let booths: any[] = [];
  try {
    booths = await getPublicBooths({ limit: 8 });
  } catch {
    booths = [];
  }

  const [{ data: slotRows }, { data: cmsRows }] = await Promise.all([
    supabase
      .from("expo_home_slots")
      .select("*")
      .eq("is_active", true)
      .order("section_key", { ascending: true })
      .order("slot_order", { ascending: true }),
    supabase.from("cms_settings").select("*").eq("id", 1).limit(1),
  ]);

  const slots = (slotRows ?? []) as HomeSlot[];
  const grouped = groupSlots(slots);
  const cms = ((cmsRows ?? [])[0] || null) as CmsSettings | null;

  const hero = grouped.hero?.[0] ?? null;
  const mainEvent = grouped.main_event?.[0] ?? null;
  const liveShow = grouped.live_show?.[0] ?? null;
  const newProducts = grouped.new_products ?? [];

  const problemPosts = [
    "3월에 심으면 망하는 작물 5가지",
    "월동작물에 추비 대신 해야 안 망하는 법",
    "고추 농사 망치는 실수 TOP5",
    "총채벌레 방제 타이밍 놓치면 생기는 일",
  ];

  const solutionButtons = ["총채벌레 해결", "노균병 해결", "비대 불량 해결"];

  const heroHref = safeText(cms?.hero_button_link, "")
    ? safeText(cms?.hero_button_link, "/expo/event")
    : resolveLink(hero?.link_type, hero?.link_value);
  const heroExternal =
    safeText(cms?.hero_button_link, "").startsWith("http") ||
    isExternalLink(hero?.link_type, hero?.link_value);

  const heroSecondaryHref = safeText(cms?.hero_secondary_button_link, "/expo/live");
  const heroSecondaryExternal = safeText(cms?.hero_secondary_button_link, "").startsWith("http");

  const mainEventHref = resolveLink(mainEvent?.link_type, mainEvent?.link_value);
  const mainEventExternal = isExternalLink(mainEvent?.link_type, mainEvent?.link_value);

  const liveHref = resolveLink(liveShow?.link_type, liveShow?.link_value);
  const liveExternal = isExternalLink(liveShow?.link_type, liveShow?.link_value);

  const heroTitle = safeText(
    cms?.hero_title,
    safeText(hero?.title, "대한민국 농업 온라인 박람회")
  );
  const heroSubtitle = safeText(
    cms?.hero_subtitle,
    safeText(
      hero?.subtitle,
      "뉴스 · 전시관 · AI 상담 · 부스 · 글로벌 바이어 연결이 하나로 이어지는 농업 플랫폼"
    )
  );

  const cmsHeroVideoUrl = safeText(cms?.hero_video_url, "");

  return (
    <main style={S.page} className="expo-home">
      <style>{RESPONSIVE_CSS}</style>

      <header style={S.topBar} className="expo-topbar">
        <Link href="/expo" style={S.brandWrap}>
          <div style={S.brandLogo}>K</div>
          <div>
            <div style={S.brandTitle}>K-Agri Expo</div>
            <div style={S.brandSub}>대한민국 농업 온라인 박람회</div>
          </div>
        </Link>

        <div style={S.headerRight} className="expo-header-right">
          <div style={S.topActions} className="expo-top-actions">
            <Link href="/login/farmer" style={S.loginFarmer}>
              👨‍🌾 농민 로그인
            </Link>
            <Link href="/login/buyer" style={S.loginBuyer}>
              🤝 바이어 로그인
            </Link>
            <Link href="/login/vendor" style={S.loginVendor}>
              🏢 기업 참가
            </Link>
          </div>

          <Link href="/admin-login" style={S.adminMiniLink}>
            운영자 로그인
          </Link>
        </div>
      </header>

      <section style={S.heroSingleWrap} className="expo-hero-wrap expo-section">
        <div style={S.heroLeftSingle} className="expo-hero-card">
          <div style={S.heroBadge}>
            {safeText(hero?.badge_text, "K-AGRI EXPO 2026")}
          </div>

          <div style={S.heroSmall}>{heroSubtitle}</div>

          <h1 style={S.heroTitle}>{heroTitle}</h1>

          <p style={S.heroDesc}>
            {safeText(
              hero?.description,
              "농민은 필요한 정보를 찾고, 기업은 부스를 운영하고, 바이어는 한국 농업 기술과 제품을 만나는 온라인 엑스포입니다."
            )}
          </p>

          <div style={S.heroButtons} className="expo-hero-buttons">
            <ActionLink href={heroHref} external={heroExternal} style={S.heroBtnPrimary}>
              {safeText(cms?.hero_button_text, safeText(hero?.button_text, "이벤트 참여하기"))} →
            </ActionLink>

            {heroSecondaryExternal ? (
              <a
                href={heroSecondaryHref}
                target="_blank"
                rel="noreferrer"
                style={S.heroBtnGhost}
              >
                {safeText(cms?.hero_secondary_button_text, "라이브 일정 보기")}
              </a>
            ) : (
              <Link href={heroSecondaryHref} style={S.heroBtnGhost}>
                {safeText(cms?.hero_secondary_button_text, "라이브 일정 보기")}
              </Link>
            )}

            <Link href="/login/vendor" style={S.heroBtnGhost}>
              기업 입점하기
            </Link>
          </div>
        </div>
      </section>

      <section style={S.sectionWrap} className="expo-section">
        <div style={S.heroMediaSingle} className="expo-hero-media">
          <img
            src="/images/expo-hero.png"
            alt="K-Agri Expo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      </section>

      <section id="event" style={S.sectionWrap} className="expo-section">
        <div style={S.promoCardWarmFull} className="expo-promo-card">
          <div style={S.promoBadge}>
            {safeText(mainEvent?.badge_text, "🎁 이달의 경품 이벤트")}
          </div>
          <h2 style={S.promoTitleFull}>
            {safeText(mainEvent?.title, "이달의 경품 이벤트")}
          </h2>
          <div style={S.promoPriceFull}>
            {safeText(mainEvent?.price_text, "참여만 해도 혜택")}
          </div>
          <p style={S.promoDescFull}>
            {safeText(
              mainEvent?.description,
              "경품 이벤트는 메인의 관심을 끌고, 참여를 유도하는 대표 진입 장치입니다."
            )}
          </p>
          <div style={S.promoButtons} className="expo-promo-buttons">
            <ActionLink href={mainEventHref} external={mainEventExternal} style={S.promoBtnPrimary}>
              {safeText(mainEvent?.button_text, "이벤트 참여하기")} →
            </ActionLink>
          </div>
        </div>
      </section>

      <section id="live" style={S.sectionWrap} className="expo-section">
        <div style={S.promoCardCoolFull} className="expo-promo-card">
          <div style={S.promoBadge}>
            {safeText(liveShow?.badge_text, "📺 MONTHLY LIVE SHOW")}
          </div>
          <h2 style={S.promoTitleFull}>
            {safeText(liveShow?.title, "K-Agri 월간 라이브쇼")}
          </h2>
          <p style={S.promoDescFull}>
            {safeText(
              liveShow?.description,
              "신제품 발표, 농민 퀴즈, 경품 추첨, 참여 기업 홍보가 한 번에 연결되는 라이브 프로그램입니다."
            )}
          </p>
          <div style={S.promoButtons} className="expo-promo-buttons">
            <ActionLink href={liveHref} external={liveExternal} style={S.promoBtnPrimary}>
              {safeText(liveShow?.button_text, "라이브 일정 보기")} →
            </ActionLink>
          </div>
        </div>
      </section>

      <section id="booths" style={S.sectionWrap} className="expo-section">
        <div style={S.sectionHead} className="expo-section-head">
          <div>
            <div style={S.sectionEyebrow}>EXHIBITORS</div>
            <h2 style={S.sectionTitle}>🏢 참가기업 부스</h2>
            <div style={S.sectionDesc}>
              온라인 박람회에 참가한 주요 기업과 대표 부스를 한눈에 확인하세요.
            </div>
          </div>
          <Link href="/expo/booths" style={S.moreLink}>
            전체 보기 →
          </Link>
        </div>

        <div style={S.logoRow} className="expo-logo-row">
          {booths.slice(0, 8).map((b: any) => {
            const name = safeText(b?.name, "부스");
            return (
              <Link
                key={String(b.booth_id)}
                href={`/expo/booths/${String(b.booth_id)}`}
                style={S.logoChip}
              >
                {name}
              </Link>
            );
          })}
        </div>

        <div style={S.boothFeatureGrid} className="expo-booth-grid">
          {booths.length === 0 ? (
            <div style={S.emptyBox}>아직 참가 부스가 없습니다.</div>
          ) : (
            booths.slice(0, 3).map((b: any) => {
              const boothId = String(b.booth_id);
              const name = safeText(b?.name, "부스");
              const region = safeText(b?.region, "지역 미입력");
              const cat = safeText(b?.category_primary, "카테고리 미입력");
              const intro = safeText(b?.intro, "소개가 아직 없습니다.");

              return (
                <Link
                  key={boothId}
                  href={`/expo/booths/${boothId}`}
                  style={S.boothFeatureCard}
                  className="expo-booth-card"
                >
                  <div style={S.boothHead}>
                    <div style={S.boothAvatar}>{name.slice(0, 1)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={S.boothName}>{name}</div>
                      <div style={S.boothMeta}>
                        {region} · {cat}
                      </div>
                    </div>
                  </div>
                  <div style={S.boothIntro}>{intro}</div>
                  <div style={S.boothCta}>부스 보기 →</div>
                </Link>
              );
            })
          )}
        </div>
      </section>

      <section id="billboard" style={S.sectionWrap} className="expo-section">
        <BillboardBoard />
      </section>

      <section id="new-products" style={S.sectionWrap} className="expo-section">
        <div style={S.sectionHead} className="expo-section-head">
          <div>
            <div style={S.sectionEyebrow}>NEW PRODUCTS SPOTLIGHT</div>
            <h2 style={S.sectionTitle}>⭐ 이달의 신제품</h2>
            <div style={S.sectionDesc}>
              메인에서는 과한 판매보다 박람회다운 신제품 소개 중심으로 노출합니다.
            </div>
          </div>
          <Link href="/expo/hall/new-products" style={S.moreLink}>
            전체 보기 →
          </Link>
        </div>

        <div style={S.newProductsGrid} className="expo-new-grid">
          {newProducts.length === 0 ? (
            <>
              <div style={S.newProductCard} className="expo-new-card">
                <div style={S.newProductBadge}>NEW</div>
                <div style={S.newProductTitle}>싹쓰리충 골드</div>
                <div style={S.newProductDesc}>친환경 해충 방제 솔루션</div>
                <Link href="/expo/hall/new-products" style={S.newProductBtn}>
                  자세히 보기 →
                </Link>
              </div>
              <div style={S.newProductCard} className="expo-new-card">
                <div style={S.newProductBadge}>NEW</div>
                <div style={S.newProductTitle}>메가파워칼</div>
                <div style={S.newProductDesc}>비대기 집중 관리용 고칼륨 자재</div>
                <Link href="/expo/hall/new-products" style={S.newProductBtn}>
                  자세히 보기 →
                </Link>
              </div>
              <div style={S.newProductCard} className="expo-new-card">
                <div style={S.newProductBadge}>NEW</div>
                <div style={S.newProductTitle}>신형 농업 장비</div>
                <div style={S.newProductDesc}>현장 효율을 높이는 신규 전시 품목</div>
                <Link href="/expo/hall/new-products" style={S.newProductBtn}>
                  자세히 보기 →
                </Link>
              </div>
            </>
          ) : (
            newProducts.map((item) => {
              const href = resolveLink(item.link_type, item.link_value);
              const external = isExternalLink(item.link_type, item.link_value);

              return (
                <ActionLink
                  key={item.id}
                  href={href}
                  external={external}
                  style={S.newProductCard}
                >
                  <div style={S.newProductBadge}>{safeText(item.badge_text, "NEW")}</div>
                  <div style={S.newProductTitle}>{safeText(item.title, "이달의 신제품")}</div>
                  <div style={S.newProductDesc}>
                    {safeText(
                      item.description || item.subtitle,
                      "신제품 설명이 아직 등록되지 않았습니다."
                    )}
                  </div>
                  <div style={S.newProductBtn}>
                    {safeText(item.button_text, "자세히 보기")} →
                  </div>
                </ActionLink>
              );
            })
          )}
        </div>
      </section>

      <section style={S.sectionWrap} className="expo-section">
        <div style={S.problemGrid} className="expo-problem-grid">
          <div style={S.problemCard} className="expo-problem-card">
            <div style={S.sectionEyebrow}>FARMER PROBLEM SEARCH</div>
            <h2 style={S.sectionTitle}>🧠 농민 고민 해결</h2>
            <div style={S.sectionDesc}>
              검색형 콘텐츠로 먼저 끌고 들어와 문제를 설명하고, 영상과 상담으로 연결합니다.
            </div>

            <div style={S.problemList}>
              {problemPosts.map((item) => (
                <Link key={item} href="/problems" style={S.problemItem}>
                  <span>{item}</span>
                  <span>→</span>
                </Link>
              ))}
            </div>
          </div>

          <div style={S.aiCard} className="expo-ai-card">
            <div style={S.sectionEyebrow}>AI SALES CONSULT</div>
            <h2 style={S.sectionTitle}>📞 농사 AI 상담</h2>
            <div style={S.sectionDesc}>
              농민의 말을 먼저 듣고 작물, 지역, 평수, 노지/시설, 현재 문제를 파악한 뒤
              방제량, 비료 치는 법, 성분과 효과까지 설명하고 관련 제품과 부스로 연결합니다.
            </div>

            <div style={S.aiInputWrap} className="expo-ai-input-wrap">
              <input style={S.aiInput} placeholder="예: 고추 / 총채벌레 / 300평 / 노지" />
              <button style={S.aiBtn}>상담 시작</button>
            </div>

            <div style={S.solutionGrid} className="expo-solution-grid">
              {solutionButtons.map((item) => (
                <button key={item} style={S.solutionBtn}>
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ ...S.sectionWrap, paddingBottom: 24 }} className="expo-section">
        <PhotoDoctorBanner />
      </section>

      <footer style={S.footer} className="expo-footer">
        <div>© 2026 K-Agri Expo</div>
        <Link href="/admin-login" style={S.adminFooterLink}>
          운영자 로그인
        </Link>
      </footer>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    color: "#0f172a",
  },

  topBar: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "22px 24px 10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
  brandWrap: {
    textDecoration: "none",
    color: "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  brandLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    background: "linear-gradient(135deg, #16a34a 0%, #0f766e 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: 950,
    letterSpacing: -0.4,
  },
  brandSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#64748b",
  },

  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  topActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
  },
  loginFarmer: {
    textDecoration: "none",
    color: "#fff",
    background: "#16a34a",
    padding: "12px 16px",
    borderRadius: 999,
    fontWeight: 950,
  },
  loginBuyer: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e2e8f0",
    padding: "12px 16px",
    borderRadius: 999,
    fontWeight: 900,
  },
  loginVendor: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e2e8f0",
    padding: "12px 16px",
    borderRadius: 999,
    fontWeight: 900,
  },
  adminMiniLink: {
    textDecoration: "none",
    color: "#64748b",
    fontSize: 13,
    fontWeight: 800,
  },

  heroSingleWrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "18px 24px 0",
  },
  heroLeftSingle: {
    borderRadius: 36,
    padding: 38,
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 46%, #166534 100%)",
    color: "#fff",
  },
  heroBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.14)",
    fontSize: 12,
    fontWeight: 950,
  },
  heroSmall: {
    marginTop: 18,
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: 800,
    whiteSpace: "pre-line",
  },
  heroTitle: {
    margin: "18px 0 0",
    fontSize: "clamp(34px, 7vw, 54px)",
    lineHeight: 1.08,
    fontWeight: 950,
    letterSpacing: -1.2,
    whiteSpace: "pre-line",
  },
  heroDesc: {
    marginTop: 20,
    fontSize: 18,
    lineHeight: 1.9,
    color: "rgba(255,255,255,0.9)",
    maxWidth: 820,
    whiteSpace: "pre-line",
  },
  heroButtons: {
    marginTop: 28,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  heroBtnPrimary: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "15px 18px",
    borderRadius: 16,
    fontWeight: 950,
  },
  heroBtnGhost: {
    textDecoration: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: "15px 18px",
    borderRadius: 16,
    fontWeight: 900,
    border: "1px solid rgba(255,255,255,0.14)",
  },

  sectionWrap: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "28px 24px 0",
  },

  heroMediaSingle: {
    minHeight: 380,
    borderRadius: 36,
    overflow: "hidden",
    background: "#e2e8f0",
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  heroVideo: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  heroIframe: {
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
    aspectRatio: "16 / 9",
  },
  heroEmpty: {
    width: "100%",
    height: "100%",
    minHeight: 380,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    background: "#e2e8f0",
    fontSize: 18,
    textAlign: "center",
    padding: 20,
  },

  promoCardWarmFull: {
    borderRadius: 34,
    padding: 30,
    background: "linear-gradient(135deg, #111827 0%, #1f2937 55%, #9a3412 100%)",
    color: "#fff",
  },
  promoCardCoolFull: {
    borderRadius: 34,
    padding: 30,
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 55%, #0f766e 100%)",
    color: "#fff",
  },
  promoBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: 12,
    fontWeight: 950,
  },
  promoTitleFull: {
    margin: "18px 0 0",
    fontSize: "clamp(28px, 6vw, 42px)",
    lineHeight: 1.08,
    fontWeight: 950,
    letterSpacing: -1,
  },
  promoPriceFull: {
    marginTop: 14,
    fontSize: "clamp(24px, 5vw, 34px)",
    fontWeight: 950,
    color: "#fde68a",
  },
  promoDescFull: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 1.9,
    color: "rgba(255,255,255,0.9)",
    maxWidth: 960,
  },
  promoButtons: {
    marginTop: 24,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  promoBtnPrimary: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    padding: "14px 18px",
    borderRadius: 16,
    fontWeight: 950,
  },

  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  sectionEyebrow: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  sectionTitle: {
    margin: "8px 0 0",
    fontSize: "clamp(26px, 5vw, 34px)",
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: -0.8,
  },
  sectionDesc: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.8,
  },
  moreLink: {
    textDecoration: "none",
    color: "#0f172a",
    fontWeight: 900,
    fontSize: 14,
  },

  logoRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 18,
  },
  logoChip: {
    textDecoration: "none",
    color: "#334155",
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 900,
    fontSize: 13,
  },
  boothFeatureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  boothFeatureCard: {
    textDecoration: "none",
    color: "#0f172a",
    borderRadius: 28,
    padding: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  boothHead: {
    display: "flex",
    gap: 14,
    alignItems: "center",
  },
  boothAvatar: {
    width: 66,
    height: 66,
    borderRadius: 20,
    background: "linear-gradient(135deg, #0f172a 0%, #16a34a 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 950,
    fontSize: 28,
    flexShrink: 0,
  },
  boothName: {
    fontSize: "clamp(20px, 4.6vw, 24px)",
    fontWeight: 950,
  },
  boothMeta: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
    fontWeight: 800,
    lineHeight: 1.6,
  },
  boothIntro: {
    marginTop: 16,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.8,
    minHeight: 76,
  },
  boothCta: {
    marginTop: 16,
    fontWeight: 950,
    fontSize: 14,
  },

  newProductsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 16,
  },
  newProductCard: {
    textDecoration: "none",
    color: "#0f172a",
    borderRadius: 28,
    padding: 22,
    background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
    border: "1px solid #fdba74",
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
    display: "block",
  },
  newProductBadge: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: 999,
    background: "#fff",
    fontSize: 11,
    fontWeight: 950,
    color: "#c2410c",
  },
  newProductTitle: {
    marginTop: 18,
    fontSize: "clamp(20px, 4.6vw, 24px)",
    lineHeight: 1.15,
    fontWeight: 950,
  },
  newProductDesc: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 1.8,
    minHeight: 62,
  },
  newProductBtn: {
    display: "inline-block",
    marginTop: 16,
    textDecoration: "none",
    fontWeight: 950,
    fontSize: 14,
    color: "#c2410c",
  },

  problemGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 18,
  },
  problemCard: {
    borderRadius: 30,
    padding: 28,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
  },
  aiCard: {
    borderRadius: 30,
    padding: 28,
    background: "#fff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 14px 34px rgba(15,23,42,0.06)",
  },
  problemList: {
    marginTop: 22,
    display: "grid",
    gap: 12,
  },
  problemItem: {
    textDecoration: "none",
    color: "#0f172a",
    borderRadius: 18,
    padding: "16px 18px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 900,
    fontSize: 15,
  },
  aiInputWrap: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 12,
  },
  aiInput: {
    height: 54,
    borderRadius: 16,
    border: "1px solid #cbd5e1",
    padding: "0 16px",
    fontSize: 15,
    outline: "none",
  },
  aiBtn: {
    border: "none",
    background: "#15803d",
    color: "#fff",
    borderRadius: 16,
    padding: "0 18px",
    fontWeight: 950,
    cursor: "pointer",
  },
  solutionGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 12,
  },
  solutionBtn: {
    borderRadius: 16,
    border: "1px solid #e2e8f0",
    background: "#f8fafc",
    padding: "14px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },

  footer: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "20px 24px 40px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    color: "#64748b",
    fontSize: 14,
    flexWrap: "wrap",
  },
  adminFooterLink: {
    textDecoration: "none",
    color: "#475569",
    fontWeight: 800,
    fontSize: 13,
  },

  emptyBox: {
    borderRadius: 24,
    padding: 24,
    background: "#f8fafc",
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    lineHeight: 1.8,
  },
};