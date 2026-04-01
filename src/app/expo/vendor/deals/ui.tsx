"use client";

import { useState } from "react";

type DealItem = {
  deal_id: string;
  title: string | null;
  description: string | null;
  regular_price_text: string | null;
  expo_price_text: string | null;
  stock_text: string | null;
  deadline_at: string | null;
  buy_url: string | null;
  is_active: boolean | null;
};

export default function DealsClient({
  boothId,
  deals,
}: {
  boothId: string;
  deals: DealItem[];
}) {
  const [list, setList] = useState<DealItem[]>(deals);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [regularPriceText, setRegularPriceText] = useState("");
  const [expoPriceText, setExpoPriceText] = useState("");
  const [stockText, setStockText] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [buyUrl, setBuyUrl] = useState("");

  async function createDeal() {
    try {
      if (!title.trim()) {
        alert("특가 제목을 입력해 주세요.");
        return;
      }

      setLoading(true);

      const res = await fetch("/api/vendor/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boothId,
          title,
          description,
          regular_price_text: regularPriceText,
          expo_price_text: expoPriceText,
          stock_text: stockText,
          deadline_at: deadlineAt || null,
          buy_url: buyUrl,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "등록 실패");
        return;
      }

      setList([json.data, ...list]);
      setTitle("");
      setDescription("");
      setRegularPriceText("");
      setExpoPriceText("");
      setStockText("");
      setDeadlineAt("");
      setBuyUrl("");
      alert("특가 등록 완료");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(id: string, isActive: boolean) {
    try {
      setLoading(true);

      const res = await fetch("/api/vendor/deals", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dealId: id,
          is_active: !isActive,
        }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "상태 변경 실패");
        return;
      }

      setList(
        list.map((d) =>
          d.deal_id === id ? { ...d, is_active: !isActive } : d
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeDeal(id: string) {
    if (!confirm("이 특가를 삭제하시겠습니까?")) return;

    try {
      setLoading(true);

      const res = await fetch("/api/vendor/deals", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dealId: id }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "삭제 실패");
        return;
      }

      setList(list.filter((d) => d.deal_id !== id));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <h1 style={S.title}>🔥 특가 관리</h1>
        <p style={S.desc}>
          농민이 바로 반응할 수 있는 특가를 등록하고, 노출 ON/OFF를 제어합니다.
        </p>

        <div style={S.formCard}>
          <div style={S.grid2}>
            <input
              style={S.input}
              placeholder="특가 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              style={S.input}
              placeholder="구매 링크"
              value={buyUrl}
              onChange={(e) => setBuyUrl(e.target.value)}
            />
          </div>

          <textarea
            style={S.textarea}
            placeholder="특가 설명"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div style={S.grid3}>
            <input
              style={S.input}
              placeholder="정가 문구 (예: 120,000원)"
              value={regularPriceText}
              onChange={(e) => setRegularPriceText(e.target.value)}
            />
            <input
              style={S.input}
              placeholder="엑스포 특가 문구 (예: 89,000원)"
              value={expoPriceText}
              onChange={(e) => setExpoPriceText(e.target.value)}
            />
            <input
              style={S.input}
              placeholder="재고/수량 문구 (예: 100개 한정)"
              value={stockText}
              onChange={(e) => setStockText(e.target.value)}
            />
          </div>

          <div style={S.grid1}>
            <input
              type="datetime-local"
              style={S.input}
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
            />
          </div>

          <button style={S.primaryBtn} onClick={createDeal} disabled={loading}>
            {loading ? "처리 중..." : "특가 등록"}
          </button>
        </div>

        <div style={{ marginTop: 28 }}>
          {list.length === 0 ? (
            <div style={S.empty}>등록된 특가가 없습니다.</div>
          ) : (
            list.map((d) => (
              <div key={d.deal_id} style={S.itemCard}>
                <div style={S.itemTop}>
                  <div>
                    <div style={S.itemTitle}>{d.title || "제목 없음"}</div>
                    <div style={S.itemDesc}>{d.description || "설명 없음"}</div>
                  </div>
                  <div style={S.badge}>
                    {d.is_active ? "노출중" : "비활성"}
                  </div>
                </div>

                <div style={S.metaRow}>
                  <span>정가: {d.regular_price_text || "-"}</span>
                  <span>특가: {d.expo_price_text || "-"}</span>
                  <span>재고: {d.stock_text || "-"}</span>
                </div>

                <div style={S.metaRow}>
                  <span>
                    마감:
                    {" "}
                    {d.deadline_at
                      ? new Date(d.deadline_at).toLocaleString("ko-KR")
                      : "-"}
                  </span>
                  <span>구매링크: {d.buy_url || "-"}</span>
                </div>

                <div style={S.actionRow}>
                  <button
                    style={S.secondaryBtn}
                    onClick={() => toggleActive(d.deal_id, !!d.is_active)}
                    disabled={loading}
                  >
                    {d.is_active ? "OFF" : "ON"}
                  </button>

                  <button
                    style={S.dangerBtn}
                    onClick={() => removeDeal(d.deal_id)}
                    disabled={loading}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    padding: 32,
    background: "#f8fafc",
    minHeight: "100vh",
  },
  wrap: {
    maxWidth: 960,
    margin: "0 auto",
  },
  title: {
    fontSize: 30,
    fontWeight: 950,
    color: "#111827",
    margin: 0,
  },
  desc: {
    color: "#64748b",
    lineHeight: 1.8,
    marginTop: 10,
  },
  formCard: {
    marginTop: 24,
    padding: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
  },
  grid1: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
    marginTop: 12,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 12,
    marginTop: 12,
  },
  input: {
    width: "100%",
    height: 46,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 100,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    boxSizing: "border-box",
    fontSize: 14,
    resize: "vertical",
  },
  primaryBtn: {
    marginTop: 14,
    height: 46,
    padding: "0 16px",
    border: "none",
    borderRadius: 12,
    background: "#0f172a",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryBtn: {
    height: 40,
    padding: "0 14px",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    background: "#fff",
    color: "#111827",
    fontWeight: 800,
    cursor: "pointer",
  },
  dangerBtn: {
    height: 40,
    padding: "0 14px",
    border: "1px solid #fecaca",
    borderRadius: 10,
    background: "#fff1f2",
    color: "#b91c1c",
    fontWeight: 800,
    cursor: "pointer",
  },
  empty: {
    padding: 20,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#64748b",
  },
  itemCard: {
    padding: 18,
    borderRadius: 18,
    background: "#fff",
    border: "1px solid #e5e7eb",
    marginBottom: 12,
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: "#111827",
  },
  itemDesc: {
    marginTop: 6,
    fontSize: 14,
    color: "#64748b",
    lineHeight: 1.7,
  },
  badge: {
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: 12,
    fontWeight: 900,
    display: "flex",
    alignItems: "center",
  },
  metaRow: {
    display: "flex",
    gap: 16,
    flexWrap: "wrap",
    marginTop: 12,
    color: "#334155",
    fontSize: 13,
  },
  actionRow: {
    display: "flex",
    gap: 8,
    marginTop: 14,
  },
};