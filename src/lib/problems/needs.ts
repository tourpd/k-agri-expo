/**
 * 이달의 준비물 — 농자재뿐 아니라 농기구·묘종·설비까지
 *
 * 문제 페이지가 "지금 아픈 곳"이라면, 준비물은 "지금 사야 할 것"입니다.
 * 농기계·설비·육묘 기업이 들어오는 자리이기도 합니다.
 */
import type { CropKey } from "./catalog";

export type NeedCategory = "material" | "tool" | "seedling" | "facility";

export const NEED_CATEGORY_LABEL: Record<NeedCategory, { label: string; icon: string }> = {
  material: { label: "농자재", icon: "🧪" },
  tool: { label: "농기구", icon: "🧰" },
  seedling: { label: "묘종·종자", icon: "🌱" },
  facility: { label: "설비", icon: "🏗️" },
};

export type Need = {
  slug: string;
  title: string;
  category: NeedCategory;
  crops: CropKey[];
  /** 왜 지금 필요한가 */
  why: string;
  /** 고를 때 볼 것 3가지 */
  checklist: [string, string, string];
  productKeywords: string[];
  /** 연결된 문제 페이지 */
  relatedProblems: string[];
};

export const NEEDS: Need[] = [
  {
    slug: "greenhouse-heating",
    title: "하우스 난방기·온풍기",
    category: "facility",
    crops: ["strawberry", "tomato", "cucumber", "paprika", "melon", "leafy"],
    why: "11월 첫 한파 전에 시운전까지 끝내야 저온 피해를 막습니다.",
    checklist: ["하우스 면적 대비 열량(kcal)이 맞는지", "연료 종류와 월 연료비", "온도 센서 연동·알람이 되는지"],
    productKeywords: ["난방", "온풍기", "열풍기", "보일러", "히터"],
    relatedProblems: ["greenhouse-heating-prep", "cucumber-tomato-low-temp"],
  },
  {
    slug: "thermal-curtain",
    title: "보온커튼·다겹커튼·이중비닐",
    category: "facility",
    crops: ["strawberry", "tomato", "cucumber", "paprika", "leafy"],
    why: "난방비의 절반은 보온에서 결정됩니다. 찢어진 곳 한 군데가 하우스 전체를 식힙니다.",
    checklist: ["보온율(겹수)과 개폐 방식(수동·자동)", "결로가 커튼에 맺혀 떨어지는 구조인지", "설치 후 환기 동선이 막히지 않는지"],
    productKeywords: ["보온커튼", "다겹", "커튼", "이중비닐", "보온", "부직포"],
    relatedProblems: ["greenhouse-heating-prep", "greenhouse-condensation"],
  },
  {
    slug: "ventilation-humidity",
    title: "유동팬·환기·온습도 센서",
    category: "facility",
    crops: ["strawberry", "tomato", "cucumber", "paprika", "leafy"],
    why: "겨울 곰팡이병의 뿌리는 결로입니다. 공기를 돌리고 새벽 습도를 보는 장비가 약값을 줄입니다.",
    checklist: ["센서를 작물 높이에 둘 수 있는지, 휴대폰 알림이 되는지", "유동팬 대수(대략 100평당 1~2대)와 방향", "자동 개폐기와 연동되는지"],
    productKeywords: ["유동팬", "환기", "온습도", "센서", "스마트팜", "제습", "개폐기"],
    relatedProblems: ["greenhouse-condensation", "strawberry-powdery-gray", "cucumber-downy-mildew"],
  },
  {
    slug: "grafted-seedlings",
    title: "참외·수박·토마토 접목묘 예약",
    category: "seedling",
    crops: ["melon", "tomato", "cucumber"],
    why: "정식 40~50일 전에 예약해야 원하는 품종·대목을 받습니다. 늦으면 남는 묘를 받게 됩니다.",
    checklist: ["연작 밭이면 덩굴쪼김병·청고병 저항성 대목인지", "육묘장의 소독·바이러스 검사 여부", "인수 날짜와 활착 보증 조건"],
    productKeywords: ["접목묘", "육묘", "모종", "대목", "종묘", "육묘장"],
    relatedProblems: ["melon-seedling-prep"],
  },
  {
    slug: "pollinator-bees",
    title: "딸기·토마토 수정벌(뒤영벌·꿀벌)",
    category: "material",
    crops: ["strawberry", "tomato", "melon"],
    why: "첫 꽃 피기 전에 벌통이 들어가야 기형과 없이 첫 수확이 나옵니다.",
    checklist: ["하우스 면적당 벌통 수", "벌에 안전한 약제 목록을 함께 주는지", "추운 날 활동성(뒤영벌이 저온에 강함)"],
    productKeywords: ["뒤영벌", "꿀벌", "수정벌", "화분매개", "벌통"],
    relatedProblems: ["strawberry-bee-pollination", "strawberry-malformed"],
  },
  {
    slug: "sticky-traps",
    title: "끈끈이트랩·방충망",
    category: "material",
    crops: ["strawberry", "tomato", "cucumber", "paprika", "leafy"],
    why: "총채·가루이는 눈에 보일 때면 이미 늦습니다. 트랩이 가장 싼 예찰 장비입니다.",
    checklist: ["황색(가루이·진딧물)과 청색(총채) 구분", "작물 위 20cm에 걸 수 있는 크기", "출입구·측창 방충망 눈 크기(총채는 0.4mm 이하)"],
    productKeywords: ["끈끈이", "트랩", "방충망", "예찰", "황색", "청색"],
    relatedProblems: ["paprika-thrips-powdery", "tomato-cucumber-whitefly", "gochu-thrips"],
  },
  {
    slug: "soil-sterilize",
    title: "정식 전 토양 소독·토양개량",
    category: "material",
    crops: ["melon", "tomato", "cucumber", "strawberry"],
    why: "연작 하우스는 심기 전이 유일한 기회입니다. 심고 나면 토양병·염류는 손을 못 댑니다.",
    checklist: ["토양 검정 결과(EC·pH)를 먼저 받았는지", "태양열·담수·약제 소독 중 내 밭에 맞는 방법", "유기물·미생물 자재는 소독 뒤에 넣는지"],
    productKeywords: ["토양 소독", "토양개량", "유기물", "미생물", "EC", "염류", "퇴비"],
    relatedProblems: ["greenhouse-salt-ec", "garlic-black-mold", "melon-seedling-prep"],
  },
  {
    slug: "drip-irrigation",
    title: "점적 관수·양액 공급 장치",
    category: "facility",
    crops: ["strawberry", "tomato", "cucumber", "paprika", "melon"],
    why: "겨울엔 물을 '조금씩 자주' 줘야 열과·시듦이 줄어듭니다. 사람 손으로는 못 맞춥니다.",
    checklist: ["타이머·EC 제어가 되는지", "점적 간격이 재식 간격과 맞는지", "겨울철 지하수 온도(차가운 물은 뿌리를 식힘)"],
    productKeywords: ["점적", "관수", "양액", "타이머", "관비", "호스"],
    relatedProblems: ["tomato-cracking", "citrus-cracking", "cucumber-tomato-low-temp"],
  },
  {
    slug: "led-supplement",
    title: "보광 LED·보광등",
    category: "facility",
    crops: ["strawberry", "tomato", "cucumber", "paprika", "leafy"],
    why: "12~1월 일조가 가장 짧을 때 착과와 당도가 떨어집니다. 보광은 투자 대비 효과를 따져야 합니다.",
    checklist: ["작물에 맞는 파장과 광량(PPFD)", "전기 용량과 월 전기료", "설치 높이와 그림자"],
    productKeywords: ["LED", "보광", "광원", "식물등"],
    relatedProblems: ["cucumber-tomato-low-temp", "apple-coloring"],
  },
  {
    slug: "sprayer",
    title: "분무기·방제기",
    category: "tool",
    crops: ["strawberry", "tomato", "cucumber", "paprika", "gochu", "apple"],
    why: "잎 뒷면까지 닿지 않으면 응애·가루이는 안 죽습니다. 장비가 약효의 절반입니다.",
    checklist: ["잎 뒷면까지 미세하게 닿는 노즐인지", "하우스 길이에 맞는 호스·배터리 용량", "세척이 쉬운지(약제 섞임 방지)"],
    productKeywords: ["분무기", "방제기", "동력분무", "충전식", "연무기", "노즐"],
    relatedProblems: ["strawberry-mite", "tomato-cucumber-whitefly", "gochu-anthracnose"],
  },
  {
    slug: "pruning-tools",
    title: "전정가위·적엽 도구·결속기",
    category: "tool",
    crops: ["apple", "tomato", "cucumber", "paprika", "citrus"],
    why: "겨울 전정과 시설 적엽은 매일 하는 일입니다. 손이 덜 가는 도구가 인건비입니다.",
    checklist: ["전동인지 수동인지, 손 크기에 맞는지", "날 교체가 쉬운지", "소독이 쉬운지(병 전염 방지)"],
    productKeywords: ["전정가위", "전동가위", "적엽", "결속기", "유인", "가위"],
    relatedProblems: ["apple-postharvest", "strawberry-powdery-gray"],
  },
  {
    slug: "mulch-film",
    title: "멀칭 필름·부직포·피복재",
    category: "material",
    crops: ["garlic", "onion", "strawberry", "melon", "leafy"],
    why: "노지는 월동 피복, 시설은 지온 유지와 결로 억제. 지금 깔아야 효과가 있습니다.",
    checklist: ["생분해·일반 중 수거 계획", "두께와 폭이 두둑에 맞는지", "투습·보온 성능"],
    productKeywords: ["멀칭", "부직포", "피복", "비닐", "생분해"],
    relatedProblems: ["garlic-onion-overwinter", "greenhouse-condensation", "cucumber-tomato-low-temp"],
  },
];

export function getNeed(slug: string): Need | null {
  return NEEDS.find((n) => n.slug === slug) ?? null;
}

export function needsByCrop(crop: CropKey): Need[] {
  return NEEDS.filter((n) => n.crops.includes(crop));
}
