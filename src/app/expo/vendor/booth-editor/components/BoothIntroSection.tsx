"use client";

import React from "react";
import type { BoothShape } from "../types";

type BoothIntroSectionProps = {
  introTemplates: string[];
  form: BoothShape;
  onFieldChange: <K extends keyof BoothShape>(key: K, value: BoothShape[K]) => void;
  onTogglePublic: () => void;
};

export default function BoothIntroSection({
  introTemplates,
  form,
  onFieldChange,
  onTogglePublic,
}: BoothIntroSectionProps) {
  return (
    <>
      <div style={S.sectionTitle}>2. 부스 소개 문구</div>
      <div style={S.sectionDesc}>
        어려운 설명보다 농민이 바로 이해하는 문장이 좋습니다.
      </div>

      <div style={S.templateRow}>
        {introTemplates.map((item) => (
          <button
            key={item}
            type="button"
            style={S.templateChip}
            onClick={() => onFieldChange("intro", item)}
          >
            예시 문구 넣기
          </button>
        ))}
      </div>

      <label style={S.labelWrap}>
        <div style={S.label}>짧은 소개</div>
        <textarea
          style={S.textareaSmall}
          value={typeof form.intro === "string" ? form.intro : ""}
          onChange={(e) => onFieldChange("intro", e.target.value)}
          placeholder="농민이 첫 화면에서 바로 보는 짧은 소개"
        />
      </label>

      <label style={S.labelWrap}>
        <div style={S.label}>상세 소개</div>
        <textarea
          style={S.textarea}
          value={typeof form.description === "string" ? form.description : ""}
          onChange={(e) => onFieldChange("description", e.target.value)}
          placeholder="제품이 어떤 도움을 주는지, 언제 쓰면 좋은지 쉽게 적어주세요."
        />
      </label>

      <div style={S.divider} />

      <div style={S.sectionTitle}>4. 부스 공개</div>
      <div style={S.sectionDesc}>
        헷갈리는 공개/활성/발행 3개를 업체 화면에서는 하나로 정리했습니다.
      </div>

      <div style={S.singleToggleRow}>
        <button
          type="button"
          style={form.is_public ? S.toggleOnWide : S.toggleOffWide}
          onClick={onTogglePublic}
        >
          {form.is_public ? "부스 공개 상태: ON" : "부스 공개 상태: OFF"}
        </button>
      </div>

      <div style={S.infoBox}>
        업체 화면에서는 <b>부스 공개</b>만 보입니다. 저장 시 내부적으로 필요한 값은 함께 처리되도록 맞춰두었습니다.
      </div>
    </>
  );
}

const S: Record<string, React.CSSProperties> = {
  sectionTitle: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
    marginBottom: 8,
  },
  sectionDesc: {
    marginBottom: 14,
    fontSize: 13,
    lineHeight: 1.85,
    color: "#64748b",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
  divider: {
    height: 1,
    background: "#e5e7eb",
    margin: "22px 0",
  },
  templateRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  templateChip: {
    borderRadius: 999,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    padding: "10px 12px",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  labelWrap: {
    display: "block",
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: 900,
    color: "#111827",
  },
  textareaSmall: {
    width: "100%",
    minHeight: 92,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: 14,
    fontSize: 15,
    resize: "vertical",
    lineHeight: 1.85,
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
  textarea: {
    width: "100%",
    minHeight: 180,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: 14,
    fontSize: 15,
    resize: "vertical",
    lineHeight: 1.95,
    boxSizing: "border-box",
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
  singleToggleRow: {
    display: "flex",
    gap: 12,
  },
  toggleOnWide: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "1px solid #86efac",
    background: "#ecfdf5",
    color: "#166534",
    fontWeight: 900,
    cursor: "pointer",
  },
  toggleOffWide: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 900,
    cursor: "pointer",
  },
  infoBox: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid #dbeafe",
    background: "#eff6ff",
    color: "#1e3a8a",
    fontSize: 14,
    lineHeight: 1.85,
    fontWeight: 700,
    marginTop: 8,
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
};