export type VendorShape = {
  user_id?: string;
  vendor_id?: string;
  company_name?: string;
  approval_status?: string;
};

export type BoothShape = {
  booth_id?: string;
  vendor_id?: string;
  vendor_user_id?: string;

  name?: string;
  title?: string;
  intro?: string;
  description?: string;

  category_primary?: string;
  category_secondary?: string;

  hall_id?: string;
  slot_code?: string;

  contact_name?: string;
  email?: string;
  website_url?: string;

  logo_url?: string;
  thumbnail_url?: string;
  cover_image_url?: string;
  banner_url?: string;

  youtube_url?: string;
  video_url?: string;
  youtube_link?: string;

  booth_type?: string;
  plan_type?: string;

  is_public?: boolean;
  is_active?: boolean;
  is_published?: boolean;
  status?: string;
};

export type ProductSpecShape = {
  application_methods?: string[];
  application_method_detail?: string;

  dilution_ratio_text?: string;
  base_water_liter?: number | null;
  base_product_amount?: number | null;
  base_product_unit?: string;
  base_area_pyeong?: number | null;

  interval_days?: number | null;
  max_cycles?: number | null;
  best_timing_text?: string;

  target_crops?: string[];
  growth_stages?: string[];

  seedling_allowed?: boolean;
  seedling_ratio_text?: string;
  seedling_interval_days?: number | null;
  seedling_notes?: string;

  soaking_allowed?: boolean;
  soaking_ratio_text?: string;
  soaking_duration_minutes?: number | null;
  soaking_target?: string;
  soaking_notes?: string;

  foliar_allowed?: boolean;
  foliar_target_parts?: string[];
  foliar_method_text?: string;

  drench_allowed?: boolean;
  drench_method_text?: string;
  drench_water_volume_text?: string;

  mixable?: boolean | null;
  mixable_with?: string[];
  non_mixable_with?: string[];
  mix_notes?: string;

  phytotoxicity_warning?: string;
  precautions?: string;
  protective_equipment?: string[];

  ai_summary?: string;
  ai_enabled?: boolean;
  verified_status?: string;
};

export type ProductShape = {
  id?: string | number;
  product_id?: string | number;
  booth_id?: string;

  name?: string;
  title?: string;
  description?: string;

  image_url?: string;
  image_file_url?: string;
  thumbnail_url?: string;

  price_krw?: number | null;
  sale_price_krw?: number | null;
  price_text?: string;

  youtube_url?: string;

  catalog_url?: string;
  catalog_file_url?: string;
  catalog_filename?: string;

  headline_text?: string;
  urgency_text?: string;
  cta_text?: string;

  point_1?: string;
  point_2?: string;
  point_3?: string;

  purchase_url?: string;
  dealer_apply_url?: string;
  buyer_apply_url?: string;

  usage_summary?: string;
  usage_method?: string;
  usage_timing?: string;
  usage_interval?: string;
  usage_crops?: string;
  caution_text?: string;

  calc_base_water_liter?: number | null;
  calc_base_product_ml?: number | null;
  calc_base_area_pyeong?: number | null;

  is_active?: boolean;
  status?: string;
  sort_order?: number | null;

  spec?: ProductSpecShape;
};