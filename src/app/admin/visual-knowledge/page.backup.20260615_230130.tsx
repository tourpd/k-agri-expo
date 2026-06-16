"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Row = {
  id: string;
  source_name: string;
  source_title?: string;
  source_category?: string;
  source_type?: string;
  image_url: string;
  page_no?: number;
  visual_type?: string;
  crop?: string;
  disease_name?: string;
  growth_stage?: string;
  key_info?: string;
  ai_summary?: string;
  ai_action_guide?: string;
  ai_crop?: string;
  ai_disease?: string;
  ai_growth_stage?: string;
  ai_confidence?: number;
  ai_status?: string;
  use_case?: string;
  confidence?: number;
  db_destination?: string;
  usage_flow?: string;
  business_use?: string;
  operator_note?: string;
  edit_request?: string;
  next_action?: string;
};

export default function VisualKnowledgePage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("대기");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  async function load() {
    const res = await fetch("/api/admin/visual-knowledge");
    const json = await res.json();
    if (json.ok) {
      setRows(json.data || []);
      setMsg(`DB ${json.data?.length || 0}건`);
    } else {
      setMsg(json.error || "조회 실패");
    }
  }

  async function scan() {
    setMsg("자료화면 이미지 스캔 중...");
    const res = await fetch("/api/admin/visual-knowledge", { method: "POST" });
    const json = await res.json();
    if (json.ok) {
      setMsg(`스캔 완료 ${json.count}장`);
      await load();
    } else {
      setMsg(json.error || "스캔 실패");
    }
  }

  async function runAiAnalysis() {
    setMsg("AI 정밀분석 실행 중...");
    const res = await fetch("/api/admin/visual-knowledge/analyze", { method: "POST" });
    const json = await res.json();
    if (json.ok) {
      setMsg(json.message || "AI 정밀분석 완료");
      await load();
    } else {
      setMsg(json.message || "AI 정밀분석 실패");
    }
  }

  async function saveDetail() {
    if (!detail) return;
    setMsg("공동편집 저장 중...");

    const res = await fetch("/api/admin/visual-knowledge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(detail),
    });

    const json = await res.json();

    if (json.ok) {
      setMsg("공동편집 저장 완료");
      setDetail(null);
      await load();
    } else {
      setMsg(json.error || "저장 실패");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const data = rows.filter((r) => {
      const text = [
        r.source_title,
        r.source_name,
        r.page_no,
        r.ai_crop || r.crop,
        r.ai_disease || r.disease_name,
        r.key_info,
        r.ai_summary,
        r.next_action,
        r.operator_note,
      ]
        .join(" ")
        .toLowerCase();

      return !q || text.includes(q);
    });

    data.sort((a, b) => {
      const av = Number(a.page_no || 0);
      const bv = Number(b.page_no || 0);
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return data;
  }, [rows, query, sortDir]);

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <Link href="/admin/dashboard" style={S.back}>← 관리자 대시보드</Link>
          <div style={S.eye}>K-AGRI VISUAL KNOWLEDGE CENTER</div>
          <h1 style={S.title}>자료화면 AI DB센터</h1>
          <p style={S.sub}>사진·표·그래프를 보고 관리할 수 있게 한 화면 운영형으로 정리합니다.</p>
        </header>

        <section style={S.kpis}>
          <div style={S.kpi}><b>전체</b><strong>{rows.length.toLocaleString()}장</strong><span>자료화면</span></div>
          <div style={S.kpi}><b>현재 표시</b><strong>{filtered.length.toLocaleString()}장</strong><span>검색 결과</span></div>
          <div style={S.kpi}><b>작물태깅</b><strong>{rows.filter((r) => r.ai_crop || r.crop).length.toLocaleString()}건</strong><span>자동/수동 포함</span></div>
          <div style={S.kpi}><b>상태</b><strong>{msg}</strong><span>DB 연결</span></div>
        </section>

        <section style={S.toolbar}>
          <button style={S.greenBtn} onClick={scan}>자료화면 이미지 DB 스캔</button>
          <button style={S.greenBtn} onClick={runAiAnalysis}>AI 정밀분석</button>
          <button style={S.darkBtn} onClick={load}>새로고침</button>
          <Link href="/admin/knowledge-assets/extract" style={S.linkBtn}>자료 업로드</Link>
          <Link href="/admin/knowledge-assets/rules" style={S.linkBtn}>판단규칙 DB</Link>
        </section>

        <section style={S.searchBox}>
          <input
            style={S.search}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="검색: 자료제목, 작물, 병해충, 핵심정보, AI요약, 운영메모"
          />
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <b>자료화면 분석표 — 한 화면 운영형</b>
            <span>현재 {filtered.length.toLocaleString()}건</span>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.thImg}>이미지</th>
                  <th style={S.thTitle}>자료제목</th>
                  <th style={S.thPage} onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}>
                    페이지 {sortDir === "asc" ? "▲" : "▼"}
                  </th>
                  <th style={S.thSmall}>작물</th>
                  <th style={S.thSmall}>병해충</th>
                  <th style={S.thInfo}>핵심정보</th>
                  <th style={S.thInfo}>AI요약</th>
                  <th style={S.thInfo}>다음작업</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={S.tr} onClick={() => setDetail(r)}>
                    <td style={S.tdImg}>
                      <img src={r.image_url} alt="자료화면" style={S.thumb} />
                    </td>
                    <td style={S.tdTitle}>
                      {r.source_title || r.source_name || "자료제목 필요"}
                      <div style={S.mini}>{r.db_destination || "knowledge_visual_pages"}</div>
                    </td>
                    <td style={S.tdCenter}>{r.page_no || "-"}</td>
                    <td style={S.td}>{r.ai_crop || r.crop || "분석필요"}</td>
                    <td style={S.td}>{r.ai_disease || r.disease_name || "분석필요"}</td>
                    <td style={S.tdEllipsis}>{r.key_info || "AI 정밀분석 대기"}</td>
                    <td style={S.tdEllipsis}>{r.ai_summary || "-"}</td>
                    <td style={S.tdEllipsis}>{r.next_action || "AI 분석 후 활용처 확정"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {detail && (
          <div style={S.modalBg} onClick={() => setDetail(null)}>
            <div style={S.modal} onClick={(e) => e.stopPropagation()}>
              <button style={S.close} onClick={() => setDetail(null)}>닫기</button>
              <h2>{detail.source_title || detail.source_name} / {detail.page_no || "-"}페이지</h2>

              <div style={S.modalGrid}>
                <div>
                  <img src={detail.image_url} style={S.bigImage} alt="자료화면" />
                </div>

                <div style={S.editBox}>
                  <label>자료제목</label>
                  <input style={S.input} value={detail.source_title || ""} onChange={(e) => setDetail({ ...detail, source_title: e.target.value })} />

                  <label>작물</label>
                  <input style={S.input} value={detail.ai_crop || detail.crop || ""} onChange={(e) => setDetail({ ...detail, ai_crop: e.target.value })} />

                  <label>병해충/이슈</label>
                  <input style={S.input} value={detail.ai_disease || detail.disease_name || ""} onChange={(e) => setDetail({ ...detail, ai_disease: e.target.value })} />

                  <label>핵심정보</label>
                  <textarea style={S.textarea} value={detail.key_info || ""} onChange={(e) => setDetail({ ...detail, key_info: e.target.value })} />

                  <label>AI요약</label>
                  <textarea style={S.textarea} value={detail.ai_summary || ""} onChange={(e) => setDetail({ ...detail, ai_summary: e.target.value })} />

                  <label>공동편집 메모</label>
                  <textarea style={S.textarea} value={detail.operator_note || ""} onChange={(e) => setDetail({ ...detail, operator_note: e.target.value })} placeholder="이 자료를 보고 떠오른 생각, 방송소재, 수정할 점" />

                  <label>수정요청</label>
                  <textarea style={S.textarea} value={detail.edit_request || ""} onChange={(e) => setDetail({ ...detail, edit_request: e.target.value })} />

                  <label>다음작업</label>
                  <textarea style={S.textarea} value={detail.next_action || ""} onChange={(e) => setDetail({ ...detail, next_action: e.target.value })} />

                  <button style={S.saveBtn} onClick={saveDetail}>공동편집 저장</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: "14px 18px" },
  wrap: { maxWidth: 1800, margin: "0 auto" },
  header: { marginBottom: 10 },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eye: { marginTop: 10, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "4px 0", fontSize: 42, fontWeight: 950, letterSpacing: "-.06em" },
  sub: { color: "#475569", fontSize: 15, fontWeight: 850, margin: 0 },
  kpis: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: 10 },
  kpi: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 14, padding: 12, display: "grid", gap: 5 },
  toolbar: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 14, padding: 10, display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" },
  greenBtn: { background: "#15803d", color: "#fff", border: 0, borderRadius: 12, padding: "12px 16px", fontWeight: 950 },
  darkBtn: { background: "#0f172a", color: "#fff", border: 0, borderRadius: 12, padding: "12px 16px", fontWeight: 950 },
  linkBtn: { background: "#0f172a", color: "#fff", borderRadius: 12, padding: "12px 16px", textDecoration: "none", fontWeight: 950 },
  searchBox: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 14, padding: 10, marginBottom: 10 },
  search: { width: "100%", border: "1px solid #cbd5e1", borderRadius: 12, padding: 14, fontWeight: 850 },
  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 18, overflow: "hidden" },
  panelHead: { padding: 12, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" },
  tableWrap: { overflowX: "hidden", overflowY: "auto", maxHeight: "calc(100vh - 310px)" },
  table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" },
  thImg: { width: 140, background: "#f1f5f9", padding: 10, textAlign: "left" },
  thTitle: { width: 220, background: "#f1f5f9", padding: 10, textAlign: "left" },
  thPage: { width: 80, background: "#f1f5f9", padding: 10, textAlign: "center", cursor: "pointer" },
  thSmall: { width: 110, background: "#f1f5f9", padding: 10, textAlign: "left" },
  thInfo: { background: "#f1f5f9", padding: 10, textAlign: "left" },
  tr: { cursor: "pointer" },
  tdImg: { padding: 8, borderTop: "1px solid #edf2f7" },
  thumb: { width: 120, height: 78, objectFit: "cover", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" },
  tdTitle: { padding: 10, borderTop: "1px solid #edf2f7", fontWeight: 950 },
  mini: { marginTop: 4, color: "#64748b", fontSize: 12 },
  tdCenter: { padding: 10, borderTop: "1px solid #edf2f7", textAlign: "center", fontWeight: 950 },
  td: { padding: 10, borderTop: "1px solid #edf2f7", fontWeight: 850 },
  tdEllipsis: { padding: 10, borderTop: "1px solid #edf2f7", fontWeight: 850, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  modalBg: { position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", zIndex: 50, display: "grid", placeItems: "center", padding: 24 },
  modal: { width: "min(1500px, 96vw)", maxHeight: "92vh", overflow: "auto", background: "#fff", borderRadius: 20, padding: 20, position: "relative" },
  close: { position: "absolute", right: 18, top: 18, background: "#0f172a", color: "#fff", border: 0, borderRadius: 10, padding: "10px 14px", fontWeight: 950 },
  modalGrid: { display: "grid", gridTemplateColumns: "1fr 520px", gap: 18 },
  bigImage: { width: "100%", maxHeight: "78vh", objectFit: "contain", border: "1px solid #e5e7eb", borderRadius: 14, background: "#f8fafc" },
  editBox: { display: "grid", gap: 8, fontWeight: 900 },
  input: { border: "1px solid #cbd5e1", borderRadius: 10, padding: 10, fontWeight: 850 },
  textarea: { border: "1px solid #cbd5e1", borderRadius: 10, padding: 10, minHeight: 68, fontWeight: 850, lineHeight: 1.5 },
  saveBtn: { marginTop: 8, background: "#15803d", color: "#fff", border: 0, borderRadius: 12, padding: "14px 18px", fontWeight: 950 },
};
