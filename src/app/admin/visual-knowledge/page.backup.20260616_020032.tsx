"use client";

import { useEffect, useMemo, useState } from "react";

type VisualPage = {
  id: string;
  source_title?: string | null;
  source_name?: string | null;
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
  source_url?: string | null;
  original_location?: string | null;
  db_location?: string | null;
  usage_flow?: string | null;
  created_at?: string | null;
  raw?: any;
};

const DEFAULT_USAGE_FLOW =
  "자료화면 → knowledge_visual_pages DB → GPT Vision 시각분석 → 작물/병해충/표/그래프 분석 → 판단규칙 DB → 방송소재 → 쇼츠 → 농민상담 답변 → 행동지시";

export default function VisualKnowledgePage() {
  const [rows, setRows] = useState<VisualPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<VisualPage | null>(null);
  const [keyword, setKeyword] = useState("");
  const [saving, setSaving] = useState(false);

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

    return rows.filter((row) =>
      [
        row.source_title,
        row.source_name,
        row.crop_name,
        row.disease_name,
        row.growth_stage,
        row.key_info,
        row.ai_summary,
        row.next_action,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, keyword]);

  function openRow(row: VisualPage) {
    setSelected({
      ...row,
      db_location: row.db_location || "knowledge_visual_pages",
      usage_flow: row.usage_flow || DEFAULT_USAGE_FLOW,
      next_action: row.next_action || "GPT Vision 정밀분석 필요",
    });
  }

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

    const json = await res.json();

    if (!res.ok) {
      alert(json.error || "저장 실패");
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
            PDF, PPT, 병해충 사진, 토양검정서, 유튜브 캡처를 AI 두뇌로 흡수하는 시각자료 운영센터입니다.
          </p>
        </div>

        <div style={styles.headerButtons}>
          <button style={styles.greenButton} onClick={loadRows}>DB 새로고침</button>
          <button style={styles.blackButton}>AI 정밀분석 1차</button>
        </div>
      </section>

      <section style={styles.flowBox}>
        <b>활용 흐름</b>
        <span>{DEFAULT_USAGE_FLOW}</span>
      </section>

      <section style={styles.toolbar}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="자료제목, 작물, 병해충, 핵심정보 검색"
          style={styles.search}
        />
        <div style={styles.count}>총 {filteredRows.length}건</div>
      </section>

      <section style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: 72 }}>열기</th>
              <th style={{ ...styles.th, width: 95 }}>이미지</th>
              <th style={{ ...styles.th, width: 160 }}>자료제목</th>
              <th style={{ ...styles.th, width: 70 }}>페이지</th>
              <th style={{ ...styles.th, width: 105 }}>작물</th>
              <th style={{ ...styles.th, width: 115 }}>병해충</th>
              <th style={{ ...styles.th, width: 230 }}>핵심정보</th>
              <th style={{ ...styles.th, width: 330 }}>AI요약</th>
              <th style={{ ...styles.th, width: 180 }}>다음작업</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td style={styles.emptyTd} colSpan={9}>불러오는 중...</td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td style={styles.emptyTd} colSpan={9}>자료가 없습니다.</td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} style={styles.tr} onClick={() => openRow(row)}>
                  <td style={styles.tdCenter}>
                    <button
                      type="button"
                      style={styles.openButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        openRow(row);
                      }}
                    >
                      열기
                    </button>
                  </td>
                  <td style={styles.td}>
                    {row.image_url ? (
                      <img src={row.image_url} alt="" style={styles.thumb} />
                    ) : (
                      <div style={styles.noImage}>없음</div>
                    )}
                  </td>
                  <td style={styles.tdStrong}>
                    {row.source_title || row.source_name || "자료제목 필요"}
                  </td>
                  <td style={styles.tdCenter}>{row.page_number || "-"}</td>
                  <td style={styles.td}>{row.crop_name || "분석필요"}</td>
                  <td style={styles.td}>{row.disease_name || "-"}</td>
                  <td style={styles.td}>{row.key_info || "-"}</td>
                  <td style={styles.td}>{row.ai_summary || "-"}</td>
                  <td style={styles.td}>{row.next_action || "GPT Vision 정밀분석"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {selected && (
        <>
          <div style={styles.overlay} onClick={() => setSelected(null)} />
          <aside style={styles.drawer}>
          <div style={styles.drawerHead}>
            <div>
              <div style={styles.kicker}>세환PD × AI 공동편집실</div>
              <h2 style={styles.drawerTitle}>
                {selected.source_title || selected.source_name || "자료 상세"}
              </h2>
              <p style={styles.drawerSub}>
                페이지 {selected.page_number || "-"} / DB: {selected.db_location || "knowledge_visual_pages"}
              </p>
            </div>
            <button style={styles.closeButton} onClick={() => setSelected(null)}>닫기</button>
          </div>

          <div style={styles.bigImageBox}>
            {selected.image_url ? (
              <img src={selected.image_url} alt="" style={styles.bigImage} />
            ) : (
              <div style={styles.noBigImage}>이미지 없음</div>
            )}
          </div>

          <div style={styles.statusGrid}>
            <Status label="작물" value={selected.crop_name || "분석필요"} />
            <Status label="병해충" value={selected.disease_name || "미분류"} />
            <Status label="생육단계" value={selected.growth_stage || "미분류"} />
          </div>

          <SectionTitle title="자료 기본정보" />
          <div style={styles.grid2}>
            <Field label="자료제목" value={selected.source_title || ""} onChange={(v) => updateSelected("source_title", v)} />
            <Field label="출처" value={selected.source_name || ""} onChange={(v) => updateSelected("source_name", v)} />
            <Field label="원본 위치" value={selected.original_location || selected.source_url || ""} onChange={(v) => updateSelected("original_location", v)} />
            <Field label="DB 저장 위치" value={selected.db_location || "knowledge_visual_pages"} onChange={(v) => updateSelected("db_location", v)} />
          </div>

          <FieldArea label="활용 흐름" value={selected.usage_flow || DEFAULT_USAGE_FLOW} onChange={(v) => updateSelected("usage_flow", v)} />

          <SectionTitle title="AI 분석정보" />
          <div style={styles.grid3}>
            <Field label="작물" value={selected.crop_name || ""} onChange={(v) => updateSelected("crop_name", v)} />
            <Field label="병해충" value={selected.disease_name || ""} onChange={(v) => updateSelected("disease_name", v)} />
            <Field label="생육단계" value={selected.growth_stage || ""} onChange={(v) => updateSelected("growth_stage", v)} />
          </div>

          <FieldArea label="핵심정보" value={selected.key_info || ""} onChange={(v) => updateSelected("key_info", v)} />
          <FieldArea label="AI요약" value={selected.ai_summary || ""} onChange={(v) => updateSelected("ai_summary", v)} />
          <FieldArea label="농민 행동지시" value={selected.action_instruction || ""} onChange={(v) => updateSelected("action_instruction", v)} />

          <SectionTitle title="콘텐츠화" />
          <FieldArea label="방송소재" value={selected.broadcast_material || ""} onChange={(v) => updateSelected("broadcast_material", v)} />
          <FieldArea label="쇼츠소재" value={selected.shorts_material || ""} onChange={(v) => updateSelected("shorts_material", v)} />

          <SectionTitle title="공동편집" />
          <FieldArea label="세환PD 공동편집 메모" value={selected.pd_memo || ""} onChange={(v) => updateSelected("pd_memo", v)} />
          <FieldArea label="수정요청" value={selected.edit_request || ""} onChange={(v) => updateSelected("edit_request", v)} />
          <FieldArea label="다음작업" value={selected.next_action || ""} onChange={(v) => updateSelected("next_action", v)} />

          <div style={styles.saveBar}>
            <button style={styles.saveButton} onClick={saveSelected} disabled={saving}>
              {saving ? "저장 중..." : "공동편집 내용 저장"}
            </button>
          </div>
        </aside>
        </>
      )}
    </main>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h3 style={styles.sectionTitle}>{title}</h3>;
}

function Status({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statusCard}>
      <div style={styles.statusLabel}>{label}</div>
      <div style={styles.statusValue}>{value}</div>
    </div>
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
    background: "#f4f7f2",
    padding: 16,
    color: "#111827",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 900,
    color: "#15803d",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 1000,
    margin: 0,
    letterSpacing: "-0.04em",
  },
  desc: {
    margin: "6px 0 0",
    color: "#4b5563",
    fontSize: 14,
  },
  headerButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  openButton: {
    border: 0,
    borderRadius: 999,
    background: "#15803d",
    color: "white",
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
  },
  greenButton: {
    border: 0,
    borderRadius: 10,
    background: "#16a34a",
    color: "white",
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  blackButton: {
    border: 0,
    borderRadius: 10,
    background: "#111827",
    color: "white",
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
  },
  flowBox: {
    background: "#ecfdf5",
    border: "1px solid #bbf7d0",
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 10,
  },
  toolbar: {
    display: "flex",
    gap: 8,
    marginBottom: 8,
  },
  search: {
    flex: 1,
    background: "white",
    border: "1px solid #d1d5db",
    borderRadius: 10,
    padding: "11px 12px",
    fontSize: 14,
  },
  count: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "11px 14px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  tableWrap: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  th: {
    background: "#111827",
    color: "white",
    padding: "9px 8px",
    fontSize: 12,
    textAlign: "left",
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  tr: {
    borderBottom: "1px solid #e5e7eb",
    cursor: "pointer",
    background: "white",
  },
  td: {
    padding: "7px 8px",
    fontSize: 12,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },
  tdStrong: {
    padding: "7px 8px",
    fontSize: 12,
    fontWeight: 900,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    verticalAlign: "middle",
  },
  tdCenter: {
    padding: "7px 8px",
    fontSize: 12,
    textAlign: "center",
  },
  emptyTd: {
    padding: 18,
    fontSize: 14,
    textAlign: "center",
  },
  thumb: {
    width: 70,
    height: 48,
    objectFit: "contain",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    background: "#f9fafb",
  },
  noImage: {
    width: 70,
    height: 48,
    borderRadius: 6,
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    color: "#6b7280",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.28)",
    zIndex: 40,
  },
  drawer: {
    position: "fixed",
    right: 0,
    top: 0,
    width: "min(820px, 100vw)",
    height: "100vh",
    background: "white",
    zIndex: 50,
    overflowY: "auto",
    padding: 18,
    boxShadow: "-20px 0 50px rgba(0,0,0,0.22)",
  },
  drawerHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 1000,
    margin: 0,
    letterSpacing: "-0.04em",
  },
  drawerSub: {
    margin: "5px 0 0",
    fontSize: 13,
    color: "#6b7280",
  },
  closeButton: {
    border: "1px solid #d1d5db",
    background: "white",
    borderRadius: 10,
    padding: "9px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  bigImageBox: {
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
  },
  bigImage: {
    width: "100%",
    maxHeight: 520,
    objectFit: "contain",
    background: "white",
    borderRadius: 12,
  },
  noBigImage: {
    height: 260,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
    marginBottom: 12,
  },
  statusCard: {
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: 12,
    padding: 10,
  },
  statusLabel: {
    fontSize: 12,
    color: "#15803d",
    fontWeight: 900,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 1000,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 1000,
    margin: "18px 0 8px",
    borderTop: "1px solid #e5e7eb",
    paddingTop: 14,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: 8,
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: 900,
    color: "#374151",
  },
  input: {
    border: "1px solid #d1d5db",
    borderRadius: 9,
    padding: 10,
    fontSize: 14,
  },
  textarea: {
    border: "1px solid #d1d5db",
    borderRadius: 9,
    padding: 10,
    fontSize: 14,
    minHeight: 88,
    resize: "vertical",
    lineHeight: 1.5,
  },
  saveBar: {
    position: "sticky",
    bottom: 0,
    background: "white",
    padding: "12px 0 20px",
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
  },
};
