export type PhotoDoctorProductRule = {
  productKey: string;
  name: string;
  label: string;
  reason: string;
  href: string;
  priority: number;
  issueGroup: "pest" | "disease" | "organic" | "nutrition" | "growth";
  matchKeywords: string[];
  blockKeywords?: string[];
};

export const PHOTO_DOCTOR_PRODUCT_RULES: PhotoDoctorProductRule[] = [
  {
    productKey: "myeolgyuni",
    name: "멸규니",
    label: "병해·곰팡이성 증상 추천",
    reason:
      "과일썩음병, 탄저, 흰가루, 노균, 곰팡이성 병해가 의심될 때 우선 연결합니다.",
    href: "/expo/booth/4348fa3a-f0f5-4aa2-b680-eff71d8cc98f",
    priority: 300,
    issueGroup: "disease",
    matchKeywords: [
      "과일썩음병",
      "썩음",
      "부패",
      "검은 반점",
      "반점",
      "탄저",
      "흰가루",
      "노균",
      "잿빛",
      "곰팡이",
      "균",
      "병",
      "마름",
      "시들음",
    ],
  },
  {
    productKey: "ssakssuri",
    name: "싹쓰리충",
    label: "해충·흡즙성 피해 추천",
    reason:
      "총채벌레, 진딧물, 응애, 나방류 등 해충 피해가 의심될 때 연결합니다.",
    href: "/expo/booth/4348fa3a-f0f5-4aa2-b680-eff71d8cc98f",
    priority: 120,
    issueGroup: "pest",
    matchKeywords: [
      "총채",
      "진딧",
      "응애",
      "나방",
      "벌레",
      "해충",
      "흡즙",
      "갉아",
      "식흔",
      "가해",
      "잎말림",
      "충",
    ],
    blockKeywords: ["과일썩음병", "썩음", "부패", "곰팡이", "탄저", "노균", "흰가루"],
  },
  {
    productKey: "ssakssuri-gold",
    name: "싹쓰리충 골드",
    label: "유기농 해충 관리 추천",
    reason:
      "친환경·유기농 재배에서 해충 피해가 의심될 때 함께 검토합니다.",
    href: "/expo/booth/4348fa3a-f0f5-4aa2-b680-eff71d8cc98f",
    priority: 100,
    issueGroup: "organic",
    matchKeywords: [
      "총채",
      "진딧",
      "응애",
      "나방",
      "벌레",
      "해충",
      "친환경",
      "유기농",
    ],
    blockKeywords: ["과일썩음병", "썩음", "부패", "곰팡이", "탄저", "노균", "흰가루"],
  },
];