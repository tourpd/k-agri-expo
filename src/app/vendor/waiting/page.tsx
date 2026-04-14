import Link from "next/link";
import { requireVendorUser } from "@/lib/vendor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;

  return d.toLocaleString("ko-KR");
}

function planLabel(value?: string | null) {
  const v = safe(value, "").toLowerCase();

  if (v === "premium") return "프리미엄";
  if (v === "basic" || v === "general") return "일반";
  if (v === "free") return "무료 체험";

  return value ? value : "basic";
}

function statusLabel(value?: string | null) {
  const v = safe(value, "").toLowerCase();

  if (v === "approved") return "승인 완료";
  if (v === "pending") return "검토 중";
  if (v === "rejected") return "반려";
  if (v === "submitted") return "접수 완료";

  return value ? value : "-";
}

export default async function VendorWaitingPage() {
  const session = await requireVendorUser();
  const supabase = createSupabaseAdminClient();

  const userId = safe(session.user_id, "");

  const [{ data: vendor }, { data: latestApplication }] = await Promise.all([
    supabase
      .from("vendors")
      .select("company_name, verify_status, approved_at, tier")
      .eq("user_id", userId)
      .maybeSingle(),

    supabase
      .from("vendor_applications_v2")
      .select("status, created_at, admin_note")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const companyName = safe(vendor?.company_name, "업체");
  const verifyStatus = safe(vendor?.verify_status, "pending");
  const tier = safe(vendor?.tier, "basic");
  const approvedAt = safe(vendor?.approved_at, "");
  const applicationStatus = safe(latestApplication?.status, "");
  const adminNote = safe(latestApplication?.admin_note, "");

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.kicker}>VENDOR WAITING</div>
          <h1 style={S.title}>부스 준비 중입니다</h1>

          <p style={S.desc}>
            <b>{companyName}</b> 업체는 현재 승인 완료 상태입니다.
            <br />
            운영팀에서 부스 개설 또는 연결 작업을 진행하고 있으며, 연결이 완료되면
            부스 관리 화면으로 이동할 수 있습니다.
          </p>

          <div style={S.statusGrid}>
            <div style={S.statusCard}>
              <div style={S.statusLabel}>업체 승인 상태</div>
              <div style={S.statusValueApproved}>{statusLabel(verifyStatus)}</div>
            </div>

            <div style={S.statusCard}>
              <div style={S.statusLabel}>신청 상태</div>
              <div style={S.statusValue}>{statusLabel(applicationStatus)}</div>
            </div>

            <div style={S.statusCard}>
              <div style={S.statusLabel}>요금제</div>
              <div style={S.statusValue}>{planLabel(tier)}</div>
            </div>

            <div style={S.statusCard}>
              <div style={S.statusLabel}>승인 시각</div>
              <div style={S.statusValue}>{formatDateTime(approvedAt)}</div>
            </div>
          </div>

          {adminNote ? (
            <div style={S.noteBox}>
              <div style={S.noteTitle}>관리자 안내</div>
              <div style={S.noteText}>{adminNote}</div>
            </div>
          ) : null}

          <div style={S.infoBox}>
            <div style={S.infoTitle}>현재 진행 중인 단계</div>
            <ul style={S.infoList}>
              <li>업체 승인은 완료되었습니다.</li>
              <li>현재 부스 생성 또는 슬롯 연결을 준비하고 있습니다.</li>
              <li>연결이 끝나면 자동으로 부스 관리 화면으로 진입할 수 있습니다.</li>
            </ul>
          </div>

          <div style={S.buttonRow}>
            <Link href="/vendor" style={S.primaryBtn}>
              상태 다시 확인
            </Link>

            <Link href="/vendor/application-status" style={S.secondaryBtn}>
              신청서 상세 보기
            </Link>
          </div>
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
  wrap: {
    maxWidth: 920,
    margin: "0 auto",
  },
  card: {
    background: "#fff",
    borderRadius: 24,
    padding: 32,
    border: "1px solid #e5e7eb",
    boxShadow: "0 18px 40px rgba(15,23,42,0.06)",
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
  statusGrid: {
    marginTop: 24,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  statusCard: {
    borderRadius: 16,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 16,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  statusValue: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 900,
    color: "#0f172a",
    wordBreak: "break-all",
    lineHeight: 1.5,
  },
  statusValueApproved: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: 900,
    color: "#15803d",
    wordBreak: "break-all",
    lineHeight: 1.5,
  },
  noteBox: {
    marginTop: 20,
    padding: 18,
    borderRadius: 16,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: "#1d4ed8",
  },
  noteText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 1.8,
    color: "#1e3a8a",
  },
  infoBox: {
    marginTop: 22,
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
  buttonRow: {
    marginTop: 26,
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
};