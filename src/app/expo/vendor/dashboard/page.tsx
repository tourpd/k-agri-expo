import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function VendorDashboardPage() {
  const supabaseUser = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();

  if (!user) {
    redirect("/login/vendor");
  }

  const admin = createSupabaseAdminClient();

  const { data: vendor } = await admin
    .from("vendors")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: booth } = await admin
    .from("booths")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  const { count: productCount } = await admin
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("booth_id", booth?.booth_id || "___none___")
    .not("status", "eq", "deleted");

  const { count: inquiryCount } = await admin
    .from("expo_inquiries")
    .select("*", { count: "exact", head: true })
    .eq("booth_id", booth?.booth_id || "___none___");

  const { count: leadCount } = await admin
    .from("expo_leads")
    .select("*", { count: "exact", head: true })
    .eq("booth_id", booth?.booth_id || "___none___");

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.kicker}>VENDOR DASHBOARD</div>
        <h1 style={S.title}>{vendor?.company_name || "업체 대시보드"}</h1>
        <div style={S.desc}>
          승인 상태, 부스 상태, 제품/문의/리드 현황을 여기서 관리합니다.
        </div>

        <div style={S.statusBox}>
          <div style={S.statusItem}>
            <div style={S.statusLabel}>업체 상태</div>
            <div style={S.statusValue}>{vendor?.status || "-"}</div>
          </div>
          <div style={S.statusItem}>
            <div style={S.statusLabel}>승인 상태</div>
            <div style={S.statusValue}>{vendor?.verify_status || "-"}</div>
          </div>
          <div style={S.statusItem}>
            <div style={S.statusLabel}>부스 공개</div>
            <div style={S.statusValue}>{booth?.is_published ? "예" : "아니오"}</div>
          </div>
        </div>

        <div style={S.kpiGrid}>
          <div style={S.kpiCard}>
            <div style={S.kpiLabel}>등록 제품</div>
            <div style={S.kpiValue}>{productCount ?? 0}</div>
          </div>
          <div style={S.kpiCard}>
            <div style={S.kpiLabel}>문의 수</div>
            <div style={S.kpiValue}>{inquiryCount ?? 0}</div>
          </div>
          <div style={S.kpiCard}>
            <div style={S.kpiLabel}>리드 수</div>
            <div style={S.kpiValue}>{leadCount ?? 0}</div>
          </div>
        </div>

        <div style={S.menuGrid}>
          <Link href="/expo/vendor/apply" style={S.menuCard}>
            <div style={S.menuTitle}>입점 신청서 수정</div>
            <div style={S.menuDesc}>회사 정보와 기본 소개를 수정합니다.</div>
          </Link>

          <Link href="/expo/vendor/booth-editor" style={S.menuCard}>
            <div style={S.menuTitle}>부스 편집</div>
            <div style={S.menuDesc}>부스 소개, 연락처, 영상, 카탈로그를 수정합니다.</div>
          </Link>

          <Link href="/expo/vendor/products" style={S.menuCard}>
            <div style={S.menuTitle}>제품 관리</div>
            <div style={S.menuDesc}>제품 등록, 설명 수정, 이미지 연결을 관리합니다.</div>
          </Link>

          <Link href="/expo/vendor/inquiries" style={S.menuCard}>
            <div style={S.menuTitle}>문의 관리</div>
            <div style={S.menuDesc}>고객 문의를 확인하고 후속 응대를 관리합니다.</div>
          </Link>

          <Link href="/expo/vendor/leads" style={S.menuCard}>
            <div style={S.menuTitle}>리드 관리</div>
            <div style={S.menuDesc}>관심 고객과 특가 연결 리드를 확인합니다.</div>
          </Link>

          <Link href="/expo/booths" style={S.menuCard}>
            <div style={S.menuTitle}>공개 부스 보기</div>
            <div style={S.menuDesc}>실제 노출 화면에서 내 부스를 확인합니다.</div>
          </Link>
        </div>
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
    maxWidth: 1200,
    margin: "0 auto",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
    letterSpacing: 0.4,
  },
  title: {
    margin: "10px 0 0",
    fontSize: 36,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 10,
    fontSize: 15,
    color: "#64748b",
    lineHeight: 1.8,
  },
  statusBox: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },
  statusItem: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  statusValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 950,
    color: "#0f172a",
  },
  kpiGrid: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },
  kpiCard: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  kpiValue: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: 950,
    color: "#0f172a",
  },
  menuGrid: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 14,
  },
  menuCard: {
    display: "block",
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 12px 24px rgba(15,23,42,0.04)",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
  },
  menuDesc: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 1.7,
    color: "#64748b",
  },
};