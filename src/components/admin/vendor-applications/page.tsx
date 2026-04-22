import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import VendorDangerActions from "@/components/admin/VendorDangerActions";

export const dynamic = "force-dynamic";

export default async function ExpoAdminVendorApplicationsPage() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("vendors")
    .select("id,user_id,email,company_name,tier,verify_status,created_at,status")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main style={{ padding: 24 }}>
        <h1>업체 목록</h1>
        <div>불러오기 실패: {error.message}</div>
      </main>
    );
  }

  const rows = data ?? [];

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.top}>
          <div>
            <div style={S.kicker}>VENDOR ADMIN</div>
            <h1 style={S.title}>업체 관리</h1>
            <div style={S.desc}>
              승인, 보류, 비활성화, 완전삭제를 여기서 처리합니다.
            </div>
          </div>

          <Link href="/expo/admin" style={S.backBtn}>
            관리자 홈
          </Link>
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>업체명</th>
                <th style={S.th}>이메일</th>
                <th style={S.th}>등급</th>
                <th style={S.th}>상태</th>
                <th style={S.th}>가입일</th>
                <th style={S.th}>작업</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any) => (
                <tr key={row.id}>
                  <td style={S.tdStrong}>{row.company_name || "-"}</td>
                  <td style={S.td}>{row.email || "-"}</td>
                  <td style={S.td}>{row.tier || "-"}</td>
                  <td style={S.td}>{row.status || row.verify_status || "-"}</td>
                  <td style={S.td}>{fmtDate(row.created_at)}</td>
                  <td style={S.td}>
                    <VendorDangerActions
                      userId={row.user_id}
                      vendorName={row.company_name || "-"}
                      vendorEmail={row.email || "-"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 ? (
            <div style={S.empty}>등록된 업체가 없습니다.</div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
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
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.3,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.8,
    fontSize: 15,
  },
  backBtn: {
    textDecoration: "none",
    color: "#0f172a",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 900,
  },
  tableWrap: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 12px 28px rgba(15,23,42,0.05)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: 14,
    fontSize: 13,
    fontWeight: 950,
    color: "#475569",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  td: {
    padding: 14,
    fontSize: 14,
    color: "#334155",
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  },
  tdStrong: {
    padding: 14,
    fontSize: 15,
    color: "#0f172a",
    fontWeight: 900,
    borderBottom: "1px solid #f1f5f9",
    verticalAlign: "top",
  },
  empty: {
    padding: 18,
    color: "#64748b",
    fontSize: 14,
  },
};