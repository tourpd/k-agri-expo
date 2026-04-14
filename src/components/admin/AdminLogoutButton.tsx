"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/admin/logout", {
        method: "POST",
      });

      const json = await res.json().catch(() => null);

      router.push(json?.redirectTo || "/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        height: 42,
        padding: "0 14px",
        borderRadius: 10,
        border: "1px solid #cbd5e1",
        background: "#fff",
        color: "#0f172a",
        fontWeight: 900,
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
}