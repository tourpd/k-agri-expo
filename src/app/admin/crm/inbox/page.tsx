// src/app/admin/crm/inbox/page.tsx
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { CSSProperties } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type CrmInboxRow = {
  id: string;
  channel?: string | null;
  category?: string | null;
  business_area?: string | null;
  contact_name?: string | null;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
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

function priorityStyle(v?: string | null): CSSProperties {
  const p = safe(v).toUpperCase();

  if (p === "S") return S.priorityS;
  if (p === "A") return S.priorityA;
  if (p === "B") return S.priorityB;
  return S.priorityC;
}

async function getRows() {
  const { data, error } = await supabase
    .from("crm_inbox")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return {
      rows: [] as CrmInboxRow[],
      error: error.message,
    };
  }

  return {
    rows: (data || []) as CrmInboxRow[],
    error: "",
  };
}

export default async function CrmInboxPage() {
  const { rows, error } = await getRows();

  const total = rows.length;
  const sCount = rows.filter((r) => safe(r.priority).toUpperCase() === "S").length;
  const buyerCount = rows.filter((r) => safe(r.category).toUpperCase() === "BUYER").length;
  const vendorCount = rows.filter((r) => safe(r.category).toUpperCase() === "VENDOR").length;
  const totalValue = rows.reduce((sum, r) => sum + Number(r.estimated_value || 0), 0);

  return (
    <main style={S.page}>
      <section style={S.header}>
        <div>
          <div style={S.kicker}>K-AGRI AI CRM</div>
          <h1 style={S.title}>AI 통합수신함</h1>
          <p style={S.desc}>
            전화, 이메일, 입점문의, 바이어 문의, OEM 문의를 한 화면에서 우선순위별로 관리합니다.
          </p>
        </div>

        <div style={S.headerLinks}>
          <Link href="/admin/farmer-crm/inbox" style={S.blueLink}>
            농민 상담수신함
          </Link>
          <Link href="/admin/farmer-crm" style={S.darkLink}>
            농민 CRM
          </Link>
        </div>
      </section>

      {error ? <section style={S.errorBox}>{error}</section> : null}

      <section style={S.stats}>
        <Stat label="전체 문의" value={`${total}건`} />
        <Stat label="S급 문의" value={`${sCount}건`} />
        <Stat label="바이어 문의" value={`${buyerCount}건`} />
        <Stat label="입점 문의" value={`${vendorCount}건`} />
        <Stat label="예상 거래액" value={money(totalValue)} />
      </section>

      <section style={S.guideBox}>
        <b>운영 기준</b>
        <p>
          S급은 대표가 바로 확인, A급은 당일 처리, B급은 3일 내 처리, C급은 일반 관리로 분류합니다.
        </p>
      </section>

      <section style={S.tableCard}>
        <div style={S.tableTop}>
          <b>통합 문의 목록</b>
          <span>최근 {rows.length}건</span>
        </div>

        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>일시</th>
                <th style={S.th}>등급</th>
                <th style={S.th}>채널</th>
                <th style={S.th}>문의유형</th>
                <th style={S.th}>사업영역</th>
                <th style={S.th}>이름/회사</th>
                <th style={S.th}>연락처</th>
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
                  <td colSpan={14} style={S.emptyTd}>
                    아직 통합수신함 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td style={S.td}>{shortDate(r.created_at)}</td>
                    <td style={S.td}>
                      <span style={priorityStyle(r.priority)}>
                        {safe(r.priority) || "C"}
                      </span>
                    </td>
                    <td style={S.tdStrong}>{safe(r.channel) || "-"}</td>
                    <td style={S.tdStrong}>{safe(r.category) || "-"}</td>
                    <td style={S.td}>{safe(r.business_area) || "-"}</td>
                    <td style={S.nameTd}>
                      <b>{safe(r.contact_name) || "-"}</b>
                      <br />
                      <span>{safe(r.company_name) || "-"}</span>
                    </td>
                    <td style={S.contactTd}>
                      {safe(r.phone) ? <div>{safe(r.phone)}</div> : null}
                      {safe(r.email) ? <div>{safe(r.email)}</div> : null}
                      {!safe(r.phone) && !safe(r.email) ? "-" : null}
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
  blueLink: link("#2563eb"),
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
    gridTemplateColumns: "repeat(5,minmax(0,1fr))",
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
    fontSize: 26,
    fontWeight: 950,
  },
  guideBox: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    fontSize: 15,
    fontWeight: 850,
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
    minWidth: 1920,
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
  nameTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    minWidth: 180,
  },
  contactTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "12px 10px",
    fontSize: 14,
    fontWeight: 800,
    minWidth: 200,
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
  priorityS: priority("#dc2626", "#fee2e2"),
  priorityA: priority("#f59e0b", "#fef3c7"),
  priorityB: priority("#2563eb", "#dbeafe"),
  priorityC: priority("#6b7280", "#f3f4f6"),
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

function priority(color: string, background: string): CSSProperties {
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