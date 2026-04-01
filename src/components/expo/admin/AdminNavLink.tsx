// src/components/expo/admin/AdminNavLink.tsx
import React from "react";
import Link from "next/link";
import { isExpoAdmin } from "@/lib/expo/isExpoAdmin";

export default async function AdminNavLink({
  hallId = "agri-inputs",
}: {
  hallId?: string;
}) {
  const ok = await isExpoAdmin();
  if (!ok) return null;

  return (
    <Link
      href={`/expo/admin/hall/${hallId}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid #ddd",
        background: "#fff",
        fontSize: 13,
        fontWeight: 800,
      }}
    >
      ⚙️ 관리자
    </Link>
  );
}