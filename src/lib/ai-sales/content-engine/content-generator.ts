import type { CreativeConcept } from "../creative-engine/industry-concepts";
import { conceptLabels } from "../creative-engine/concept-score";

export function buildContentOutputPrompt(concepts: CreativeConcept[]) {
  const conceptText = concepts
    .map((concept, index) => `${index + 1}. ${conceptLabels[concept] || concept}`)
    .join("\n");

  return `
선택된 컨셉으로 아래 콘텐츠를 생성하십시오.

선택 컨셉:
${conceptText}

출력:
1. 제품 한 줄 파악
2. 추천 광고 컨셉 TOP 5
3. 쇼츠 5편
4. 상세페이지 설계
5. 상세페이지 이미지 패키지 7장
6. Gemini 이미지 프롬프트 7개
7. Gemini/Veo 영상 프롬프트 5개
8. 배너 문구 10개
9. 문자 문구 6개
10. CRM 태그
11. HTML 판매페이지 초안
`;
}
