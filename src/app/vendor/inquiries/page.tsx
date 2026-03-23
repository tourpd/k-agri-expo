"use client";

import React from "react";

type InquiryRow = {
  id: string;
  booth_id: string;
  booth_name?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  name?: string | null;
  phone?: string | null;
  region?: string | null;
  crop?: string | null;
  message?: string | null;
  status:
    | "new"
    | "notified"
    | "contacted"
    | "consulting"
    | "quoted"
    | "ordered"
    | "closed"
    | "spam";
  vendor_memo?: string | null;
  created_at?: string | null;
  contacted_at?: string | null;
  closed_at?: string | null;
};

const STATUS_OPTIONS: Array<{ value: InquiryRow["status"]; label: string }> = [
  { value: "new", label: "신규" },
  { value: "notified", label: "알림완료" },
  { value: "contacted", label: "연락완료" },
  { value: "consulting", label: "상담중" },
  { value: "quoted", label: "견적발송" },
  { value: "ordered", label: "주문완료" },
  { value: "closed", label: "종료" },
  { value: "spam", label: "스팸" },
];

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function statusStyle(status: InquiryRow["status"]): React.CSSProperties {
  switch (status) {
    case "new":
      return {
        background: "#eff6ff",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
      };
    case "notified":
      return {
        background: "#f5f3ff",
        color: "#6d28d9",
        border: "1px solid #ddd6fe",
      };
    case "contacted":
      return {
        background: "#ecfeff",
        color: "#0f766e",
        border: "1px solid #a5f3fc",
      };
    case "consulting":
      return {
        background: "#fff7ed",
        color: "#c2410c",
        border: "1px solid #fdba74",
      };
    case "quoted":
      return {
        background: "#fefce8",
        color: "#a16207",
        border: "1px solid #fde68a",
      };
    case "ordered":
      return {
        background: "#ecfdf5",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    case "closed":
      return {
        background: "#f3f4f6",
        color: "#374151",
        border: "1px solid #d1d5db",
      };
    case "spam":
      return {
        background: "#fef2f2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
      };
    default:
      return {
        background: "#f8fafc",
        color: "#334155",
        border: "1px solid #e2e8f0",
      };
  }
}

export default function VendorInquiriesPage() {
  const [loading, setLoading] = React.useState(true);
  const [errorText, setErrorText] = React.useState("");
  const [items, setItems] = React.useState<InquiryRow[]>([]);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setErrorText("");

      const res = await fetch("/api/vendor/inquiries", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "문의 목록을 불러오지 못했습니다.");
      }

      setItems(Array.isArray(json.inquiries) ? json.inquiries : []);
    } catch (e: any) {
      setErrorText(e?.message || "문의 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function updateInquiry(
    inquiryId: string,
    nextStatus: InquiryRow["status"],
    vendorMemo: string | null
  ) {
    try {
      setSavingId(inquiryId);

      const res = await fetch("/api/vendor/inquiries/update", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          inquiry_id: inquiryId,
          status: nextStatus,
          vendor_memo: vendorMemo ?? "",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "문의 상태 변경에 실패했습니다.");
      }

      setItems((prev) =>
        prev.map((row) =>
          row.id === inquiryId
            ? {
                ...row,
                status: nextStatus,
                vendor_memo: vendorMemo ?? "",
                contacted_at:
                  nextStatus === "contacted"
                    ? json?.inquiry?.contacted_at ?? row.contacted_at ?? null
                    : row.contacted_at ?? null,
                closed_at:
                  nextStatus === "closed" || nextStatus === "spam"
                    ? json?.inquiry?.closed_at ?? row.closed_at ?? null
                    : row.closed_at ?? null,
              }
            : row
        )
      );
    } catch (e: any) {
      alert(e?.message || "문의 상태 변경에 실패했습니다.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <div style={S.kicker}>VENDOR CRM</div>
            <h1 style={S.title}>문의 관리</h1>
            <div style={S.desc}>
              농민 문의를 확인하고 상태를 변경하며 메모를 남길 수 있습니다.
            </div>
          </div>

          <button onClick={() => void load()} style={S.refreshBtn}>
            새로고침
          </button>
        </header>

        {loading ? (
          <div style={S.stateBox}>문의 목록 불러오는 중...</div>
        ) : errorText ? (
          <div style={S.errorBox}>{errorText}</div>
        ) : items.length === 0 ? (
          <div style={S.stateBox}>아직 접수된 문의가 없습니다.</div>
        ) : (
          <div style={S.list}>
            {items.map((item) => (
              <InquiryCard
                key={item.id}
                item={item}
                saving={savingId === item.id}
                onSave={updateInquiry}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function InquiryCard({
  item,
  saving,
  onSave,
}: {
  item: InquiryRow;
  saving: boolean;
  onSave: (
    inquiryId: string,
    nextStatus: InquiryRow["status"],
    vendorMemo: string | null
  ) => Promise<void>;
}) {
  const [status, setStatus] = React.useState<InquiryRow["status"]>(item.status);
  const [memo, setMemo] = React.useState(item.vendor_memo ?? "");

  const telHref = item.phone ? `tel:${item.phone.replace(/\s+/g, "")}` : null;

  return (
    <section style={S.card}>
      <div style={S.cardTop}>
        <div style={{ minWidth: 0 }}>
          <div style={S.cardTitleRow}>
            <div style={S.cardTitle}>
              {item.booth_name ?? "부스"}
              {item.product_name ? ` / ${item.product_name}` : ""}
            </div>

            <span style={{ ...S.statusPill, ...statusStyle(item.status) }}>
              {STATUS_OPTIONS.find((s) => s.value === item.status)?.label ?? item.status}
            </span>
          </div>

          <div style={S.metaRow}>
            접수시각: {fmtDate(item.created_at)} · 지역: {item.region ?? "-"} · 작물:{" "}
            {item.crop ?? "-"}
          </div>
        </div>
      </div>

      <div style={S.infoGrid}>
        <div style={S.infoBox}>
          <div style={S.infoLabel}>문의자</div>
          <div style={S.infoValue}>{item.name ?? "-"}</div>
        </div>

        <div style={S.infoBox}>
          <div style={S.infoLabel}>연락처</div>
          <div style={S.infoValue}>
            {item.phone ?? "-"}{" "}
            {telHref ? (
              <a href={telHref} style={S.callLink}>
                전화걸기
              </a>
            ) : null}
          </div>
        </div>

        <div style={S.infoBoxFull}>
          <div style={S.infoLabel}>문의 내용</div>
          <div style={S.messageBox}>{item.message ?? "-"}</div>
        </div>
      </div>

      <div style={S.editWrap}>
        <div style={S.editCol}>
          <label style={S.label}>상태 변경</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as InquiryRow["status"])}
            style={S.select}
            disabled={saving}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...S.editCol, flex: 1.5 }}>
          <label style={S.label}>업체 메모</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 3/23 오후 통화 완료, 다음 주 견적 전달 예정"
            style={S.textarea}
            disabled={saving}
          />
        </div>
      </div>

      <div style={S.bottomRow}>
        <div style={S.subMeta}>
          연락완료: {fmtDate(item.contacted_at)} · 종료: {fmtDate(item.closed_at)}
        </div>

        <button
          onClick={() => void onSave(item.id, status, memo)}
          style={S.saveBtn}
          disabled={saving}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)",
    padding: "24px 16px 40px",
  },
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-end",
    flexWrap: "wrap",
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
    letterSpacing: 0.4,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 32,
    fontWeight: 950,
    color: "#111827",
  },
  desc: {
    marginTop: 10,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },
  refreshBtn: {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  stateBox: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 16,
    padding: 18,
    color: "#64748b",
    lineHeight: 1.7,
  },
  errorBox: {
    border: "1px solid #fecaca",
    background: "#fef2f2",
    borderRadius: 16,
    padding: 18,
    color: "#b91c1c",
    lineHeight: 1.7,
  },
  list: {
    display: "grid",
    gap: 14,
  },
  card: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  cardTitleRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
    lineHeight: 1.3,
  },
  statusPill: {
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 900,
  },
  metaRow: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.7,
  },
  infoGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  infoBox: {
    border: "1px solid #eef2f7",
    background: "#f8fafc",
    borderRadius: 14,
    padding: 12,
  },
  infoBoxFull: {
    gridColumn: "1 / -1",
    border: "1px solid #eef2f7",
    background: "#f8fafc",
    borderRadius: 14,
    padding: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 1.6,
    fontWeight: 800,
  },
  messageBox: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 1.8,
    whiteSpace: "pre-wrap",
  },
  callLink: {
    marginLeft: 8,
    textDecoration: "none",
    fontWeight: 900,
    color: "#2563eb",
    fontSize: 13,
  },
  editWrap: {
    marginTop: 16,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  editCol: {
    minWidth: 220,
    flex: 1,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 900,
    color: "#374151",
    marginBottom: 8,
  },
  select: {
    width: "100%",
    height: 44,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 92,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: 12,
    fontSize: 14,
    lineHeight: 1.6,
    resize: "vertical",
    boxSizing: "border-box",
  },
  bottomRow: {
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
  subMeta: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 1.7,
  },
  saveBtn: {
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 950,
    cursor: "pointer",
  },
};