"use client";

import { useState } from "react";
import Link from "next/link";

export default function FarmActionEngineClient() {
  const [crop, setCrop] = useState("고추");
  const [month, setMonth] = useState("6월");
  const [actions, setActions] = useState<any[]>([]);
  const [top5, setTop5] = useState<any[]>([]);
  const [smsText, setSmsText] = useState("");
  const [msg, setMsg] = useState("대기");
  const [manualPpl, setManualPpl] = useState("아미65, 아스트롱");
  const [loading, setLoading] = useState(false);

  async function makeTop5() {
    if (actions.length === 0) {
      alert("먼저 오늘 할 일을 생성하세요.");
      return;
    }

    setLoading(true);
    setMsg("TOP5 압축 중...");

    try {
      const res = await fetch("/api/admin/farm-action-engine/top5", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, month, actions }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "TOP5 생성 실패");

      setTop5(json.top5 || []);
      setSmsText(json.sms || "");
      setMsg(`TOP5 ${json.top5?.length || 0}건 생성`);
    } catch (e: any) {
      setMsg(e.message || "TOP5 오류");
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    setLoading(true);
    setMsg("조회 중...");

    try {
      const res = await fetch("/api/admin/farm-action-engine/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crop, month }),
      });

      const json = await res.json();

      if (!res.ok) throw new Error(json.error || "조회 실패");

      setActions(json.actions || []);
      setTop5([]);
      setSmsText("");
      setMsg(`${json.count || 0}건 생성`);
    } catch (e: any) {
      setMsg(e.message || "오류");
      setActions([]);
    } finally {
      setLoading(false);
    }
  }

  const sms =
    actions.length === 0
      ? ""
      : `${crop} ${month} 농가 행동알림\n\n` +
        actions.slice(0, 5).map((a, i) => `${i + 1}. ${a.action_instruction}`).join("\n");

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/knowledge-assets" style={S.back}>← 농업 AI 두뇌센터</Link>
            <div style={S.eye}>K-AGRI FARM ACTION ENGINE</div>
            <h1 style={S.title}>농민 행동지시 운영센터</h1>
            <p style={S.sub}>knowledge_rules DB를 오늘 할 일 엑셀표로 변환합니다.</p>
          </div>
          <div style={S.btns}>
            <Link href="/admin/knowledge-assets" style={S.darkLink}>두뇌센터</Link>
            <Link href="/admin/knowledge-assets/extract" style={S.greenLink}>AI 추출기</Link>
          </div>
        </header>

        <section style={S.toolbar}>
          <select style={S.input} value={crop} onChange={(e) => setCrop(e.target.value)}>
            <option>고추</option>
            <option>가지</option>
            <option>마늘</option>
            <option>양파</option>
            <option>딸기</option>
          </select>

          <select style={S.input} value={month} onChange={(e) => setMonth(e.target.value)}>
            <option>5월</option>
            <option>6월</option>
            <option>7월</option>
            <option>8월</option>
            <option>9월</option>
            <option>10월</option>
          </select>

          <button style={S.greenBtn} onClick={generate} disabled={loading}>
            {loading ? "생성 중..." : "오늘 할 일 생성"}
          </button>

          <button style={S.darkButton} onClick={makeTop5} disabled={loading}>
            TOP5 압축
          </button>

          <input
            style={S.pplInput}
            value={manualPpl}
            onChange={(e) => setManualPpl(e.target.value)}
            placeholder="PPL 상품 직접 입력: 아미65, 아스트롱"
          />

          <b style={S.msg}>{msg}</b>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <b>오늘 할 일 엑셀 운영표</b>
            <span>현재 {actions.length}건</span>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>우선</th>
                  <th style={S.th}>작물</th>
                  <th style={S.th}>월</th>
                  <th style={S.th}>생육단계</th>
                  <th style={S.th}>증상</th>
                  <th style={S.th}>원인</th>
                  <th style={S.th}>대책</th>
                  <th style={S.thWide}>오늘 할 일</th>
                  <th style={S.th}>위험도</th>
                </tr>
              </thead>
              <tbody>
                {actions.length === 0 ? (
                  <tr>
                    <td style={S.empty} colSpan={9}>아직 생성된 행동지시가 없습니다.</td>
                  </tr>
                ) : (
                  actions.map((a, i) => (
                    <tr key={i}>
                      <td style={S.tdRank}>{a.priority}</td>
                      <td style={S.tdStrong}>{a.crop}</td>
                      <td style={S.td}>{a.month}</td>
                      <td style={S.td}>{a.growth_stage}</td>
                      <td style={S.td}>{a.symptom}</td>
                      <td style={S.td}>{a.cause}</td>
                      <td style={S.tdStrong}>{a.countermeasure}</td>
                      <td style={S.tdAction}>{a.action_instruction}</td>
                      <td style={S.td}>{a.risk_level}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <b>오늘 할 일 TOP5</b>
            <span>현재 {top5.length}건</span>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>우선</th>
                  <th style={S.th}>작업명</th>
                  <th style={S.th}>이유</th>
                  <th style={S.thWide}>농민 행동지시</th>
                  <th style={S.th}>추천제품 / PPL</th>
                  <th style={S.th}>위험도</th>
                </tr>
              </thead>
              <tbody>
                {top5.length === 0 ? (
                  <tr>
                    <td style={S.empty} colSpan={5}>아직 TOP5가 없습니다. 오늘 할 일 생성 후 TOP5 압축을 누르세요.</td>
                  </tr>
                ) : (
                  top5.map((a, i) => (
                    <tr key={i}>
                      <td style={S.tdRank}>{a.priority}</td>
                      <td style={S.tdStrong}>{a.title}</td>
                      <td style={S.td}>{a.reason}</td>
                      <td style={S.tdAction}>{a.action}</td>
                      <td style={S.tdPpl}>
                        {Array.isArray(a.products) && a.products.length > 0 ? (
                          <div>
                            {a.products.map((p: string) => (
                              <span key={p} style={S.productBadge}>{p}</span>
                            ))}
                            {a.ppl_note ? <p style={S.pplNote}>{a.ppl_note}</p> : null}
                          </div>
                        ) : (
                          <span style={S.pplEmpty}>PPL 상품 추가 예정</span>
                        )}
                      </td>
                      <td style={S.td}>{a.risk_level}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={S.sms}>
          <b>TOP5 SMS 문안</b>
          <textarea style={S.textarea} value={smsText || sms} readOnly />
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: 24 },
  wrap: { maxWidth: 1700, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 18 },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 900 },
  eye: { marginTop: 12, color: "#15803d", fontWeight: 950 },
  title: { fontSize: 48, margin: "8px 0", fontWeight: 950 },
  sub: { color: "#475569", fontWeight: 800 },
  btns: { display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" },
  darkLink: { background: "#0f172a", color: "#fff", padding: "13px 18px", borderRadius: 12, textDecoration: "none", fontWeight: 950, display: "inline-flex", alignItems: "center", justifyContent: "center", height: "fit-content", whiteSpace: "nowrap" },
  greenLink: { background: "#15803d", color: "#fff", padding: "13px 18px", borderRadius: 12, textDecoration: "none", fontWeight: 950, display: "inline-flex", alignItems: "center", justifyContent: "center", height: "fit-content", whiteSpace: "nowrap" },
  toolbar: { display: "flex", gap: 10, alignItems: "center", background: "#fff", borderRadius: 18, padding: 16, marginBottom: 14 },
  input: { padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 900 },
  pplInput: { padding: "12px 14px", borderRadius: 10, border: "1px solid #cbd5e1", color: "#0f172a", fontWeight: 900, minWidth: 320 },
  greenBtn: { background: "#15803d", color: "#fff", border: 0, borderRadius: 12, padding: "13px 18px", fontWeight: 950, cursor: "pointer" },
  darkButton: { background: "#0f172a", color: "#fff", border: 0, borderRadius: 12, padding: "13px 18px", fontWeight: 950, cursor: "pointer" },
  msg: { color: "#15803d" },
  panel: { background: "#fff", borderRadius: 20, overflow: "hidden", border: "1px solid #dbe3ea" },
  panelHead: { padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" },
  tableWrap: { overflowX: "auto" },
  table: { width: "max-content", minWidth: 1600, borderCollapse: "collapse" },
  th: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950, whiteSpace: "nowrap" },
  thWide: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950, minWidth: 480 },
  td: { padding: 12, borderTop: "1px solid #edf2f7", fontWeight: 800, maxWidth: 260 },
  tdRank: { padding: 12, borderTop: "1px solid #edf2f7", color: "#dc2626", fontWeight: 950 },
  tdStrong: { padding: 12, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950, maxWidth: 280 },
  tdAction: { padding: 12, borderTop: "1px solid #edf2f7", color: "#dc2626", fontWeight: 950, maxWidth: 620 },
  tdPpl: { padding: 12, borderTop: "1px solid #edf2f7", fontWeight: 900, minWidth: 220, maxWidth: 300 },
  productBadge: { display: "inline-flex", margin: "0 6px 6px 0", background: "#ecfdf5", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: 999, padding: "6px 10px", fontWeight: 950 },
  pplNote: { marginTop: 6, color: "#dc2626", fontWeight: 900 },
  pplEmpty: { color: "#64748b", fontWeight: 850 },
  empty: { padding: 40, textAlign: "center", color: "#64748b", fontWeight: 900 },
  sms: { marginTop: 14, background: "#fff", borderRadius: 20, padding: 16, border: "1px solid #dbe3ea" },
  textarea: { marginTop: 12, width: "100%", minHeight: 130, border: "1px solid #cbd5e1", borderRadius: 12, padding: 14, color: "#0f172a", fontWeight: 800 },
};
