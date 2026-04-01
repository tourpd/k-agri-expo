"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

export type DealRowForList = {
  deal_id: string;
  booth_id: string;
  title: string | null;
  image_url: string | null;
  stock: number | null;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean | null;
  lead_count?: number | null; // 있으면 사용
};

type SortKey = "closing" | "consult" | "newest" | "stock";

export default function DealsListClient({ deals }: { deals: DealRowForList[] }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("closing");

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let arr = deals.filter((d) => (d.title ?? "").toLowerCase().includes(qq));

    arr = [...arr].sort((a, b) => {
      if (sort === "closing") return toTime(a.end_at) - toTime(b.end_at);
      if (sort === "stock") return (a.stock ?? 999999) - (b.stock ?? 999999);
      if (sort === "newest") return toTime(b.start_at) - toTime(a.start_at);
      if (sort === "consult") return (b.lead_count ?? 0) - (a.lead_count ?? 0);
      return 0;
    });

    return arr;
  }, [deals, q, sort]);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={toolbar}>
        <input
          style={search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="딜 검색(예: 돌분쇄기, 비료, 트랙터...)"
        />

        <select style={select} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="closing">마감 임박</option>
          <option value="consult">상담 많은 순</option>
          <option value="newest">최신 등록</option>
          <option value="stock">잔여 적은 순</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={empty}>검색 결과가 없습니다.</div>
      ) : (
        <div style={grid}>
          {filtered.map((d) => (
            <Link key={d.deal_id} href={`/expo/${d.deal_id}`} style={card}>
              {d.image_url ? (
                <img src={d.image_url} alt={d.title ?? "deal"} style={img} />
              ) : (
                <div style={{ height: 170, background: "#f3f4f6" }} />
              )}

              <div style={{ padding: 14 }}>
                <div style={title}>{d.title ?? "특가 딜"}</div>

                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={pillStrong}>잔여 {d.stock ?? 0}</span>
                  <span style={pillSoft}>마감 {fmtK(d.end_at)}</span>
                  <span style={pillSoft}>상담 {d.lead_count ?? 0}</span>
                </div>

                <div style={{ marginTop: 10, fontSize: 14, fontWeight: 950, color: "#111" }}>
                  👉 상세에서 영상/사진/PDF 확인
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function toTime(s: string | null) {
  if (!s) return 9999999999999;
  const t = new Date(s).getTime();
  return Number.isFinite(t) ? t : 9999999999999;
}

function fmtK(s: string | null) {
  if (!s) return "-";
  try {
    return new Date(s).toLocaleString("ko-KR");
  } catch {
    return "-";
  }
}

/** styles */
const toolbar: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 180px",
  gap: 10,
};

const search: React.CSSProperties = {
  height: 56,
  borderRadius: 16,
  border: "2px solid #111",
  padding: "0 14px",
  fontSize: 18,
  fontWeight: 850,
  outline: "none",
};

const select: React.CSSProperties = {
  height: 56,
  borderRadius: 16,
  border: "2px solid #111",
  padding: "0 10px",
  fontSize: 16,
  fontWeight: 950,
  background: "#fff",
};

const grid: React.CSSProperties = {
  marginTop: 12,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
  gap: 12,
};

const card: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  overflow: "hidden",
  background: "#fff",
  textDecoration: "none",
  color: "#111",
};

const img: React.CSSProperties = {
  width: "100%",
  height: 170,
  objectFit: "cover",
};

const title: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 950,
  lineHeight: 1.35,
};

const empty: React.CSSProperties = {
  marginTop: 12,
  padding: 14,
  borderRadius: 18,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  fontSize: 16,
  color: "#444",
  lineHeight: 1.6,
};

const pillStrong: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  fontSize: 14,
  whiteSpace: "nowrap",
};

const pillSoft: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  background: "#f9fafb",
  color: "#111",
  fontWeight: 950,
  fontSize: 14,
  whiteSpace: "nowrap",
};