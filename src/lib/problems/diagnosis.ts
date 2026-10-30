/**
 * 포토닥터 진단명 → 문제 페이지(처방)
 *
 * 포토닥터는 "칼슘 결핍", "탄저병"처럼 원인 이름을 돌려줍니다.
 * 여기서 작물과 함께 받아 우리 문제 페이지(지금 할 일 + 이럴 때 쓰는 자재 + 약박사)로 잇습니다.
 * 1) 진단명 규칙(작물별 분기) → 2) 안 맞으면 글 매칭(matchText)
 */
import { getProblem, type CropKey } from "./catalog";
import { detectCrop, matchText } from "./match";

type Rule = { re: RegExp; slug: string | ((crop: CropKey | null) => string | null) };

const RULES: Rule[] = [
  { re: /칼슘|배꼽\s*썩|고두/, slug: "tomato-blossom-end-rot" },
  { re: /탄저/, slug: "gochu-anthracnose" },
  { re: /노균/, slug: (c) => (c === "onion" || c === "garlic" ? "onion-downy-mildew" : c === "leafy" || c === "cabbage" ? "leafy-downy-sclerotinia" : "cucumber-downy-mildew") },
  { re: /균핵/, slug: (c) => (c === "garlic" || c === "onion" ? "garlic-black-mold" : "leafy-downy-sclerotinia") },
  { re: /흰가루|잿빛/, slug: (c) => (c === "paprika" ? "paprika-thrips-powdery" : "strawberry-powdery-gray") },
  { re: /응애/, slug: "strawberry-mite" },
  { re: /총채/, slug: (c) => (c === "paprika" ? "paprika-thrips-powdery" : "gochu-thrips") },
  { re: /가루이/, slug: "tomato-cucumber-whitefly" },
  { re: /진딧물|바이러스|모자이크/, slug: "gochu-aphid-virus" },
  { re: /무름|세균/, slug: "cabbage-soft-rot" },
  { re: /열과|터짐|갈라짐/, slug: (c) => (c === "citrus" ? "citrus-cracking" : "tomato-cracking") },
  { re: /착색|색\s*불량/, slug: "apple-coloring" },
  { re: /염류|EC|염해/, slug: "greenhouse-salt-ec" },
  { re: /저온|냉해|동해/, slug: "cucumber-tomato-low-temp" },
  { re: /시들|시듦|역병|풋마름|뿌리\s*썩/, slug: "common-sudden-wilt" },
  { re: /황화|노랗|누렇|양분\s*결핍|질소\s*결핍|마그네슘/, slug: "common-yellow-leaf" },
];

export type DxResult = { slug: string; title: string; crop: CropKey | null; how: "rule" | "match" } | null;

export function problemForDiagnosis(input: { crop?: string; dx?: string; obs?: string }): DxResult {
  const cropText = (input.crop ?? "").trim();
  const dx = (input.dx ?? "").trim();
  const crop = detectCrop(cropText) ?? detectCrop(dx);

  // 문제 페이지가 아직 없는 진단은 약박사 검색으로 (예: 일소 → 일소 방지제)
  if (/일소|햇볕\s*데임/.test(dx)) return null;

  if (dx) {
    for (const r of RULES) {
      if (!r.re.test(dx)) continue;
      const slug = typeof r.slug === "function" ? r.slug(crop) : r.slug;
      const p = slug ? getProblem(slug) : null;
      if (p) return { slug: p.slug, title: p.title, crop, how: "rule" };
    }
  }

  const m = matchText(`${cropText} ${dx} ${input.obs ?? ""}`, 1);
  const best = m.problems[0];
  if (best && best.score >= 5) return { slug: best.problem.slug, title: best.problem.title, crop, how: "match" };
  return null;
}
