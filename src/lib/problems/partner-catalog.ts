/**
 * 참여 기업 카탈로그 (코드 안 자료)
 *
 * 기업이 아직 DB에 제품을 등록하지 않았을 때, 대표님이 받은 카탈로그에서 확인한 제품을 문제 페이지·계산기에 붙입니다.
 * - 숫자(희석배수·사용량·시기)는 카탈로그 문구 그대로. 지어내지 않습니다. 출처(연도·쪽)를 같이 둡니다.
 * - DB에 등록된 제품이 있으면 그쪽이 먼저고, 이 표는 빈칸을 채우는 용도입니다.
 * - 1차: (주)도프 2025 카탈로그(161쪽) 글자 인식 → 사용량까지 확인된 23개 제품.
 */
import type { CropKey } from "./catalog";
import wasungRaw from "@/data/partners/wasung.json";

export type DoseRule =
  | {
      kind: "dilution";
      /** 1,000배 → 1000. 범위면 ratio(진하게)~ratioMax(묽게) */
      ratio: number;
      ratioMax?: number;
      method: "엽면" | "관주" | "살포" | "침지";
      /** 어떤 작물군에 해당하는지 (없으면 전체) */
      crops?: string;
      note?: string;
    }
  | {
      kind: "perArea";
      /** 이 양을 */
      amount: number;
      unit: "ml" | "L" | "g" | "kg";
      /** 이 평수에 */
      areaPyeong: number;
      /** 이 물에 타서 (없으면 토양 살포 등) */
      waterL?: number;
      method: "엽면" | "관주" | "살포" | "토양";
      crops?: string;
      note?: string;
    }
  | { kind: "text"; text: string };

export type PartnerProduct = {
  id: string;
  company: PartnerCompanyKey;
  name: string;
  group: string;
  /** 포장 단위 (ml 또는 g 환산). 병 수 계산용 */
  packages: Array<{ label: string; ml?: number; g?: number }>;
  feature: string;
  ingredients?: string;
  /** 카탈로그에 적힌 대상작물 */
  crops: string[];
  cropKeys: CropKey[];
  uses: string[];
  /** 연결되는 문제 slug (앞에 있을수록 우선) */
  problems: string[];
  doses: DoseRule[];
  timing: string;
  cautions?: string[];
  /** 유기농업자재 공시번호 (있으면 친환경 자재) */
  organicCertNo?: string;
  source: { label: string; page: number };
  /** 기업 제품 소개 주소 (없으면 회사 홈) */
  href?: string;
  /** 온라인 판매 가능 여부 (농약은 불가) */
  sellable: boolean;
  /** 쿠팡 상품 고정 (검색 1순위가 엉뚱할 때). productId만 있으면 파트너스 딥링크로 변환 */
  coupang?: { productId: number; itemId?: number; vendorItemId?: number; label?: string; priceKrw?: number };
};

export type PartnerCompanyKey = "dof" | "wasung";

export const PARTNER_COMPANIES: Record<PartnerCompanyKey, { name: string; phone: string; homepage: string; catalogLabel: string }> = {
  dof: {
    name: "도프",
    phone: "031-683-2444",
    homepage: "https://www.dofagro.com/dof/main/main.html",
    catalogLabel: "도프 2025 카탈로그",
  },
  // 전화번호는 매거진에 없어 비워 둠 → 번호가 비면 전화 버튼이 안 뜨고 '문의 남기기'만 보입니다. 대표님이 알려 주시면 채움.
  wasung: {
    name: "와성원예",
    phone: "",
    homepage: "",
    catalogLabel: "와성원예 교육용 매거진(2026)",
  },
};

const SRC = (page: number) => ({ label: PARTNER_COMPANIES.dof.catalogLabel, page });

/** 와성원예(웨스트브릿지 한국 총판) — 매거진 본문에서 추출(106개, 사용량 있는 것 99개). 자료: src/data/partners/wasung.json */
const WASUNG_PRODUCTS = (wasungRaw as unknown as Array<PartnerProduct & { confidence?: string }>).map(({ confidence: _c, ...p }) => p as PartnerProduct);

const DOF_PRODUCTS: PartnerProduct[] = [
  {
    id: "dof-ssakssuri-chung",
    company: "dof",
    name: "싹쓰리-충",
    group: "친환경 해충 방어제",
    packages: [{ label: "500ml", ml: 500 }],
    feature: "식물추출물로 만든 진딧물·담배거세미나방·파밤나방 전용 해충방제제",
    ingredients: "고삼 뿌리·할미꽃·유칼립투스·백리향 추출물, 살리실산 등",
    crops: ["포도", "오이", "딸기", "참외", "수박", "고추", "토마토", "배추", "벼", "파", "마늘", "양파"],
    cropKeys: ["gochu", "tomato", "cucumber", "strawberry", "melon", "cabbage", "rice", "garlic", "onion"],
    uses: ["진딧물", "담배거세미나방", "파밤나방", "나방류·흡즙해충"],
    problems: ["gochu-aphid-virus", "tomato-cucumber-whitefly"],
    doses: [
      { kind: "perArea", amount: 500, unit: "ml", areaPyeong: 750, waterL: 500, method: "엽면", crops: "과채류(고추·토마토·오이·딸기·참외·수박·포도)" },
      { kind: "perArea", amount: 500, unit: "ml", areaPyeong: 1000, waterL: 500, method: "엽면", crops: "배추·벼·파·마늘·양파" },
    ],
    timing: "생육 초기부터 수확기까지, 발생 초기에 2회",
    cautions: ["농약·비료와 혼용 가능하나 소면적 시험 후 사용", "살포 시 보호장구 착용, 바람을 등지고 살포", "사용 전 흔들어 주세요"],
    source: SRC(134),
    sellable: true,
  },
  {
    id: "dof-ssakssuri-i",
    company: "dof",
    name: "싹쓰리-I",
    group: "친환경 해충 방어제",
    packages: [{ label: "500ml", ml: 500 }],
    feature: "식물추출물로 만든 응애 전용 해충방제제",
    ingredients: "고삼 뿌리·할미꽃·유칼립투스·백리향 추출물, 살리실산 등",
    crops: ["감귤", "사과", "배", "포도", "딸기", "고추", "오이", "토마토", "수박"],
    cropKeys: ["citrus", "apple", "strawberry", "gochu", "cucumber", "tomato"],
    uses: ["응애"],
    problems: ["strawberry-mite"],
    doses: [
      { kind: "perArea", amount: 500, unit: "ml", areaPyeong: 600, waterL: 500, method: "엽면", crops: "과수류(감귤·사과·배·포도)" },
      { kind: "perArea", amount: 500, unit: "ml", areaPyeong: 1000, waterL: 500, method: "엽면", crops: "과채류(딸기·고추·오이·토마토·수박)" },
    ],
    timing: "생육 초기부터 수확기까지, 발생 초기",
    cautions: ["소면적 시험 후 사용", "살포 시 보호장구 착용"],
    source: SRC(134),
    sellable: true,
  },
  {
    id: "dof-jinjabi-gold",
    company: "dof",
    name: "진자비골드",
    group: "친환경 해충 방어제",
    packages: [{ label: "500ml", ml: 500 }, { label: "2L", ml: 2000 }],
    feature: "응애·총채벌레·혹명나방에 쓰는 식물추출물 해충방제용 유기자재",
    ingredients: "고삼뿌리 추출물(마트린), 할미꽃 추출물(사포닌), 백리향 추출물(티몰), 허브 오일류",
    crops: ["감귤", "사과", "배", "포도", "딸기", "오이", "고추", "수박", "가지", "배추", "벼"],
    cropKeys: ["citrus", "apple", "strawberry", "cucumber", "gochu", "paprika", "cabbage", "rice"],
    uses: ["응애(귤응애·점박이응애)", "꽃노랑총채벌레", "총채벌레", "진딧물", "담배나방", "배추좀나방", "혹명나방", "멸구"],
    problems: ["gochu-thrips", "paprika-thrips-powdery", "strawberry-mite"],
    doses: [
      { kind: "dilution", ratio: 1000, method: "엽면", note: "물 20L당 20ml. 밀도 높으면 500배(20L당 40ml까지). 딸기는 반드시 1,000배" },
      { kind: "perArea", amount: 500, unit: "ml", areaPyeong: 750, method: "엽면", note: "500ml로 600~900평" },
    ],
    timing: "응애는 한 잎에 2~3마리 보일 때, 그 외 발생 초기. 7~10일 간격 2~3회",
    cautions: ["4회 이상 연용 금지", "1회 최대 40ml/20L", "침투확산제(스피드업) 혼용 권장"],
    organicCertNo: "공시 2-5-275",
    source: SRC(132),
    sellable: true,
  },
  {
    id: "dof-bakmyeol-king",
    company: "dof",
    name: "박멸킹",
    group: "친환경 해충 방어제",
    packages: [{ label: "3kg", g: 3000 }],
    feature: "토양에 뿌리는 해충방제제 — 총채벌레·잎굴파리·작은뿌리파리의 땅속 생활사를 끊습니다",
    ingredients: "님오일, 마트린, 사포닌, 바실러스 계열 미생물",
    crops: ["오이", "고추", "딸기", "호박", "가지", "수박", "메론", "참외", "파", "쪽파", "상추", "양파", "마늘", "배추"],
    cropKeys: ["cucumber", "gochu", "strawberry", "paprika", "melon", "leafy", "onion", "garlic", "cabbage"],
    uses: ["총채벌레(토양 경유 차단)", "작은뿌리파리", "잎굴파리", "뿌리응애", "뿌리혹선충", "연작장해 예방"],
    problems: ["gochu-thrips", "paprika-thrips-powdery"],
    doses: [{ kind: "perArea", amount: 3, unit: "kg", areaPyeong: 300, method: "토양", note: "두둑 처리 또는 토양 혼화. 물에 희석하지 않음, 처리 후 관수" }],
    timing: "정식 전 또는 정식 후",
    cautions: ["물에 희석 금지", "처리 후 관수"],
    source: SRC(135),
    sellable: true,
  },
  {
    id: "dof-myeolgyuni",
    company: "dof",
    name: "멸규니",
    group: "친환경 병균 방어제",
    packages: [{ label: "500ml", ml: 500 }, { label: "2L", ml: 2000 }],
    feature: "잿빛곰팡이·탄저병·도열병·균핵병에 쓰는 병해방제용 유기자재",
    ingredients: "대황뿌리 추출물, 황련뿌리 추출물, 백리향 추출물, 허브 오일류",
    crops: ["감귤", "사과", "포도", "감", "딸기", "오이", "고추", "수박", "토마토", "마늘", "양파", "벼"],
    cropKeys: ["citrus", "apple", "strawberry", "cucumber", "gochu", "tomato", "garlic", "onion", "rice", "leafy"],
    uses: ["잿빛곰팡이병", "탄저병", "더뎅이병", "둥근무늬낙엽병", "흰가루병", "노균병", "덩굴마름병", "균핵병", "도열병"],
    problems: ["gochu-anthracnose", "strawberry-powdery-gray", "onion-downy-mildew", "cucumber-downy-mildew", "leafy-downy-sclerotinia"],
    doses: [
      { kind: "dilution", ratio: 1000, method: "엽면", note: "물 20L당 20ml. 밀도 높으면 500배(20L당 40ml까지)" },
      { kind: "perArea", amount: 500, unit: "ml", areaPyeong: 750, method: "엽면", note: "500ml로 600~900평" },
    ],
    timing: "발병 초기, 10~15일 간격 2~3회, 예방 위주",
    cautions: ["늦은 오후 살포", "1회 최대 40ml/20L", "침투확산제 혼용 권장"],
    organicCertNo: "공시 2-4-232",
    source: SRC(138),
    sellable: true,
  },
  {
    id: "dof-ssakssuri-all",
    company: "dof",
    name: "싹쓰리올",
    group: "친환경 병균 방어제",
    packages: [{ label: "500ml", ml: 500 }],
    feature: "흰가루·잿빛곰팡이·탄저병 등 여러 병해에 쓰는 종합 항균제",
    ingredients: "수산화구리, 수산화아연, 대황·황련 추출물, 킬레이트제",
    crops: ["감귤", "포도", "복숭아", "오이", "딸기", "고추", "토마토", "사과", "수박", "인삼", "양파", "감", "벼"],
    cropKeys: ["citrus", "cucumber", "strawberry", "gochu", "tomato", "apple", "onion", "rice", "paprika"],
    uses: ["흰가루병", "잿빛곰팡이병", "탄저병", "지상부 병해 종합"],
    problems: ["strawberry-powdery-gray", "gochu-anthracnose", "paprika-thrips-powdery"],
    doses: [{ kind: "dilution", ratio: 500, ratioMax: 1000, method: "엽면", note: "드론 살포 가능" }],
    timing: "생육 초기부터 수확기까지 경엽처리",
    source: SRC(140),
    sellable: true,
  },
  {
    id: "dof-ssakssuri-soil",
    company: "dof",
    name: "싹쓰리쏘일",
    group: "친환경 병균 방어제",
    packages: [{ label: "2L", ml: 2000 }],
    feature: "뿌리썩음병 등 토양에서 오는 병에서 작물을 보호하는 관주용 항균제",
    crops: ["수박", "메론", "고추", "토마토", "상추", "무", "마늘", "양파", "파"],
    cropKeys: ["melon", "gochu", "tomato", "leafy", "garlic", "onion"],
    uses: ["뿌리썩음병 등 토양 기인 병해", "지하부 생육 관리"],
    problems: ["garlic-black-mold", "common-sudden-wilt"],
    doses: [{ kind: "perArea", amount: 2, unit: "L", areaPyeong: 600, method: "관주" }],
    timing: "생육 초기부터 수확기까지 관주",
    source: SRC(140),
    sellable: true,
  },
  {
    id: "dof-oxygen",
    company: "dof",
    name: "옥시겐",
    group: "친환경 병균 방어제",
    packages: [{ label: "500ml", ml: 500 }],
    feature: "시설하우스·관수 자재·작물을 넓게 살균 소독 (안정화 과산화수소 + 나노 은)",
    crops: ["시설하우스 전반"],
    cropKeys: ["common", "strawberry", "tomato", "cucumber", "paprika", "melon", "leafy"],
    uses: ["관수·양액 수질 살균", "하우스 공기 정화(연무)", "점적호스 바이오필름 제거", "장비 소독"],
    problems: ["greenhouse-condensation", "garlic-black-mold"],
    doses: [
      { kind: "dilution", ratio: 5000, method: "관주", crops: "수질 관리(급수 시 3~4일 간격)" },
      { kind: "dilution", ratio: 2000, method: "살포", crops: "하우스 공기(연무)" },
      { kind: "dilution", ratio: 50, method: "침지", crops: "장비 소독 15분" },
    ],
    timing: "수질: 급수 시 3~4일 간격 / 공기: 연무 / 장비: 15분 침지",
    source: SRC(141),
    sellable: true,
  },
  {
    id: "dof-rustout",
    company: "dof",
    name: "러스아웃",
    group: "친환경 병균 방어제",
    packages: [{ label: "500ml", ml: 500 }],
    feature: "키토산·버섯추출물로 만든 바이러스 저항성 증진제",
    ingredients: "프로테오글리칸(버섯추출물), 키토산",
    crops: ["전작물(파프리카·장미 제외)"],
    cropKeys: ["gochu", "tomato", "cucumber", "strawberry", "melon", "common"],
    uses: ["바이러스성 생리장애 억제", "바이러스 저항성·면역 증진"],
    problems: ["gochu-aphid-virus"],
    doses: [
      { kind: "dilution", ratio: 500, ratioMax: 1000, method: "엽면", note: "5~7일 간격 2~3회" },
      { kind: "perArea", amount: 500, unit: "ml", areaPyeong: 100, method: "관주", note: "7일 간격 2~3회" },
    ],
    timing: "전 생육기, 특히 병해 발생 초기",
    cautions: ["파프리카·장미에는 사용하지 않음", "아미노산제와 혼용 시 효과적"],
    source: SRC(137),
    sellable: true,
  },
  {
    id: "dof-antibacter-ca",
    company: "dof",
    name: "안티박터-칼슘",
    group: "칼슘제",
    packages: [{ label: "500g", g: 500 }],
    feature: "작물에 방부제 역할을 하는 부패 방지용 유기칼슘제 (킬레이트 칼슘 26%, 붕소 2.5%)",
    crops: ["사과", "배", "감귤", "포도", "복숭아", "딸기", "고추", "토마토", "오이", "수박", "배추", "무", "양파", "마늘"],
    cropKeys: ["apple", "citrus", "strawberry", "gochu", "tomato", "cucumber", "cabbage", "onion", "garlic"],
    uses: ["부패 방지·저장성", "세균·곰팡이 침입 억제", "칼슘 결핍(잎끝 타기·배꼽썩음)", "세포벽 강화"],
    problems: ["cabbage-soft-rot", "tomato-cracking", "citrus-cracking"],
    doses: [{ kind: "dilution", ratio: 500, ratioMax: 1000, method: "엽면", note: "20~40g/1말(20L)" }],
    timing: "과수: 수확 60일 전부터 7~10일 간격 2~4회 / 과채: 수확 14일 전 5~7일 간격 2회 / 채소: 수확 20일 전부터 7~10일 간격 2~3회",
    source: SRC(110),
    sellable: true,
  },
  {
    id: "dof-ami65",
    company: "dof",
    name: "아미65",
    group: "아미노산제",
    // 카탈로그는 500ml·2L, 쿠팡(농사마트)은 1L 40,000원 → 세 규격 다 둠
    packages: [{ label: "1L", ml: 1000 }, { label: "500ml", ml: 500 }, { label: "2L", ml: 2000 }],
    coupang: { productId: 9711874004, itemId: 29058030935, vendorItemId: 95984566038, label: "1L", priceKrw: 40000 },
    feature: "총 아미노산 65%. 저온·고온·일조 부족으로 생육이 처질 때 빠른 회복",
    ingredients: "총 아미노산 65% (유리아미노산 40%, 펩타이드 25%)",
    crops: ["딸기", "오이", "토마토", "호박", "고추", "수박", "메론", "상추", "깻잎", "배추", "마늘", "양파", "감자", "포도", "배", "사과", "복숭아", "감귤", "벼"],
    cropKeys: ["strawberry", "cucumber", "tomato", "gochu", "melon", "leafy", "cabbage", "garlic", "onion", "apple", "citrus", "rice", "paprika"],
    uses: ["저온·고온·일조부족 스트레스 회복", "활력 증진", "뿌리 활착", "개화·착과·비대기 영양 보충", "수세 회복"],
    problems: ["cucumber-tomato-low-temp", "tomato-cracking", "citrus-cracking", "apple-postharvest", "garlic-rooting", "garlic-onion-overwinter"],
    doses: [
      { kind: "dilution", ratio: 1000, method: "엽면", note: "20ml/1말(20L). 생육 단계마다 1회 또는 7일 간격 2~3회" },
      { kind: "perArea", amount: 1, unit: "L", areaPyeong: 300, method: "관주", note: "5~7일 간격 2회" },
    ],
    timing: "육묘기·뿌리활착기·개화 전후·착과 후·비대기, 생육 부진·스트레스 때",
    cautions: ["권장량보다 진하게 쓰면 오히려 생육이 억제될 수 있음", "점도가 있어 저온 보관 피하기"],
    source: SRC(93),
    href: "https://www.dofagro.com/dof/product/view.html?uid=141&category=00030005000000000000",
    sellable: true,
  },
  {
    id: "dof-naengout",
    company: "dof",
    name: "냉아웃",
    group: "냉해예방제",
    packages: [{ label: "1L", ml: 1000 }],
    feature: "세포막을 보호하고 수분 증산을 억제해 저온·냉해를 예방",
    crops: ["전작물"],
    cropKeys: ["common", "cucumber", "tomato", "strawberry", "gochu", "melon", "paprika", "leafy", "garlic", "onion"],
    uses: ["저온 스트레스", "냉해·서리 피해 예방", "꽃샘추위"],
    problems: ["cucumber-tomato-low-temp", "greenhouse-heating-prep"],
    doses: [{ kind: "dilution", ratio: 500, method: "엽면" }],
    timing: "저온 피해가 예상될 때 미리 (3~4일 뒤 내성, 7~8일 유효). 추가 살포는 7~10일 간격",
    cautions: ["피해를 입은 뒤 회복은 리카바 권장"],
    source: SRC(83),
    sellable: true,
  },
  {
    id: "dof-yeomdown-liquid",
    company: "dof",
    name: "염다운리퀴드",
    group: "염류경감제",
    packages: [{ label: "10L", ml: 10000 }],
    feature: "재배 중에 쓰는 염류 피해 경감제(관주용). 불용성 염을 가용화",
    ingredients: "킬레이트제 10%, 휴믹산 10%, 발근제 4%, 유기산 1%",
    crops: ["딸기", "토마토", "수박", "오이", "고추", "참외", "호박", "마늘", "양파", "당근", "생강", "상추", "부추", "깻잎", "인삼"],
    cropKeys: ["strawberry", "tomato", "cucumber", "gochu", "melon", "garlic", "onion", "leafy", "paprika"],
    uses: ["토양 염류장해 경감", "불용성 양분 가용화", "뿌리 고사·시들음 예방", "잔뿌리 발생 촉진"],
    problems: ["greenhouse-salt-ec", "common-sudden-wilt"],
    doses: [{ kind: "perArea", amount: 1, unit: "L", areaPyeong: 150, method: "관주", note: "1L/100~200평, 7~10일 간격 3~4회. 관주 전용(엽면시비 불가)" }],
    timing: "과채류 착과 후부터, 구근류 구 형성기, 엽채류 수확 초기. 건조기 예방 사용 권장",
    cautions: ["엽면시비 불가"],
    source: SRC(88),
    sellable: true,
  },
  {
    id: "dof-yeomdown-granule",
    company: "dof",
    name: "염다운그레뉼",
    group: "입상 토양개량제",
    packages: [{ label: "10kg", g: 10000 }],
    feature: "불용화된 황산칼슘·인산칼슘을 가용화하고 뿌리 발근에도 효과 (토양시비용)",
    ingredients: "수용성 부식산 85%, DTPA 킬레이트제 2.5%",
    crops: ["사과", "배", "포도", "복숭아", "감귤", "토마토", "오이", "고추", "수박", "참외", "딸기", "인삼"],
    cropKeys: ["apple", "citrus", "tomato", "cucumber", "gochu", "melon", "strawberry"],
    uses: ["연작지 염류장해 개선", "염류 가용화", "발근 촉진"],
    problems: ["greenhouse-salt-ec"],
    doses: [{ kind: "perArea", amount: 15, unit: "kg", areaPyeong: 300, method: "토양", note: "10~20kg/300평 전층 또는 두둑 시비. 시비 전 토양 EC 측정" }],
    timing: "염류 집적 시, 정식 전 전층시비 또는 생육 중",
    source: SRC(29),
    sellable: true,
  },
  {
    id: "dof-root-vitality",
    company: "dof",
    name: "뿌리활력제",
    group: "뿌리발근제",
    packages: [{ label: "10kg", g: 10000 }],
    feature: "관주 시설이 없는 노지에서 토양에 뿌리는 발근제",
    ingredients: "수용성 포타슘 휴믹산, 펄빅산, DTPA 킬레이트제",
    crops: ["사과", "배", "복숭아", "감귤", "포도", "생강", "양파", "마늘", "대파", "배추", "인삼", "노지작물"],
    cropKeys: ["apple", "citrus", "onion", "garlic", "cabbage"],
    uses: ["노지·과수 발근(토양 살포)", "염류 집적 완화", "불용 양분 가용화"],
    problems: ["garlic-rooting", "garlic-onion-overwinter", "apple-postharvest"],
    doses: [{ kind: "perArea", amount: 7.5, unit: "kg", areaPyeong: 200, method: "토양", note: "5~10kg/200평 표층 시비" }],
    timing: "새 뿌리 발생 시, 정식 후 활착 전후, 과일 비대기, 염류 장애 발생 시",
    source: SRC(59),
    sellable: true,
  },
  {
    id: "dof-root-bulkkeun",
    company: "dof",
    name: "도프뿌리불끈",
    group: "뿌리발근제",
    packages: [{ label: "1L", ml: 1000 }],
    feature: "정식 직후·최대 성장기·과다 착과·환경 스트레스 때 관주하는 고급형 발근제",
    ingredients: "유기산, 가바, 타우린, 식물발효물, 미량요소",
    crops: ["고추", "오이", "딸기", "토마토", "수박", "참외", "배추", "상추", "마늘", "양파", "사과", "감귤", "벼"],
    cropKeys: ["gochu", "cucumber", "strawberry", "tomato", "melon", "cabbage", "leafy", "garlic", "onion", "apple", "citrus", "rice", "paprika"],
    uses: ["뿌리 활착", "발근 촉진", "염류·과습·침수 피해 후 뿌리 회복", "저온·고온·가뭄 스트레스 내성"],
    problems: ["melon-seedling-prep", "garlic-rooting", "cucumber-tomato-low-temp"],
    doses: [
      { kind: "perArea", amount: 1, unit: "L", areaPyeong: 200, method: "관주", note: "7일 간격 2~3회" },
      { kind: "dilution", ratio: 1000, method: "관주" },
    ],
    timing: "육묘기·뿌리활착기·착과 후·생육 부진 때 (전 생육기)",
    source: SRC(56),
    sellable: true,
  },
  {
    id: "dof-speed-kkal",
    company: "dof",
    name: "스피드깔파워",
    group: "당도착색제",
    packages: [{ label: "500ml", ml: 500 }],
    feature: "착색 후기에 써서 안토시아닌 합성을 빠르게 — 수확 직전 색 보정",
    crops: ["사과", "포도", "블루베리", "복숭아", "딸기", "고추", "토마토", "가지", "적상추"],
    cropKeys: ["apple", "strawberry", "gochu", "tomato", "leafy"],
    uses: ["착색 촉진(속효)", "안토시아닌 합성"],
    problems: ["apple-coloring"],
    doses: [{ kind: "dilution", ratio: 500, ratioMax: 1000, method: "엽면", note: "흠뻑 엽면시비. 칼슘제·미량요소 혼용 시 효과 증대" }],
    timing: "과수: 색이 20~30% 났을 때(수확 20~30일 전) / 과채: 수확 10~20일 전. 7~10일 간격 1~2회",
    source: SRC(72),
    sellable: true,
  },
  {
    id: "dof-sugar-n-color-lx",
    company: "dof",
    name: "슈가엔칼라LX",
    group: "당도착색제",
    packages: [{ label: "1L", ml: 1000 }],
    feature: "색이 돌 무렵 써서 비대·당도·착색을 동시에",
    ingredients: "폴리사카라이드 60%, 기능성 아미노산 15%, 유기산 1.2%",
    crops: ["사과", "포도", "복숭아", "오미자", "딸기", "고추", "토마토", "수박", "가지", "적상추"],
    cropKeys: ["apple", "strawberry", "gochu", "tomato", "leafy"],
    uses: ["착색 증진", "당도 증진", "후기 비대"],
    problems: ["apple-coloring"],
    doses: [
      { kind: "dilution", ratio: 500, ratioMax: 1000, method: "엽면", note: "강한 농도 금지" },
      { kind: "perArea", amount: 1, unit: "L", areaPyeong: 200, method: "관주", crops: "과채류" },
    ],
    timing: "과수: 착색 시작 초기 7~14일 간격 2~3회 / 과채: 비대기 이후 7일 간격 2회",
    source: SRC(71),
    sellable: true,
  },
  {
    id: "dof-dsd-1",
    company: "dof",
    name: "DSD-1",
    group: "건조해예방제",
    packages: [{ label: "500ml", ml: 500 }],
    feature: "가뭄으로 물이 부족할 때 엽면시비로 저항성을 높이는 건조해 예방제",
    crops: ["배추", "감자", "양파", "마늘", "상추", "딸기", "오이", "토마토", "고추", "벼"],
    cropKeys: ["cabbage", "onion", "garlic", "leafy", "strawberry", "cucumber", "tomato", "gochu", "rice"],
    uses: ["가뭄 스트레스", "염류 집적 시들음 예방", "절수 재배"],
    problems: ["greenhouse-salt-ec"],
    doses: [{ kind: "dilution", ratio: 1000, method: "엽면", note: "엽면시비 또는 관주. 침투확산제 혼용 권장" }],
    timing: "심한 물 부족이 예상될 때, 시설 연작지 염류 삼투압 스트레스 때",
    source: SRC(81),
    sellable: true,
  },
  {
    id: "dof-dalout",
    company: "dof",
    name: "달아웃",
    group: "친환경 해충 방어제",
    packages: [{ label: "500ml", ml: 500 }],
    feature: "식물추출물(동백 사포닌)로 만든 달팽이·지렁이·선충 기피제",
    crops: ["상추", "배추", "엽채류", "인삼", "감귤", "과수류", "오이", "과채류", "고구마", "감자"],
    cropKeys: ["leafy", "cabbage", "citrus", "cucumber"],
    uses: ["달팽이 기피", "지렁이·선충 기피"],
    problems: [],
    doses: [
      { kind: "dilution", ratio: 500, ratioMax: 1000, method: "엽면", note: "20~40ml/20L" },
      { kind: "perArea", amount: 500, unit: "ml", areaPyeong: 150, method: "관주", note: "500ml/100~200평" },
    ],
    timing: "수확기 포함 전 생육기, 2주 간격",
    cautions: ["장미·화훼·파프리카는 시험 후 사용"],
    source: SRC(136),
    sellable: true,
  },
  {
    id: "dof-gochu-hanbang",
    company: "dof",
    name: "고추한방",
    group: "입상 미량요소제",
    packages: [{ label: "2kg", g: 2000 }],
    feature: "고추 재배 전용 기비 미량요소제 (칼슘 14%, 고토 6%, 붕소 1.8% 등). 자매품 역탄킬러는 아인산 함유",
    crops: ["고추"],
    cropKeys: ["gochu"],
    uses: ["고추 기비 미량요소", "탄저병·역병 저항성", "생리장애 예방"],
    problems: ["gochu-anthracnose"],
    doses: [{ kind: "text", text: "입상 기비(2kg 포장). 뒤이어 착과 후 GS-칼 1,000배 2회, 장마 후 도프아인산큐 500배 2회 권장" }],
    timing: "기비 (3개월 이상 지속)",
    source: SRC(36),
    sellable: true,
  },
  {
    id: "dof-ssakssuri-c",
    company: "dof",
    name: "싹쓰리-C",
    group: "친환경 병균 방어제",
    packages: [{ label: "200ml", ml: 200 }, { label: "500ml", ml: 500 }, { label: "4L", ml: 4000 }],
    feature: "나노 구리 원료. 세균성·진균성 병해와 바이러스에 내병성을 높임",
    crops: ["전작물"],
    cropKeys: ["common", "cabbage", "onion", "cucumber", "leafy", "gochu", "tomato"],
    uses: ["세균성 병해", "진균성 병해", "바이러스 내병성"],
    problems: ["cabbage-soft-rot", "onion-downy-mildew", "cucumber-downy-mildew", "leafy-downy-sclerotinia"],
    doses: [{ kind: "text", text: "카탈로그에 희석배수 미기재 — 기업에 문의. 싹쓰리-S와 혼용 가능" }],
    timing: "이상 징후 시 신속 처리. 방제 후 바로 수확 가능",
    source: SRC(142),
    sellable: true,
  },
  {
    id: "dof-ssakssuri-s",
    company: "dof",
    name: "싹쓰리-S",
    group: "친환경 병균 방어제",
    packages: [{ label: "200ml", ml: 200 }, { label: "500ml", ml: 500 }, { label: "4L", ml: 4000 }],
    feature: "액상 나노황(유황 15%). 노지 작물의 흰가루병 등 병해 예방·치료",
    crops: ["노지 작물 전반"],
    cropKeys: ["common", "gochu", "apple"],
    uses: ["흰가루병 등 진균 병해", "병해 예방·치료"],
    problems: [],
    doses: [{ kind: "text", text: "카탈로그에 희석배수 미기재 — 기업에 문의. 싹쓰리-C와 혼용 가능" }],
    timing: "이상 징후 시 신속 처리",
    source: SRC(142),
    sellable: true,
  },
];

export const PARTNER_PRODUCTS: PartnerProduct[] = [...DOF_PRODUCTS, ...WASUNG_PRODUCTS];

export function getPartnerProduct(id: string) {
  return PARTNER_PRODUCTS.find((p) => p.id === id) ?? null;
}

/** 문제 slug에 연결된 참여 기업 제품 (연결 순서가 앞일수록 먼저) */
export function partnerProductsForProblem(slug: string, limit = 2) {
  return PARTNER_PRODUCTS.map((p) => ({ p, i: p.problems.indexOf(slug) }))
    .filter((x) => x.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map((x) => x.p)
    .slice(0, limit);
}

export function partnerProductsForCrop(crop: CropKey) {
  return PARTNER_PRODUCTS.filter((p) => p.cropKeys.includes(crop) || p.cropKeys.includes("common"));
}

export function partnerCompany(p: PartnerProduct) {
  return PARTNER_COMPANIES[p.company];
}

/** 이름으로 찾기 (계산기 검색) */
export function searchPartnerProducts(q: string, limit = 8) {
  const t = q.trim().toLowerCase().replace(/[\s-]/g, "");
  if (!t) return [];
  return PARTNER_PRODUCTS.filter((p) => {
    const hay = [p.name, p.group, ...p.uses, ...p.crops].join(" ").toLowerCase().replace(/[\s-]/g, "");
    return hay.includes(t);
  }).slice(0, limit);
}
