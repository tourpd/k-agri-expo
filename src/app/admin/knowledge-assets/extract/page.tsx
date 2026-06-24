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
    if (!selected.length) return;

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

        const row: FileRow = {
          id,
          fileName: file.name,
          status: "텍스트 추출 완료",
          textLength: json.text?.length || 0,
          ruleCount: 0,
          text: json.text || "",
          imageCount: json.imageUrls?.length || 0,
          imageUrls: json.imageUrls || [],
        };

        next.push(row);

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
    setExtractingId(row?.id || "current");

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

      const list: RuleRow[] = json.rules || json.items || [];
      setRules(list);

      if (row) {
        setFiles((prev) =>
          prev.map((x) =>
            x.id === row.id
              ? {
                  ...x,
                  ruleCount: list.length,
                  status: `AI 추출 완료 ${list.length}건`,
                }
              : x
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
    if (!rules.length) {
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
            <Link href="/admin/knowledge-assets" style={S.back}>
              ← 농업 AI 두뇌센터
            </Link>
            <div style={S.eye}>K-AGRI AI EXTRACTOR</div>
            <h1 style={S.title}>AI 판단규칙 일괄 추출기</h1>
            <p style={S.sub}>
              PPT·PDF·DOC·HWP 자료를 엑셀형 표로 관리하고 판단규칙으로 바꿉니다.
            </p>
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

          <button
            style={S.greenButton}
            onClick={() => extractRules()}
            disabled={loading}
          >
            현재 원문 AI 추출
          </button>

          <button
            style={S.darkButton}
            onClick={saveRules}
            disabled={loading}
          >
            현재 규칙 DB 저장
          </button>

          <b style={S.msg}>{msg}</b>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>1. 자료 처리 엑셀표</h2>
            <span>현재 {files.length}개</span>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <tbody>
                {files.map((f) => (
                  <tr key={f.id}>
                    <td style={S.tdTitle}>{f.fileName}</td>
                    <td style={S.td}>{f.status}</td>
                    <td style={S.td}>{f.textLength}자</td>
                    <td style={S.tdGood}>{f.ruleCount}건</td>
                    <td style={S.td}>
                      <button
                        style={S.smallGreen}
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
      </div>
    </main>
  );
}

/** =========================
 *  STYLE OBJECT (핵심 복구)
 * ========================= */
const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: 24 },
  wrap: { maxWidth: 1900, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 18, flexWrap: "wrap" },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eye: { marginTop: 12, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0", fontSize: 46, fontWeight: 950, letterSpacing: "-.05em" },
  sub: { color: "#475569", fontSize: 17, fontWeight: 850 },

  toolbar: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 18, padding: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 },

  uploadBtn: { background: "#15803d", color: "#fff", padding: "13px 18px", borderRadius: 12, fontWeight: 950, cursor: "pointer" },
  greenButton: { background: "#15803d", color: "#fff", border: 0, borderRadius: 12, padding: "13px 18px", fontWeight: 950, cursor: "pointer" },
  darkButton: { background: "#0f172a", color: "#fff", border: 0, borderRadius: 12, padding: "13px 18px", fontWeight: 950, cursor: "pointer" },

  msg: { color: "#15803d", fontWeight: 950 },

  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 18, overflow: "hidden", marginBottom: 12 },
  panelHead: { padding: 14, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" },

  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 900 },

  th: { background: "#f1f5f9", padding: 10, fontWeight: 950 },
  td: { padding: 10, borderTop: "1px solid #edf2f7", fontWeight: 800 },
  tdTitle: { padding: 10, borderTop: "1px solid #edf2f7", fontWeight: 950 },
  tdGood: { padding: 10, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950 },
  tdBad: { padding: 10, borderTop: "1px solid #edf2f7", color: "#dc2626", fontWeight: 900 },

  smallGreen: { background: "#15803d", color: "#fff", border: 0, borderRadius: 8, padding: "8px 11px", fontWeight: 950, cursor: "pointer" },
};