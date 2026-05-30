import { PHOTO_DOCTOR_PRODUCT_RULES } from "./productRules";

function text(v: unknown) {
  return typeof v === "string" ? v.toLowerCase().trim() : "";
}

function collectResultText(result: any) {
  const parts: string[] = [];

  parts.push(text(result?.diagnosis));
  parts.push(text(result?.final_judgement));

  if (Array.isArray(result?.symptoms)) {
    result.symptoms.forEach((x: unknown) => parts.push(text(x)));
  }

  if (Array.isArray(result?.do_now)) {
    result.do_now.forEach((x: unknown) => parts.push(text(x)));
  }

  if (Array.isArray(result?.must_check)) {
    result.must_check.forEach((x: unknown) => parts.push(text(x)));
  }

  if (Array.isArray(result?.possible_causes)) {
    result.possible_causes.forEach((cause: any) => {
      parts.push(text(cause?.name));
      parts.push(text(cause?.reason));
    });
  }

  return parts.filter(Boolean).join(" ");
}

function scoreRule(rule: (typeof PHOTO_DOCTOR_PRODUCT_RULES)[number], fullText: string) {
  if (rule.blockKeywords?.some((k) => fullText.includes(k.toLowerCase()))) {
    if (rule.issueGroup === "pest" || rule.issueGroup === "organic") {
      return 0;
    }
  }

  let score = 0;

  for (const keyword of rule.matchKeywords) {
    if (fullText.includes(keyword.toLowerCase())) {
      score += 30;
    }
  }

  if (score > 0) score += rule.priority;

  return score;
}

export function getPhotoDoctorLinkedProducts(result: any) {
  const fullText = collectResultText(result);

  const matched = PHOTO_DOCTOR_PRODUCT_RULES.map((rule) => ({
    ...rule,
    score: scoreRule(rule, fullText),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return matched.slice(0, 3).map((item) => ({
    productKey: item.productKey,
    name: item.name,
    label: item.label,
    reason: item.reason,
    href: item.href,
    issueGroup: item.issueGroup,
  }));
}