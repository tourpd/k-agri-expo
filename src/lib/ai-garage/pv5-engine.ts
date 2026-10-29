export interface UserProfile {
  dream: string;
  people?: string;
  budget?: string;
  hobby?: string;
  work?: string;
}

export interface DesignResult {
  vehicle: string;
  concept: string;
  summary: string;
  life_analysis: {
    work: string[];
    hobbies: string[];
    companions: string[];
    desires: string[];
  };
  vehicle_scores: Record<string, number>;
  modules: {
    name: string;
    reason: string;
    price: number;
  }[];
  estimate: {
    vehicle_price: number;
    module_total: number;
    build_labor: number;
    total: number;
  };
  build_time: string;
  image_prompts: string[];
  story_title: string;
  sales_message: string;
}

const VEHICLES = {
  passenger: {
    model: "PV5 Passenger",
    price: 45000000,
    keywords: ["가족", "부부", "여행", "아이", "부모님", "병원"],
  },
  cargo: {
    model: "PV5 Cargo",
    price: 50000000,
    keywords: ["짐", "수납", "장비", "운반", "비즈니스"],
  },
  highroof: {
    model: "PV5 Cargo High Roof",
    price: 53000000,
    keywords: ["유튜브", "촬영", "편집", "사무실", "차박", "캠핑", "숙박", "방송"],
  },
  openbed: {
    model: "PV5 Openbed",
    price: 52000000,
    keywords: ["농장", "농사", "과수", "낚시", "작업", "농자재", "현장"],
  },
  wav: {
    model: "PV5 WAV",
    price: 61000000,
    keywords: ["휠체어", "복지", "병원", "케어", "보호자"],
  },
};

const MODULES = [
  { name: "2인 침대", keywords: ["부부", "차박", "숙박", "여행", "캠핑"], price: 1200000 },
  { name: "편집 데스크", keywords: ["유튜브", "촬영", "편집", "방송", "사무실"], price: 850000 },
  { name: "촬영장비 수납", keywords: ["유튜브", "촬영", "카메라", "방송"], price: 900000 },
  { name: "차량용 냉장고", keywords: ["여행", "캠핑", "차박", "음식", "커피", "낚시"], price: 300000 },
  { name: "인산철 배터리", keywords: ["전기", "촬영", "편집", "냉장고", "캠핑", "차박"], price: 1800000 },
  { name: "태양광 충전", keywords: ["캠핑", "차박", "장기", "전국", "농장"], price: 1200000 },
  { name: "외부 어닝", keywords: ["캠핑", "낚시", "농장", "커피", "휴식"], price: 900000 },
  { name: "농자재 적재함", keywords: ["농장", "농사", "농자재", "과수", "작업"], price: 1000000 },
  { name: "낚시 장비 랙", keywords: ["낚시", "바다", "로드", "장비"], price: 750000 },
  { name: "커피바", keywords: ["커피", "아내", "휴식", "여행"], price: 700000 },
];

function textOf(profile: UserProfile) {
  return [profile.dream, profile.people, profile.budget, profile.hobby, profile.work]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreVehicle(text: string) {
  const scores: Record<string, number> = {};

  for (const [key, vehicle] of Object.entries(VEHICLES)) {
    scores[vehicle.model] = 0;
    for (const k of vehicle.keywords) {
      if (text.includes(k)) scores[vehicle.model] += 10;
    }
  }

  if (text.includes("아내") || text.includes("부부")) {
    scores["PV5 Passenger"] += 8;
    scores["PV5 Cargo High Roof"] += 8;
  }

  if (text.includes("전국") || text.includes("장거리")) {
    scores["PV5 Cargo High Roof"] += 10;
  }

  if (text.includes("농") && text.includes("촬영")) {
    scores["PV5 Cargo High Roof"] += 15;
    scores["PV5 Openbed"] += 10;
  }

  return scores;
}

function pickVehicle(scores: Record<string, number>) {
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function pickModules(text: string) {
  const picked = MODULES.filter((m) =>
    m.keywords.some((k) => text.includes(k))
  );

  if (!picked.find((m) => m.name === "차량용 냉장고")) {
    picked.push(MODULES.find((m) => m.name === "차량용 냉장고")!);
  }

  if (!picked.find((m) => m.name === "인산철 배터리")) {
    picked.push(MODULES.find((m) => m.name === "인산철 배터리")!);
  }

  return picked.map((m) => ({
    name: m.name,
    reason: `"${m.keywords.find((k) => text.includes(k)) || "기본 생활"}" 목적에 필요`,
    price: m.price,
  }));
}

function vehiclePrice(model: string) {
  return Object.values(VEHICLES).find((v) => v.model === model)?.price || 50000000;
}

function analyzeText(text: string) {
  return {
    work: ["농장", "농사", "촬영", "방송", "유튜브", "작업"].filter((x) => text.includes(x)),
    hobbies: ["캠핑", "차박", "낚시", "여행", "커피"].filter((x) => text.includes(x)),
    companions: ["아내", "부부", "아이", "부모님", "반려견", "강아지"].filter((x) => text.includes(x)),
    desires: ["전국", "휴식", "이동", "촬영", "숙박", "편집"].filter((x) => text.includes(x)),
  };
}

export function generateDesign(profile: UserProfile): DesignResult {
  const text = textOf(profile);
  const scores = scoreVehicle(text);
  const vehicle = pickVehicle(scores);
  const modules = pickModules(text);

  const vehicle_price = vehiclePrice(vehicle);
  const module_total = modules.reduce((sum, m) => sum + m.price, 0);
  const build_labor = Math.round(module_total * 0.55);
  const total = vehicle_price + module_total + build_labor;

  const life = analyzeText(text);

  const concept =
    vehicle.includes("High Roof")
      ? "이동형 방송국"
      : vehicle.includes("Openbed")
      ? "농업·아웃도어 워크캠프"
      : vehicle.includes("WAV")
      ? "케어 모빌리티"
      : "라이프스타일 투어링";

  return {
    vehicle,
    concept,
    summary: `${vehicle} 기반으로 ${concept} 설계를 추천합니다. 사용자의 삶과 목적을 기준으로 차량, 모듈, 비용을 계산했습니다.`,
    life_analysis: life,
    vehicle_scores: scores,
    modules,
    estimate: {
      vehicle_price,
      module_total,
      build_labor,
      total,
    },
    build_time: "4~7주",
    image_prompts: [
      `${vehicle}, ${concept}, Korean countryside, photorealistic exterior, practical converted vehicle`,
      `${vehicle} interior, ${modules.map((m) => m.name).join(", ")}, realistic compact layout`,
      `Korean lifestyle scene, ${profile.dream}, cinematic documentary style`,
    ],
    story_title: `${concept} — ${profile.dream}`,
    sales_message: `이 설계는 단순 차량 추천이 아니라 "${profile.dream}"을 실제 PV5 공간으로 구현하는 제안입니다. 다음 단계는 상봉기아 상담 견적입니다.`,
  };
}
