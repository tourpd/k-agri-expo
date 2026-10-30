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

  // 글 매칭은 '진단명' 낱말이 문제 제목·요약·키워드에 실제로 있어야만 인정합니다.
  // (작물 이름만 같아서 엉뚱한 처방이 붙는 일 방지 — 예: 토마토 흑반병 → 배꼽썩음 X)
  const tokens = dx
    .replace(/(병|증|결핍|피해|해충|장해|의심)$/g, "")
    .split(/[\s,.·()/]+/)
    .map((w) => w.replace(/(병|증)$/, ""))
    .filter((w) => w.length >= 2 && !/토마토|고추|오이|딸기|사과|배추|양파|마늘|파프리카|작물|열매|잎/.test(w));
  if (!tokens.length) return null;
  const m = matchText(`${cropText} ${dx}`, 5);
  for (const c of m.problems) {
    const words = [c.problem.title, c.problem.summary, ...c.problem.productKeywords].join(" ");
    const cropOk = !crop || c.problem.crop === crop || c.problem.alsoCrops?.includes(crop) || c.problem.crop === "common";
    if (cropOk && tokens.some((t) => words.includes(t))) return { slug: c.problem.slug, title: c.problem.title, crop, how: "match" };
  }
  return null;
}
