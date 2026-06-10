import { memeLibrary } from "./meme-library";
import { parodyLibrary } from "./parody-library";

export function recommendTrends({
  industry,
  limit = 5,
}: {
  industry: string;
  limit?: number;
}) {
  const memes = memeLibrary
    .filter(
      (item) =>
        item.bestFor.includes(industry) ||
        item.bestFor.includes("agriculture")
    )
    .slice(0, limit);

  const parodies = parodyLibrary
    .filter(
      (item) =>
        item.bestFor.includes(industry) ||
        item.bestFor.includes("agriculture")
    )
    .slice(0, limit);

  return {
    recommendedMemes: memes,
    recommendedParodies: parodies,

    memeNames: memes.map((m) => m.label),

    parodyNames: parodies.map((p) => p.label),

    promptText: `
추천 밈:
${memes.map((m) => `- ${m.label}`).join("\n")}

추천 패러디:
${parodies.map((p) => `- ${p.label}`).join("\n")}

위 컨셉을 활용하여
쇼츠, 광고, 상세페이지, 공동구매 콘텐츠를 생성하라.
`,
  };
}