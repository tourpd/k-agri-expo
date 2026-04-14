import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVendorUser } from "@/lib/vendor-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type VendorRow = {
  company_name?: string | null;
  email?: string | null;
  tier?: string | null;
  verify_status?: string | null;
  approved_at?: string | null;
};

type ApplicationRow = {
  id?: string | null;
  application_id?: string | null;
  application_code?: string | null;
  user_id?: string | null;
  status?: string | null;
  admin_note?: string | null;
  company_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;
  booth_type?: string | null;
  duration_key?: string | null;
  amount_krw?: number | null;
  desired_hall?: string | null;
  desired_slot_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

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

function formatMoney(value?: number | null) {
  if (typeof value !== "number") return "-";
  return `${value.toLocaleString("ko-KR")}원`;
}

function statusLabel(value?: string | null) {
  const v = safe(value, "").toLowerCase();

  if (v === "approved") return "승인 완료";
  if (v === "pending") return "검토 중";
  if (v === "submitted") return "접수 완료";
  if (v === "rejected") return "반려";
  if (v === "revision_requested") return "보완 요청";
  if (v === "needs_revision") return "보완 필요";

  return value ? value : "-";
}

function boothTypeLabel(value?: string | null) {
  const v = safe(value, "").toLowerCase();

  if (v === "free") return "무료 체험";
  if (v === "basic" || v === "general") return "일반 부스";
  if (v === "premium") return "프리미엄 부스";
  if (v === "brand") return "브랜드형";
  if (v === "promo") return "특가형";

  return value ? value : "-";
}

function hallLabel(value?: string | null) {
  const v = safe(value, "").toLowerCase();

  if (v === "agri-inputs" || v === "agri_inputs") return "농자재관";
  if (v === "machines" || v === "machinery") return "농기계관";
  if (v === "seeds" || v === "seed") return "종자관";
  if (v === "smartfarm" || v === "smart_farm" || v === "smart-farm") return "스마트팜관";
  if (v === "eco-friendly" || v === "eco_friendly") return "친환경관";
  if (v === "future-insect" || v === "future_insect") return "미래 곤충관";

  return value ? value : "-";
}

function durationLabel(value?: string | null) {
  const v = safe(value, "").toLowerCase();

  if (v === "1m") return "1개월";
  if (v === "3m") return "3개월";
  if (v === "6m") return "6개월";
  if (v === "12m") return "12개월";

  return value ? value : "-";
}

export default async function VendorApplicationStatusPage() {
  const session = await requireVendorUser();
  const userId = safe(session.user_id, "");

  if (!userId) {
    redirect("/vendor/login");
  }

  const supabase = createSupabaseAdminClient();

  const [{ data: vendor }, { data: application }, { data: booth }] = await Promise.all([
    supabase
      .from("vendors")
      .select("company_name,email,tier,verify_status,approved_at")
      .eq("user_id", userId)
      .maybeSingle(),

    supabase
      .from("vendor_applications_v2")
      .select(`
        id,
        application_id,
        application_code,
        user_id,
        status,
        admin_note,
        company_name,
        contact_name,
        phone,
        email,
        booth_type,
        duration_key,
        amount_krw,
        desired_hall,
        desired_slot_code,
        created_at,
        updated_at
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("booths")
      .select("booth_id")
      .eq("vendor_user_id", userId)
      .limit(1)
      .maybeSingle(),
  ]);

  const vendorRow = (vendor ?? null) as VendorRow | null;
  const appRow = (application ?? null) as ApplicationRow | null;
  const boothId = safe(booth?.booth_id, "");

  if (!appRow) {
    return (
      <main style={S.page}>
        <div style={S.wrap}>
          <div style={S.card}>
            <div style={S.kicker}>APPLICATION STATUS</div>
            <h1 style={S.title}>신청 내역이 없습니다</h1>
            <p style={S.desc}>
              아직 제출된 입점 신청서가 없습니다. 신규 업체라면 아래에서 신청을 시작해 주세요.
            </p>

            <div style={S.buttonRow}>
              <Link href="/vendor/apply" style={S.primaryBtn}>
                입점 신청하기 →
              </Link>
              <Link href="/vendor" style={S.secondaryBtn}>
                업체 상태 화면으로
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const applicationStatus = safe(appRow.status, "");
  const verifyStatus = safe(vendorRow?.verify_status, "");
  const companyName =
    safe(appRow.company_name, "") || safe(vendorRow?.company_name, "") || "업체";

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.card}>
          <div style={S.kicker}>APPLICATION STATUS</div>
          <h1 style={S.title}>입점 신청 상태</h1>
          <p style={S.desc}>
            <b>{companyName}</b> 업체의 최신 입점 신청서와 현재 처리 상태를 확인할 수 있습니다.
          </p>

          <div style={S.statusHero}>
            <div style={S.statusHeroCard}>
              <div style={S.statusHeroLabel}>신청 상태</div>
              <div style={S.statusHeroValue}>{statusLabel(applicationStatus)}</div>
            </div>

            <div style={S.statusHeroCard}>
              <div style={S.statusHeroLabel}>업체 승인 상태</div>
              <div
                style={
                  verifyStatus.toLowerCase() === "approved"
                    ? S.statusHeroValueApproved
                    : S.statusHeroValue
                }
              >
                {statusLabel(verifyStatus)}
              </div>
            </div>

            <div style={S.statusHeroCard}>
              <div style={S.statusHeroLabel}>부스 연결 상태</div>
              <div
                style={boothId ? S.statusHeroValueApproved : S.statusHeroValue}
              >
                {boothId ? "부스 연결 완료" : "부스 연결 대기"}
              </div>
            </div>
          </div>

          {safe(appRow.admin_note, "") ? (
            <div style={S.noteBox}>
              <div style={S.noteTitle}>관리자 메모</div>
              <div style={S.noteText}>{safe(appRow.admin_note, "")}</div>
            </div>
          ) : null}

          <div style={S.section}>
            <div style={S.sectionTitle}>신청 기본 정보</div>
            <div style={S.grid}>
              <div style={S.infoCard}>
                <div style={S.infoLabel}>신청 코드</div>
                <div style={S.infoValue}>{safe(appRow.application_code, "-")}</div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>회사명</div>
                <div style={S.infoValue}>{companyName}</div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>담당자명</div>
                <div style={S.infoValue}>{safe(appRow.contact_name, "-")}</div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>연락처</div>
                <div style={S.infoValue}>{safe(appRow.phone, "-")}</div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>이메일</div>
                <div style={S.infoValue}>
                  {safe(appRow.email, "") || safe(vendorRow?.email, "-")}
                </div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>요금제</div>
                <div style={S.infoValue}>{boothTypeLabel(vendorRow?.tier)}</div>
              </div>
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>희망 입점 정보</div>
            <div style={S.grid}>
              <div style={S.infoCard}>
                <div style={S.infoLabel}>부스 유형</div>
                <div style={S.infoValue}>{boothTypeLabel(appRow.booth_type)}</div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>이용 기간</div>
                <div style={S.infoValue}>{durationLabel(appRow.duration_key)}</div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>희망 전시장</div>
                <div style={S.infoValue}>{hallLabel(appRow.desired_hall)}</div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>희망 위치</div>
                <div style={S.infoValue}>{safe(appRow.desired_slot_code, "-")}</div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>결제 예정 금액</div>
                <div style={S.infoValue}>{formatMoney(appRow.amount_krw)}</div>
              </div>
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sectionTitle}>처리 이력</div>
            <div style={S.grid}>
              <div style={S.infoCard}>
                <div style={S.infoLabel}>신청 접수 시각</div>
                <div style={S.infoValue}>{formatDateTime(appRow.created_at)}</div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>최근 수정 시각</div>
                <div style={S.infoValue}>{formatDateTime(appRow.updated_at)}</div>
              </div>

              <div style={S.infoCard}>
                <div style={S.infoLabel}>승인 시각</div>
                <div style={S.infoValue}>{formatDateTime(vendorRow?.approved_at)}</div>
              </div>
            </div>
          </div>

          <div style={S.buttonRow}>
            <Link href="/vendor" style={S.primaryBtn}>
              상태 다시 확인
            </Link>

            {boothId ? (
              <Link href="/vendor/manage" style={S.secondaryBtn}>
                부스 관리로 이동
              </Link>
            ) : (
              <Link href="/vendor/waiting" style={S.secondaryBtn}>
                부스 준비 상태 보기
              </Link>
            )}

            {(applicationStatus === "rejected" ||
              applicationStatus === "revision_requested" ||
              applicationStatus === "needs_revision") && (
              <Link href="/vendor/apply" style={S.ghostBtn}>
                신청서 다시 작성
              </Link>
            )}
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
    maxWidth: 1100,
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
  statusHero: {
    marginTop: 24,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  statusHeroCard: {
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    padding: 18,
  },
  statusHeroLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  statusHeroValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 950,
    color: "#0f172a",
    lineHeight: 1.4,
    wordBreak: "break-all",
  },
  statusHeroValueApproved: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: 950,
    color: "#15803d",
    lineHeight: 1.4,
    wordBreak: "break-all",
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
  section: {
    marginTop: 26,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 950,
    color: "#0f172a",
    marginBottom: 12,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  infoCard: {
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    padding: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  infoValue: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.7,
    wordBreak: "break-all",
  },
  buttonRow: {
    marginTop: 28,
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
  ghostBtn: {
    textDecoration: "none",
    background: "#f8fafc",
    color: "#111827",
    border: "1px solid #e5e7eb",
    padding: "14px 18px",
    borderRadius: 12,
    fontWeight: 900,
    display: "inline-block",
  },
};