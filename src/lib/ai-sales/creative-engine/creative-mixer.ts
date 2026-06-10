import type { CreativeConcept } from "./industry-concepts";
import { conceptLabels } from "./concept-score";

export function mixCreativeConcepts(concepts: CreativeConcept[]) {
  const labels = concepts.map((concept) => conceptLabels[concept] || concept);

  return `
선택된 광고 컨셉:
${labels.map((label, index) => `${index + 1}. ${label}`).join("\n")}

작성 원칙:
- 하나의 제품을 여러 광고 문법으로 변주하십시오.
- 제품 성격과 맞지 않는 억지 코미디는 피하십시오.
- 고가 장비·시설·태양광은 신뢰, 비교, 투자회수 중심으로 작성하십시오.
- 농자재·병해충·공동구매 제품은 공포, 비교, 농촌 시트콤을 적극 활용하십시오.
- 건강식품·식품·선물세트는 가족, 감성, 후기, 프리미엄 중심으로 작성하십시오.
`;
}
