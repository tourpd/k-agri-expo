"use client";

import { useState } from "react";
import Link from "next/link";

export default function AiBroadcastStationClient() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("대기");

  async function analyze(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setMsg("FCPXML 분석 중...");

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/admin/ai-broadcast-station/analyze", {
        method: "POST",
        body: form,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "분석 실패");

      setResult(json);
      setMsg(`${json.subtitleCount}개 자막 추출 완료`);
    } catch (e: any) {
      setMsg(e.message || "오류");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  function copy(v: string) {
    navigator.clipboard.writeText(v || "");
    setMsg("복사 완료");
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/dashboard" style={S.back}>← 경영기획실</Link>
            <div style={S.eye}>K-AGRI AI BROADCAST STATION</div>
            <h1 style={S.title}>AI 방송국</h1>
            <p style={S.sub}>
              Final Cut FCPXML을 올리면 자막을 추출하고 쇼츠·밴드·티스토리·유튜브 게시글을 만듭니다.
            </p>
          </div>
          <div style={S.headerBtns}>
            <Link href="/admin/kagri-writers-room" style={S.darkBtn}>작가실</Link>
            <Link href="/admin/ai-production-line" style={S.greenBtn}>AI 제작라인</Link>
            <Link href="/admin/shorts-generator" style={S.greenBtn}>쇼츠 생성기</Link>
          </div>
        </header>

        <section style={S.uploadBox}>
          <div>
            <h2>1. FCPXML 업로드</h2>
            <p>Final Cut에서 내보낸 .fcpxml 파일을 먼저 올립니다. 영상 2.4GB를 올리지 않아도 자막과 구조를 분석할 수 있습니다.</p>
          </div>

          <label style={S.uploadBtn}>
            {loading ? "분석 중..." : "FCPXML 선택"}
            <input type="file" accept=".fcpxml,.xml" onChange={analyze} style={{ display: "none" }} />
          </label>

          <b style={S.msg}>{msg}</b>
        </section>

        {result ? (
          <>
            <section style={S.kpiGrid}>
              <Kpi title="파일" value={result.fileName} />
              <Kpi title="자막" value={`${result.subtitleCount}개`} />
              <Kpi title="주제" value={result.topics.join(" · ") || "분석 중"} />
              <Kpi title="쇼츠 후보" value={`${result.shorts.length}개`} />
            </section>

            <section style={S.panel}>
              <div style={S.panelHead}>
                <h2>2. 추출 자막</h2>
                <span>농업용어 자동 교정 적용</span>
              </div>
              <div style={S.scroll}>
                {result.subtitles.slice(0, 80).map((s: string, i: number) => (
                  <div key={i} style={S.subtitleLine}>
                    <b>{i + 1}</b>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </section>

            <section style={S.panel}>
              <div style={S.panelHead}>
                <h2>3. 쇼츠 후보</h2>
                <span>조회수 가능성이 높은 문장 중심</span>
              </div>
              <div style={S.tableWrap}>
                <table style={S.table}>
                  <thead>
                    <tr>
                      <th style={S.th}>번호</th>
                      <th style={S.th}>쇼츠 제목</th>
                      <th style={S.thWide}>핵심 멘트</th>
                      <th style={S.th}>예상</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.shorts.map((x: any) => (
                      <tr key={x.no}>
                        <td style={S.tdRank}>{x.no}</td>
                        <td style={S.tdStrong}>{x.title}</td>
                        <td style={S.tdAction}>{x.hook}</td>
                        <td style={S.td}>{x.estimate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section style={S.contentGrid}>
              <ContentBox title="유튜브 게시글" text={result.youtubePost} onCopy={copy} />
              <ContentBox title="밴드 글" text={result.bandPost} onCopy={copy} />
              <ContentBox title="티스토리 글" text={result.tistoryPost} onCopy={copy} />
            </section>
          </>
        ) : (
          <section style={S.empty}>
            <h2>오늘 할 일</h2>
            <p>Final Cut에서 <b>파일 → 내보내기 XML</b>로 만든 FCPXML을 올리세요.</p>
          </section>
        )}
      </div>
    </main>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div style={S.kpi}>
      <b>{title}</b>
      <span>{value}</span>
    </div>
  );
}

function ContentBox({ title, text, onCopy }: { title: string; text: string; onCopy: (v: string) => void }) {
  return (
    <section style={S.contentBox}>
      <div style={S.panelHead}>
        <h2>{title}</h2>
        <button style={S.smallBtn} onClick={() => onCopy(text)}>복사</button>
      </div>
      <textarea style={S.textarea} value={text} readOnly />
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: 24 },
  wrap: { maxWidth: 1700, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 20, flexWrap: "wrap" },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eye: { marginTop: 12, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0", fontSize: 54, fontWeight: 950, letterSpacing: "-.06em" },
  sub: { color: "#475569", fontSize: 18, fontWeight: 850 },
  headerBtns: { display: "flex", gap: 10, flexWrap: "wrap" },
  darkBtn: { background: "#0f172a", color: "#fff", padding: "13px 18px", borderRadius: 12, textDecoration: "none", fontWeight: 950, height: "fit-content" },
  greenBtn: { background: "#15803d", color: "#fff", padding: "13px 18px", borderRadius: 12, textDecoration: "none", fontWeight: 950, height: "fit-content" },
  uploadBox: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 20, padding: 20, display: "flex", alignItems: "center", gap: 16, marginBottom: 14, flexWrap: "wrap" },
  uploadBtn: { background: "#15803d", color: "#fff", padding: "14px 20px", borderRadius: 12, fontWeight: 950, cursor: "pointer" },
  msg: { color: "#15803d", fontWeight: 950 },
  kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 12, marginBottom: 14 },
  kpi: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 18, padding: 16, display: "grid", gap: 8 },
  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 20, overflow: "hidden", marginBottom: 14 },
  panelHead: { padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 },
  scroll: { maxHeight: 360, overflow: "auto", padding: 12 },
  subtitleLine: { display: "grid", gridTemplateColumns: "60px 1fr", gap: 12, borderBottom: "1px solid #edf2f7", padding: "10px 6px", fontWeight: 850 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", minWidth: 1200, borderCollapse: "collapse" },
  th: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950 },
  thWide: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950, minWidth: 520 },
  td: { padding: 12, borderTop: "1px solid #edf2f7", fontWeight: 850 },
  tdRank: { padding: 12, borderTop: "1px solid #edf2f7", color: "#dc2626", fontWeight: 950 },
  tdStrong: { padding: 12, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950 },
  tdAction: { padding: 12, borderTop: "1px solid #edf2f7", color: "#dc2626", fontWeight: 950 },
  contentGrid: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 14 },
  contentBox: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 20, overflow: "hidden" },
  textarea: { width: "100%", minHeight: 360, border: 0, padding: 16, fontSize: 15, lineHeight: 1.7, fontWeight: 850, color: "#0f172a" },
  smallBtn: { background: "#0f172a", color: "#fff", border: 0, borderRadius: 10, padding: "9px 13px", fontWeight: 950, cursor: "pointer" },
  empty: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 20, padding: 24 },
};
