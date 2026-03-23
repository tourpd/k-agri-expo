import { notFound } from "next/navigation";
import Link from "next/link";
import HallSponsorStrip from "@/components/expo/HallSponsorStrip";
import ExpoHallMapClient from "@/components/expo/ExpoHallMapClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getFeatureSlots } from "@/lib/expoFeatureSlots";

export const dynamic = "force-dynamic";

function getHallTitle(hallId: string) {
  switch (hallId) {
    case "agri-inputs":
      return "농자재관";
    case "machines":
      return "농기계관";
    case "seeds":
      return "종자관";
    case "smartfarm":
      return "스마트팜관";
    default:
      return hallId;
  }
}

function getSlotGroupByHall(hallId: string) {
  switch (hallId) {
    case "agri-inputs":
      return "hall_inputs_top";
    case "machines":
      return "hall_machine_top";
    case "seeds":
      return "hall_seed_top";
    case "smartfarm":
      return "hall_smartfarm_top";
    default:
      return "";
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ hallId: string }>;
}) {
  const { hallId } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: booths } = await supabase
    .from("booths")
    .select("*")
    .eq("hall_id", hallId);

  const { data: slots } = await supabase
    .from("hall_booth_slots")
    .select("*")
    .eq("hall_id", hallId);

  if (!booths || !slots) {
    notFound();
  }

  const slotGroup = getSlotGroupByHall(hallId);

  let featureItems: any[] = [];
  if (slotGroup) {
    try {
      featureItems = await getFeatureSlots(slotGroup, 5);
    } catch {
      featureItems = [];
    }
  }

  const mappedSlots = slots.map((s: any) => {
    const booth = booths.find((b: any) => b.booth_id === s.booth_id);

    return {
      ...s,
      booth_name: booth?.name ?? null,
      category: booth?.category_primary ?? null,
    };
  });

  const hallTitle = getHallTitle(hallId);

  return (
    <main style={S.page}>
      <header style={S.header}>
        <div>
          <div style={S.kicker}>K-Agri Expo</div>
          <h1 style={S.title}>{hallTitle}</h1>
          <div style={S.sub}>
            전시장 프리미엄 스폰서와 주요 부스를 먼저 둘러보신 뒤, 아래 전시장 지도를 통해 전체 부스를 확인하실 수 있습니다.
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
        title={`${hallTitle} TOP 5 프리미엄 스폰서`}
        items={featureItems}
      />

      <section style={S.mapWrap}>
        <ExpoHallMapClient slots={mappedSlots} />
      </section>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
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
  kicker: { fontSize: 12, fontWeight: 900, color: "#ef4444" },
  title: { margin: "6px 0 0", fontSize: 28, fontWeight: 950, letterSpacing: -0.2 },
  sub: {
    marginTop: 8,
    fontSize: 13,
    color: "#666",
    fontWeight: 800,
    lineHeight: 1.7,
    maxWidth: 760,
  },
  actions: { display: "flex", gap: 10, flexWrap: "wrap" },
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