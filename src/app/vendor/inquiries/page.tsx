"use client";

import React, { useEffect, useState } from "react";

type Inquiry = {
  inquiry_id: string;
  booth_id: string;
  farmer_name: string | null;
  phone: string | null;
  email: string | null;
  message: string;
  status: string;
  created_at: string | null;
};

export default function VendorInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/inquiries");
      const data = await res.json();

      if (!res.ok || !data?.ok) {
        alert(data?.error ?? "문의 목록을 불러오지 못했습니다.");
        setItems([]);
        return;
      }

      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(inquiryId: string, status: string) {
    const res = await fetch("/api/vendor/inquiries/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inquiry_id: inquiryId,
        status,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      alert(data?.error ?? "상태 변경 실패");
      return;
    }

    await load();
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.header}>
          <div>
            <div style={S.kicker}>VENDOR CRM</div>
            <h1 style={S.title}>상담 요청 관리</h1>
            <div style={S.desc}>
              농민이 남긴 문의를 확인하고 응대 상태를 관리합니다.
            </div>
          </div>

          <button onClick={load} style={S.ghostBtn}>
            새로고침
          </button>
        </div>

        {loading ? (
          <div style={S.emptyBox}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <div style={S.emptyBox}>아직 접수된 상담 요청이 없습니다.</div>
        ) : (
          <div style={S.list}>
            {items.map((item) => (
              <section key={item.inquiry_id} style={S.card}>
                <div style={S.rowTop}>
                  <div style={S.name}>
                    {item.farmer_name || "이름 미입력"}
                  </div>

                  <div
                    style={{
                      ...S.status,
                      ...(item.status === "closed"
                        ? S.statusClosed
                        : item.status === "contacted"
                        ? S.statusContacted
                        : S.statusNew),
                    }}
                  >
                    {item.status}
                  </div>
                </div>

                <div style={S.meta}>연락처: {item.phone || "-"}</div>
                <div style={S.meta}>이메일: {item.email || "-"}</div>
                <div style={S.meta}>접수일: {formatDate(item.created_at)}</div>

                <div style={S.messageBox}>{item.message}</div>

                <div style={S.actionRow}>
                  <button
                    onClick={() => changeStatus(item.inquiry_id, "contacted")}
                    style={S.primaryBtn}
                  >
                    연락 완료
                  </button>

                  <button
                    onClick={() => changeStatus(item.inquiry_id, "closed")}
                    style={S.ghostBtn}
                  >
                    종료
                  </button>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function formatDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px 18px 60px",
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#2563eb",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 32,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.8,
  },
  list: {
    display: "grid",
    gap: 14,
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 18,
    background: "#fff",
  },
  rowTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  name: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
  },
  status: {
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 950,
  },
  statusNew: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  statusContacted: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fdba74",
  },
  statusClosed: {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
  },
  meta: {
    marginTop: 8,
    color: "#64748b",
    fontSize: 14,
  },
  messageBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 12,
    background: "#f8fafc",
    lineHeight: 1.8,
    color: "#334155",
  },
  actionRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  primaryBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
  ghostBtn: {
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontWeight: 900,
    cursor: "pointer",
  },
  emptyBox: {
    padding: 18,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#64748b",
  },
};