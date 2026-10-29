"use client";

import { useState } from "react";

export default function PV5AnalyzePage() {
  const [urls, setUrls] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState("");

  const list = urls
    .split(/\n|,/)
    .map((x) => x.trim())
    .filter(Boolean);

  async function analyzeAll() {
    setError("");
    setResults([]);

    if (list.length === 0) {
      setError("유튜브 URL을 한 개 이상 입력하세요.");
      return;
    }

    setLoading(true);

    const output: any[] = [];

    for (let i = 0; i < list.length; i++) {
      const videoUrl = list[i];
      setCurrent(`${i + 1}/${list.length} 분석 중: ${videoUrl}`);

      try {
        const fd = new FormData();
        fd.append("video_url", videoUrl);
        fd.append("memo", memo);

        const res = await fetch("/api/pv5/analyze-video", {
          method: "POST",
          body: fd,
        });

        const data = await res.json();

        output.push({
          index: i + 1,
          url: videoUrl,
          ok: !!data.success,
          saved: !!data.saved,
          db_id: data.db_id || "",
          summary: data.summary || data.error || "",
          data,
        });

        setResults([...output]);
      } catch (e: any) {
        output.push({
          index: i + 1,
          url: videoUrl,
          ok: false,
          saved: false,
          summary: e.message || "분석 실패",
        });
        setResults([...output]);
      }
    }

    setCurrent("전체 분석 완료");
    setLoading(false);
  }

  return (
    <main style={S.page}>
      <section style={S.card}>
        <h1 style={S.title}>PV5 유튜브 일괄 분석실</h1>
        <p style={S.desc}>
          여러 유튜브 URL을 한 줄에 하나씩 넣으면 순서대로 분석하고 Supabase DB에 저장합니다.
        </p>

        <label style={S.label}>유튜브 URL 목록</label>
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={`https://www.youtube.com/shorts/...\nhttps://youtu.be/...`}
          rows={16}
          style={S.textarea}
        />

        <label style={S.label}>공통 메모 / 분석 기준</label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="예: PV5 공간, 제품, 비용, 업체, 동선, 차박 구성, 전장, 격벽, 팝업텐트 중심으로 분석"
          rows={6}
          style={S.textarea}
        />

        <div style={S.count}>분석 대상: {list.length}개</div>

        <button onClick={analyzeAll} disabled={loading} style={loading ? S.buttonDisabled : S.button}>
          {loading ? "일괄 분석 중..." : "전체 URL 일괄 분석 시작"}
        </button>

        {current ? <div style={S.progress}>{current}</div> : null}
        {error ? <div style={S.error}>{error}</div> : null}

        {results.length > 0 ? (
          <section style={S.result}>
            <h2>분석 결과</h2>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>#</th>
                  <th style={S.th}>URL</th>
                  <th style={S.th}>저장</th>
                  <th style={S.th}>요약</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.index}>
                    <td style={S.td}>{r.index}</td>
                    <td style={S.td}>{r.url}</td>
                    <td style={S.td}>{r.saved ? "DB 저장 완료" : "실패/미저장"}</td>
                    <td style={S.td}>{r.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>RAW JSON</h3>
            <pre style={S.pre}>{JSON.stringify(results, null, 2)}</pre>
          </section>
        ) : null}
      </section>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    color: "#111827",
    padding: "40px 20px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    maxWidth: 1100,
    margin: "0 auto",
    background: "#ffffff",
    borderRadius: 20,
    padding: 32,
    boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
  },
  title: { fontSize: 32, fontWeight: 900, margin: 0 },
  desc: { fontSize: 17, color: "#374151", lineHeight: 1.6 },
  label: { display: "block", fontSize: 18, fontWeight: 800, margin: "22px 0 8px" },
  textarea: {
    width: "100%",
    padding: 16,
    border: "2px solid #d1d5db",
    borderRadius: 12,
    fontSize: 16,
    color: "#111827",
    background: "#ffffff",
    boxSizing: "border-box",
    lineHeight: 1.5,
  },
  count: { marginTop: 14, fontWeight: 900, color: "#047857" },
  button: {
    width: "100%",
    marginTop: 24,
    padding: 18,
    background: "#0a7c2f",
    color: "white",
    border: 0,
    borderRadius: 14,
    fontSize: 18,
    fontWeight: 900,
    cursor: "pointer",
  },
  buttonDisabled: {
    width: "100%",
    marginTop: 24,
    padding: 18,
    background: "#6b7280",
    color: "white",
    border: 0,
    borderRadius: 14,
    fontSize: 18,
    fontWeight: 900,
  },
  progress: {
    marginTop: 18,
    padding: 16,
    background: "#ecfdf5",
    border: "1px solid #86efac",
    borderRadius: 12,
    fontWeight: 800,
    color: "#065f46",
  },
  error: {
    marginTop: 18,
    padding: 16,
    background: "#fee2e2",
    borderRadius: 12,
    color: "#991b1b",
    fontWeight: 800,
  },
  result: { marginTop: 32 },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  th: { border: "1px solid #d1d5db", padding: 10, background: "#f9fafb", textAlign: "left" },
  td: { border: "1px solid #d1d5db", padding: 10, verticalAlign: "top", fontSize: 14 },
  pre: {
    background: "#111827",
    color: "#d1fae5",
    padding: 20,
    borderRadius: 12,
    overflow: "auto",
    fontSize: 13,
  },
};
