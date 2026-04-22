"use client";

import React from "react";

type BoothEditorHeroProps = {
  onFillExample: () => void;
  publicHref: string;
};

export default function BoothEditorHero({
  onFillExample,
  publicHref,
}: BoothEditorHeroProps) {
  return (
    <section style={S.heroCard} className="booth-editor-hero">
      <div>
        <div style={S.eyebrow}>VENDOR EDITOR</div>
        <h1 style={S.title} className="booth-editor-hero-title">
          업체용 부스 편집기
        </h1>
        <div style={S.desc}>
          이 화면은 업체가 자기 부스를 꾸미는 화면입니다. 너무 어려운 항목은 빼고,
          실제로 필요한 내용만 남겼습니다. 부스명, 대표 이미지, 대표 영상, 대표 제품만
          먼저 넣으면 바로 운영 가능합니다.
        </div>
      </div>

      <div style={S.topActions}>
        {publicHref ? (
          <a
            href={publicHref}
            target="_blank"
            rel="noreferrer"
            style={S.primaryGhostBtn}
          >
            실제 부스 보기
          </a>
        ) : (
          <button type="button" style={S.disabledBtn} disabled>
            실제 부스 보기 불가
          </button>
        )}

        <a href="/vendor" style={S.ghostBtn}>
          업체 운영관리로
        </a>

        <button type="button" style={S.fillBtn} onClick={onFillExample}>
          예시 문구 자동입력
        </button>
      </div>
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  heroCard: {
    borderRadius: 28,
    padding: 24,
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
    color: "#fff",
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#86efac",
    letterSpacing: 0.6,
  },
  title: {
    marginTop: 8,
    fontSize: 38,
    lineHeight: 1.1,
    fontWeight: 950,
    color: "#fff",
  },
  desc: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 1.9,
    color: "rgba(255,255,255,0.86)",
    maxWidth: 780,
    whiteSpace: "pre-wrap",
    wordBreak: "keep-all",
  },
  topActions: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
    alignItems: "flex-start",
    minWidth: 260,
  },
  primaryGhostBtn: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "#fff",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 950,
    border: "1px solid #e5e7eb",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtn: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.96)",
    color: "#111827",
    textDecoration: "none",
    fontWeight: 900,
    border: "1px solid #e5e7eb",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  fillBtn: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "#16a34a",
    color: "#fff",
    border: "none",
    fontWeight: 900,
    cursor: "pointer",
  },
  disabledBtn: {
    padding: "12px 14px",
    borderRadius: 14,
    background: "#94a3b8",
    color: "#fff",
    border: "none",
    fontWeight: 900,
    cursor: "not-allowed",
  },
};