import { genreLibrary } from "./genre-library";
import { musicVideoLibrary } from "./music-video-library";
import { parseCustomConcept } from "./custom-concept-parser";

export function recommendCreativeDirection({
  industry,
  customConcept,
  limit = 5,
}: {
  industry: string;
  customConcept?: string | null;
  limit?: number;
}) {
  const parsed = parseCustomConcept(customConcept);

  const recommendedGenres = genreLibrary
    .filter(
      (item) =>
        item.bestFor.includes(industry) ||
        item.bestFor.includes("agriculture") ||
        parsed.genres.includes(item.id)
    )
    .slice(0, limit);

  const recommendedMusicVideos = musicVideoLibrary
    .filter(
      (item) =>
        item.bestFor.includes(industry) ||
        parsed.musicVideoStyles.includes(item.id)
    )
    .slice(0, limit);

  const promptText = `
사용자 요청 컨셉:
${parsed.rawInput || "사용자 지정 컨셉 없음"}

해석된 장르:
${parsed.genres.length ? parsed.genres.map((v) => `- ${v}`).join("\n") : "- 없음"}

해석된 톤:
${parsed.tones.length ? parsed.tones.map((v) => `- ${v}`).join("\n") : "- 없음"}

추천 장르:
${recommendedGenres.map((v) => `- ${v.label}: ${v.description}`).join("\n")}

추천 뮤직비디오 스타일:
${recommendedMusicVideos.map((v) => `- ${v.label}: ${v.description}`).join("\n")}

패러디 안전 규칙:
${parsed.safetyNote}
`;

  return {
    parsed,
    recommendedGenres,
    recommendedMusicVideos,
    promptText,
  };
}
