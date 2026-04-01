import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/authz";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function VendorHome() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login/vendor");
  if (!profile || profile.role !== "vendor") redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [{ data: vendor }, { data: latestApplication }] = await Promise.all([
    supabase
      .from("vendors")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),

    supabase
      .from("vendor_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // 1) 승인 완료면 바로 운영 대시보드
  if (vendor?.status === "approved") {
    redirect("/vendor/dashboard");
  }

  // 2) 입점 신청 기록이 전혀 없으면: 시작 화면
  if (!latestApplication) {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <div style={S.kicker}>VENDOR HOME</div>
          <h1 style={S.title}>업체 홈</h1>
          <p style={S.desc}>
            업체 계정은 생성되었습니다. 이제 입점 신청을 하시면 관리자 검토 후 부스 운영이 열립니다.
          </p>

          <div style={S.buttonRow}>
            <Link href="/vendor/apply" style={S.primaryBtn}>
              입점 신청하기 →
            </Link>
          </div>

          <div style={S.infoBox}>
            <div style={S.infoTitle}>진행 순서</div>
            <ul style={S.infoList}>
              <li>1. 업체 회원가입</li>
              <li>2. 입점 신청서 작성</li>
              <li>3. 관리자 검토</li>
              <li>4. 승인 후 부스 운영 시작</li>
            </ul>
          </div>
        </div>
      </main>
    );
  }

  const applicationStatus = latestApplication.status || "pending";

  // 3) 검토 중
  if (applicationStatus === "pending") {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <div style={S.kicker}>VENDOR HOME</div>
          <h1 style={S.title}>입점 검토 중</h1>
          <p style={S.desc}>
            입점 신청이 접수되어 현재 관리자 검토 중입니다. 승인 후 부스 운영이 열립니다.
          </p>

          <div style={S.statusBox}>
            <div style={S.statusLabel}>현재 상태</div>
            <div style={S.statusValuePending}>검토 중</div>
          </div>

          <div style={S.buttonRow}>
            <Link href="/vendor/apply" style={S.secondaryBtn}>
              신청 내용 다시 보기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 4) 반려됨
  if (applicationStatus === "rejected") {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <div style={S.kicker}>VENDOR HOME</div>
          <h1 style={S.title}>입점 반려</h1>
          <p style={S.desc}>
            입점 신청이 반려되었습니다. 내용을 보완한 뒤 다시 신청해 주세요.
          </p>

          <div style={S.statusBox}>
            <div style={S.statusLabel}>현재 상태</div>
            <div style={S.statusValueRejected}>반려</div>
          </div>

          {latestApplication.admin_note ? (
            <div style={S.noteBox}>
              <div style={S.noteTitle}>관리자 메모</div>
              <div style={S.noteText}>{latestApplication.admin_note}</div>
            </div>
          ) : null}

          <div style={S.buttonRow}>
            <Link href="/vendor/apply" style={S.primaryBtn}>
              다시 신청하기 →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 5) 신청서는 approved인데 vendor.status 반영이 늦은 경우 대비
  if (applicationStatus === "approved") {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <div style={S.kicker}>VENDOR HOME</div>
          <h1 style={S.title}>승인 완료</h1>
          <p style={S.desc}>
            입점 승인이 완료되었습니다. 부스와 상품 운영 화면으로 이동하실 수 있습니다.
          </p>

          <div style={S.statusBox}>
            <div style={S.statusLabel}>현재 상태</div>
            <div style={S.statusValueApproved}>승인 완료</div>
          </div>

          <div style={S.buttonRow}>
            <Link href="/vendor/dashboard" style={S.primaryBtn}>
              대시보드로 이동 →
            </Link>
            <Link href="/vendor/booth" style={S.secondaryBtn}>
              부스 관리
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 예외 상황 fallback
  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>VENDOR HOME</div>
        <h1 style={S.title}>업체 홈</h1>
        <p style={S.desc}>
          현재 상태를 불러오는 중입니다. 문제가 계속되면 다시 로그인해 주세요.
        </p>

        <div style={S.buttonRow}>
          <Link href="/vendor/apply" style={S.secondaryBtn}>
            입점 신청 페이지
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
    padding: "40px 20px",
  },
  card: {
    maxWidth: 860,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
    border: "1px solid #e5e7eb",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
    letterSpacing: 0.4,
  },
  title: {
    margin: "10px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 16,
    fontSize: 16,
    lineHeight: 1.8,
    color: "#475569",
  },
  buttonRow: {
    marginTop: 24,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryBtn: {
    textDecoration: "none",
    background: "#111827",
    color: "#fff",
    padding: "14px 18px",
    borderRadius: 12,
    fontWeight: 900,
    display: "inline-block",
  },
  secondaryBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    padding: "14px 18px",
    borderRadius: 12,
    fontWeight: 900,
    display: "inline-block",
  },
  infoBox: {
    marginTop: 24,
    padding: 18,
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
  },
  infoList: {
    marginTop: 10,
    paddingLeft: 18,
    color: "#475569",
    lineHeight: 1.9,
    fontSize: 14,
  },
  statusBox: {
    marginTop: 22,
    padding: 18,
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: 900,
    color: "#64748b",
  },
  statusValuePending: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 950,
    color: "#b45309",
  },
  statusValueRejected: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 950,
    color: "#b91c1c",
  },
  statusValueApproved: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: 950,
    color: "#15803d",
  },
  noteBox: {
    marginTop: 18,
    padding: 18,
    borderRadius: 16,
    background: "#fff7ed",
    border: "1px solid #fed7aa",
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#9a3412",
  },
  noteText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#7c2d12",
  },
};