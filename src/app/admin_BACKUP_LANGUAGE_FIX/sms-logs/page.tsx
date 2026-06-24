"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

type SmsLog = {
  id: string;
  order_id?: string | null;
  phone?: string | null;
  receiver_name?: string | null;
  message?: string | null;
  sms_type?: string | null;
  send_status?: string | null;
  provider_response?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

function statusColor(status?: string | null) {
  const s = safe(status);

  if (s === "success") return "#16a34a";
  if (s === "failed") return "#dc2626";
  if (s === "pending") return "#f59e0b";

  return "#6b7280";
}

function statusText(status?: string | null) {
  const s = safe(status);

  if (s === "success") return "발송완료";
  if (s === "failed") return "발송실패";
  if (s === "pending") return "발송대기";

  return s || "-";
}

export default function AdminSmsLogsPage() {
  const [logs, setLogs] = useState<SmsLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("all");
  const [smsType, setSmsType] = useState("all");

  async function loadLogs() {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (keyword.trim()) params.set("keyword", keyword.trim());
      if (status !== "all") params.set("status", status);
      if (smsType !== "all") params.set("sms_type", smsType);

      const res = await fetch(`/api/admin/sms-logs?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data?.success) {
        alert(data?.error || "문자 로그 조회 실패");
        return;
      }

      setLogs(data.logs || []);
    } catch {
      alert("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [status, smsType]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return logs;

    return logs.filter((o) =>
      [
        o.order_id,
        o.phone,
        o.receiver_name,
        o.message,
        o.sms_type,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [logs, keyword]);

  return (
    <main style={S.page}>
      <section style={S.hero}>
        <div>
          <div style={S.kicker}>OMS SMS CENTER</div>
          <h1 style={S.title}>문자 발송 로그</h1>
          <p style={S.desc}>
            배송완료 / 송장등록 / 상태변경 문자 발송 내역 확인
          </p>
        </div>

        <button
          type="button"
          onClick={loadLogs}
          style={S.reloadBtn}
        >
          {loading ? "불러오는중" : "새로고침"}
        </button>
      </section>

      <section style={S.filterCard}>
        <div style={S.filterGrid}>
          <div>
            <div style={S.label}>발송상태</div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={S.select}
            >
              <option value="all">전체</option>
              <option value="pending">발송대기</option>
              <option value="success">발송완료</option>
              <option value="failed">발송실패</option>
            </select>
          </div>

          <div>
            <div style={S.label}>문자유형</div>

            <select
              value={smsType}
              onChange={(e) => setSmsType(e.target.value)}
              style={S.select}
            >
              <option value="all">전체</option>
              <option value="tracking">송장등록</option>
              <option value="delivery_done">배송완료</option>
            </select>
          </div>
        </div>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="주문ID / 전화번호 / 이름 / 문자내용 검색"
          style={S.search}
        />

        <div style={S.countText}>
          총 {filtered.length}건
        </div>
      </section>

      <section style={S.tableCard}>
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>시간</th>
                <th style={S.th}>상태</th>
                <th style={S.th}>유형</th>
                <th style={S.th}>수신자</th>
                <th style={S.th}>전화번호</th>
                <th style={S.th}>주문ID</th>
                <th style={S.th}>문자내용</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={S.emptyTd}>
                    문자 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id}>
                    <td style={S.td}>
                      {shortDate(log.created_at)}
                    </td>

                    <td style={S.td}>
                      <span
                        style={{
                          ...S.badge,
                          color: statusColor(log.send_status),
                          background: `${statusColor(log.send_status)}18`,
                        }}
                      >
                        {statusText(log.send_status)}
                      </span>
                    </td>

                    <td style={S.tdStrong}>
                      {log.sms_type || "-"}
                    </td>

                    <td style={S.tdStrong}>
                      {log.receiver_name || "-"}
                    </td>

                    <td style={S.tdStrong}>
                      {log.phone || "-"}
                    </td>

                    <td style={S.td}>
                      {log.order_id || "-"}
                    </td>

                    <td style={S.messageTd}>
                      {log.message || "-"}
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

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 20,
    color: "#111827",
  },

  hero: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 28,
    marginBottom: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },

  kicker: {
    fontSize: 13,
    fontWeight: 950,
    color: "#047857",
  },

  title: {
    margin: "8px 0 0",
    fontSize: 40,
    fontWeight: 950,
  },

  desc: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 800,
    color: "#4b5563",
  },

  reloadBtn: {
    minHeight: 52,
    borderRadius: 16,
    border: "none",
    background: "#111827",
    color: "#ffffff",
    padding: "0 20px",
    fontSize: 16,
    fontWeight: 950,
    cursor: "pointer",
  },

  filterCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },

  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2,minmax(0,1fr))",
    gap: 12,
    marginBottom: 14,
  },

  label: {
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 950,
  },

  select: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: 15,
    fontWeight: 850,
    background: "#ffffff",
  },

  search: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    padding: "0 16px",
    fontSize: 16,
    fontWeight: 800,
    boxSizing: "border-box",
  },

  countText: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: 900,
    color: "#374151",
  },

  tableCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 18,
  },

  tableWrap: {
    overflowX: "auto",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 1400,
    background: "#ffffff",
  },

  th: {
    background: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    padding: "14px 12px",
    textAlign: "left",
    fontSize: 14,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  td: {
    borderBottom: "1px solid #e5e7eb",
    padding: "16px 12px",
    fontSize: 15,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },

  tdStrong: {
    borderBottom: "1px solid #e5e7eb",
    padding: "16px 12px",
    fontSize: 15,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  messageTd: {
    borderBottom: "1px solid #e5e7eb",
    padding: "16px 12px",
    fontSize: 15,
    lineHeight: 1.6,
    minWidth: 500,
  },

  emptyTd: {
    padding: 40,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 900,
  },

  badge: {
    display: "inline-flex",
    borderRadius: 999,
    padding: "6px 10px",
    fontSize: 13,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
};