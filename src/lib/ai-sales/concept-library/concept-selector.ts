import { emotionConcepts } from "./emotion-concepts";
import { ruralComedyConcepts } from "./rural-comedy-concepts";
import { storyConcepts } from "./story-concepts";

type RecommendInput = {
  industry?: string;
  productName?: string;
  notes?: string;
  limit?: number;
};

function scoreConcept(bestFor: string[] | undefined, text: string) {
  if (!bestFor || bestFor.length === 0) return 1;

  let score = 0;

  for (const key of bestFor) {
    if (text.includes(key.toLowerCase())) score += 5;
  }

  return score || 1;
}

export function recommendConceptLibrary({
  industry = "",
  productName = "",
  notes = "",
  limit = 5,
}: RecommendInput) {
  const text = `${industry} ${productName} ${notes}`.toLowerCase();

  const emotion = emotionConcepts
    .map((item) => ({
      ...item,
      category: "emotion",
      score: scoreConcept(item.bestFor, text),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const ruralComedy = ruralComedyConcepts
    .map((item) => ({
      ...item,
      category: "rural_comedy",
      score:
        text.includes("agriculture") ||
        text.includes("농자재") ||
        text.includes("비료") ||
        text.includes("병해") ||
        text.includes("농업")
          ? 5
          : 1,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const story = storyConcepts
    .map((item) => ({
      ...item,
      category: "story",
      score: scoreConcept(item.bestFor, text),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    emotion,
    ruralComedy,
    story,
    all: [...emotion, ...ruralComedy, ...story]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit * 2),
  };
}
