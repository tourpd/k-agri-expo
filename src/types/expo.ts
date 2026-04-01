export type AudienceType = "all" | "farmer" | "vendor" | "buyer";

export type HeroTargetType =
  | "event"
  | "deal"
  | "booth"
  | "live"
  | "external"
  | "crm_form";

export interface HeroItem {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  buttonText: string;
  secondaryButtonText?: string | null;
  targetType: HeroTargetType;
  targetId?: string | null;
  targetUrl?: string | null;
  audienceType: AudienceType;
  isActive: boolean;
  priority: number;
  startAt?: string | null;
  endAt?: string | null;
}

export interface ActionItem {
  key: string;
  title: string;
  description: string;
  href: string;
  icon?: string;
}

export interface ExploreGroup {
  key: string;
  title: string;
  items: {
    label: string;
    href: string;
  }[];
}

export interface ExpoStats {
  todayConsultCount: number;
  hotLeadCount: number;
  liveNowCount: number;
  endingDealsCount: number;
}

export interface KATVVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  href: string;
  boothHref?: string | null;
}

export interface ExpoHomeData {
  heroItems: HeroItem[];
  actions: ActionItem[];
  explore: ExploreGroup[];
  stats: ExpoStats;
  recommendedVideos: KATVVideo[];
}