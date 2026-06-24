"use client";

import { useState } from "react";
import Link from "next/link";

type FileRow = {
  id: string;
  fileName: string;
  status: string;
  textLength: number;
  ruleCount: number;
  text: string;
  imageCount: number;
  imageUrls: string[];
  error?: string;
};

type RuleRow = {
  crop?: string;
  month?: string;
  growth_stage?: string;
  symptom?: string;
  cause?: string;
  countermeasure?: string;
  action_instruction?: string;
  confidence_score?: number;
};

export default function KnowledgeExtractPage() {
  const [files, setFiles] = useState<FileRow[]>([]);
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [selectedText, setSelectedText] = useState("");
  const [msg, setMsg] = useState("대기");
  const [loading, setLoading] = useState(false);
  const [extractingId, setExtractingId] = useState<string | null>(null);

  async function uploadFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    setLoading(true);
    setMsg(`${selected.length}개 파일 텍스트 추출 시작`);

    const next: FileRow[] = [];

    for (const file of selected) {
      const id = `${file.name}-${Date.now()}-${Math.random()}`;

      try {
        const form = new FormData();
        form.append("file", file);

        const res = await fetch("/api/admin/knowledge-assets/upload-ppt", {
          method: "POST",
          body: form,
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "텍스트 추출 실패");

        next.push({
          id,
          fileName: file.name,
          status: "텍스트 추출 완료",
          textLength: json.text?.length || 0,
          ruleCount: 0,
          text: json.text || "",
          imageCount: json.imageUrls?.length || 0,
          imageUrls: json.imageUrls || [],
        });

        if (!selectedText && json.text) setSelectedText(json.text);
      } catch (err: any) {
        next.push({
          id,
          fileName: file.name,
          status: "실패",
          textLength: 0,
          ruleCount: 0,
          text: "",
          imageCount: 0,
          imageUrls: [],
          error: err.message || "오류",
        });
      }

      setFiles((prev) => [...prev, next[next.length - 1]]);
    }

    setMsg(`${selected.length}개 파일 처리 완료`);
    setLoading(false);
  }

  async function extractRules(row?: FileRow) {
    const text = row?.text || selectedText;
    if (!text.trim()) {
      alert("추출할 원문이 없습니다.");
      return;
    }

    setLoading(true);
    setMsg(`${row?.fileName || "현재 원문"} AI 판단규칙 추출 중... 최대 60초 기다려주세요.`);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);

      const res = await fetch("/api/admin/knowledge-assets/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          mode: "extract",
          title: row?.fileName || "현재 원문",
          author: "안이영 자료",
          crop: "고추",
          month: "",
          raw_content: text.slice(0, 12000),
        }),
      });

      clearTimeout(timer);

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "AI 추출 실패");

      const list = json.rules || json.items || [];
      setRules(list);

      if (row) {
        setFiles((prev) =>
          prev.map((x) =>
            x.id === row.id ? { ...x, ruleCount: list.length, status: `AI 추출 완료 ${list.length}건` } : x
          )
        );
      }

      setMsg(`AI 판단규칙 ${list.length}건 추출 완료`);
    } catch (err: any) {
      setMsg(err.message || "AI 추출 오류");
    } finally {
      setLoading(false);
      setExtractingId(null);
    }
  }

  async function saveRules() {
    if (rules.length === 0) {
      alert("저장할 판단규칙이 없습니다.");
      return;
    }

    setLoading(true);
    setMsg("DB 저장 중");

    try {
      const res = await fetch("/api/admin/knowledge-rules/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "DB 저장 실패");

      setMsg(`DB 저장 완료 ${json.count || rules.length}건`);
    } catch (err: any) {
      setMsg(err.message || "DB 저장 오류");
    } finally {
      setLoading(false);
      setExtractingId(null);
    }
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/knowledge-assets" style={S.back}>← 농업 AI 두뇌센터</Link>
            <div style={S.eye}>K-AGRI AI EXTRACTOR</div>
            <h1 style={S.title}>AI 판단규칙 일괄 추출기</h1>
            <p style={S.sub}>PPT·PDF·DOC·HWP 자료를 엑셀형 표로 관리하고 판단규칙으로 바꿉니다.</p>
          </div>
          <div style={S.btns}>
            <Link href="/admin/farm-action-engine" style={S.darkBtn}>운영표 보기</Link>
            <Link href="/admin/knowledge-assets/rules" style={S.greenBtn}>판단규칙 DB</Link>
          </div>
        </header>

        <section style={S.toolbar}>
          <label style={S.uploadBtn}>
            자료 파일 일괄 선택
            <input
              type="file"
              multiple
              accept=".ppt,.pptx,.pdf,.doc,.docx,.hwp,.hwpx"
              onChange={uploadFiles}
              style={{ display: "none" }}
            />
          </label>
          <button style={S.greenButton} onClick={() => extractRules()} disabled={loading}>
            {extractingId === "current" ? "현재 원문 추출 중..." : "현재 원문 AI 추출"}
          </button>
          <button style={S.darkButton} onClick={saveRules} disabled={loading}>현재 규칙 DB 저장</button>
          <b style={S.msg}>{msg}</b>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>1. 자료 처리 엑셀표</h2>
            <span>현재 {files.length}개</span>
          </div>
          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>선택</th>
                  <th style={S.thWide}>파일명</th>
                  <th style={S.th}>상태</th>
                  <th style={S.th}>텍스트</th>
                  <th style={S.th}>규칙</th>
                  <th style={S.th}>보기</th>
                  <th style={S.th}>AI 추출</th>
                  <th style={S.thWide}>오류</th>
                </tr>
              </thead>
              <tbody>
                {files.length === 0 ? (
                  <tr><td colSpan={8} style={S.empty}>아직 업로드한 자료가 없습니다.</td></tr>
                ) : files.map((f) => (
                  <tr key={f.id}>
                    <td style={S.td}><input type="checkbox" /></td>
                    <td style={S.tdTitle}>{f.fileName}</td>
                    <td style={f.status.includes("실패") ? S.tdBad : S.tdGood}>{f.status}</td>
                    <td style={S.td}>{f.textLength.toLocaleString()}자</td>
                    <td style={S.tdGood}>{f.imageCount}장</td>
                    <td style={S.td}>{f.ruleCount}건</td>
                    <td style={S.td}><button style={S.smallBtn} onClick={() => setSelectedText(f.text)}>열기</button></td>
                    <td style={S.td}>
                      <button
                        style={{
                          ...S.smallGreen,
                          opacity: extractingId === f.id ? 0.75 : 1,
                          cursor: loading ? "wait" : "pointer",
                        }}
                        onClick={() => extractRules(f)}
                        disabled={!f.text || loading}
                      >
                        {extractingId === f.id ? "추출 중..." : "추출"}
                      </button>
                    </td>
                    <td style={S.tdBad}>{f.error || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>2. 자료화면 이미지 검수표</h2>
            <span>{files.reduce((sum, f) => sum + f.imageCount, 0).toLocaleString()}장</span>
          </div>
          <div style={S.imageGrid}>
            {files.flatMap((f) =>
              f.imageUrls.slice(0, 40).map((url, idx) => (
                <div key={`${f.id}-${idx}`} style={S.imageCard}>
                  <img src={url} alt={`${f.fileName}-${idx + 1}`} style={S.thumb} />
                  <b>{f.fileName}</b>
                  <span>{idx + 1}페이지</span>
                </div>
              ))
            )}
            {files.every((f) => f.imageUrls.length === 0) && (
              <div style={S.empty}>아직 추출된 사진·표·자료화면 이미지가 없습니다.</div>
            )}
          </div>
        </section>

        <section style={S.grid}>
          <section style={S.panel}>
            <div style={S.panelHead}>
              <h2>2. 원문 검수 엑셀표</h2>
              <span>{selectedText.length.toLocaleString()}자</span>
            </div>
            <div style={S.tableWrap}>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>구분</th>
                    <th style={S.th}>글자수</th>
                    <th style={S.thWide}>원문</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={S.tdGood}>현재 파일</td>
                    <td style={S.td}>{selectedText.length.toLocaleString()}자</td>
                    <td style={S.td}>
                      <textarea
                        style={S.textarea}
                        value={selectedText}
                        onChange={(e) => setSelectedText(e.target.value)}
                        placeholder="파일을 열면 추출 원문이 여기에 표시됩니다."
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section style={S.panel}>
            <div style={S.panelHead}>
              <h2>3. 추출 결과 검수표</h2>
              <span>현재 {rules.length}건</span>
            </div>
            <div style={S.tableWrap}>
              <table style={S.ruleTable}>
                <thead>
                  <tr>
                    <th style={S.th}>선택</th>
                    <th style={S.th}>작물</th>
                    <th style={S.th}>월</th>
                    <th style={S.th}>생육단계</th>
                    <th style={S.th}>증상</th>
                    <th style={S.th}>원인</th>
                    <th style={S.th}>대책</th>
                    <th style={S.thWide}>행동지시</th>
                    <th style={S.th}>신뢰도</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.length === 0 ? (
                    <tr><td colSpan={9} style={S.empty}>아직 추출된 판단규칙이 없습니다.</td></tr>
                  ) : rules.map((r, i) => (
                    <tr key={i}>
                      <td style={S.td}><input type="checkbox" defaultChecked /></td>
                      <td style={S.tdGood}>{r.crop || "-"}</td>
                      <td style={S.td}>{r.month || "-"}</td>
                      <td style={S.td}>{r.growth_stage || "-"}</td>
                      <td style={S.td}>{r.symptom || "-"}</td>
                      <td style={S.td}>{r.cause || "-"}</td>
                      <td style={S.tdGood}>{r.countermeasure || "-"}</td>
                      <td style={S.tdAction}>{r.action_instruction || "-"}</td>
                      <td style={S.td}>{r.confidence_score ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: 24 },
  wrap: { maxWidth: 1900, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 18, flexWrap: "wrap" },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eye: { marginTop: 12, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0", fontSize: 46, fontWeight: 950, letterSpacing: "-.05em" },
  sub: { color: "#475569", fontSize: 17, fontWeight: 850 },
  btns: { display: "flex", gap: 10 },
  darkBtn: { background: "#0f172a", color: "#fff", padding: "13px 18px", borderRadius: 12, textDecoration: "none", fontWeight: 950, height: "fit-content" },
  greenBtn: { background: "#15803d", color: "#fff", padding: "13px 18px", borderRadius: 12, textDecoration: "none", fontWeight: 950, height: "fit-content" },
  toolbar: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 18, padding: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 },
  uploadBtn: { background: "#15803d", color: "#fff", padding: "13px 18px", borderRadius: 12, fontWeight: 950, cursor: "pointer" },
  greenButton: { background: "#15803d", color: "#fff", border: 0, borderRadius: 12, padding: "13px 18px", fontWeight: 950, cursor: "pointer" },
  darkButton: { background: "#0f172a", color: "#fff", border: 0, borderRadius: 12, padding: "13px 18px", fontWeight: 950, cursor: "pointer" },
  msg: { color: "#15803d", fontWeight: 950 },
  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 18, overflow: "hidden", marginBottom: 12 },
  panelHead: { padding: 14, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", minWidth: 1300, borderCollapse: "collapse" },
  ruleTable: { width: "100%", minWidth: 1500, borderCollapse: "collapse" },
  th: { background: "#f1f5f9", padding: 10, textAlign: "left", fontWeight: 950, whiteSpace: "nowrap" },
  thWide: { background: "#f1f5f9", padding: 10, textAlign: "left", fontWeight: 950, minWidth: 360 },
  td: { padding: 10, borderTop: "1px solid #edf2f7", fontWeight: 850, verticalAlign: "top" },
  tdTitle: { padding: 10, borderTop: "1px solid #edf2f7", fontWeight: 950, verticalAlign: "top" },
  tdGood: { padding: 10, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950, verticalAlign: "top" },
  tdBad: { padding: 10, borderTop: "1px solid #edf2f7", color: "#dc2626", fontWeight: 900, verticalAlign: "top" },
  tdAction: { padding: 10, borderTop: "1px solid #edf2f7", color: "#dc2626", fontWeight: 950, verticalAlign: "top" },
  smallBtn: { background: "#0f172a", color: "#fff", border: 0, borderRadius: 8, padding: "8px 11px", fontWeight: 950, cursor: "pointer" },
  smallGreen: { background: "#15803d", color: "#fff", border: 0, borderRadius: 8, padding: "8px 11px", fontWeight: 950, cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "1fr", gap: 12, alignItems: "start" },
  textarea: { width: "100%", height: 260, border: 0, padding: 14, fontSize: 14, lineHeight: 1.65, fontWeight: 800, color: "#0f172a" },
  empty: { padding: 30, textAlign: "center", color: "#64748b", fontWeight: 950 },
  imageGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, padding: 14 },
  imageCard: { border: "1px solid #e5e7eb", borderRadius: 12, padding: 10, display: "grid", gap: 6, fontWeight: 850, background: "#fff" },
  thumb: { width: "100%", height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" },
};
