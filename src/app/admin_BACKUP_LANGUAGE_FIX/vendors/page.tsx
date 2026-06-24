"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";


type DocType = "business_license" | "corporate_registry";

type VendorDocRow = {
  id: string;
  vendor_user_id: string;
  doc_type: DocType;
  status: "pending" | "approved" | "rejected";
  file_path: string;
  created_at: string;
};

function docLabel(t: DocType) {
  return t === "business_license" ? "사업자등록증" : "법인등기";
}

export default function AdminVendorsPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<VendorDocRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);

    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      // ✅ 로그인 페이지로 보내기
      window.location.href = "/login?next=/admin/vendors";
      return;
    }

    const { data, error } = await supabase
      .from("vendor_docs")
      .select("id, vendor_user_id, doc_type, status, file_path, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      setMsg(`에러: ${error.message}`);
      setDocs([]);
    } else {
      setDocs((data ?? []) as VendorDocRow[]);
    }
    setLoading(false);
  }

  async function openSignedUrl(path: string) {
    setMsg(null);
    const { data, error } = await supabase.storage
      .from("vendor-docs")
      .createSignedUrl(path, 60 * 10);

    if (error || !data?.signedUrl) {
      setMsg(`서명링크 생성 실패: ${error?.message ?? "unknown"}`);
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function approve(doc_id: string) {
    setMsg(null);

    const res = await fetch("/api/admin/vendor-docs/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ doc_id }),
    });

    if (!res.ok) {
      const t = await res.text();
      setMsg(`승인 실패: ${res.status} ${t}`);
      return;
    }

    setMsg("승인 완료!");
    await load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
        관리자 — 업체 인증 심사
      </h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <button
          onClick={load}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          새로고침
        </button>
      </div>

      {msg && (
        <div
          style={{
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px solid #eee",
            background: "#fafafa",
            color: "#222",
            lineHeight: 1.6,
          }}
        >
          {msg}
        </div>
      )}

      {loading ? (
        <div style={{ color: "#666" }}>불러오는 중...</div>
      ) : docs.length === 0 ? (
        <div style={{ color: "#666" }}>대기(pending) 서류가 없습니다.</div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {docs.map((d) => (
            <div
              key={d.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>
                    {docLabel(d.doc_type)} · {d.status}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    doc_id: {d.id}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    vendor_user_id: {d.vendor_user_id}
                  </div>
                  <div style={{ fontSize: 12, color: "#999" }}>{d.file_path}</div>
                  <div style={{ fontSize: 12, color: "#999" }}>
                    {new Date(d.created_at).toLocaleString("ko-KR")}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => openSignedUrl(d.file_path)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #ddd",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 900,
                    }}
                  >
                    보기(서명링크)
                  </button>

                  <button
                    onClick={() => approve(d.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "1px solid #0b6",
                      background: "#0b6",
                      color: "#fff",
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    승인
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}