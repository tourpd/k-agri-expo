"use client";

import { useEffect, useMemo, useState } from "react";

type VisualPage = {
  id: string;
  source_title?: string | null;
  title?: string | null;
  page_number?: number | null;
  image_url?: string | null;
  crop_name?: string | null;
  disease_name?: string | null;
  growth_stage?: string | null;
  key_info?: string | null;
  ai_summary?: string | null;
  action_instruction?: string | null;
  broadcast_material?: string | null;
  shorts_material?: string | null;
  pd_memo?: string | null;
  edit_request?: string | null;
  next_action?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  original_location?: string | null;
  db_location?: string | null;
  usage_flow?: string | null;
  created_at?: string | null;
};

const DEFAULT_USAGE_FLOW =
  "자료화면 → knowledge_visual_pages DB → AI 시각분석 → 판단규칙 DB → 방송소재 → 쇼츠 → 농민상담 답변 → 행동지시";

export default function VisualKnowledgePage() {
  const [rows, setRows] = useState<VisualPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VisualPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [keyword, setKeyword] = useState("");

  async function loadRows() {
    setLoading(true);
    const res = await fetch("/api/admin/visual-knowledge", { cache: "no-store" });
    const json = await res.json();
    setRows(json.items || []);
    setLoading(false);
  }

  useEffect(() => {
    loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((row) => {
      return [
        row.source_title,
        row.title,
        row.crop_name,
        row.disease_name,
        row.key_info,
        row.ai_summary,
        row.next_action,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, keyword]);

  function updateSelected(key: keyof VisualPage, value: string) {
    setSelected((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function saveSelected() {
    if (!selected) return;

    setSaving(true);

    const res = await fetch("/api/admin/visual-knowledge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(selected),
    });

    if (!res.ok) {
      alert("저장 실패");
      setSaving(false);
      return;
    }

    await loadRows();
    setSaving(false);
    alert("저장 완료");
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <div style={styles.kicker}>K-AGRI EXPO / 농업 AI 두뇌센터</div>
          <h1 style={styles.title}>자료화면 AI DB센터</h1>
          <p style={styles.desc}>
            PDF, PPT, 병해충 사진, 토양검정서, 유튜브 캡처를 AI 두뇌로 흡수하는 시각자료 DB입니다.
          </p>
        </div>

        <div style={styles.headerButtons}>
          <button style={styles.primaryButton} onClick={loadRows}>
            DB 새로고침
          </button>
          <button style={styles.darkButton}>
            AI 정밀분석 1차
          </button>
        </div>
      </section>

      <section style={styles.infoBox}>
        <b>자료화면 DB 흐름</b>
        <span>
          자료화면 → knowledge_visual_pages DB → AI 시각분석 → 작물/병해충/표/그래프 분석 → 판단규칙 DB → 방송소재 → 쇼츠 → 농민상담 답변 → 행동지시
        </span>
      </section>

      <section style={styles.toolbar}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="자료제목, 작물, 병해충, 핵심정보 검색"
          style={styles.search}
        />
        <div style={styles.count}>총 {filteredRows.length.toLocaleString()}건</div>
      </section>

      <section style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: 110 }}>이미지</th>
              <th style={{ ...styles.th, width: 220 }}>자료제목</th>
              <th style={{ ...styles.th, width: 70 }}>페이지</th>
              <th style={{ ...styles.th, width: 110 }}>작물</th>
              <th style={{ ...styles.th, width: 130 }}>병해충</th>
              <th style={{ ...styles.th, width: 240 }}>핵심정보</th>
              <th style={{ ...styles.th, width: 260 }}>AI요약</th>
              <th style={{ ...styles.th, width: 180 }}>다음작업</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td style={styles.td} colSpan={8}>불러오는 중...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan={8}>자료가 없습니다.</td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() =>
                    setSelected({
                      ...row,
                      db_location: row.db_location || "knowledge_visual_pages",
                      usage_flow: row.usage_flow || DEFAULT_USAGE_FLOW,
                    })
                  }
                  style={styles.tr}
                >
                  <td style={styles.td}>
                    {row.image_url ? (
                      <img src={row.image_url} alt="" style={styles.thumb} />
                    ) : (
                      <div style={styles.noImage}>이미지 없음</div>
                    )}
                  </td>
                  <td style={styles.tdStrong}>
                    {row.source_title || row.title || "자료제목 입력 필요"}
                  </td>
                  <td style={styles.tdCenter}>{row.page_number || "-"}</td>
                  <td style={styles.td}>{row.crop_name || "-"}</td>
                  <td style={styles.td}>{row.disease_name || "-"}</td>
                  <td style={styles.td}>{row.key_info || "-"}</td>
                  <td style={styles.td}>{row.ai_summary || "-"}</td>
                  <td style={styles.td}>{row.next_action || "검토 필요"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {selected && (
        <aside style={styles.drawer}>
          <div style={styles.drawerHead}>
            <div>
              <div style={styles.kicker}>공동편집 구역</div>
              <h2 style={styles.drawerTitle}>
                {selected.source_title || selected.title || "자료 상세"}
              </h2>
            </div>
            <button style={styles.closeButton} onClick={() => setSelected(null)}>
              닫기
            </button>
          </div>

          <div style={styles.imageBox}>
            {selected.image_url ? (
              <img src={selected.image_url} alt="" style={styles.bigImage} />
            ) : (
              <div style={styles.noBigImage}>이미지 없음</div>
            )}
          </div>

          <div style={styles.grid2}>
            <Field label="자료제목" value={selected.source_title || ""} onChange={(v) => updateSelected("source_title", v)} />
            <Field label="출처" value={selected.source_name || ""} onChange={(v) => updateSelected("source_name", v)} />
            <Field label="원본 위치" value={selected.original_location || selected.source_url || ""} onChange={(v) => updateSelected("original_location", v)} />
            <Field label="DB 저장 위치" value={selected.db_location || "knowledge_visual_pages"} onChange={(v) => updateSelected("db_location", v)} />
          </div>

          <FieldArea label="활용 흐름" value={selected.usage_flow || DEFAULT_USAGE_FLOW} onChange={(v) => updateSelected("usage_flow", v)} />

          <div style={styles.grid3}>
            <Field label="작물" value={selected.crop_name || ""} onChange={(v) => updateSelected("crop_name", v)} />
            <Field label="병해충" value={selected.disease_name || ""} onChange={(v) => updateSelected("disease_name", v)} />
            <Field label="생육단계" value={selected.growth_stage || ""} onChange={(v) => updateSelected("growth_stage", v)} />
          </div>

          <FieldArea label="핵심정보" value={selected.key_info || ""} onChange={(v) => updateSelected("key_info", v)} />
          <FieldArea label="AI요약" value={selected.ai_summary || ""} onChange={(v) => updateSelected("ai_summary", v)} />
          <FieldArea label="행동지시" value={selected.action_instruction || ""} onChange={(v) => updateSelected("action_instruction", v)} />
          <FieldArea label="방송소재" value={selected.broadcast_material || ""} onChange={(v) => updateSelected("broadcast_material", v)} />
          <FieldArea label="쇼츠소재" value={selected.shorts_material || ""} onChange={(v) => updateSelected("shorts_material", v)} />
          <FieldArea label="세환PD 공동편집 메모" value={selected.pd_memo || ""} onChange={(v) => updateSelected("pd_memo", v)} />
          <FieldArea label="수정요청" value={selected.edit_request || ""} onChange={(v) => updateSelected("edit_request", v)} />
          <FieldArea label="다음작업" value={selected.next_action || ""} onChange={(v) => updateSelected("next_action", v)} />

          <button style={styles.saveButton} onClick={saveSelected} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </aside>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={styles.input} />
    </label>
  );
}

function FieldArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} style={styles.textarea} />
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f6f1",
    padding: 20,
    color: "#111827",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  kicker: {
    fontSize: 13,
    fontWeight: 900,
    color: "#15803d",
    marginBottom: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: 1000,
    margin: 0,
  },
  desc: {
    marginTop: 8,
    color: "#4b5563",
    fontSize: 15,
  },
  headerButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  primaryButton: {
    border: 0,
    borderRadius: 12,
    background: "#16a34a",
    color: "white",
    padding: "12px 16px",
    fontWeight: 900,
    cursor: "pointer",
  },
  darkButton: {
    border: 0,
    borderRadius: 12,
    background: "#111827",
    color: "white",
    padding: "12px 16px",
    fontWeight: 900,
    cursor: "pointer",
  },
  infoBox: {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    borderRadius: 16,
    padding: 14,
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 12,
    fontSize: 14,
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  search: {
    flex: 1,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "12px 14px",
    fontSize: 15,
    background: "white",
  },
  count: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "12px 14px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  tableWrap: {
    overflowX: "auto",
    background: "white",
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  },
  table: {
    width: "100%",
    minWidth: 1280,
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  th: {
    position: "sticky",
    top: 0,
    background: "#111827",
    color: "white",
    padding: 12,
    textAlign: "left",
    fontSize: 13,
    zIndex: 1,
  },
  tr: {
    cursor: "pointer",
    borderBottom: "1px solid #e5e7eb",
  },
  td: {
    padding: 10,
    fontSize: 13,
    verticalAlign: "middle",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tdStrong: {
    padding: 10,
    fontSize: 13,
    fontWeight: 900,
    verticalAlign: "middle",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  tdCenter: {
    padding: 10,
    fontSize: 13,
    textAlign: "center",
  },
  thumb: {
    width: 82,
    height: 58,
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  noImage: {
    width: 82,
    height: 58,
    borderRadius: 8,
    border: "1px solid #e5e7eb",
    background: "#f3f4f6",
    fontSize: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    width: "min(760px, 100vw)",
    height: "100vh",
    overflowY: "auto",
    background: "white",
    zIndex: 20,
    boxShadow: "-20px 0 50px rgba(0,0,0,0.18)",
    padding: 20,
  },
  drawerHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  drawerTitle: {
    fontSize: 23,
    fontWeight: 1000,
    margin: 0,
  },
  closeButton: {
    border: "1px solid #d1d5db",
    background: "white",
    borderRadius: 10,
    padding: "9px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  imageBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 10,
    marginBottom: 14,
  },
  bigImage: {
    width: "100%",
    maxHeight: 520,
    objectFit: "contain",
    borderRadius: 12,
    background: "white",
  },
  noBigImage: {
    height: 240,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 10,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: 900,
    color: "#374151",
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
  },
  textarea: {
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    minHeight: 84,
    resize: "vertical",
  },
  saveButton: {
    width: "100%",
    border: 0,
    borderRadius: 14,
    background: "#15803d",
    color: "white",
    padding: "15px 18px",
    fontSize: 17,
    fontWeight: 1000,
    cursor: "pointer",
    marginTop: 10,
    marginBottom: 40,
  },
};
