import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ExpoCategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: category } = await supabase
    .from("expo_categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!category) {
    return (
      <main style={S.page}>
        <div style={S.wrap}>
          <h1 style={S.title}>카테고리를 찾을 수 없습니다.</h1>
          <Link href="/expo" style={S.ghostBtn}>엑스포 홈</Link>
        </div>
      </main>
    );
  }

  const { data: booths } = await supabase
    .from("booths")
    .select("*")
    .eq("category_primary", category.name)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.hero}>
          <div style={S.kicker}>CATEGORY</div>
          <h1 style={S.title}>{category.hero_title || category.name}</h1>
          <div style={S.desc}>
            {category.hero_desc || category.short_desc || "카테고리 소개 준비 중입니다."}
          </div>
        </div>

        {!booths || booths.length === 0 ? (
          <div style={S.empty}>등록된 부스가 아직 없습니다.</div>
        ) : (
          <div style={S.grid}>
            {booths.map((booth: any) => (
              <Link
                key={booth.booth_id}
                href={`/expo/booths/${booth.booth_id}`}
                style={S.card}
              >
                <div style={S.cardTitle}>{booth.name || "부스명 없음"}</div>
                <div style={S.cardMeta}>
                  {booth.region || "지역 미입력"} · {booth.category_primary || "카테고리 미입력"}
                </div>
                <div style={S.cardDesc}>
                  {booth.intro || "부스 소개 준비 중입니다."}
                </div>
                <div style={S.cardCta}>부스 들어가기 →</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 24,
  },
  wrap: {
    maxWidth: 1400,
    margin: "0 auto",
  },
  hero: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
  },
  title: {
    margin: "8px 0 0",
    fontSize: 38,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 12,
    color: "#64748b",
    lineHeight: 1.8,
    fontSize: 15,
  },
  empty: {
    padding: 20,
    borderRadius: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#64748b",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },
  card: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 18,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 950,
  },
  cardMeta: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
  },
  cardDesc: {
    marginTop: 12,
    fontSize: 14,
    color: "#334155",
    lineHeight: 1.7,
    minHeight: 56,
  },
  cardCta: {
    marginTop: 16,
    fontWeight: 950,
  },
  ghostBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#111",
    border: "1px solid #ddd",
    borderRadius: 12,
    padding: "12px 16px",
    display: "inline-block",
    fontWeight: 900,
  },
};