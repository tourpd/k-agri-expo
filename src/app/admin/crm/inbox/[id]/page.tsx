// src/app/admin/crm/inbox/[id]/page.tsx
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { CSSProperties } from "react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PageProps = {
  params: Promise<{ id: string }>;
};

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
  source_file_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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

async function getRow(id: string) {
  const { data, error } = await supabase
    .from("crm_inbox")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return {
      row: null as CrmInboxRow | null,
      error: error.message,
    };
  }

  return {
    row: data as CrmInboxRow | null,
    error: "",
  };
}

export default async function CrmInboxDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { row, error } = await getRow(id);

  if (!row) {
    return (
      <main style={S.page}>
        <section style={S.errorBox}>
          {error || "문의 데이터를 찾지 못했습니다."}
        </section>

        <Link href="/admin/crm/inbox" style={S.darkLink}>
          통합수신함으로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <section style={S.header}>
        <div>
          <div style={S.kicker}>AI CRM DETAIL</div>
          <h1 style={S.title}>{safe(row.title) || "문의 상세"}</h1>
          <p style={S.desc}>
            AI가 분류한 문의 내용을 확인하고 후속 대응을 결정합니다.
          </p>
        </div>

        <div style={S.headerLinks}>
          <Link href="/admin/crm/inbox" style={S.grayLink}>
            목록
          </Link>
          {safe(row.phone) ? (
            <a href={`tel:${safe(row.phone)}`} style={S.greenLink}>
              전화하기
            </a>
          ) : null}
          {safe(row.email) ? (
            <a href={`mailto:${safe(row.email)}`} style={S.blueLink}>
              메일쓰기
            </a>
          ) : null}
        </div>
      </section>

      <section style={S.summaryGrid}>
        <Card label="우선순위" value={safe(row.priority) || "C"} badge={row.priority} />
        <Card label="채널" value={safe(row.channel) || "-"} />
        <Card label="문의유형" value={safe(row.category) || "-"} />
        <Card label="사업영역" value={safe(row.business_area) || "-"} />
        <Card label="예상금액" value={money(row.estimated_value)} />
        <Card label="상태" value={safe(row.status) || "new"} />
        <Card label="담당자" value={safe(row.assigned_to) || "-"} />
        <Card label="접수일" value={shortDate(row.created_at)} />
      </section>

      <section style={S.twoGrid}>
        <section style={S.card}>
          <h2 style={S.sectionTitle}>연락처</h2>

          <Info label="이름" value={row.contact_name} />
          <Info label="회사" value={row.company_name} />
          <Info label="전화" value={row.phone} />
          <Info label="이메일" value={row.email} />
        </section>

        <section style={S.card}>
          <h2 style={S.sectionTitle}>AI 판단</h2>

          <Info label="AI 요약" value={row.ai_summary} />
          <Info label="다음 행동" value={row.ai_action} />
        </section>
      </section>

      <section style={S.card}>
        <h2 style={S.sectionTitle}>문의 원문</h2>
        <div style={S.contentBox}>{safe(row.content) || "-"}</div>
      </section>

      {safe(row.source_file_url) ? (
        <section style={S.card}>
          <h2 style={S.sectionTitle}>첨부/원본 파일</h2>
          <a href={safe(row.source_file_url)} target="_blank" rel="noreferrer" style={S.fileLink}>
            원본 파일 열기
          </a>
        </section>
      ) : null}
    </main>
  );
}

function Card({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: string | null;
}) {
  return (
    <div style={S.statCard}>
      <div style={S.cardLabel}>{label}</div>
      {badge ? (
        <span style={priorityStyle(badge)}>{value}</span>
      ) : (
        <div style={S.cardValue}>{value}</div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value?: unknown }) {
  return (
    <div style={S.infoRow}>
      <div style={S.infoLabel}>{label}</div>
      <div style={S.infoValue}>{safe(value) || "-"}</div>
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
    fontSize: 32,
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
  grayLink: link("#6b7280"),
  darkLink: link("#111827"),
  greenLink: link("#047857"),
  blueLink: link("#2563eb"),
  errorBox: {
    background: "#fff1f2",
    color: "#dc2626",
    border: "1px solid #fecdd3",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    fontWeight: 900,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4,minmax(0,1fr))",
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    minHeight: 82,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: 950,
    color: "#6b7280",
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 950,
    wordBreak: "break-word",
  },
  twoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 12,
    marginBottom: 12,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
  },
  sectionTitle: {
    margin: "0 0 12px",
    fontSize: 22,
    fontWeight: 950,
  },
  infoRow: {
    display: "grid",
    gridTemplateColumns: "120px 1fr",
    gap: 10,
    borderBottom: "1px solid #e5e7eb",
    padding: "10px 0",
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: 950,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 15,
    fontWeight: 850,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  contentBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 14,
    fontSize: 15,
    fontWeight: 800,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
  },
  fileLink: {
    color: "#2563eb",
    fontWeight: 950,
    textDecoration: "underline",
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