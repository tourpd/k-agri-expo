export type ApplicationMethod =
  | "foliar"
  | "drench"
  | "soaking"
  | "soil"
  | "mixed";

export type ProductSpecShape = {
  application_methods: ApplicationMethod[];
  application_method_detail: string;

  dilution_ratio_text: string;
  base_water_liter: number | null;
  base_product_amount: number | null;
  base_product_unit: string;
  base_area_pyeong: number | null;

  interval_days: number | null;
  max_cycles: number | null;
  best_timing_text: string;

  target_crops: string[];
  growth_stages: string[];

  seedling_allowed: boolean;
  seedling_ratio_text: string;
  seedling_interval_days: number | null;
  seedling_notes: string;

  soaking_allowed: boolean;
  soaking_ratio_text: string;
  soaking_duration_minutes: number | null;
  soaking_target: string;
  soaking_notes: string;

  foliar_allowed: boolean;
  foliar_target_parts: string[];
  foliar_method_text: string;

  drench_allowed: boolean;
  drench_method_text: string;
  drench_water_volume_text: string;

  mixable: boolean | null;
  mixable_with: string[];
  non_mixable_with: string[];
  mix_notes: string;

  phytotoxicity_warning: string;
  precautions: string;
  protective_equipment: string[];

  ai_summary: string;
  ai_enabled: boolean;
  verified_status: string;
};

export function createEmptyProductSpec(): ProductSpecShape {
  return {
    application_methods: [],
    application_method_detail: "",

    dilution_ratio_text: "",
    base_water_liter: null,
    base_product_amount: null,
    base_product_unit: "ml",
    base_area_pyeong: null,

    interval_days: null,
    max_cycles: null,
    best_timing_text: "",

    target_crops: [],
    growth_stages: [],

    seedling_allowed: false,
    seedling_ratio_text: "",
    seedling_interval_days: null,
    seedling_notes: "",

    soaking_allowed: false,
    soaking_ratio_text: "",
    soaking_duration_minutes: null,
    soaking_target: "",
    soaking_notes: "",

    foliar_allowed: false,
    foliar_target_parts: [],
    foliar_method_text: "",

    drench_allowed: false,
    drench_method_text: "",
    drench_water_volume_text: "",

    mixable: null,
    mixable_with: [],
    non_mixable_with: [],
    mix_notes: "",

    phytotoxicity_warning: "",
    precautions: "",
    protective_equipment: [],

    ai_summary: "",
    ai_enabled: false,
    verified_status: "draft",
  };
}