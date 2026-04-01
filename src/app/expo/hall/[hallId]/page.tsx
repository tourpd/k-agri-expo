import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BoothRow = {
  booth_id: string;
  name: string | null;
  intro: string | null;
  category_primary: string | null;
  company_type: string | null;
  plan_type: string | null;
  is_featured: boolean | null;
  sponsor_weight: number | null;
  manual_boost: number | null;
  hall_id: string | null;
  slot_code: string | null;
  cover_image_url: string | null;
  thumbnail_url: string | null;
  logo_url: string | null;
  status: string | null;
  is_public: boolean | null;
  is_active: boolean | null;
  is_published: boolean | null;
};

function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

function hallLabel(hallId: string) {
  switch (hallId) {
    case "fertilizer":
      return "비료관";
    case "eco-inputs":
      return "친환경자재관";
    case "machinery":
      return "농기계관";
    case "seed":
      return "종자관";
    case "smart-farm":
      return "스마트농업관";
    case "future-insect":
      return "미래곤충관";
    default:
      return "카테고리관";
  }
}

function boothTypeLabel(booth: BoothRow) {
  const plan = safe(booth.plan_type, "").toLowerCase();
  const company = safe(booth.company_type, "").toLowerCase();

  if (plan === "premium" || company === "premium") return "premium";
  if (plan === "free" || company === "free") return "free";
  return "general";
}

function exposureScore(booth: BoothRow) {
  const sponsor = Number(booth.sponsor_weight || 0);
  const boost = Number(booth.manual_boost || 0);
  const featured = booth.is_featured ? 1000 : 0;
  const premium = boothTypeLabel(booth) === "premium" ? 300 : 0;
  return featured + premium + sponsor + boost;
}

function sortBooths(items: BoothRow[]) {
  return [...items].sort((a, b) => {
    const scoreDiff = exposureScore(b) - exposureScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    const slotA = safe(a.slot_code, "ZZZ");
    const slotB = safe(b.slot_code, "ZZZ");
    return slotA.localeCompare(slotB);
  });
}

function heroText(hallId: string) {
  switch (hallId) {
    case "fertilizer":
      return "기비·추비·비대·활력 관련 제품을 한눈에 확인합니다.";
    case "eco-inputs":
      return "친환경 병해충·영양 관리 자재를 우선순위대로 보여줍니다.";
    case "machinery":
      return "작업 효율을 높이는 농기계를 프리미엄부터 확인합니다.";
    case "seed":
      return "작물별 우수 종자·육묘 관련 부스를 순서대로 보여줍니다.";
    case "smart-farm":
      return "센서·제어·자동화 장비를 프리미엄 중심으로 배치합니다.";
    case "future-insect":
      return "곤충 산업의 생산·가공·장비·교육 부스를 우선순위대로 보여줍니다.";
    default:
      return "프리미엄 부스부터 순서대로 확인할 수 있습니다.";
  }
}

export default async function ExpoHallPage({
  params,
}: {
  params: Promise<{ hallId: string }>;
}) {
  const { hallId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("booths")
    .select(`
      booth_id,
      name,
      intro,
      category_primary,
      company_type,
      plan_type,
      is_featured,
      sponsor_weight,
      manual_boost,
      hall_id,
      slot_code,
      cover_image_url,
      thumbnail_url,
      logo_url,
      status,
      is_public,
      is_active,
      is_published
    `)
    .eq("hall_id", hallId)
    .eq("status", "approved")
    .eq("is_public", true)
    .eq("is_active", true)
    .eq("is_published", true);

  if (error) {
    return (
      <main style={pageWrap}>
        <h1 style={titleStyle}>카테고리 부스를 불러오지 못했습니다.</h1>
        <div style={descStyle}>{error.message}</div>
      </main>
    );
  }

  const booths = (data || []) as BoothRow[];

  const featuredPremium = sortBooths(
    booths.filter(
      (b) => boothTypeLabel(b) === "premium" && !!b.is_featured
    )
  );

  const premium = sortBooths(
    booths.filter(
      (b) => boothTypeLabel(b) === "premium" && !b.is_featured
    )
  );

  const general = sortBooths(
    booths.filter((b) => boothTypeLabel(b) === "general")
  );

  const free = sortBooths(
    booths.filter((b) => boothTypeLabel(b) === "free")
  );

  const totalCount =
    featuredPremium.length + premium.length + general.length + free.length;

  return (
    <main style={pageWrap}>
      <header style={heroWrap}>
        <div style={eyebrow}>CATEGORY HALL</div>
        <h1 style={titleStyle}>{hallLabel(hallId)}</h1>
        <p style={descStyle}>{heroText(hallId)}</p>

        <div style={metaRow}>
          <span style={metaPill}>총 {totalCount}개 부스</span>
          <span style={metaPill}>프리미엄 우선 노출</span>
          <span style={metaPill}>추천 부스 별도 노출</span>
        </div>
      </header>

      {featuredPremium.length > 0 && (
        <section style={sectionWrap}>
          <div style={sectionEyebrow}>FEATURED PREMIUM</div>
          <h2 style={sectionTitle}>추천 프리미엄 부스</h2>
          <div style={grid4}>
            {featuredPremium.map((booth) => (
              <BoothCard key={booth.booth_id} booth={booth} strong />
            ))}
          </div>
        </section>
      )}

      {premium.length > 0 && (
        <section style={sectionWrap}>
          <div style={sectionEyebrow}>PREMIUM</div>
          <h2 style={sectionTitle}>프리미엄 부스</h2>
          <div style={grid4}>
            {premium.map((booth) => (
              <BoothCard key={booth.booth_id} booth={booth} />
            ))}
          </div>
        </section>
      )}

      {general.length > 0 && (
        <section style={sectionWrap}>
          <div style={sectionEyebrow}>GENERAL</div>
          <h2 style={sectionTitle}>일반 부스</h2>
          <div style={grid4}>
            {general.map((booth) => (
              <BoothCard key={booth.booth_id} booth={booth} />
            ))}
          </div>
        </section>
      )}

      {free.length > 0 && (
        <section style={sectionWrap}>
          <div style={sectionEyebrow}>FREE</div>
          <h2 style={sectionTitle}>무료 체험 부스</h2>
          <div style={grid4}>
            {free.map((booth) => (
              <BoothCard key={booth.booth_id} booth={booth} muted />
            ))}
          </div>
        </section>
      )}

      {totalCount === 0 && (
        <section style={emptyWrap}>
          <div style={emptyTitle}>아직 공개된 부스가 없습니다.</div>
          <div style={emptyDesc}>
            부스 승인 후 이 카테고리에 자동으로 노출됩니다.
          </div>
        </section>
      )}
    </main>
  );
}

function BoothCard({
  booth,
  strong = false,
  muted = false,
}: {
  booth: BoothRow;
  strong?: boolean;
  muted?: boolean;
}) {
  const image =
    safe(booth.cover_image_url) ||
    safe(booth.thumbnail_url) ||
    safe(booth.logo_url) ||
    "";

  return (
    <Link
      href={`/expo/booths/${booth.booth_id}`}
      style={{
        ...card,
        ...(strong ? cardStrong : {}),
        ...(muted ? cardMuted : {}),
      }}
    >
      <div style={cardTop}>
        <div>
          <div style={cardTitle}>{safe(booth.name, "부스명 없음")}</div>
          <div style={cardMeta}>
            {safe(booth.category_primary, "카테고리 미지정")}
          </div>
        </div>

        <div style={badgeWrap}>
          {booth.is_featured ? <span style={badgeFeatured}>추천</span> : null}
          {boothTypeLabel(booth) === "premium" ? (
            <span style={badgePremium}>프리미엄</span>
          ) : null}
          {boothTypeLabel(booth) === "free" ? (
            <span style={badgeFree}>무료</span>
          ) : null}
        </div>
      </div>

      {image ? (
        <div style={imageWrap}>
          <img
            src={image}
            alt={safe(booth.name, "부스")}
            style={imageStyle}
          />
        </div>
      ) : null}

      <div style={cardIntro}>
        {safe(booth.intro, "부스 소개가 아직 등록되지 않았습니다.")}
      </div>

      <div style={cardFooter}>
        <span style={footerMeta}>
          slot: {safe(booth.slot_code, "-")}
        </span>
        <span style={footerArrow}>부스 보기 →</span>
      </div>
    </Link>
  );
}

const pageWrap: React.CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: "36px 28px 80px",
  background: "#fff",
  minHeight: "100vh",
};

const heroWrap: React.CSSProperties = {
  padding: "8px 0 12px",
};

const eyebrow: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 950,
  color: "#16a34a",
  letterSpacing: 0.4,
};

const titleStyle: React.CSSProperties = {
  marginTop: 12,
  fontSize: 56,
  lineHeight: 1.06,
  fontWeight: 950,
  color: "#0f172a",
};

const descStyle: React.CSSProperties = {
  marginTop: 20,
  fontSize: 24,
  lineHeight: 1.7,
  color: "#64748b",
  maxWidth: 980,
};

const metaRow: React.CSSProperties = {
  marginTop: 24,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const metaPill: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: 14,
  fontWeight: 800,
};

const sectionWrap: React.CSSProperties = {
  marginTop: 40,
};

const sectionEyebrow: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 950,
  color: "#16a34a",
  letterSpacing: 0.4,
};

const sectionTitle: React.CSSProperties = {
  marginTop: 10,
  fontSize: 34,
  lineHeight: 1.2,
  fontWeight: 950,
  color: "#0f172a",
};

const grid4: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
  gap: 18,
};

const card: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "#111",
  borderRadius: 24,
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: 20,
  boxShadow: "0 12px 28px rgba(15,23,42,0.04)",
};

const cardStrong: React.CSSProperties = {
  border: "2px solid #86efac",
  background: "#f0fdf4",
  boxShadow: "0 16px 34px rgba(22,163,74,0.08)",
};

const cardMuted: React.CSSProperties = {
  opacity: 0.82,
};

const cardTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const cardTitle: React.CSSProperties = {
  fontSize: 28,
  lineHeight: 1.25,
  fontWeight: 950,
  color: "#0f172a",
};

const cardMeta: React.CSSProperties = {
  marginTop: 8,
  fontSize: 16,
  color: "#64748b",
  fontWeight: 700,
};

const badgeWrap: React.CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const badgeFeatured: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 10px",
  borderRadius: 999,
  background: "#fef3c7",
  color: "#92400e",
  fontSize: 12,
  fontWeight: 950,
};

const badgePremium: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 10px",
  borderRadius: 999,
  background: "#dcfce7",
  color: "#166534",
  fontSize: 12,
  fontWeight: 950,
};

const badgeFree: React.CSSProperties = {
  display: "inline-block",
  padding: "7px 10px",
  borderRadius: 999,
  background: "#e2e8f0",
  color: "#334155",
  fontSize: 12,
  fontWeight: 950,
};

const imageWrap: React.CSSProperties = {
  marginTop: 16,
  borderRadius: 18,
  overflow: "hidden",
  background: "#f8fafc",
  aspectRatio: "16 / 9",
};

const imageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const cardIntro: React.CSSProperties = {
  marginTop: 16,
  fontSize: 16,
  lineHeight: 1.8,
  color: "#334155",
  minHeight: 86,
};

const cardFooter: React.CSSProperties = {
  marginTop: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const footerMeta: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#64748b",
};

const footerArrow: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 950,
  color: "#0f172a",
};

const emptyWrap: React.CSSProperties = {
  marginTop: 50,
  padding: 28,
  borderRadius: 20,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const emptyTitle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 950,
  color: "#0f172a",
};

const emptyDesc: React.CSSProperties = {
  marginTop: 10,
  fontSize: 16,
  lineHeight: 1.8,
  color: "#64748b",
};