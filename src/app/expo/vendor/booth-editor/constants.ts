export const boothIntroTemplates = [
  "행사 가격과 핵심 효과를 한눈에 보고 바로 문의할 수 있는 부스입니다.",
  "작물 상황에 맞는 사용 포인트와 행사 혜택을 빠르게 확인할 수 있습니다.",
  "대표 제품과 영상, 자료를 보고 상담까지 바로 연결되는 부스입니다.",
];

export const RESPONSIVE_CSS = `
.booth-editor-root * {
  box-sizing: border-box;
}
.booth-editor-root input,
.booth-editor-root textarea,
.booth-editor-root button {
  font: inherit;
}
@media (max-width: 1100px) {
  .booth-editor-layout {
    grid-template-columns: 1fr !important;
  }
  .booth-editor-side {
    position: static !important;
    top: auto !important;
  }
}
@media (max-width: 768px) {
  .booth-editor-page {
    padding: 12px !important;
  }
  .booth-editor-hero {
    padding: 18px !important;
    border-radius: 22px !important;
  }
  .booth-editor-hero-title {
    font-size: 28px !important;
    line-height: 1.15 !important;
  }
  .booth-editor-summary {
    grid-template-columns: 1fr 1fr !important;
  }
  .booth-editor-grid2 {
    grid-template-columns: 1fr !important;
  }
  .booth-editor-grid3 {
    grid-template-columns: 1fr !important;
  }
  .booth-editor-upload-row {
    grid-template-columns: 1fr !important;
  }
  .booth-editor-price-preview {
    grid-template-columns: 1fr !important;
  }
  .booth-editor-form,
  .booth-editor-side {
    padding: 16px !important;
  }
}
@media (max-width: 560px) {
  .booth-editor-summary {
    grid-template-columns: 1fr !important;
  }
}
`;