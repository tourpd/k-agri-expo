"use client";

import React from "react";

type LeadRow = {
  id: string;
  booth_id: string;
  booth_name?: string | null;
  name?: string | null;
  phone?: string | null;
  region?: string | null;
  crop?: string | null;
  first_inquiry_at?: string | null;
  last_inquiry_at?: string | null;
  inquiry_count?: number | null;
  order_count?: number | null;
  total_order_amount?: number | null;
  lead_status?: "new" | "warm" | "hot" | "customer" | "dormant" | string | null;
  last_product_id?: string | null;
  last_product_name?: string | null;
  memo?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const STATUS_OPTIONS = [
  { value: "new", label: "신규" },
  { value: "warm", label: "관심" },
  { value: "hot", label: "집중관리" },
  { value: "customer", label: "고객" },
  { value: "dormant", label: "휴면" },
] as const;

type LeadStatus = (typeof STATUS_OPTIONS)[number]["value"];
type SaveState = "idle" | "saving" | "saved" | "error";

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

function fmtAmount(v?: number | null) {
  if (typeof v !== "number" || !Number.isFinite(v)) return "-";
  return `${v.toLocaleString("ko-KR")}원`;
}

function leadStatusLabel(v?: string | null) {
  switch (v) {
    case "new":
      return "신규";
    case "warm":
      return "관심";
    case "hot":
      return "집중관리";
    case "customer":
      return "고객";
    case "dormant":
      return "휴면";
    default:
      return v ?? "-";
  }
}

function leadStatusStyle(v?: string | null): React.CSSProperties {
  switch (v) {
    case "new":
      return {
        background: "#eff6ff",
        color: "#1d4ed8",
        border: "1px solid #bfdbfe",
      };
    case "warm":
      return {
        background: "#fff7ed",
        color: "#c2410c",
        border: "1px solid #fdba74",
      };
    case "hot":
      return {
        background: "#fef2f2",
        color: "#b91c1c",
        border: "1px solid #fecaca",
      };
    case "customer":
      return {
        background: "#ecfdf5",
        color: "#166534",
        border: "1px solid #bbf7d0",
      };
    case "dormant":
      return {
        background: "#f3f4f6",
        color: "#374151",
        border: "1px solid #d1d5db",
      };
    default:
      return {
        background: "#f8fafc",
        color: "#334155",
        border: "1px solid #e2e8f0",
      };
  }
}

export default function VendorLeadsPage() {
  const [loading, setLoading] = React.useState(true);
  const [errorText, setErrorText] = React.useState("");
  const [items, setItems] = React.useState<LeadRow[]>([]);
  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");

  React.useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setErrorText("");

      const res = await fetch("/api/vendor/leads", {
        method: "GET",
        cache: "no-store",
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "고객 목록을 불러오지 못했습니다.");
      }

      setItems(Array.isArray(json.leads) ? json.leads : []);
    } catch (e: any) {
      setErrorText(e?.message || "고객 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function saveLead(
    leadId: string,
    leadStatus: LeadStatus,
    memo: string | null
  ) {
    const res = await fetch("/api/vendor/leads/update", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        lead_id: leadId,
        lead_status: leadStatus,
        memo: memo ?? "",
      }),
    });

    const json = await res.json();

    if (!res.ok || !json?.ok) {
      throw new Error(json?.error || "고객 저장에 실패했습니다.");
    }

    setItems((prev) =>
      prev.map((row) =>
        row.id === leadId
          ? {
              ...row,
              lead_status: leadStatus,
              memo: memo ?? "",
              updated_at: json?.lead?.updated_at ?? row.updated_at ?? null,
            }
          : row
      )
    );
  }

  const filtered = React.useMemo(() => {
    const keyword = q.trim().toLowerCase();

    return items.filter((row) => {
      if (statusFilter !== "all" && (row.lead_status ?? "") !== statusFilter) {
        return false;
      }

      if (!keyword) return true;

      const hay =
        `${row.name ?? ""} ${row.phone ?? ""} ${row.region ?? ""} ${row.crop ?? ""} ${row.booth_name ?? ""} ${row.last_product_name ?? ""}`.toLowerCase();

      return hay.includes(keyword);
    });
  }, [items, q, statusFilter]);

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <div style={S.kicker}>VENDOR CRM</div>
            <h1 style={S.title}>고객관리</h1>
            <div style={S.desc}>
              문의가 누적된 고객을 정리하고, 상태와 메모를 자동 저장으로 관리합니다.
            </div>
          </div>

          <button onClick={() => void load()} style={S.refreshBtn}>
            새로고침
          </button>
        </header>

        <section style={S.filterBar}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름, 연락처, 지역, 작물, 상품명 검색"
            style={S.searchInput}
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={S.select}
          >
            <option value="all">전체 상태</option>
            <option value="new">신규</option>
            <option value="warm">관심</option>
            <option value="hot">집중관리</option>
            <option value="customer">고객</option>
            <option value="dormant">휴면</option>
          </select>
        </section>

        {loading ? (
          <div style={S.stateBox}>고객 목록 불러오는 중...</div>
        ) : errorText ? (
          <div style={S.errorBox}>{errorText}</div>
        ) : filtered.length === 0 ? (
          <div style={S.stateBox}>표시할 고객이 없습니다.</div>
        ) : (
          <div style={S.list}>
            {filtered.map((item) => (
              <LeadCard
                key={item.id}
                item={item}
                onSave={saveLead}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function LeadCard({
  item,
  onSave,
}: {
  item: LeadRow;
  onSave: (
    leadId: string,
    leadStatus: LeadStatus,
    memo: string | null
  ) => Promise<void>;
}) {
  const initialStatus = ((item.lead_status as LeadStatus) || "new") as LeadStatus;
  const initialMemo = item.memo ?? "";

  const [status, setStatus] = React.useState<LeadStatus>(initialStatus);
  const [memo, setMemo] = React.useState(initialMemo);
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const [saveError, setSaveError] = React.useState("");

  const mountedRef = React.useRef(false);
  const timerRef = React.useRef<number | null>(null);
  const initialRef = React.useRef({
    status: initialStatus,
    memo: initialMemo,
  });

  const telHref = item.phone ? `tel:${item.phone.replace(/\s+/g, "")}` : null;

  React.useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    const changed =
      status !== initialRef.current.status || memo !== initialRef.current.memo;

    if (!changed) {
      return;
    }

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(async () => {
      try {
        setSaveState("saving");
        setSaveError("");

        await onSave(item.id, status, memo);

        initialRef.current = {
          status,
          memo,
        };

        setSaveState("saved");

        window.setTimeout(() => {
          setSaveState((prev) => (prev === "saved" ? "idle" : prev));
        }, 1200);
      } catch (e: any) {
        setSaveState("error");
        setSaveError(e?.message || "자동 저장 실패");
      }
    }, 800);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [status, memo, item.id, onSave]);

  return (
    <section style={S.card}>
      <div style={S.cardTop}>
        <div style={{ minWidth: 0 }}>
          <div style={S.titleRow}>
            <div style={S.cardTitle}>{item.name ?? "이름 없음"}</div>
            <span
              style={{
                ...S.statusPill,
                ...leadStatusStyle(item.lead_status),
              }}
            >
              {leadStatusLabel(item.lead_status)}
            </span>
          </div>

          <div style={S.subMeta}>
            {item.booth_name ?? "부스"} · {item.region ?? "-"} · {item.crop ?? "-"}
          </div>
        </div>

        <div style={S.topRight}>
          {telHref ? (
            <a href={telHref} style={S.callBtn}>
              전화걸기
            </a>
          ) : null}

          <div style={S.saveStateWrap}>
            {saveState === "saving" ? (
              <span style={S.savingText}>저장 중...</span>
            ) : null}
            {saveState === "saved" ? (
              <span style={S.savedText}>저장 완료</span>
            ) : null}
            {saveState === "error" ? (
              <span style={S.errorMiniText}>{saveError || "저장 실패"}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div style={S.grid}>
        <div style={S.box}>
          <div style={S.label}>연락처</div>
          <div style={S.value}>{item.phone ?? "-"}</div>
        </div>

        <div style={S.box}>
          <div style={S.label}>최근 관심 상품</div>
          <div style={S.value}>{item.last_product_name ?? "-"}</div>
        </div>

        <div style={S.box}>
          <div style={S.label}>첫 문의일</div>
          <div style={S.value}>{fmtDate(item.first_inquiry_at)}</div>
        </div>

        <div style={S.box}>
          <div style={S.label}>최근 문의일</div>
          <div style={S.value}>{fmtDate(item.last_inquiry_at)}</div>
        </div>

        <div style={S.box}>
          <div style={S.label}>문의 횟수</div>
          <div style={S.valueStrong}>{item.inquiry_count ?? 0}회</div>
        </div>

        <div style={S.box}>
          <div style={S.label}>주문 횟수</div>
          <div style={S.valueStrong}>{item.order_count ?? 0}회</div>
        </div>

        <div style={S.boxFull}>
          <div style={S.label}>누적 주문금액</div>
          <div style={S.valueStrong}>{fmtAmount(item.total_order_amount ?? 0)}</div>
        </div>
      </div>

      <div style={S.editWrap}>
        <div style={S.editCol}>
          <label style={S.label}>고객 상태</label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as LeadStatus)
            }
            style={S.select}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ ...S.editCol, flex: 1.5 }}>
          <label style={S.label}>고객 메모</label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="예: 마늘 농가 / 총채벌레 방제 관심 / 다음 주 재연락 예정"
            style={S.textarea}
          />
        </div>
      </div>

      <div style={S.bottomRow}>
        <div style={S.subMeta}>최근 수정: {fmtDate(item.updated_at)}</div>
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
  filterBar: {
    marginBottom: 16,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  searchInput: {
    flex: 1,
    minWidth: 260,
    height: 46,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: 14,
    background: "#fff",
  },
  select: {
    minWidth: 170,
    height: 46,
    borderRadius: 12,
    border: "1px solid #d1d5db",
    padding: "0 12px",
    fontSize: 14,
    background: "#fff",
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
  topRight: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
  },
  titleRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
  },
  statusPill: {
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 900,
  },
  subMeta: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
    lineHeight: 1.7,
  },
  callBtn: {
    textDecoration: "none",
    border: "1px solid #111827",
    background: "#111827",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 14px",
    fontWeight: 900,
  },
  saveStateWrap: {
    minHeight: 20,
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
  grid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
  },
  box: {
    border: "1px solid #eef2f7",
    background: "#f8fafc",
    borderRadius: 14,
    padding: 12,
  },
  boxFull: {
    gridColumn: "1 / -1",
    border: "1px solid #eef2f7",
    background: "#f8fafc",
    borderRadius: 14,
    padding: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
    marginBottom: 8,
  },
  value: {
    fontSize: 14,
    color: "#111827",
    lineHeight: 1.6,
    fontWeight: 800,
  },
  valueStrong: {
    fontSize: 18,
    color: "#111827",
    lineHeight: 1.4,
    fontWeight: 950,
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
    background: "#fff",
  },
  bottomRow: {
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
  },
};