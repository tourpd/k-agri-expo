import { getIndustryConceptProfile } from "./industry-concepts";
import { scoreConcepts } from "./concept-score";

export function selectCreativeConcepts({
  industry,
  limit = 5,
}: {
  industry: string;
  limit?: number;
}) {
  const profile = getIndustryConceptProfile(industry);
  const scores = scoreConcepts(profile);

  return {
    industryLabel: profile.label,
    recommended: scores.slice(0, limit),
    all: scores,
  };
}
