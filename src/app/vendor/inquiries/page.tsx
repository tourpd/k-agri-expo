// src/app/vendor/inquiries/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Inquiry = {
  inquiry_id: string;
  booth_id: string | null;
  farmer_name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  status: string;
  source?: string | null;
  memo?: string | null;
  vendor_memo?: string | null;
  contacted_at?: string | null;
  closed_at?: string | null;
  updated_at?: string | null;
  created_at: string | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

function getBoothIdFromUrl() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("booth_id") ?? "";
}

export default function VendorInquiriesPage() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  const [boothId, setBoothId] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    setBoothId(getBoothIdFromUrl());
  }, []);

  async function load() {
    setLoading(true);
    setErrorText("");

    try {
      const params = new URLSearchParams();

      if (boothId) params.set("booth_id", boothId);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      if (q.trim()) params.set("q", q.trim());

      const res = await fetch(`/api/vendor/inquiries?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setErrorText(data?.error ?? "문의 목록을 불러오지 못했습니다.");
        setItems([]);
        return;
      }

      setItems(data.items ?? []);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (boothId !== "") {
      load();
    }
  }, [boothId, statusFilter]);

  const filteredItems = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;

    return items.filter((item) => {
      const hay = [
        item.farmer_name ?? "",
        item.phone ?? "",
        item.email ?? "",
        item.message ?? "",
        item.memo ?? "",
        item.vendor_memo ?? "",
        item.source ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(keyword);
    });
  }, [items, q]);

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.header}>
          <div>
            <div style={S.kicker}>VENDOR CRM</div>
            <h1 style={S.title}>상담 요청 관리</h1>
            <div style={S.desc}>
              농민이 남긴 문의를 확인하고 상태 변경, 메모 저장, 후속 응대를 운영형으로 관리합니다.
            </div>
          </div>

          <button onClick={load} style={S.ghostBtn}>
            새로고침
          </button>
        </div>

        <section style={S.filterBox}>
          <div style={S.filterGrid}>
            <div>
              <div style={S.filterLabel}>부스 ID</div>
              <input
                value={boothId}
                onChange={(e) => setBoothId(e.target.value)}
                placeholder="booth_id"
                style={S.input}
              />
            </div>

            <div>
              <div style={S.filterLabel}>상태</div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={S.input}
              >
                <option value="all">전체</option>
                <option value="new">new</option>
                <option value="contacted">contacted</option>
                <option value="closed">closed</option>
              </select>
            </div>

            <div>
              <div style={S.filterLabel}>검색</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="이름 / 연락처 / 이메일 / 내용 / 메모 / source"
                style={S.input}
              />
            </div>
          </div>

          <div style={S.filterActionRow}>
            <button onClick={load} style={S.primaryBtn}>
              필터 적용
            </button>
          </div>
        </section>

        {loading ? (
          <div style={S.emptyBox}>불러오는 중...</div>
        ) : errorText ? (
          <div style={S.errorBox}>{errorText}</div>
        ) : filteredItems.length === 0 ? (
          <div style={S.emptyBox}>조건에 맞는 문의가 없습니다.</div>
        ) : (
          <div style={S.list}>
            {filteredItems.map((item) => (
              <InquiryCard key={item.inquiry_id} item={item} onReload={load} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function InquiryCard({
  item,
  onReload,
}: {
  item: Inquiry;
  onReload: () => Promise<void>;
}) {
  const [status, setStatus] = useState(item.status || "new");
  const [memo, setMemo] = useState(item.memo ?? item.vendor_memo ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorText, setErrorText] = useState("");

  const initialRef = useRef({
    status: item.status || "new",
    memo: item.memo ?? item.vendor_memo ?? "",
  });

  const mountedRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function updateInquiry(payload: { status?: string; memo?: string }) {
    const res = await fetch("/api/vendor/inquiries/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inquiry_id: item.inquiry_id,
        ...payload,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data?.ok) {
      throw new Error(data?.error ?? "저장 실패");
    }
  }

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const changed =
      status !== initialRef.current.status || memo !== initialRef.current.memo;

    if (!changed) return;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(async () => {
      try {
        setSaveState("saving");
        setErrorText("");

        await updateInquiry({ status, memo });

        initialRef.current = { status, memo };
        setSaveState("saved");

        window.setTimeout(() => {
          setSaveState((prev) => (prev === "saved" ? "idle" : prev));
        }, 1200);
      } catch (e: any) {
        setSaveState("error");
        setErrorText(e?.message ?? "저장 실패");
      }
    }, 700);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [status, memo]);

  return (
    <section style={S.card}>
      <div style={S.rowTop}>
        <div style={S.name}>{item.farmer_name || "이름 미입력"}</div>

        <div
          style={{
            ...S.status,
            ...(status === "closed"
              ? S.statusClosed
              : status === "contacted"
              ? S.statusContacted
              : S.statusNew),
          }}
        >
          {status}
        </div>
      </div>

      <div style={S.meta}>문의 ID: {item.inquiry_id}</div>
      <div style={S.meta}>부스 ID: {item.booth_id || "-"}</div>
      <div style={S.meta}>연락처: {item.phone || "-"}</div>
      <div style={S.meta}>이메일: {item.email || "-"}</div>
      <div style={S.meta}>유입경로: {item.source || "-"}</div>
      <div style={S.meta}>접수일: {formatDate(item.created_at)}</div>
      <div style={S.meta}>응대일: {formatDate(item.contacted_at)}</div>
      <div style={S.meta}>종료일: {formatDate(item.closed_at)}</div>

      <div style={S.messageBox}>{item.message || "문의 내용 없음"}</div>

      <div style={S.editorWrap}>
        <div style={S.editorCol}>
          <div style={S.filterLabel}>상태</div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={S.input}>
            <option value="new">new</option>
            <option value="contacted">contacted</option>
            <option value="closed">closed</option>
          </select>
        </div>

        <div style={{ ...S.editorCol, flex: 1.5 }}>
          <div style={S.filterLabel}>운영 메모</div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 견적 요청 예정 / 오늘 통화 완료 / 다음 주 재연락"
            style={S.textarea}
          />
        </div>
      </div>

      <div style={S.actionRow}>
        <button onClick={() => setStatus("contacted")} style={S.primaryBtn}>
          응대중
        </button>

        <button onClick={() => setStatus("closed")} style={S.ghostBtn}>
          종료
        </button>

        <button onClick={() => onReload()} style={S.ghostBtn}>
          목록 새로고침
        </button>

        <div style={S.saveStateBox}>
          {saveState === "saving" ? <span style={S.savingText}>저장 중...</span> : null}
          {saveState === "saved" ? <span style={S.savedText}>저장 완료</span> : null}
          {saveState === "error" ? <span style={S.errorMiniText}>{errorText}</span> : null}
        </div>
      </div>
    </section>
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
  filterBox: {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
    background: "#fff",
    marginBottom: 16,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
  },
  filterLabel: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  filterActionRow: {
    marginTop: 12,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    background: "#fff",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 92,
    padding: 12,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    boxSizing: "border-box",
    background: "#fff",
    fontSize: 14,
    lineHeight: 1.7,
    resize: "vertical",
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
  editorWrap: {
    marginTop: 14,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  editorCol: {
    minWidth: 220,
    flex: 1,
  },
  actionRow: {
    marginTop: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "center",
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
  saveStateBox: {
    minHeight: 20,
    display: "flex",
    alignItems: "center",
  },
  savingText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: 900,
  },
  savedText: {
    fontSize: 12,
    color: "#15803d",
    fontWeight: 900,
  },
  errorMiniText: {
    fontSize: 12,
    color: "#b91c1c",
    fontWeight: 900,
  },
  errorBox: {
    padding: 18,
    borderRadius: 16,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#991b1b",
  },
  emptyBox: {
    padding: 18,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#64748b",
  },
};