export type HallLayout = {
  hallId: string;
  title: string;
  // ex) A01~A30 같은 슬롯 목록
  slots: string[];
  // grid 컬럼 수(지도처럼 보이게)
  cols: number;
};

function range(n: number) {
  return Array.from({ length: n }, (_, i) => i + 1);
}

function makeSlots(prefix: string, count: number) {
  // A01, A02 ... A30
  return range(count).map((i) => `${prefix}${String(i).padStart(2, "0")}`);
}

export const HALL_LAYOUTS: Record<string, HallLayout> = {
  "agri-inputs": {
    hallId: "agri-inputs",
    title: "농자재관",
    slots: makeSlots("A", 30),
    cols: 6, // 6x5 그리드
  },
  machinery: {
    hallId: "machinery",
    title: "농기계관",
    slots: makeSlots("B", 30),
    cols: 6,
  },
  smartfarm: {
    hallId: "smartfarm",
    title: "스마트팜관",
    slots: makeSlots("C", 24),
    cols: 6,
  },
  seeds: {
    hallId: "seeds",
    title: "종자관",
    slots: makeSlots("D", 24),
    cols: 6,
  },
};

/**
 * 엑스포 전시관 목록 (한 곳에서 관리)
 *
 * - 홈의 전시관 카드, /expo/hall 목록 화면이 함께 씁니다.
 * - href는 실제로 있는 화면만 가리킵니다.
 * - dbHallIds: 입점 신청·부스 자리(hall_booth_slots)에서 쓰는 전시관 코드
 *   (기업이 신청할 때 고르는 전시관과 같아야 부스가 그 관에 보입니다)
 */
export type ExpoHall = {
  key: string;
  icon: string;
  title: string;
  desc: string;
  href: string;
  cta: string;
  dbHallIds: string[];
};

export const EXPO_HALL_LIST: ExpoHall[] = [
  {
    key: "crop-nutrition",
    icon: "🌱",
    title: "작물영양관",
    desc: "비대 · 활력 · 뿌리 · 회복 · 칼슘 솔루션",
    href: "/expo/halls/crop-nutrition",
    cta: "작물영양관 입장",
    dbHallIds: [],
  },
  {
    key: "agri-inputs",
    icon: "🐛",
    title: "농자재·병해충관",
    desc: "비료 · 영양제 · 병해충 관리 자재",
    href: "/expo/hall/agri-inputs",
    cta: "농자재관 입장",
    dbHallIds: ["agri-inputs", "agri_inputs"],
  },
  {
    key: "machines",
    icon: "🚜",
    title: "농기계·장비관",
    desc: "농기계 · 드론 · 자동화 장비",
    href: "/expo/hall/machines",
    cta: "농기계관 입장",
    dbHallIds: ["machines", "machinery"],
  },
  {
    key: "seeds",
    icon: "🌾",
    title: "종자·묘종관",
    desc: "종자 · 모종 · 육묘기술",
    href: "/expo/hall/seeds",
    cta: "종자관 입장",
    dbHallIds: ["seeds", "seed", "seeds_seedlings"],
  },
  {
    key: "smartfarm",
    icon: "📱",
    title: "스마트팜관",
    desc: "센서 · 제어 · 스마트팜 장비",
    href: "/expo/hall/smartfarm",
    cta: "스마트팜관 입장",
    dbHallIds: ["smartfarm", "smart-farm", "smart_farm"],
  },
  {
    key: "eco-friendly",
    icon: "♻️",
    title: "친환경관",
    desc: "친환경 병해충 · 유기농 자재",
    href: "/expo/hall/eco-friendly",
    cta: "친환경관 입장",
    dbHallIds: ["eco-friendly", "eco-inputs", "eco_friendly"],
  },
  {
    key: "future-food",
    icon: "🦗",
    title: "미래식량·곤충관",
    desc: "곤충 · 기능성식품 · 대체단백",
    href: "/expo/future-food",
    cta: "미래식량관 입장",
    dbHallIds: ["future-insect", "future_insect"],
  },
];

/**
 * 부스 공개 여부 (전시관·부스 목록·부스 상세가 같은 기준을 쓰도록)
 *
 * 예전에는 화면마다 기준이 달라서, 전시관에는 보이는 부스가
 * 부스 목록에는 안 보이고 상세에서는 "공개 준비 중"으로 막혔습니다.
 */
const BLOCKED_BOOTH_STATUS = ["rejected", "hidden", "deleted", "suspended", "inactive", "closed"];
export const PUBLIC_BOOTH_STATUS = ["published", "active", "live", "approved"];

export function isBoothPublic(booth: {
  status?: string | null;
  is_public?: boolean | null;
  is_published?: boolean | null;
}): boolean {
  const status = String(booth?.status ?? "").trim().toLowerCase();
  if (BLOCKED_BOOTH_STATUS.includes(status)) return false;
  if (booth?.is_published === false && booth?.is_public === false) return false;
  return (
    booth?.is_published === true ||
    booth?.is_public === true ||
    PUBLIC_BOOTH_STATUS.includes(status)
  );
}

/** Supabase 조회용 같은 기준 (or 필터) */
export const PUBLIC_BOOTH_OR_FILTER = `is_published.eq.true,is_public.eq.true,status.in.(${PUBLIC_BOOTH_STATUS.join(",")})`;
