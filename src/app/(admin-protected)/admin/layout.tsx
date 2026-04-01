import Link from "next/link";
import { requireAdminUser } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminUser();

  return (
    <div style={S.page}>
      <aside style={S.sidebar}>
        <div style={S.logo}>ADMIN</div>

        <nav style={S.nav}>
          <Link href="/vendor/manage" style={S.link}>
            벤더 신청 관리
          </Link>
          <Link href="/admin/event" style={S.link}>
            관리자 이벤트
          </Link>
        </nav>

        <form action="/api/admin/logout" method="post" style={{ marginTop: "auto" }}>
          <button type="submit" style={S.logoutBtn}>
            로그아웃
          </button>
        </form>
      </aside>

      <main style={S.main}>{children}</main>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    background: "#f8fafc",
  },
  sidebar: {
    borderRight: "1px solid #e5e7eb",
    background: "#fff",
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  logo: {
    fontSize: 14,
    fontWeight: 900,
    color: "#16a34a",
    letterSpacing: 0.5,
  },
  nav: {
    display: "grid",
    gap: 10,
  },
  link: {
    display: "block",
    padding: "12px 14px",
    borderRadius: 12,
    color: "#0f172a",
    textDecoration: "none",
    fontWeight: 700,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  logoutBtn: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#0f172a",
    fontWeight: 800,
    cursor: "pointer",
  },
  main: {
    padding: 24,
  },
};