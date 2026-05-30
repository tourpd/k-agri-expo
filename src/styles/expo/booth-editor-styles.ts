import React from "react";

export const RESPONSIVE_CSS = `
.booth-editor-root * {
  box-sizing: border-box;
}
.booth-editor-root input,
.booth-editor-root textarea,
.booth-editor-root button {
  font: inherit;
}
.booth-editor-root input,
.booth-editor-root textarea {
  word-break: keep-all;
}
@media (max-width: 900px) {
  .booth-grid-2 {
    grid-template-columns: 1fr !important;
  }
  .booth-grid-3 {
    grid-template-columns: 1fr !important;
  }
  .booth-summary-row {
    grid-template-columns: 1fr 1fr !important;
  }
  .booth-price-box {
    grid-template-columns: 1fr !important;
  }
}
@media (max-width: 640px) {
  .booth-summary-row {
    grid-template-columns: 1fr !important;
  }
}
`;

export const S: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: 20,
    background: "#f8fafc",
    minHeight: "100vh",
  },

  hero: {
    borderRadius: 24,
    padding: 24,
    background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
    color: "#fff",
    marginBottom: 16,
  },

  // ↓↓↓ 여기 아래에 기존 S 전체를 그대로 붙여넣기 ↓↓↓
};