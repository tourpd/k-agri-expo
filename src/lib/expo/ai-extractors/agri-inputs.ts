import { AiExtractInput, AiExtractResult } from "./types";

export function fallbackAgriExtract(
  input: AiExtractInput
): AiExtractResult {
  const text = String(input.sourceText || "");

  const dilution =
    text.match(/(\d{2,5})\s*배/)?.[0] ||
    text.match(/물\s*\d+\s*말[^.\n]*/)?.[0] ||
    "";

  const interval =
    text.match(/\d+\s*[~\-]\s*\d+\s*일\s*간격/)?.[0] ||
    text.match(/\d+\s*일\s*간격/)?.[0] ||
    "";

  const rounds = Number(
    text.match(/(\d+)\s*회\s*(살포|처리|사용)/)?.[1] || 0
  );

  const baseArea = Number(
    text.match(/(\d{2,6})\s*평/)?.[1] || 0
  );

  return {
    detail_description: text.slice(0, 600),

    target_crops: [
      "딸기",
      "오이",
      "토마토",
      "고추",
      "마늘",
      "양파",
      "포도",
      "감귤",
      "사과",
      "배",
    ]
      .filter((x) => text.includes(x))
      .join(", "),

    dosage_guide: dilution,

    spray_interval: interval,

    base_area_pyeong: baseArea || null,

    recommended_rounds: rounds || null,
  };
}