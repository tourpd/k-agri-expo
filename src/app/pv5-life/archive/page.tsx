"use client";

import { useEffect, useMemo, useState } from "react";

export default function PV5ArchivePage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/pv5/archive", { cache: "no-store" });
    const data = await res.json();
    setRows(data.rows || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return rows;
    return rows.filter((r) =>
      [
        r.video_title,
        r.source_channel,
        r.builder_name,
        r.builder_region,
        r.builder_contact,
        r.vehicle_type,
        r.vehicle_model,
        r.main_category,
        r.sub_category,
        r.summary,
        r.cost_meaning,
        r.writer_room_notes,
        r.business_notes,
        r.developer_notes,
        r.content_notes,
        r.video_url,
      ]
        .join(" ")
        .toLowerCase()
        .includes(k)
    );
  }, [rows, q]);

  function text(v: any) {
    if (!v) return "";
    if (typeof v === "string") return v;
    return JSON.stringify(v);
  }

  function price(v: any) {
    const arr = Array.isArray(v) ? v : [];
    return arr
      .filter((x) => x?.item || x?.price_krw)
      .map((x) => `${x.item || ""} ${x.price_krw ? Number(x.price_krw).toLocaleString() + "원" : ""}`)
      .join(" / ");
  }

  function products(v: any) {
    const arr = Array.isArray(v) ? v : [];
    return arr.map((x) => x?.name || x?.item || "").filter(Boolean).join(" / ");
  }

  return (
    <main style={S.page}>
      <section style={S.header}>
        <h1 style={S.title}>PV5 작가실 엑셀 DB</h1>
        <p style={S.desc}>유튜브에서 수집·분석된 PV5 실자료를 엑셀형으로 관리합니다.</p>

        <div style={S.toolbar}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="업체명, 가격, 차종, 제품, 키워드 검색"
            style={S.search}
          />
          <button onClick={load} style={S.button}>새로고침</button>
        </div>

        <div style={S.count}>
          전체 {rows.length}개 / 검색 결과 {filtered.length}개
        </div>
      </section>

      {loading ? (
        <div style={S.loading}>불러오는 중...</div>
      ) : (
        <div style={S.tableWrap}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>번호</th>
                <th style={S.th}>제목</th>
                <th style={S.th}>채널</th>
                <th style={S.th}>업체</th>
                <th style={S.th}>지역</th>
                <th style={S.th}>연락처</th>
                <th style={S.th}>차종</th>
                <th style={S.th}>분류</th>
                <th style={S.th}>가격</th>
                <th style={S.th}>제품</th>
                <th style={S.th}>핵심요약</th>
                <th style={S.th}>작가실 메모</th>
                <th style={S.th}>사업실 메모</th>
                <th style={S.th}>개발실 메모</th>
                <th style={S.th}>콘텐츠 메모</th>
                <th style={S.th}>URL</th>
                <th style={S.th}>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id || i}>
                  <td style={S.td}>{i + 1}</td>
                  <td style={S.tdTitle}>{r.video_title || "-"}</td>
                  <td style={S.td}>{r.source_channel || "-"}</td>
                  <td style={S.td}>{r.builder_name || "-"}</td>
                  <td style={S.td}>{r.builder_region || "-"}</td>
                  <td style={S.td}>{r.builder_contact || "-"}</td>
                  <td style={S.td}>{r.vehicle_type || r.vehicle_model || "-"}</td>
                  <td style={S.td}>{[r.main_category, r.sub_category].filter(Boolean).join(" / ") || "-"}</td>
                  <td style={S.td}>{price(r.confirmed_costs) || "-"}</td>
                  <td style={S.td}>{products(r.products) || "-"}</td>
                  <td style={S.tdWide}>{r.summary || "-"}</td>
                  <td style={S.tdWide}>{r.writer_room_notes || "-"}</td>
                  <td style={S.tdWide}>{r.business_notes || "-"}</td>
                  <td style={S.tdWide}>{r.developer_notes || "-"}</td>
                  <td style={S.tdWide}>{r.content_notes || "-"}</td>
                  <td style={S.td}>
                    {r.video_url ? (
                      <a href={r.video_url} target="_blank" rel="noreferrer">
                        보기
                      </a>
                    ) : "-"}
                  </td>
                  <td style={S.td}>{r.status || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f3f4f6", color: "#111827", padding: 24, fontFamily: "Arial, sans-serif" },
  header: { background: "#fff", borderRadius: 18, padding: 24, boxShadow: "0 12px 30px rgba(0,0,0,0.08)", marginBottom: 20 },
  title: { margin: 0, fontSize: 30, fontWeight: 900 },
  desc: { color: "#4b5563", fontSize: 16 },
  toolbar: { display: "flex", gap: 12, marginTop: 16 },
  search: { flex: 1, padding: 14, border: "2px solid #d1d5db", borderRadius: 12, fontSize: 16, color: "#111827", background: "#fff" },
  button: { padding: "0 22px", border: 0, borderRadius: 12, background: "#0a7c2f", color: "#fff", fontWeight: 900, fontSize: 16 },
  count: { marginTop: 14, color: "#047857", fontWeight: 900 },
  loading: { padding: 30, background: "#fff", borderRadius: 18, fontWeight: 900 },
  tableWrap: { overflow: "auto", background: "#fff", borderRadius: 18, boxShadow: "0 12px 30px rgba(0,0,0,0.08)" },
  table: { borderCollapse: "collapse", width: "2200px", fontSize: 13 },
  th: { position: "sticky", top: 0, background: "#111827", color: "#fff", border: "1px solid #374151", padding: 10, textAlign: "left", whiteSpace: "nowrap" },
  td: { border: "1px solid #d1d5db", padding: 9, verticalAlign: "top", minWidth: 110 },
  tdTitle: { border: "1px solid #d1d5db", padding: 9, verticalAlign: "top", minWidth: 260, fontWeight: 800 },
  tdWide: { border: "1px solid #d1d5db", padding: 9, verticalAlign: "top", minWidth: 260, lineHeight: 1.45 },
};
