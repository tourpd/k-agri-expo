export type AiExtractResult = {
  detail_description?: string;

  target_crops?: string;
  use_season?: string;
  how_to_use?: string;
  dosage_guide?: string;
  cautions?: string;

  base_area_pyeong?: number | null;
  recommended_rounds?: number | null;
  spray_interval?: string;
  use_period?: string;

  future_business_type?: string;

  container_farm_spec?: string;
  education_program?: string;
  buyback_terms?: string;
  healing_program?: string;
  functional_food_info?: string;
  patent_info?: string;
  target_customer?: string;
};

export type AiExtractInput = {
  productName: string;

  category?: string | null;
  shortDescription?: string | null;

  sourceText: string;

  imageUrls: string[];
};