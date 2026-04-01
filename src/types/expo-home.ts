export type HomeSlot = {
  id: string;
  section_key: string;
  slot_order: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  badge_text: string | null;
  button_text: string | null;
  link_type: string | null;
  link_value: string | null;
  price_text: string | null;
  stock_text: string | null;
  event_text: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export type CmsSettings = {
  id: number;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_button_text: string | null;
  hero_button_link: string | null;
  hero_secondary_button_text: string | null;
  hero_secondary_button_link: string | null;
  hero_video_url: string | null;
};

export type ExpoProblemContent = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  link_url: string;
  audience_type: string;
  season_key: string | null;
  month_key: number | null;
  crop_key: string | null;
  issue_key: string | null;
  priority: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ExpoProblemQuickLink = {
  id: string;
  label: string;
  link_url: string;
  audience_type: string;
  season_key: string | null;
  month_key: number | null;
  crop_key: string | null;
  issue_key: string | null;
  priority: number;
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  created_at: string;
  updated_at: string;
};