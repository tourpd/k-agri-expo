import { notFound } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import HallSponsorStrip from "@/components/expo/HallSponsorStrip";
import ExpoHallMapClient from "@/components/expo/ExpoHallMapClient";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type HallMeta = {
  title: string;
  sponsorKey: string;
  routeId: string;
  dbAliases: string[];
};

type BoothRow = {
  booth_id?: string | null;
  name?: string | null;
  title?: string | null;
  intro?: string | null;
  description?: string | null;
  region?: string | null;
  category_primary?: string | null;
  hall_id?: string | null;
  hall_code?: string | null;

  sponsor_sort_order?: number | null;
  is_inputs_sponsor?: boolean | null;
  is_machine_sponsor?: boolean | null;
  is_seed_sponsor?: boolean | null;
  is_smartfarm_sponsor?: boolean | null;

  status?: string | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
  is_published?: boolean | null;

  cover_image_url?: string | null;
  thumbnail_url?: string | null;
  logo_url?: string | null;

  company_type?: string | null;
  plan_type?: string | null;
  is_featured?: boolean | null;
  sponsor_weight?: number | null;
  manual_boost?: number | null;

  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
};

type SlotRow = {
  hall_id?: string | null;
  slot_id?: string | null;
  booth_id?: string | null;
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
};

type ProductLike = {
  id?: string | number | null;
  product_id?: string | number | null;
  booth_id?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  cover_image_url?: string | null;
  price?: number | null;
  price_krw?: number | null;
  sale_price_krw?: number | null;
  expo_price_krw?: number | null;
  is_active?: boolean | null;
};

type DealLike = {
  id?: string | number | null;
  deal_id?: string | number | null;
  booth_id?: string | null;
  title?: string | null;
  image_url?: string | null;
  price_sale_krw?: number | null;
  expo_price_text?: string | null;
  is_active?: boolean | null;
};

type RepresentativeProduct = {
  name: string;
  image_url: string | null;
  price_text: string | null;
  is_expo_deal: boolean;
};

type MergedBoothRow = BoothRow & {
  booth_id: string;
  slot_code?: string | null;
  source_hall_id?: string | null;
};

function getHallMeta(hallId: string): HallMeta | null {
  switch (hallId) {
    case "agri-inputs":
    case "agri_inputs":
      return {
        title: "농자재관",
        sponsorKey: "is_inputs_sponsor",
        routeId: "agri-inputs",
        dbAliases: ["agri-inputs", "agri_inputs"],
      };
    case "machines":
    case "machinery":
      return {
        title: "농기계관",
        sponsorKey: "is_machine_sponsor",
        routeId: "machines",
        dbAliases: ["machines", "machinery"],
      };
    case "seeds":
    case "seed":
    case "seeds_seedlings":
      return {
        title: "종자관",
        sponsorKey: "is_seed_sponsor",
        routeId: "seeds",
        dbAliases: ["seeds", "seed", "seeds_seedlings"],
      };
    case "smartfarm":
    case "smart-farm":
    case "smart_farm":
      return {
        title: "스마트팜관",
        sponsorKey: "is_smartfarm_sponsor",
        routeId: "smartfarm",
        dbAliases: ["smartfarm", "smart-farm", "smart_farm"],
      };
    case "eco-friendly":
    case "eco-inputs":
    case "eco_friendly":
      return {
        title: "친환경관",
        sponsorKey: "",
        routeId: "eco-friendly",
        dbAliases: ["eco-friendly", "eco-inputs", "eco_friendly"],
      };
    case "future-insect":
    case "future_insect":
      return {
        title: "미래 곤충관",
        sponsorKey: "",
        routeId: "future-insect",
        dbAliases: ["future-insect", "future_insect"],
      };
    default:
      return null;
  }
}

function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

function isUuid(v: string) {
  return /^[0-9a-f-]{36}$/i.test(v);
}

function normalizeHallId(v?: string | null) {
  const raw = safe(v, "");
  if (!raw) return "";
  if (raw === "agri_inputs") return "agri-inputs";
  if (raw === "smart_farm") return "smartfarm";
  if (raw === "eco_friendly") return "eco-friendly";
  if (raw === "future_insect") return "future-insect";
  return raw;
}

function normalizeSlotCode(v?: string | null) {
  const slot = safe(v, "");
  if (!slot) return "-";
  const raw = slot.toUpperCase().replace(/\s+/g, "");
  const m = raw.match(/^([A-Z])[-_]?0*([0-9]+)$/);
  if (!m) return raw;
  return `${m[1]}-${m[2].padStart(2, "0")}`;
}

function resolveBoothId(row: Partial<BoothRow> | null | undefined) {
  return safe(row?.booth_id, "");
}

function resolveBoothName(row: Partial<BoothRow> | null | undefined) {
  return safe(row?.name ?? row?.title, "부스명 없음");
}

function resolveIntro(row: Partial<BoothRow> | null | undefined) {
  return safe(row?.intro ?? row?.description, "부스 소개가 아직 등록되지 않았습니다.");
}

function hallLabel(hallId: string) {
  const meta = getHallMeta(hallId);
  return meta?.title ?? "카테고리관";
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

function sortBooths(items: MergedBoothRow[]) {
  return [...items].sort((a, b) => {
    const scoreDiff = exposureScore(b) - exposureScore(a);
    if (scoreDiff !== 0) return scoreDiff;

    const slotA = normalizeSlotCode(a.slot_code) || "ZZZ";
    const slotB = normalizeSlotCode(b.slot_code) || "ZZZ";
    return slotA.localeCompare(slotB);
  });
}

function heroText(hallId: string) {
  const normalized = normalizeHallId(hallId);
  switch (normalized) {
    case "agri-inputs":
      return "비료·영양제·병해충 관리 자재를 우선순위대로 확인할 수 있습니다.";
    case "eco-inputs":
    case "eco-friendly":
      return "친환경 병해충·영양 관리 자재를 우선순위대로 보여줍니다.";
    case "machines":
    case "machinery":
      return "작업 효율을 높이는 농기계를 프리미엄부터 확인합니다.";
    case "seeds":
    case "seed":
    case "seeds_seedlings":
      return "작물별 우수 종자·육묘 관련 부스를 순서대로 보여줍니다.";
    case "smartfarm":
    case "smart-farm":
      return "센서·제어·자동화 장비를 프리미엄 중심으로 배치합니다.";
    case "future-insect":
      return "곤충 산업의 생산·가공·장비·교육 부스를 우선순위대로 보여줍니다.";
    default:
      return "프리미엄 부스부터 순서대로 확인할 수 있습니다.";
  }
}

function isVisibleBooth(booth: BoothRow) {
  const status = safe(booth.status, "").toLowerCase();
  return (
    !status ||
    status === "approved" ||
    status === "live" ||
    status === "published" ||
    status === "draft" ||
    status === "pending"
  );
}

function formatPriceText(value?: number | null) {
  if (typeof value !== "number") return null;
  return `${value.toLocaleString("ko-KR")}원`;
}

function resolveProductImage(row: ProductLike | DealLike | null | undefined) {
  if (!row) return null;
  return (
    safe((row as ProductLike).image_url, "") ||
    safe((row as ProductLike).thumbnail_url, "") ||
    safe((row as ProductLike).cover_image_url, "") ||
    null
  );
}

async function loadBoothsByBoothIds(boothIds: string[]) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("booths")
    .select("*")
    .in("booth_id", boothIds);

  if (error) {
    console.error("[hall-page] booths by booth_id error:", error);
    return [];
  }

  return (data ?? []) as BoothRow[];
}

async function loadRepresentativeProducts(boothIds: string[]) {
  const supabase = createSupabaseAdminClient();
  const map = new Map<string, RepresentativeProduct>();

  const { data: dealsData, error: dealsError } = await supabase
    .from("booth_deals")
    .select("*")
    .in("booth_id", boothIds);

  if (!dealsError) {
    for (const row of (dealsData ?? []) as DealLike[]) {
      const boothId = safe(row.booth_id, "");
      if (!boothId || map.has(boothId)) continue;

      map.set(boothId, {
        name: safe(row.title, "EXPO 특가"),
        image_url: resolveProductImage(row),
        price_text: safe(row.expo_price_text, "") || formatPriceText(row.price_sale_krw),
        is_expo_deal: true,
      });
    }
  }

  const remainingIds = boothIds.filter((id) => !map.has(id));
  if (remainingIds.length === 0) return map;

  const { data: productsData, error: productsError } = await supabase
    .from("booth_products")
    .select("*")
    .in("booth_id", remainingIds);

  if (!productsError) {
    for (const row of (productsData ?? []) as ProductLike[]) {
      const boothId = safe(row.booth_id, "");
      if (!boothId || map.has(boothId)) continue;

      map.set(boothId, {
        name: safe(row.name ?? row.title, "대표 상품"),
        image_url: resolveProductImage(row),
        price_text:
          formatPriceText(row.expo_price_krw) ||
          formatPriceText(row.sale_price_krw) ||
          formatPriceText(row.price_krw) ||
          formatPriceText(row.price),
        is_expo_deal: false,
      });
    }
  }

  return map;
}

export default async function ExpoHallPage({
  params,
}: {
  params: Promise<{ hallId: string }>;
}) {
  const { hallId } = await params;
  const hallMeta = getHallMeta(hallId);

  if (!hallMeta) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();

  const { data: slotData, error: slotError } = await supabase
    .from("hall_booth_slots")
    .select("*")
    .in("hall_id", hallMeta.dbAliases)
    .order("y", { ascending: true })
    .order("x", { ascending: true });

  if (slotError) {
    console.error("[hall-page] slot query error =", slotError);
    return (
      <main style={pageWrap}>
        <h1 style={titleStyle}>전시장 슬롯을 불러오지 못했습니다.</h1>
        <div style={descStyle}>{slotError.message}</div>
      </main>
    );
  }

  const slots = ((slotData ?? []) as SlotRow[]).map((slot) => ({
    ...slot,
    hall_id: normalizeHallId(slot.hall_id),
  }));

  const boothIds = Array.from(
    new Set(
      slots
        .map((slot) => safe(slot.booth_id, ""))
        .filter((id) => id.length > 0)
    )
  );

  if (boothIds.length === 0) {
    return (
      <main style={pageWrap}>
        <header style={heroWrap}>
          <div style={eyebrow}>CATEGORY HALL</div>
          <h1 style={titleStyle}>{hallLabel(hallId)}</h1>
          <p style={descStyle}>{heroText(hallId)}</p>

          <div style={metaRow}>
            <span style={metaPill}>총 0개 부스</span>
            <span style={metaPill}>프리미엄 우선 노출</span>
            <span style={metaPill}>추천 부스 별도 노출</span>
          </div>
        </header>

        <section style={emptyWrap}>
          <div style={emptyTitle}>아직 연결된 부스가 없습니다.</div>
          <div style={emptyDesc}>
            hall_booth_slots에 booth_id가 아직 연결되지 않았거나, 해당 관의 슬롯 데이터가 없습니다.
          </div>
        </section>
      </main>
    );
  }

  const [boothRows, productMap] = await Promise.all([
    loadBoothsByBoothIds(boothIds),
    loadRepresentativeProducts(boothIds),
  ]);

  const boothMap = new Map<string, BoothRow>();
  for (const booth of boothRows) {
    const boothId = resolveBoothId(booth);
    if (boothId) boothMap.set(boothId, booth);
  }

  const booths = slots.reduce<MergedBoothRow[]>((acc, slot) => {
  const slotBoothId = safe(slot.booth_id, "");
  if (!slotBoothId) return acc;

  const booth = boothMap.get(slotBoothId);
  if (!booth) return acc;

  const resolvedBoothId = safe(booth.booth_id, slotBoothId);
  if (!resolvedBoothId) return acc;

  const merged: MergedBoothRow = {
    ...booth,
    booth_id: resolvedBoothId,
    slot_code: slot.slot_id ?? null,
    source_hall_id: slot.hall_id ?? null,
  };

  if (!isVisibleBooth(merged)) return acc;

  acc.push(merged);
  return acc;
}, []);

  const featuredPremium = sortBooths(
    booths.filter((b) => boothTypeLabel(b) === "premium" && !!b.is_featured)
  );

  const premium = sortBooths(
    booths.filter((b) => boothTypeLabel(b) === "premium" && !b.is_featured)
  );

  const general = sortBooths(
    booths.filter((b) => boothTypeLabel(b) === "general")
  );

  const free = sortBooths(
    booths.filter((b) => boothTypeLabel(b) === "free")
  );

  const totalCount =
    featuredPremium.length + premium.length + general.length + free.length;

  const sponsorBooths = booths
    .filter((b) =>
      hallMeta.sponsorKey ? Boolean((b as any)?.[hallMeta.sponsorKey]) : false
    )
    .sort((a, b) => {
      const aOrder = Number(a?.sponsor_sort_order ?? 999);
      const bOrder = Number(b?.sponsor_sort_order ?? 999);
      return aOrder - bOrder;
    })
    .slice(0, 5)
    .map((b) => ({
      booth_id: resolveBoothId(b),
      name: resolveBoothName(b),
      intro: b?.intro ?? null,
      region: b?.region ?? null,
      category_primary: b?.category_primary ?? null,
    }));

  const mappedSlots = slots.map((s) => {
    const slotBoothId = safe(s.booth_id, "");
    const booth = slotBoothId ? boothMap.get(slotBoothId) : null;
    const resolvedBoothId = slotBoothId && isUuid(slotBoothId) ? slotBoothId : "";
    const rep = slotBoothId ? productMap.get(slotBoothId) : null;

    return {
      ...s,
      hall_id: normalizeHallId(s.hall_id),
      booth_id: slotBoothId || null,
      slot_id: s?.slot_id ?? null,
      slot_code: normalizeSlotCode(s?.slot_id),
      booth_name: resolveBoothName(booth),
      category: booth?.category_primary ?? null,
      booth_intro: booth?.intro ?? booth?.description ?? null,
      logo_url:
        safe(booth?.logo_url, "") ||
        safe(booth?.thumbnail_url, "") ||
        safe(booth?.cover_image_url, "") ||
        null,
      product_name: rep?.name ?? null,
      product_image_url: rep?.image_url ?? null,
      product_price_text: rep?.price_text ?? null,
      is_expo_deal: rep?.is_expo_deal ?? false,
      detail_href: resolvedBoothId
        ? `/expo/booths/${encodeURIComponent(resolvedBoothId)}`
        : null,
    };
  });

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

      <HallSponsorStrip
        title={`${hallLabel(hallId)} TOP 5 프리미엄 스폰서`}
        items={sponsorBooths as any}
      />

      <section style={mapWrap}>
        <ExpoHallMapClient slots={mappedSlots as any} />
      </section>

      {featuredPremium.length > 0 && (
        <section style={sectionWrap}>
          <div style={sectionEyebrow}>FEATURED PREMIUM</div>
          <h2 style={sectionTitle}>추천 프리미엄 부스</h2>
          <div style={grid4}>
            {featuredPremium.map((booth) => (
              <BoothCard key={`${booth.booth_id}-${booth.slot_code ?? "slot"}`} booth={booth} strong />
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
              <BoothCard key={`${booth.booth_id}-${booth.slot_code ?? "slot"}`} booth={booth} />
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
              <BoothCard key={`${booth.booth_id}-${booth.slot_code ?? "slot"}`} booth={booth} />
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
              <BoothCard key={`${booth.booth_id}-${booth.slot_code ?? "slot"}`} booth={booth} muted />
            ))}
          </div>
        </section>
      )}

      {totalCount === 0 && (
        <section style={emptyWrap}>
          <div style={emptyTitle}>아직 공개된 부스가 없습니다.</div>
          <div style={emptyDesc}>
            슬롯은 연결되어 있지만 현재 필터 조건 또는 부스 데이터 상태 때문에 화면에 표시되지 않고 있습니다.
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
  booth: MergedBoothRow;
  strong?: boolean;
  muted?: boolean;
}) {
  const boothId = safe(booth.booth_id, "");
  const image =
    safe(booth.cover_image_url) ||
    safe(booth.thumbnail_url) ||
    safe(booth.logo_url) ||
    "";

  const slotCode = normalizeSlotCode(booth.slot_code);
  const validDetailHref = boothId && isUuid(boothId);

  const content = (
    <>
      <div style={cardTop}>
        <div>
          <div style={cardTitle}>{resolveBoothName(booth)}</div>
          <div style={cardMeta}>
            {safe(booth.category_primary, "카테고리 미지정")}
          </div>
        </div>

        <div style={badgeWrap}>
          {booth.is_featured ? <span style={badgeFeatured}>추천</span> : null}
          {boothTypeLabel(booth) === "premium" ? <span style={badgePremium}>프리미엄</span> : null}
          {boothTypeLabel(booth) === "free" ? <span style={badgeFree}>무료</span> : null}
        </div>
      </div>

      {image ? (
        <div style={imageWrap}>
          <img src={image} alt={resolveBoothName(booth)} style={imageStyle} />
        </div>
      ) : null}

      <div style={cardIntro}>{resolveIntro(booth)}</div>

      <div style={cardFooter}>
        <span style={footerMeta}>slot: {slotCode}</span>
        <span style={footerArrow}>{validDetailHref ? "부스 보기 →" : "링크 점검 필요"}</span>
      </div>
    </>
  );

  if (!validDetailHref) {
    return (
      <div
        style={{
          ...card,
          ...(strong ? cardStrong : {}),
          ...(muted ? cardMuted : {}),
          cursor: "default",
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href={`/expo/booths/${encodeURIComponent(boothId)}`}
      style={{
        ...card,
        ...(strong ? cardStrong : {}),
        ...(muted ? cardMuted : {}),
      }}
    >
      {content}
    </Link>
  );
}

const pageWrap: CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
  padding: "36px 28px 80px",
  background: "#fff",
  minHeight: "100vh",
};

const heroWrap: CSSProperties = {
  padding: "8px 0 12px",
};

const eyebrow: CSSProperties = {
  fontSize: 14,
  fontWeight: 950,
  color: "#16a34a",
  letterSpacing: 0.4,
};

const titleStyle: CSSProperties = {
  marginTop: 12,
  fontSize: 56,
  lineHeight: 1.06,
  fontWeight: 950,
  color: "#0f172a",
};

const descStyle: CSSProperties = {
  marginTop: 20,
  fontSize: 24,
  lineHeight: 1.7,
  color: "#64748b",
  maxWidth: 980,
};

const metaRow: CSSProperties = {
  marginTop: 24,
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const metaPill: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 999,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: 14,
  fontWeight: 800,
};

const mapWrap: CSSProperties = {
  maxWidth: 1200,
  margin: "18px auto 0",
  border: "1px solid #eee",
  borderRadius: 16,
  overflow: "hidden",
  background: "#fff",
};

const sectionWrap: CSSProperties = {
  marginTop: 40,
};

const sectionEyebrow: CSSProperties = {
  fontSize: 13,
  fontWeight: 950,
  color: "#16a34a",
  letterSpacing: 0.4,
};

const sectionTitle: CSSProperties = {
  marginTop: 10,
  fontSize: 34,
  lineHeight: 1.2,
  fontWeight: 950,
  color: "#0f172a",
};

const grid4: CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 16,
};

const card: CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "#111",
  borderRadius: 20,
  border: "1px solid #e5e7eb",
  background: "#fff",
  padding: 18,
  boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
};

const cardStrong: CSSProperties = {
  border: "2px solid #86efac",
  background: "#f0fdf4",
  boxShadow: "0 16px 34px rgba(22,163,74,0.08)",
};

const cardMuted: CSSProperties = {
  opacity: 0.82,
};

const cardTop: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const cardTitle: CSSProperties = {
  fontSize: 28,
  lineHeight: 1.25,
  fontWeight: 950,
  color: "#0f172a",
};

const cardMeta: CSSProperties = {
  marginTop: 8,
  fontSize: 16,
  color: "#64748b",
  fontWeight: 700,
};

const badgeWrap: CSSProperties = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const badgeFeatured: CSSProperties = {
  display: "inline-block",
  padding: "7px 10px",
  borderRadius: 999,
  background: "#fef3c7",
  color: "#92400e",
  fontSize: 12,
  fontWeight: 950,
};

const badgePremium: CSSProperties = {
  display: "inline-block",
  padding: "7px 10px",
  borderRadius: 999,
  background: "#dcfce7",
  color: "#166534",
  fontSize: 12,
  fontWeight: 950,
};

const badgeFree: CSSProperties = {
  display: "inline-block",
  padding: "7px 10px",
  borderRadius: 999,
  background: "#e2e8f0",
  color: "#334155",
  fontSize: 12,
  fontWeight: 950,
};

const imageWrap: CSSProperties = {
  marginTop: 16,
  borderRadius: 18,
  overflow: "hidden",
  background: "#f8fafc",
  aspectRatio: "16 / 9",
};

const imageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const cardIntro: CSSProperties = {
  marginTop: 14,
  fontSize: 15,
  lineHeight: 1.7,
  color: "#334155",
  minHeight: 54,
};

const cardFooter: CSSProperties = {
  marginTop: 18,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
};

const footerMeta: CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#64748b",
};

const footerArrow: CSSProperties = {
  fontSize: 15,
  fontWeight: 950,
  color: "#0f172a",
};

const emptyWrap: CSSProperties = {
  marginTop: 50,
  padding: 28,
  borderRadius: 20,
  background: "#f8fafc",
  border: "1px solid #e5e7eb",
};

const emptyTitle: CSSProperties = {
  fontSize: 24,
  fontWeight: 950,
  color: "#0f172a",
};

const emptyDesc: CSSProperties = {
  marginTop: 10,
  fontSize: 16,
  lineHeight: 1.8,
  color: "#64748b",
};