import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVendorUser } from "@/lib/vendor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type VendorRow = {
  user_id?: string | null;
  verify_status?: string | null;
  company_name?: string | null;
  tier?: string | null;
  approved_at?: string | null;
  created_at?: string | null;
};

type VendorApplicationRow = {
  id?: string | null;
  application_id?: string | null;
  user_id?: string | null;
  status?: string | null;
  admin_note?: string | null;
  created_at?: string | null;
};

type BoothRow = {
  booth_id?: string | null;
  vendor_user_id?: string | null;
  status?: string | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
  is_published?: boolean | null;
  created_at?: string | null;
};

function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

export default async function VendorHome() {
  const session = await requireVendorUser();
  const userId = safe(session.user_id, "");

  if (!userId) {
    redirect("/vendor/login");
  }

  const supabase = createSupabaseAdminClient();

  const [{ data: vendor }, { data: latestApplication }, { data: booths }] =
    await Promise.all([
      supabase
        .from("vendors")
        .select("user_id,verify_status,company_name,tier,approved_at,created_at")
        .eq("user_id", userId)
        .maybeSingle(),

      supabase
        .from("vendor_applications_v2")
        .select("id,application_id,user_id,status,admin_note,created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from("booths")
        .select("booth_id,vendor_user_id,status,is_public,is_active,is_published,created_at")
        .eq("vendor_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

  const vendorRow = (vendor ?? null) as VendorRow | null;
  const applicationRow = (latestApplication ?? null) as VendorApplicationRow | null;
  const boothRows = (booths ?? []) as BoothRow[];
  const boothRow = boothRows.length > 0 ? boothRows[0] : null;

  const vendorStatus = safe(vendorRow?.verify_status, "").toLowerCase();
  const applicationStatus = safe(applicationRow?.status, "").toLowerCase();
  const boothId = safe(boothRow?.booth_id, "");

  console.log("[vendor/page] userId =", userId);
  console.log("[vendor/page] vendorRow =", vendorRow);
  console.log("[vendor/page] applicationRow =", applicationRow);
  console.log("[vendor/page] boothCount =", boothRows.length);
  console.log("[vendor/page] boothRow =", boothRow);

  // 1) 부스가 있으면 기존 업체로 판단 → 바로 운영 페이지
  if (boothId) {
    redirect("/vendor/manage");
  }

  // 2) vendors 승인 상태인데 부스만 아직 없으면 대기 페이지
  if (vendorStatus === "approved") {
    redirect("/vendor/waiting");
  }

  // 3) 신청 기록이 전혀 없으면: 신규 업체 시작 화면
  if (!applicationRow) {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <div style={S.kicker}>VENDOR HOME</div>
          <h1 style={S.title}>업체 홈</h1>
          <p style={S.desc}>
            업체 계정은 생성되었습니다. 이제 입점 신청을 하시면 관리자 검토 후
            부스 운영이 열립니다.
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

  // 4) 검토 중
  if (
    applicationStatus === "pending" ||
    applicationStatus === "submitted" ||
    applicationStatus === "review" ||
    applicationStatus === "under_review"
  ) {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <div style={S.kicker}>VENDOR HOME</div>
          <h1 style={S.title}>입점 검토 중</h1>
          <p style={S.desc}>
            입점 신청이 접수되어 현재 관리자 검토 중입니다. 승인 후 부스 운영이
            열립니다.
          </p>

          <div style={S.statusBox}>
            <div style={S.statusLabel}>현재 상태</div>
            <div style={S.statusValuePending}>검토 중</div>
          </div>

          <div style={S.buttonRow}>
            <Link href="/vendor/application-status" style={S.secondaryBtn}>
              신청 상태 보기
            </Link>
            <Link href="/vendor/apply" style={S.secondaryBtn}>
              신청 내용 보기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 5) 반려 / 보완 요청
  if (
    applicationStatus === "rejected" ||
    applicationStatus === "revision_requested" ||
    applicationStatus === "needs_revision"
  ) {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <div style={S.kicker}>VENDOR HOME</div>
          <h1 style={S.title}>입점 보완 필요</h1>
          <p style={S.desc}>
            입점 신청이 반려되었거나 보완 요청 상태입니다. 내용을 수정한 뒤 다시
            신청해 주세요.
          </p>

          <div style={S.statusBox}>
            <div style={S.statusLabel}>현재 상태</div>
            <div style={S.statusValueRejected}>보완 필요</div>
          </div>

          {safe(applicationRow?.admin_note, "") ? (
            <div style={S.noteBox}>
              <div style={S.noteTitle}>관리자 메모</div>
              <div style={S.noteText}>{safe(applicationRow?.admin_note, "")}</div>
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

  // 6) 신청서는 approved인데 booth 생성 전
  if (applicationStatus === "approved") {
    return (
      <main style={S.page}>
        <div style={S.card}>
          <div style={S.kicker}>VENDOR HOME</div>
          <h1 style={S.title}>승인 완료</h1>
          <p style={S.desc}>
            입점 승인이 완료되었습니다. 현재 부스 개설 또는 연결 작업을 준비
            중입니다.
          </p>

          <div style={S.statusBox}>
            <div style={S.statusLabel}>현재 상태</div>
            <div style={S.statusValueApproved}>승인 완료</div>
          </div>

          <div style={S.buttonRow}>
            <Link href="/vendor/waiting" style={S.primaryBtn}>
              준비 상태 보기 →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 7) 예외 fallback
  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>VENDOR HOME</div>
        <h1 style={S.title}>업체 홈</h1>
        <p style={S.desc}>
          현재 상태를 확인하는 중입니다. 문제가 계속되면 다시 로그인해 주세요.
        </p>

        <div style={S.buttonRow}>
          <Link href="/vendor/application-status" style={S.secondaryBtn}>
            신청 상태 보기
          </Link>
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