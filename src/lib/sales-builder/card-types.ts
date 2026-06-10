export type CardType =
  | "hero"
  | "problem"
  | "solution"
  | "before"
  | "after"
  | "compare"
  | "usage"
  | "dosage"
  | "warning"
  | "ingredient"
  | "proof"
  | "review"
  | "faq"
  | "video"
  | "banner"
  | "price"
  | "event"
  | "coupon"
  | "cta";

export type CardSize =
  | "1x1"
  | "2x1"
  | "1x2"
  | "2x2"
  | "3x1"
  | "3x2";

export interface BuilderCard {
  id: string;

  type: CardType;

  title: string;

  subtitle?: string;

  content?: string;

  imageUrl?: string;

  imagePrompt?: string;

  videoUrl?: string;

  badge?: string;

  price?: number;

  originalPrice?: number;

  discountRate?: number;

  crop?: string;

  tags?: string[];

  size: CardSize;

  backgroundColor?: string;

  textColor?: string;

  borderColor?: string;

  sortOrder: number;

  visible: boolean;
}

export interface BuilderPage {
  id: string;

  title: string;

  productName: string;

  companyName: string;

  cards: BuilderCard[];

  createdAt: string;

  updatedAt: string;
}