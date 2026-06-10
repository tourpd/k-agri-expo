import { AiExtractInput, AiExtractResult } from "./types";

export function fallbackFutureFoodExtract(
  input: AiExtractInput
): AiExtractResult {
  const text = String(input.sourceText || "");

  let businessType = "";

  if (
    text.includes("컨테이너") ||
    text.includes("스마트 사육")
  ) {
    businessType = "smart_insect_farm";
  }

  if (
    text.includes("교육") ||
    text.includes("교육과정")
  ) {
    businessType = "insect_farming_education";
  }

  if (
    text.includes("수매") ||
    text.includes("전량수매")
  ) {
    businessType = "buyback_contract";
  }

  if (
    text.includes("치유농업")
  ) {
    businessType = "healing_agriculture";
  }

  if (
    text.includes("건강기능식품") ||
    text.includes("개별인정형")
  ) {
    businessType = "functional_health_food";
  }

  return {
    future_business_type: businessType,

    container_farm_spec:
      text.includes("컨테이너")
        ? text.slice(0, 1000)
        : "",

    education_program:
      text.includes("교육")
        ? text.slice(0, 1000)
        : "",

    buyback_terms:
      text.includes("수매")
        ? text.slice(0, 1000)
        : "",

    healing_program:
      text.includes("치유농업")
        ? text.slice(0, 1000)
        : "",

    functional_food_info:
      text.includes("건강기능식품")
        ? text.slice(0, 1000)
        : "",

    patent_info:
      text.includes("특허") ||
      text.includes("개별인정형")
        ? text.slice(0, 1000)
        : "",

    target_customer:
      "농업인, 치유농장, 귀농인, 곤충사육 희망농가",
  };
}