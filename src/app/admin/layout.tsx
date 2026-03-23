import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ok = await isAdminAuthenticated();

  if (!ok) redirect("/admin-login");

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* 좌측 사이드바 */}
      <aside className="w-64 bg-white border-r p-5 space-y-4">
        <div className="text-xl font-black">K-Agri Admin</div>

        <nav className="space-y-2">
          <Menu href="/admin">대시보드</Menu>
          <Menu href="/admin/orders">주문/결제</Menu>
          <Menu href="/admin/booths">업체/부스</Menu>
          <Menu href="/admin/event">이벤트</Menu>
          <Menu href="/admin/entries">응모자</Menu>
          <Menu href="/admin/cms">CMS</Menu>
          <Menu href="/admin/media">미디어</Menu>
        </nav>

        <form action="/api/admin/logout" method="post">
          <button className="w-full mt-6 bg-black text-white py-2 rounded-xl font-bold">
            로그아웃
          </button>
        </form>
      </aside>

      {/* 메인 */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

function Menu({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block px-4 py-2 rounded-xl hover:bg-slate-100 font-bold"
    >
      {children}
    </Link>
  );
}