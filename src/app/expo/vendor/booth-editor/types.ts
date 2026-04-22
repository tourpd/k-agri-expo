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

  is_active?: boolean;
  status?: string;
  sort_order?: number | null;
};

export type BoothEditorClientProps = {
  vendor: VendorShape;
  booth: BoothShape;
  initialProducts: ProductShape[];
};