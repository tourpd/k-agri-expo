import Link from "next/link";
import type { CSSProperties } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EXPO_HALL_LIST } from "@/lib/expo/halls";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "전시관 | K-Agri Expo",
};

/** 전시관별 입점 부스 수 (불러오지 못해도 화면은 그대로) */
async function loadBoothCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  try {
    const supabase = createSupabaseAdminClient();
    const allIds = EXPO_HALL_LIST.flatMap((h) => h.dbHallIds);
    const { data, error } = await supabase
      .from("hall_booth_slots")
      .select("hall_id, booth_id")
      .in("hall_id", allIds)
      .not("booth_id", "is", null);

    if (error || !Array.isArray(data)) return counts;

    for (const hall of EXPO_HALL_LIST) {
      const ids = new Set(hall.dbHallIds);
      const booths = new Set(
        (data as Array<{ hall_id: string | null; booth_id: string | null }>)
          .filter((row) => row.hall_id && ids.has(row.hall_id) && row.booth_id)
          .map((row) => String(row.booth_id))
      );
      counts[hall.key] = booths.size;
    }
  } catch (error) {
    console.error("[expo/hall] booth count error:", error);
  }
  return counts;
}

export default async function ExpoHallIndexPage() {
  const counts = await loadBoothCounts();

  return (
    <div style={S.wrap}>
      <div style={S.eyebrow}>HALL</div>
      <h1 style={S.title}>전시관</h1>
      <p style={S.desc}>
        필요한 농사 문제에 맞는 전시관으로 들어가 기업 부스와 제품을 보고, 바로 상담을
        남길 수 있습니다.
      </p>

      <div style={S.grid}>
        {EXPO_HALL_LIST.map((hall) => {
          const count = counts[hall.key];
          return (
            <Link key={hall.key} href={hall.href} style={S.card}>
              <div style={S.cardHead}>
                <span style={S.icon}>{hall.icon}</span>
                {typeof count === "number" && count > 0 ? (
                  <span style={S.badge}>부스 {count}곳</span>
                ) : null}
              </div>
              <div style={S.cardTitle}>{hall.title}</div>
              <div style={S.cardDesc}>{hall.desc}</div>
              <div style={S.cta}>{hall.cta} →</div>
            </Link>
          );
        })}
      </div>

      <div style={S.more}>
        <Link href="/expo/booths" style={S.moreLink}>
          전체 부스 보기
        </Link>
        <Link href="/expo/deals" style={S.moreLink}>
          농민 특가 보기
        </Link>
      </div>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: { padding: "8px 0 40px" },
  eyebrow: { fontSize: 12, fontWeight: 900, color: "#16a34a", letterSpacing: 0.6 },
  title: { marginTop: 8, fontSize: 32, fontWeight: 950, color: "#0f172a", letterSpacing: -0.5 },
  desc: { marginTop: 10, fontSize: 15, lineHeight: 1.7, color: "#64748b", wordBreak: "keep-all" },
  grid: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: 12,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "16px 14px",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#fff",
    textDecoration: "none",
    color: "#0f172a",
    minHeight: 170,
  },
  cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 },
  icon: { fontSize: 26, lineHeight: 1 },
  badge: {
    fontSize: 12,
    fontWeight: 800,
    color: "#166534",
    background: "#dcfce7",
    borderRadius: 999,
    padding: "3px 8px",
    whiteSpace: "nowrap",
  },
  cardTitle: { marginTop: 4, fontSize: 17, fontWeight: 950, wordBreak: "keep-all" },
  cardDesc: { fontSize: 13, lineHeight: 1.55, color: "#64748b", wordBreak: "keep-all", flex: 1 },
  cta: { fontSize: 13, fontWeight: 900, color: "#15803d" },
  more: { marginTop: 24, display: "flex", gap: 10, flexWrap: "wrap" },
  moreLink: {
    padding: "12px 16px",
    borderRadius: 14,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    textDecoration: "none",
  },
};
