"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Asset = {
  id: string;
  channel_name: string;
  video_url: string;
  title: string;
  crop?: string;
  product_names?: string;
  expert_names?: string;
  transcript?: string;
  rule_count?: number;
  shorts_count?: number;
  status?: string;
  created_at?: string;
};

export default function YoutubeAssetsClient() {
  const [items, setItems] = useState<Asset[]>([]);
  const [message, setMessage] = useState("대기");
  const [form, setForm] = useState({
    channel_name: "한국농수산TV",
    video_url: "",
    title: "",
    crop: "",
    product_names: "",
    expert_names: "",
    transcript: "",
  });

  async function load() {
    const res = await fetch("/api/admin/youtube-assets");
    const json = await res.json();
    if (json.ok) setItems(json.data || []);
    else setMessage(json.error || "DB 조회 실패");
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setMessage("유튜브 자산 분석·저장 중...");
    const res = await fetch("/api/admin/youtube-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await res.json();
    if (!json.ok) {
      setMessage(json.error || "저장 실패");
      return;
    }
    setMessage(`저장 완료 / 판단규칙 ${json.rules?.length || 0}건 생성`);
    setForm({ ...form, video_url: "", title: "", transcript: "" });
    await load();
  }

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <header style={S.header}>
          <div>
            <Link href="/admin/dashboard" style={S.back}>← 관리자 대시보드</Link>
            <div style={S.eye}>K-AGRI YOUTUBE ASSET CENTER</div>
            <h1 style={S.title}>유튜브 영상자산센터</h1>
            <p style={S.sub}>한국농수산TV·도프 유튜브 영상을 DB화해 판단규칙, 쇼츠, 밴드, 티스토리, 방송자료로 재사용합니다.</p>
          </div>

        </header>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>1. 유튜브 영상 등록 엑셀폼</h2>
            <span>{message}</span>
          </div>

          <div style={S.formGrid}>
            <label style={S.label}>채널
              <select style={S.input} value={form.channel_name} onChange={(e) => setForm({ ...form, channel_name: e.target.value })}>
                <option>한국농수산TV</option>
                <option>도프TV</option>
                <option>PandaTV</option>
                <option>KFFR</option>
                <option>두루기계</option>
                <option>부성바이오</option>
                <option>영진로타리</option>
                <option>거래처 채널</option>
              </select>
            </label>
            <label style={S.label}>영상 URL
              <input style={S.input} value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/..." />
            </label>
            <label style={S.label}>제목
              <input style={S.input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="영상 제목" />
            </label>
            <label style={S.label}>작물
              <input style={S.input} value={form.crop} onChange={(e) => setForm({ ...form, crop: e.target.value })} placeholder="고추, 마늘, 가지..." />
            </label>
            <label style={S.label}>제품/PPL
              <input style={S.input} value={form.product_names} onChange={(e) => setForm({ ...form, product_names: e.target.value })} placeholder="아미65, K-PLUS, 제균박사..." />
            </label>
            <label style={S.label}>전문가/출연자
              <input style={S.input} value={form.expert_names} onChange={(e) => setForm({ ...form, expert_names: e.target.value })} placeholder="안철현, 안이영, 이성준..." />
            </label>
          </div>

          <div style={{ padding: 14 }}>
            <label style={S.label}>자막/대본/영상 내용 붙여넣기
              <textarea style={S.textarea} value={form.transcript} onChange={(e) => setForm({ ...form, transcript: e.target.value })} placeholder="유튜브 자막, 설명문, 촬영 대본, 주요 내용을 붙여넣으면 판단규칙과 쇼츠 후보를 생성합니다." />
            </label>
            <button style={S.greenBtn} onClick={save}>영상자산 분석·DB 저장</button>
          </div>
        </section>

        <section style={S.panel}>
          <div style={S.panelHead}>
            <h2>2. 유튜브 자산 엑셀표</h2>
            <span>현재 {items.length}건</span>
          </div>

          <div style={S.tableWrap}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>채널</th>
                  <th style={S.thWide}>제목</th>
                  <th style={S.th}>작물</th>
                  <th style={S.th}>제품</th>
                  <th style={S.th}>출연자</th>
                  <th style={S.th}>규칙</th>
                  <th style={S.th}>쇼츠</th>
                  <th style={S.th}>상태</th>
                  <th style={S.th}>보기</th>
                </tr>
              </thead>
              <tbody>
                {items.map((x) => (
                  <tr key={x.id}>
                    <td style={S.tdGood}>{x.channel_name}</td>
                    <td style={S.tdTitle}>{x.title}</td>
                    <td style={S.td}>{x.crop || "-"}</td>
                    <td style={S.td}>{x.product_names || "-"}</td>
                    <td style={S.td}>{x.expert_names || "-"}</td>
                    <td style={S.td}>{x.rule_count || 0}건</td>
                    <td style={S.td}>{x.shorts_count || 0}개</td>
                    <td style={S.tdGood}>{x.status || "draft"}</td>
                    <td style={S.td}><a href={x.video_url} target="_blank" style={S.openBtn}>열기</a></td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={9} style={S.empty}>아직 등록된 유튜브 자산이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#eef4f2", color: "#0f172a", padding: 24 },
  wrap: { maxWidth: 1800, margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 18 },
  back: { color: "#15803d", textDecoration: "none", fontWeight: 950 },
  eye: { marginTop: 14, color: "#15803d", fontWeight: 950, letterSpacing: ".08em" },
  title: { margin: "8px 0", fontSize: 54, fontWeight: 950, letterSpacing: "-.06em" },
  sub: { color: "#475569", fontSize: 18, fontWeight: 850 },
  darkBtn: { background: "#0f172a", color: "#fff", borderRadius: 12, padding: "14px 18px", textDecoration: "none", fontWeight: 950, height: 24 },
  panel: { background: "#fff", border: "1px solid #dbe3ea", borderRadius: 20, overflow: "hidden", marginBottom: 14 },
  panelHead: { padding: 16, borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, padding: 14 },
  label: { display: "grid", gap: 6, fontWeight: 950 },
  input: { border: "1px solid #cbd5e1", borderRadius: 10, padding: 12, fontWeight: 850 },
  textarea: { width: "100%", minHeight: 180, border: "1px solid #cbd5e1", borderRadius: 12, padding: 12, fontWeight: 850, lineHeight: 1.6 },
  greenBtn: { marginTop: 10, background: "#15803d", color: "#fff", border: 0, borderRadius: 12, padding: "14px 18px", fontWeight: 950 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", minWidth: 1400, borderCollapse: "collapse" },
  th: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950 },
  thWide: { background: "#f1f5f9", padding: 12, textAlign: "left", fontWeight: 950, minWidth: 500 },
  td: { padding: 12, borderTop: "1px solid #edf2f7", fontWeight: 850, verticalAlign: "top" },
  tdGood: { padding: 12, borderTop: "1px solid #edf2f7", color: "#15803d", fontWeight: 950 },
  tdTitle: { padding: 12, borderTop: "1px solid #edf2f7", color: "#0f172a", fontWeight: 950 },
  openBtn: { background: "#0f172a", color: "#fff", borderRadius: 10, padding: "8px 12px", textDecoration: "none", fontWeight: 950 },
  empty: { padding: 28, textAlign: "center", color: "#64748b", fontWeight: 950 },
};
