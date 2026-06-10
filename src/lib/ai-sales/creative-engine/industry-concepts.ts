export type CreativeConcept =
  | "rural_sitcom"
  | "fear"
  | "comparison"
  | "expert"
  | "documentary"
  | "news"
  | "investment"
  | "premium"
  | "family"
  | "review"
  | "live_commerce"
  | "parody"
  | "shorts_meme"
  | "before_after"
  | "urgent_groupbuy"
  | "emotional_drama"
  | "field_test"
  | "subsidy"
  | "seasonal_alert";

export type IndustryConceptProfile = {
  label: string;
  primaryConcepts: CreativeConcept[];
  optionalConcepts: CreativeConcept[];
  avoidConcepts?: CreativeConcept[];
};

export const industryConceptProfiles: Record<string, IndustryConceptProfile> = {
  agriculture: {
    label: "농자재",
    primaryConcepts: ["rural_sitcom", "fear", "comparison", "expert", "urgent_groupbuy"],
    optionalConcepts: ["documentary", "news", "shorts_meme", "before_after", "parody", "seasonal_alert"],
  },
  machinery: {
    label: "농기계",
    primaryConcepts: ["expert", "comparison", "documentary", "investment", "field_test"],
    optionalConcepts: ["news", "review", "subsidy", "before_after", "parody"],
    avoidConcepts: ["rural_sitcom"],
  },
  smartfarm: {
    label: "스마트농업",
    primaryConcepts: ["expert", "investment", "documentary", "comparison", "news"],
    optionalConcepts: ["review", "before_after", "field_test"],
  },
  solar: {
    label: "태양광·에너지",
    primaryConcepts: ["investment", "expert", "documentary", "comparison", "news"],
    optionalConcepts: ["review", "subsidy"],
    avoidConcepts: ["rural_sitcom"],
  },
  dryer: {
    label: "건조기·저장설비",
    primaryConcepts: ["fear", "comparison", "expert", "before_after", "investment"],
    optionalConcepts: ["documentary", "urgent_groupbuy", "review", "field_test"],
  },
  seed: {
    label: "종자·묘종·묘목",
    primaryConcepts: ["fear", "comparison", "expert", "documentary", "before_after"],
    optionalConcepts: ["rural_sitcom", "urgent_groupbuy", "review", "seasonal_alert"],
  },
  health: {
    label: "건강기능식품",
    primaryConcepts: ["family", "premium", "expert", "review", "emotional_drama"],
    optionalConcepts: ["documentary", "shorts_meme", "parody", "live_commerce", "urgent_groupbuy"],
    avoidConcepts: ["fear"],
  },
  produce: {
    label: "농산물",
    primaryConcepts: ["premium", "family", "documentary", "review", "live_commerce"],
    optionalConcepts: ["rural_sitcom", "shorts_meme", "urgent_groupbuy", "parody", "seasonal_alert"],
  },
  processed: {
    label: "가공식품",
    primaryConcepts: ["premium", "family", "review", "live_commerce", "shorts_meme"],
    optionalConcepts: ["documentary", "parody", "urgent_groupbuy"],
  },
  fishery: {
    label: "수산물",
    primaryConcepts: ["premium", "family", "live_commerce", "review", "documentary"],
    optionalConcepts: ["shorts_meme", "urgent_groupbuy", "parody"],
  },
  futurefood: {
    label: "미래식량",
    primaryConcepts: ["documentary", "investment", "expert", "news", "family"],
    optionalConcepts: ["parody", "shorts_meme", "review"],
  },
  healing: {
    label: "치유농업",
    primaryConcepts: ["family", "documentary", "premium", "review", "expert"],
    optionalConcepts: ["shorts_meme", "parody", "emotional_drama"],
  },
  drone: {
    label: "농업드론",
    primaryConcepts: ["expert", "comparison", "investment", "documentary", "field_test"],
    optionalConcepts: ["news", "review", "parody", "subsidy"],
  },
  livestock: {
    label: "축산자재",
    primaryConcepts: ["expert", "fear", "comparison", "documentary", "before_after"],
    optionalConcepts: ["rural_sitcom", "news", "urgent_groupbuy"],
  },
  aquaculture: {
    label: "양식·수산기자재",
    primaryConcepts: ["expert", "comparison", "investment", "documentary", "fear"],
    optionalConcepts: ["news", "review", "before_after"],
  },
  farmtour: {
    label: "농촌체험·관광",
    primaryConcepts: ["family", "premium", "shorts_meme", "documentary", "review"],
    optionalConcepts: ["parody", "live_commerce"],
  },
  unknown: {
    label: "미분류",
    primaryConcepts: ["expert", "documentary", "comparison", "shorts_meme", "urgent_groupbuy"],
    optionalConcepts: ["rural_sitcom", "parody", "review"],
  },
};

export function getIndustryConceptProfile(industry: string) {
  return industryConceptProfiles[industry] || industryConceptProfiles.unknown;
}
