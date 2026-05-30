export type LiveVisualType = "main" | "box" | "general" | "phone";

export type LiveVisualConfig = {
  visual_type: LiveVisualType;

  brand_logo_url?: string;
  sponsor_logo_url?: string;
  product_image_url?: string;
  video_url?: string;

  brand_name?: string;
  sponsor_name?: string;

  show_brand_logo?: boolean;
  show_sponsor_logo?: boolean;
  show_participant_count?: boolean;

  participant_min_show?: number;

  title_font_size?: number;
  subtitle_font_size?: number;
  dday_font_size?: number;
  schedule_font_size?: number;
  participant_font_size?: number;
  prize_title_font_size?: number;
  body_font_size?: number;

  product_image_width?: number;
  product_image_height?: number;
  video_height?: number;

  background_color?: string;
  card_background_color?: string;
  primary_color?: string;
  secondary_color?: string;
  text_color?: string;
  button_color?: string;

  layout_mode?: "split" | "poster" | "compact" | "broadcast";
  product_position?: "right" | "bottom" | "center";
  participant_position?: "top_right" | "left_box" | "hidden";

  show_dday?: boolean;
  show_schedule_box?: boolean;
  show_flow?: boolean;
  show_product_points?: boolean;
  show_draw_points?: boolean;

  custom_css?: string;
};

export const DEFAULT_LIVE_VISUAL_CONFIG: LiveVisualConfig = {
  visual_type: "main",

  brand_logo_url: "",
  sponsor_logo_url: "",
  product_image_url: "",
  video_url: "",

  brand_name: "K-Agri Expo",
  sponsor_name: "",

  show_brand_logo: true,
  show_sponsor_logo: true,
  show_participant_count: true,

  participant_min_show: 50,

  title_font_size: 64,
  subtitle_font_size: 34,
  dday_font_size: 72,
  schedule_font_size: 24,
  participant_font_size: 42,
  prize_title_font_size: 38,
  body_font_size: 16,

  product_image_width: 420,
  product_image_height: 240,
  video_height: 300,

  background_color: "#07111f",
  card_background_color: "#ffffff",
  primary_color: "#facc15",
  secondary_color: "#16a34a",
  text_color: "#111827",
  button_color: "#facc15",

  layout_mode: "split",
  product_position: "right",
  participant_position: "top_right",

  show_dday: true,
  show_schedule_box: true,
  show_flow: true,
  show_product_points: true,
  show_draw_points: true,

  custom_css: "",
};

export function mergeLiveVisualConfig(
  config?: Partial<LiveVisualConfig> | null
): LiveVisualConfig {
  return {
    ...DEFAULT_LIVE_VISUAL_CONFIG,
    ...(config || {}),
  };
}