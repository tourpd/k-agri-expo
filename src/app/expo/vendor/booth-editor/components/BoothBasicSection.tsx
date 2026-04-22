"use client";

import React from "react";
import type { BoothShape, VendorShape } from "../types";

type BoothBasicSectionProps = {
  form: BoothShape;
  vendor: VendorShape;
  hallLabelText: string;
  slotCode: string;
  uploadingField: string;
  onFieldChange: <K extends keyof BoothShape>(key: K, value: BoothShape[K]) => void;
  onCoverUploadClick: () => void;
  onThumbUploadClick: () => void;
  onLogoUploadClick: () => void;
};

export default function BoothBasicSection({
  form,
  vendor,
  hallLabelText,
  slotCode,
  uploadingField,
  onFieldChange,
  onCoverUploadClick,
  onThumbUploadClick,
  onLogoUploadClick,
}: BoothBasicSectionProps) {
  return (
    <>
      <div style={S.sectionTitle}>1. 부스 기본 정보</div>
      <div style={S.sectionDesc}>
        업체가 실제로 꼭 입력해야 하는 핵심 정보만 남겼습니다.
      </div>

      <div style={S.grid2} className="booth-editor-grid2">
        <label style={S.labelWrap}>
          <div style={S.label}>부스명</div>
          <input
            style={S.input}
            value={typeof form.name === "string" ? form.name : ""}
            onChange={(e) => onFieldChange("name", e.target.value)}
            placeholder="예: DOF 농자재 특별부스"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>부스 한줄 제목</div>
          <input
            style={S.input}
            value={typeof form.title === "string" ? form.title : ""}
            onChange={(e) => onFieldChange("title", e.target.value)}
            placeholder="예: 작물 활력 회복과 병해충 관리"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>담당자명</div>
          <input
            style={S.input}
            value={typeof form.contact_name === "string" ? form.contact_name : ""}
            onChange={(e) => onFieldChange("contact_name", e.target.value)}
            placeholder="상담 담당자"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>상담 이메일</div>
          <input
            style={S.input}
            value={typeof form.email === "string" ? form.email : ""}
            onChange={(e) => onFieldChange("email", e.target.value)}
            placeholder="상담용 이메일"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>카테고리</div>
          <input
            style={S.input}
            value={typeof form.category_primary === "string" ? form.category_primary : ""}
            onChange={(e) => onFieldChange("category_primary", e.target.value)}
            placeholder="예: 비료 / 영양제 / 친환경자재"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>세부 카테고리</div>
          <input
            style={S.input}
            value={typeof form.category_secondary === "string" ? form.category_secondary : ""}
            onChange={(e) => onFieldChange("category_secondary", e.target.value)}
            placeholder="예: 활착제 / 칼슘제 / 살충제"
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>홈페이지</div>
          <input
            style={S.input}
            value={typeof form.website_url === "string" ? form.website_url : ""}
            onChange={(e) => onFieldChange("website_url", e.target.value)}
            placeholder="https://..."
          />
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>대표 유튜브 링크</div>
          <input
            style={S.input}
            value={typeof form.youtube_url === "string" ? form.youtube_url : ""}
            onChange={(e) => onFieldChange("youtube_url", e.target.value)}
            placeholder="이 링크는 실제 부스에서 대표 영상으로 보여줄 주소입니다."
          />
        </label>
      </div>

      <div style={S.infoBox}>
        전시장 위치는 현재 <b>{hallLabelText}</b> / <b>{slotCode}</b> 입니다.
        이 값은 업체가 임의로 바꾸기보다 운영자가 배정하는 기준으로 두는 것이 안전합니다.
      </div>

      <div style={S.divider} />

      <div style={S.sectionTitle}>3. 부스 이미지</div>
      <div style={S.sectionDesc}>
        대표 이미지는 실제 부스 상단에 보이게 될 핵심 이미지입니다.
      </div>

      <div style={S.grid2} className="booth-editor-grid2">
        <label style={S.labelWrap}>
          <div style={S.label}>대표 이미지</div>
          <div style={S.uploadRow} className="booth-editor-upload-row">
            <input
              style={S.input}
              value={typeof form.cover_image_url === "string" ? form.cover_image_url : ""}
              onChange={(e) => onFieldChange("cover_image_url", e.target.value)}
              placeholder="이미지 URL 직접 입력 가능"
            />
            <button type="button" style={S.uploadBtn} onClick={onCoverUploadClick}>
              {uploadingField === "cover_image_url" ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>썸네일 이미지</div>
          <div style={S.uploadRow} className="booth-editor-upload-row">
            <input
              style={S.input}
              value={typeof form.thumbnail_url === "string" ? form.thumbnail_url : ""}
              onChange={(e) => onFieldChange("thumbnail_url", e.target.value)}
              placeholder="이미지 URL 직접 입력 가능"
            />
            <button type="button" style={S.uploadBtn} onClick={onThumbUploadClick}>
              {uploadingField === "thumbnail_url" ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </label>

        <label style={S.labelWrap}>
          <div style={S.label}>로고 이미지</div>
          <div style={S.uploadRow} className="booth-editor-upload-row">
            <input
              style={S.input}
              value={typeof form.logo_url === "string" ? form.logo_url : ""}
              onChange={(e) => onFieldChange("logo_url", e.target.value)}
              placeholder="이미지 URL 직접 입력 가능"
            />
            <button type="button" style={S.uploadBtn} onClick={onLogoUploadClick}>
              {uploadingField === "logo_url" ? "업로드 중..." : "업로드"}
            </button>
          </div>
        </label>
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
  grid2: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 12,
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
  input: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    padding: "0 14px",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box",
  },
  uploadRow: {
    display: "grid",
    gridTemplateColumns: "1fr 96px",
    gap: 8,
  },
  uploadBtn: {
    height: 50,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#111827",
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