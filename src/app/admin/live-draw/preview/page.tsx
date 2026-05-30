import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Prize = {
  id: string;
  title: string;
  sponsor: string | null;
  description: string | null;
  image_url: string | null;
  quantity: number | null;
  draw_type: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

export default async function LiveDrawPreviewPage() {
  const supabase = createSupabaseAdminClient();

  const eventId =
  typeof window !== "undefined"
    ? localStorage.getItem("current_event_id")
    : null;

  const { data: prizes, error } = await supabase
    .from("live_prizes")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <main style={styles.page}>
        <h1>방송용 미리보기 오류</h1>
        <pre>{error.message}</pre>
      </main>
    );
  }

  const bigPrizes = (prizes || []).filter((p) => p.draw_type === "phone");
  const boxPrizes = (prizes || []).filter((p) => p.draw_type !== "phone");

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.kicker}>K-AGRI LIVE DRAW PREVIEW</p>
        <h1 style={styles.title}>라이브 경품 방송 미리보기</h1>
        <p style={styles.desc}>
          방송 전에 경품 구성, 이미지, 추첨 순서, 당첨 수량을 확인하는 리허설 화면입니다.
        </p>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🏆 빅 이벤트 추첨</h2>
        <p style={styles.sectionDesc}>
          번호 추첨 후 전화 연결로 최종 당첨을 확정하는 메인 경품입니다.
        </p>

        <div style={styles.cardGrid}>
          {bigPrizes.length === 0 ? (
            <div style={styles.empty}>등록된 빅 이벤트 경품이 없습니다.</div>
          ) : (
            bigPrizes.map((item) => <PrizeCard key={item.id} item={item} />)
          )}
        </div>
      </section>

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>🎁 일반 경품 박스추첨</h2>
        <p style={styles.sectionDesc}>
          경품 수량만큼 박스가 열리고 고정 참여번호가 당첨번호로 표시됩니다.
        </p>

        <div style={styles.cardGrid}>
          {boxPrizes.length === 0 ? (
            <div style={styles.empty}>등록된 일반 경품이 없습니다.</div>
          ) : (
            boxPrizes.map((item) => <PrizeCard key={item.id} item={item} />)
          )}
        </div>
      </section>
    </main>
  );
}

function PrizeCard({ item }: { item: Prize }) {
  return (
    <article style={styles.card}>
      <div style={styles.imageBox}>
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.title} style={styles.image} />
        ) : (
          <span style={styles.noImage}>이미지 없음</span>
        )}
      </div>

      <div style={styles.cardBody}>
        <div style={styles.badge}>
          {item.draw_type === "phone" ? "전화추첨" : "박스추첨"}
        </div>

        <h3 style={styles.cardTitle}>{item.title}</h3>

        <p style={styles.meta}>협찬사: {item.sponsor || "-"}</p>
        <p style={styles.meta}>당첨 수량: {item.quantity || 1}명</p>
        <p style={styles.meta}>방송 추첨 순서: {item.sort_order || 0}</p>

        <p style={styles.description}>{item.description || "설명 없음"}</p>
      </div>
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #07111f, #111827)",
    color: "white",
    padding: 32,
  },

  hero: {
    maxWidth: 1180,
    margin: "0 auto 28px",
    textAlign: "center",
  },

  kicker: {
    color: "#86efac",
    fontWeight: 900,
    letterSpacing: "0.12em",
  },

  title: {
    margin: "10px 0",
    fontSize: 52,
    fontWeight: 950,
  },

  desc: {
    color: "#cbd5e1",
    fontSize: 18,
  },

  section: {
    maxWidth: 1180,
    margin: "0 auto 28px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 28,
    padding: 24,
  },

  sectionTitle: {
    margin: 0,
    fontSize: 32,
    fontWeight: 950,
  },

  sectionDesc: {
    color: "#cbd5e1",
    marginTop: 8,
  },

  cardGrid: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 18,
  },

  card: {
    background: "white",
    color: "#111827",
    borderRadius: 24,
    overflow: "hidden",
    boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
  },

  // ✅ 핵심 수정 1: 비율 고정
  imageBox: {
    width: "100%",
    aspectRatio: "1 / 1", // ⭐ 이게 핵심
    background: "#f8fafc",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  // ✅ 핵심 수정 2: 꽉 채우기
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover", // ⭐ 방송용 추천
  },

  noImage: {
    fontSize: 16,
    color: "#6b7280",
    fontWeight: 900,
  },

  cardBody: {
    padding: 18,
  },

  badge: {
    display: "inline-flex",
    padding: "7px 11px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 900,
    fontSize: 13,
  },

  cardTitle: {
    margin: "12px 0 10px",
    fontSize: 24,
    fontWeight: 950,
  },

  meta: {
    margin: "6px 0",
    fontWeight: 800,
    color: "#374151",
  },

  description: {
    marginTop: 12,
    color: "#6b7280",
    lineHeight: 1.5,
  },

  empty: {
    padding: 40,
    borderRadius: 18,
    background: "rgba(255,255,255,0.1)",
    color: "#cbd5e1",
    textAlign: "center",
    fontWeight: 900,
  },
};