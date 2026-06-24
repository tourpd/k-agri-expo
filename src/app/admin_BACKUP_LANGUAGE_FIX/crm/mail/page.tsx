// src/app/admin/crm/mail/page.tsx
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { CSSProperties } from "react";
import GmailPullButton from "./GmailPullButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Row = {
  id: string;
  channel?: string | null;
  category?: string | null;
  business_area?: string | null;
  contact_name?: string | null;
  company_name?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  content?: string | null;
  ai_summary?: string | null;
  ai_action?: string | null;
  priority?: string | null;
  estimated_value?: number | null;
  status?: string | null;
  assigned_to?: string | null;
  created_at?: string | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function money(v: unknown) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n <= 0) return "-";
  return `${n.toLocaleString()}원`;
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

function badgeStyle(v?: string | null): CSSProperties {
  const p = safe(v).toUpperCase();
  if (p === "S") return S.sBadge;
  if (p === "A") return S.aBadge;
  if (p === "B") return S.bBadge;
  return S.cBadge;
}

function isVisibleLead(r: Row) {
  const category = safe(r.category).toUpperCase();
  const businessArea = safe(r.business_area).toUpperCase();
  const priority = safe(r.priority).toUpperCase();

  if (["SYSTEM", "SPAM", "NEWSLETTER"].includes(category)) return false;
  if (["ETC", "GENERAL"].includes(category) && !["S", "A", "B"].includes(priority)) {
    return false;
  }
  if (businessArea === "GENERAL" && category === "ETC") return false;

  return true;
}

async function getRows() {
  const { data, error } = await supabase
    .from("crm_inbox")
    .select("*")
    .in("channel", ["email", "mail", "buyer", "manual"])
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return { rows: [] as Row[], hiddenCount: 0, error: error.message };
  }

  const allRows = (data || []) as Row[];
  const rows = allRows.filter(isVisibleLead);

  return {
    rows,
    hiddenCount: allRows.length - rows.length,
    error: "",
  };
}

export default async function CrmMailPage() {
  const { rows, hiddenCount, error } = await getRows();

  const total = rows.length;
  const buyerCount = rows.filter((r) => safe(r.category).toUpperCase() === "BUYER").length;
  const vendorCount = rows.filter((r) => safe(r.category).toUpperCase() === "VENDOR").length;
  const oemCount = rows.filter((r) => safe(r.category).toUpperCase() === "OEM").length;
  const sCount = rows.filter((r) => safe(r.priority).toUpperCase() === "S").length;
  const totalValue = rows.reduce((sum, r) => sum + Number(r.estimated_value || 0), 0);

  return (
    <main style={S.page}>
      <section style={S.header}>
        <div>
          <div style={S.kicker}>K-AGRI AI MAIL CRM</div>
          <h1 style={S.title}>CRM 메일함</h1>
          <p style={S.desc}>
            바이어 메일, 입점 문의, OEM 문의, 수출 문의를 AI가 분류한 결과를 확인합니다.
          </p>
        </div>

        <div style={S.headerLinks}>
          <GmailPullButton />
          <Link href="/admin/crm/inbox/new" style={S.purpleLink}>
            메일 수동등록
          </Link>
          <Link href="/admin/crm/inbox" style={S.darkLink}>
            통합수신함
          </Link>
        </div>
      </section>

      {error ? <section style={S.errorBox}>{error}</section> : null}

      <section style={S.stats}>
        <Stat label="유효 메일" value={`${total}건`} />
        <Stat label="S급" value={`${sCount}건`} />
        <Stat label="바이어" value={`${buyerCount}건`} />
        <Stat label="입점" value={`${vendorCount}건`} />
        <Stat label="OEM" value={`${oemCount}건`} />
        <Stat label="예상 거래액" value={money(totalValue)} />
      </section>

      <section style={S.mailAddressBox}>
        <div style={S.mailBoxTop}>
          <b>추천 운영 메일</b>
          <span>시스템/뉴스레터 제외 {hiddenCount}건</span>
        </div>

        <div style={S.mailGrid}>
          <Mini label="바이어" value="buyer@kagri-expo.com" />
          <Mini label="입점" value="vendor@kagri-expo.com" />
          <Mini label="수출" value="export@kagri-expo.com" />
          <Mini label="OEM" value="oem@kagri-expo.com" />
          <Mini label="고객지원" value="support@kagri-expo.com" />
          <Mini label="대표" value="ceo@kagri-expo.com" />
        </div>
      </section>

      <section style={S.tableCard}>
        <div style={S.tableTop}>
          <b>AI 메일 분석 목록</b>
          <span>유효 리드 {rows.length}건</span>
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>접수일</th>
                <th style={S.th}>등급</th>
                <th style={S.th}>유형</th>
                <th style={S.th}>사업영역</th>
                <th style={S.th}>보낸 사람</th>
                <th style={S.th}>제목</th>
                <th style={S.th}>AI 요약</th>
                <th style={S.th}>다음 행동</th>
                <th style={S.th}>예상금액</th>
                <th style={S.th}>담당</th>
                <th style={S.th}>상태</th>
                <th style={S.th}>관리</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={12} style={S.emptyTd}>
                    아직 유효한 메일 CRM 데이터가 없습니다. Gmail 수집 또는 수동등록을 실행하세요.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td style={S.td}>{shortDate(r.created_at)}</td>
                    <td style={S.td}>
                      <span style={badgeStyle(r.priority)}>{safe(r.priority) || "C"}</span>
                    </td>
                    <td style={S.tdStrong}>{safe(r.category) || "-"}</td>
                    <td style={S.td}>{safe(r.business_area) || "-"}</td>
                    <td style={S.senderTd}>
                      <b>{safe(r.contact_name) || "-"}</b>
                      <br />
                      <span>{safe(r.company_name) || "-"}</span>
                      <br />
                      <span>{safe(r.email) || safe(r.phone) || "-"}</span>
                    </td>
                    <td style={S.titleTd}>{safe(r.title) || "-"}</td>
                    <td style={S.memoTd}>{safe(r.ai_summary) || safe(r.content) || "-"}</td>
                    <td style={S.memoTd}>{safe(r.ai_action) || "-"}</td>
                    <td style={S.tdStrong}>{money(r.estimated_value)}</td>
                    <td style={S.td}>{safe(r.assigned_to) || "-"}</td>
                    <td style={S.tdStrong}>{safe(r.status) || "new"}</td>
                    <td style={S.td}>
                      <Link href={`/admin/crm/inbox/${r.id}`} style={S.detailBtn}>
                        상세보기
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.stat}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.mini}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 16,
    color: "#111827",
  },
  header: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 22,
    marginBottom: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#7c3aed",
  },
  title: {
    margin: "6px 0 0",
    fontSize: 34,
    fontWeight: 950,
  },
  desc: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 800,
    color: "#4b5563",
  },
  headerLinks: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  purpleLink: link("#7c3aed"),
  darkLink: link("#111827"),
  errorBox: {
    background: "#fff1f2",
    color: "#dc2626",
    border: "1px solid #fecdd3",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    fontWeight: 900,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(6,minmax(0,1fr))",
    gap: 10,
    marginBottom: 12,
  },
  stat: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 950,
    color: "#6b7280",
  },
  statValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: 950,
  },
  mailAddressBox: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  mailBoxTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    fontSize: 15,
    fontWeight: 950,
  },
  mailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3,minmax(0,1fr))",
    gap: 8,
    marginTop: 10,
  },
  mini: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 12,
    background: "#f9fafb",
    display: "grid",
    gap: 4,
  },
  tableCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 12,
  },
  tableTop: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 4px 12px",
    fontSize: 15,
    fontWeight: 950,
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
  },
  table: {
    width: "100%",
    minWidth: 1700,
    borderCollapse: "collapse",
  },
  th: {
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    textAlign: "left",
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  tdStrong: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  senderTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    minWidth: 220,
  },
  titleTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 950,
    minWidth: 240,
    whiteSpace: "normal",
  },
  memoTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 800,
    minWidth: 300,
    whiteSpace: "normal",
  },
  emptyTd: {
    padding: 30,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 900,
  },
  detailBtn: {
    minHeight: 34,
    borderRadius: 10,
    background: "#111827",
    color: "#ffffff",
    padding: "0 10px",
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  sBadge: badge("#dc2626", "#fee2e2"),
  aBadge: badge("#f59e0b", "#fef3c7"),
  bBadge: badge("#2563eb", "#dbeafe"),
  cBadge: badge("#6b7280", "#f3f4f6"),
};

function link(bg: string): CSSProperties {
  return {
    minHeight: 42,
    borderRadius: 12,
    background: bg,
    color: "#ffffff",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 950,
  };
}

function badge(color: string, background: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 34,
    minHeight: 30,
    borderRadius: 999,
    color,
    background,
    fontSize: 14,
    fontWeight: 950,
  };
}