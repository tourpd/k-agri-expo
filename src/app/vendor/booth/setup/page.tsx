import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type BoothRow = {
  booth_id: string;
  name?: string | null;
  booth_type?: string | null;
  assigned_hall?: string | null;
  assigned_slot_code?: string | null;
  plan_type?: string | null;
};

function cardTitle(type: string) {
  if (type === "product") return "대표상품형";
  if (type === "brand") return "브랜드형";
  return "특가형";
}

function cardDesc(type: string) {
  if (type === "product") {
    return "대표 제품 1~3개를 중심으로 보여주는 가장 기본적인 부스입니다. 대부분의 농자재 업체에 가장 잘 맞습니다.";
  }
  if (type === "brand") {
    return "회사 신뢰, 브랜드 스토리, 기술력, 대표 이미지와 영상을 중심으로 보여주는 부스입니다.";
  }
  return "엑스포 특가, 행사 상품, 이벤트 배너를 중심으로 전환을 높이는 행사형 부스입니다.";
}

function previewBullets(type: string) {
  if (type === "product") return ["대표상품 1~3개", "핵심 효능 강조", "상담 전환 중심"];
  if (type === "brand") return ["회사 소개 중심", "영상/스토리 강조", "신뢰 확보용"];
  return ["특가 상품 강조", "이벤트/할인 중심", "박람회형 전환"];
}

async function getMyBooth() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("booths")
    .select("booth_id,name,booth_type,assigned_hall,assigned_slot_code,plan_type,vendor_id")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data) return data as BoothRow;

  const fallback = await supabase
    .from("vendors")
    .select("vendor_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const vendorId = fallback.data?.vendor_id;
  if (!vendorId) return null;

  const boothFallback = await supabase
    .from("booths")
    .select("booth_id,name,booth_type,assigned_hall,assigned_slot_code,plan_type")
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (boothFallback.data ?? null) as BoothRow | null;
}

export default async function VendorBoothSetupPage() {
  const booth = await getMyBooth();

  if (!booth) {
    redirect("/vendor/apply");
  }

  const selectedType = booth.booth_type ?? "";

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.topBar}>
          <div>
            <div style={S.kicker}>MY BOOTH STUDIO</div>
            <h1 style={S.title}>부스 타입 선택</h1>
            <div style={S.sub}>
              먼저 부스의 기본 운영 방식을 선택하세요. 이후 로고, 상품, 배너, 소개를 이 타입에 맞게 꾸미게 됩니다.
            </div>
          </div>

          <div style={S.metaCard}>
            <div><b>부스명</b> {booth.name ?? "내 부스"}</div>
            <div><b>위치</b> {booth.assigned_hall ?? "-"} / {booth.assigned_slot_code ?? "-"}</div>
            <div><b>등급</b> {booth.plan_type ?? "free"}</div>
          </div>
        </div>

        <div style={S.grid}>
          {(["product", "brand", "promo"] as const).map((type) => {
            const active = selectedType === type;

            return (
              <section
                key={type}
                style={{
                  ...S.card,
                  ...(active ? S.cardActive : {}),
                }}
              >
                <div style={S.cardBadge}>{cardTitle(type)}</div>
                <h2 style={S.cardTitle}>{cardTitle(type)}</h2>
                <p style={S.cardDesc}>{cardDesc(type)}</p>

                <div style={S.previewBox}>
                  <div style={S.previewTitle}>이런 업체에 추천</div>
                  <ul style={S.ul}>
                    {previewBullets(type).map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </div>

                <form action="/api/vendor/booth/setup" method="post" style={{ marginTop: 18 }}>
                  <input type="hidden" name="booth_id" value={booth.booth_id} />
                  <input type="hidden" name="booth_type" value={type} />
                  <button type="submit" style={active ? S.btnActive : S.btn}>
                    {active ? "선택됨" : "이 타입으로 시작"}
                  </button>
                </form>
              </section>
            );
          })}
        </div>

        <div style={S.bottomActions}>
          <Link href="/vendor/dashboard" style={S.ghostBtn}>
            대시보드로
          </Link>

          <Link href={`/expo/vendor/booth-editor?booth_id=${encodeURIComponent(booth.booth_id)}`} style={S.primaryBtn}>
            부스 꾸미기 계속 →
          </Link>
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#fff", padding: 24 },
  wrap: { maxWidth: 1280, margin: "0 auto" },
  topBar: { display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", alignItems: "flex-start" },
  kicker: { fontSize: 12, fontWeight: 900, color: "#16a34a" },
  title: { margin: "8px 0 0", fontSize: 40, fontWeight: 950, color: "#0f172a" },
  sub: { marginTop: 12, maxWidth: 780, fontSize: 16, lineHeight: 1.8, color: "#64748b" },
  metaCard: {
    minWidth: 280,
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    background: "#f8fafc",
    lineHeight: 1.9,
    color: "#334155",
    fontSize: 14,
  },
  grid: {
    marginTop: 28,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
    gap: 18,
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 22,
    background: "#fff",
    boxShadow: "0 10px 24px rgba(15,23,42,0.05)",
  },
  cardActive: {
    border: "2px solid #16a34a",
    background: "#f0fdf4",
  },
  cardBadge: {
    display: "inline-block",
    padding: "7px 10px",
    borderRadius: 999,
    background: "#e2e8f0",
    color: "#334155",
    fontWeight: 900,
    fontSize: 12,
  },
  cardTitle: { marginTop: 16, fontSize: 28, fontWeight: 950, color: "#0f172a" },
  cardDesc: { marginTop: 10, fontSize: 15, lineHeight: 1.8, color: "#475569" },
  previewBox: {
    marginTop: 18,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
    padding: 14,
  },
  previewTitle: { fontSize: 13, fontWeight: 900, color: "#0f172a" },
  ul: { margin: "10px 0 0", paddingLeft: 18, lineHeight: 1.9, color: "#334155", fontSize: 14 },
  btn: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    cursor: "pointer",
  },
  btnActive: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 14,
    background: "#16a34a",
    color: "#fff",
    fontWeight: 900,
    border: "none",
    cursor: "pointer",
  },
  bottomActions: {
    marginTop: 26,
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  ghostBtn: {
    textDecoration: "none",
    padding: "13px 16px",
    borderRadius: 12,
    border: "1px solid #e5e7eb",
    color: "#0f172a",
    fontWeight: 900,
    background: "#fff",
  },
  primaryBtn: {
    textDecoration: "none",
    padding: "13px 16px",
    borderRadius: 12,
    color: "#fff",
    fontWeight: 900,
    background: "#0f172a",
  },
};