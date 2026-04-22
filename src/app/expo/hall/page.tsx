// src/app/expo/hall/[hallId]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import HallSponsorStrip from "@/components/expo/HallSponsorStrip";
import ExpoHallMapClient from "@/components/expo/ExpoHallMapClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type HallMeta = {
  title: string;
  sponsorKey: string;
  routeId: string;
  dbAliases: string[];
};

type BoothRow = {
  booth_id?: string | null;
  id?: string | null;
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

type MergedBoothRow = BoothRow & {
  booth_id: string;
  slot_code: string | null;
  source_hall_id: string | null;
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
    case "seeds_seedlings":
      return {
        title: "종자관",
        sponsorKey: "is_seed_sponsor",
        routeId: "seeds",
        dbAliases: ["seeds", "seeds_seedlings"],
      };

    case "smartfarm":
    case "smart_farm":
      return {
        title: "스마트팜관",
        sponsorKey: "is_smartfarm_sponsor",
        routeId: "smartfarm",
        dbAliases: ["smartfarm", "smart_farm"],
      };

    case "eco-friendly":
    case "eco_friendly":
      return {
        title: "친환경관",
        sponsorKey: "",
        routeId: "eco-friendly",
        dbAliases: ["eco-friendly", "eco_friendly"],
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
  return safe(row?.booth_id ?? row?.id, "");
}

function resolveBoothName(row: Partial<BoothRow> | null | undefined) {
  return safe(row?.name ?? row?.title, "부스명 없음");
}

function buildInList(values: string[]) {
  return values.map((v) => `"${v}"`).join(",");
}

/**
 * 개발용 완화 필터
 * - status만 너무 이상하지 않으면 통과
 * - is_public / is_active / is_published 는 개발 중에는 막지 않음
 */
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

export default async function Page({
  params,
}: {
  params: Promise<{ hallId: string }>;
}) {
  const { hallId } = await params;

  const hallMeta = getHallMeta(hallId);
  if (!hallMeta) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const aliasIn = buildInList(hallMeta.dbAliases);

  const { data: slotsData, error: slotsError } = await supabase
    .from("hall_booth_slots")
    .select("*")
    .in("hall_id", hallMeta.dbAliases)
    .order("y", { ascending: true })
    .order("x", { ascending: true });

  if (slotsError) {
    console.error("[expo/hall/[hallId]] slots error:", slotsError);
    notFound();
  }

  const slots: SlotRow[] = ((slotsData ?? []).filter(Boolean) as SlotRow[]).map((slot) => ({
    ...slot,
    hall_id: normalizeHallId(slot.hall_id),
  }));

  const slotBoothIds = Array.from(
    new Set(
      slots
        .map((s) => safe(s.booth_id, ""))
        .filter((id) => id.length > 0)
    )
  );

  let boothRows: BoothRow[] = [];

  if (slotBoothIds.length > 0) {
    const { data: boothByIdData, error: boothByIdError } = await supabase
      .from("booths")
      .select("*")
      .in("booth_id", slotBoothIds);

    if (boothByIdError) {
      console.error("[expo/hall/[hallId]] booths by booth_id error:", boothByIdError);
    } else {
      boothRows = (boothByIdData ?? []) as BoothRow[];
    }
  }

  if (boothRows.length === 0) {
    const { data: boothsData, error: boothsError } = await supabase
      .from("booths")
      .select("*")
      .or(`hall_id.in.(${aliasIn}),hall_code.in.(${aliasIn})`);

    if (boothsError) {
      console.error("[expo/hall/[hallId]] booths fallback error:", boothsError);
    } else {
      boothRows = (boothsData ?? []) as BoothRow[];
    }
  }

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
    if (!isVisibleBooth(booth)) return acc;

    acc.push({
      ...booth,
      booth_id: slotBoothId,
      slot_code: slot.slot_id ?? null,
      source_hall_id: slot.hall_id ?? null,
    });

    return acc;
  }, []);

  const sponsorBooths = booths
    .filter((b) =>
      hallMeta.sponsorKey ? Boolean((b as Record<string, unknown>)[hallMeta.sponsorKey]) : false
    )
    .sort((a, b) => {
      const aOrder = Number(a.sponsor_sort_order ?? 999);
      const bOrder = Number(b.sponsor_sort_order ?? 999);
      return aOrder - bOrder;
    })
    .slice(0, 5)
    .map((b) => ({
      booth_id: resolveBoothId(b),
      name: resolveBoothName(b),
      intro: b.intro ?? null,
      region: b.region ?? null,
      category_primary: b.category_primary ?? null,
    }));

  const mappedSlots = slots.map((s) => {
    const slotBoothId = safe(s.booth_id, "");
    const booth = slotBoothId ? boothMap.get(slotBoothId) : null;
    const resolvedBoothId = slotBoothId && isUuid(slotBoothId) ? slotBoothId : "";

    return {
      ...s,
      hall_id: normalizeHallId(s.hall_id),
      booth_id: slotBoothId || null,
      slot_id: s.slot_id ?? null,
      slot_code: normalizeSlotCode(s.slot_id),
      booth_name: resolveBoothName(booth),
      category: booth?.category_primary ?? null,
      booth_intro: booth?.intro ?? booth?.description ?? null,
      detail_href: resolvedBoothId
        ? `/expo/booths/${encodeURIComponent(resolvedBoothId)}`
        : null,
    };
  });

  return (
    <main style={S.page}>
      <header style={S.header}>
        <div>
          <div style={S.kicker}>K-Agri Expo</div>
          <h1 style={S.title}>{hallMeta.title}</h1>
          <div style={S.sub}>
            전시장 프리미엄 스폰서와 주요 부스를 먼저 둘러보신 뒤, 아래 전시장
            지도를 통해 전체 부스를 확인하실 수 있습니다.
          </div>
        </div>

        <div style={S.actions}>
          <Link href="/expo/deals" style={S.btnHot}>
            🔥 EXPO 특가
          </Link>

          <Link href="/expo" style={S.btnGhost}>
            엑스포 홈
          </Link>
        </div>
      </header>

      <HallSponsorStrip
        title={`${hallMeta.title} TOP 5 프리미엄 스폰서`}
        items={sponsorBooths as any}
      />

      <section style={S.mapWrap}>
        <ExpoHallMapClient slots={mappedSlots as any} />
      </section>
    </main>
  );
}

const S: Record<string, CSSProperties> = {
  page: {
    padding: 20,
    minHeight: "100vh",
    background: "#fff",
  },

  header: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },

  kicker: {
    fontSize: 12,
    fontWeight: 900,
    color: "#ef4444",
  },

  title: {
    margin: "6px 0 0",
    fontSize: 28,
    fontWeight: 950,
    letterSpacing: -0.2,
  },

  sub: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    fontWeight: 800,
    lineHeight: 1.7,
    maxWidth: 760,
  },

  actions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },

  btnHot: {
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 950,
    textDecoration: "none",
    background: "#111",
    color: "#fff",
    border: "1px solid #111",
  },

  btnGhost: {
    padding: "10px 14px",
    borderRadius: 999,
    fontWeight: 950,
    textDecoration: "none",
    background: "#f9fafb",
    color: "#111",
    border: "1px solid #eee",
  },

  mapWrap: {
    maxWidth: 1200,
    margin: "18px auto 0",
    border: "1px solid #eee",
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
  },
};