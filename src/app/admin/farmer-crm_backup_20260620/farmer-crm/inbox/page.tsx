// src/app/admin/farmer-crm/inbox/page.tsx
import Link from "next/link";
import type { CSSProperties } from "react";
import FarmerCallInboxClient from "./FarmerCallInboxClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function FarmerCallInboxPage() {
  return (
    <main style={S.page}>
      <section style={S.header}>
        <div>
          <div style={S.kicker}>AI CALL INBOX</div>
          <h1 style={S.title}>AI 상담수신함</h1>
          <p style={S.desc}>
            고객이 먼저 전화한 통화녹음도 업로드하면 AI가 전화번호를 찾고 CRM 후보를 자동 생성합니다.
          </p>
        </div>

        <div style={S.links}>
          <Link href="/admin/farmer-crm" style={S.darkLink}>
            고객 CRM
          </Link>
          <Link href="/admin/product-orders" style={S.greenLink}>
            주문센터
          </Link>
        </div>
      </section>

      <FarmerCallInboxClient />
    </main>
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
    color: "#2563eb",
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
  links: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  darkLink: link("#111827"),
  greenLink: link("#047857"),
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