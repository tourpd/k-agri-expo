import Link from "next/link";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

function safe(v: any, fallback = "-") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s : fallback;
}

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
}

export default async function AdminLeadsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/admin");
  }

  const admin = createSupabaseAdminClient();

  const { data: leads } = await admin
    .from("expo_consult_leads")
    .select(`
      lead_id,
      created_at,
      user_name,
      phone,
      region,
      city,
      crop,
      category,
      problem_name,
      urgency_level,
      purchase_intent,
      question_text,
      status,
      assigned_vendor_count,
      conversion_status,
      conversion_amount
    `)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = leads ?? [];

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.top}>
          <div>
            <div style={S.kicker}>ADMIN LEADS</div>
            <h1 style={S.title}>상담 리드 대시보드</h1>
            <div style={S.desc}>
              상담 유입, 자동 배정, 전환 상태를 한 번에 확인합니다.
            </div>
          </div>
        </div>

        {rows.length === 0 ? (
          <div style={S.empty}>아직 리드가 없습니다.</div>
        ) : (
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>접수시각</th>
                  <th style={S.th}>이름</th>
                  <th style={S.th}>연락처</th>
                  <th style={S.th}>지역</th>
                  <th style={S.th}>작물</th>
                  <th style={S.th}>카테고리</th>
                  <th style={S.th}>문제</th>
                  <th style={S.th}>긴급도</th>
                  <th style={S.th}>구매의도</th>
                  <th style={S.th}>배정수</th>
                  <th style={S.th}>상태</th>
                  <th style={S.th}>전환</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: any) => (
                  <tr key={row.lead_id}>
                    <td style={S.td}>{fmtDate(row.created_at)}</td>
                    <td style={S.td}>{safe(row.user_name)}</td>
                    <td style={S.td}>{safe(row.phone)}</td>
                    <td style={S.td}>
                      {safe(row.region)}
                      {row.city ? ` / ${row.city}` : ""}
                    </td>
                    <td style={S.td}>{safe(row.crop)}</td>
                    <td style={S.td}>{safe(row.category)}</td>
                    <td style={S.td}>{safe(row.problem_name)}</td>
                    <td style={S.td}>{safe(row.urgency_level)}</td>
                    <td style={S.td}>{safe(row.purchase_intent)}</td>
                    <td style={S.td}>{row.assigned_vendor_count ?? 0}</td>
                    <td style={S.td}>{safe(row.status)}</td>
                    <td style={S.td}>
                      {row.conversion_status === "won"
                        ? `완료 / ${row.conversion_amount ? Number(row.conversion_amount).toLocaleString("ko-KR") + "원" : "-"}`
                        : safe(row.conversion_status, "-")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={S.bottomLinks}>
          <Link href="/expo/admin" style={S.ghostBtn}>
            ← 관리자 홈
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
    maxWidth: 1440,
    margin: "0 auto",
  },
  top: {
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#64748b",
  },
  empty: {
    padding: 18,
    borderRadius: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#64748b",
  },
  tableWrap: {
    overflowX: "auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1200,
  },
  th: {
    textAlign: "left",
    padding: 14,
    fontSize: 13,
    color: "#475569",
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  td: {
    padding: 14,
    fontSize: 14,
    color: "#111827",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
    lineHeight: 1.6,
  },
  bottomLinks: {
    marginTop: 16,
  },
  ghostBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 900,
    display: "inline-block",
  },
};