/**
 * 농민 문제 목록 (1주차 초안)
 *
 * - 엑스포의 핵심 단위. 영상·포토닥터·카드뉴스가 전부 여기로 떨어집니다.
 * - 내용은 '일반 원리'로만 씁니다. 제품명·약제명·희석배수는 쓰지 않습니다. (강의 원칙과 같음)
 * - noProducts = true 인 문제는 원인이 여러 가지라 제품을 바로 보여주지 않고 진단·문의만 받습니다.
 *   (포토닥터 추천 규칙의 '제품 미노출' 기준과 같음)
 * - 나중에 DB 표(expo_problems)로 옮깁니다. 지금은 코드에 두어 DB 변경 없이 미리보기를 띄웁니다.
 */

export type CropKey =
  | "gochu"
  | "garlic"
  | "onion"
  | "apple"
  | "strawberry"
  | "tomato"
  | "cucumber"
  | "citrus"
  | "cabbage"
  | "rice"
  | "melon"
  | "paprika"
  | "leafy"
  | "common";

export type Crop = { key: CropKey; label: string; icon: string; monthNote: string; aliases: string[] };

/** 작물 입구 (이달 할 일은 11월 기준 — 매달 갱신) */
export const CROPS: Crop[] = [
  { key: "strawberry", label: "딸기", icon: "🍓", monthNote: "시설 가동, 응애·흰가루병 초기 관리, 벌 투입", aliases: ["딸기", "설향", "육묘"] },
  { key: "tomato", label: "토마토", icon: "🍅", monthNote: "시설 환기·습도 관리, 가루이 예찰, 칼슘 공급", aliases: ["토마토", "방울토마토", "완숙"] },
  { key: "cucumber", label: "오이", icon: "🥒", monthNote: "환기·보온 균형, 노균병·가루이 예찰", aliases: ["오이", "백다다기", "취청"] },
  { key: "paprika", label: "파프리카·시설고추", icon: "🫑", monthNote: "총채벌레·흰가루 예찰, 야간 보온", aliases: ["파프리카", "피망", "시설고추", "하우스고추", "풋고추"] },
  { key: "melon", label: "참외·수박", icon: "🍈", monthNote: "접목묘 예약, 육묘상 준비, 정식 전 토양 관리", aliases: ["참외", "수박", "멜론", "접목묘"] },
  { key: "leafy", label: "상추·엽채", icon: "🥗", monthNote: "저온기 생육, 노균병·균핵병 예찰", aliases: ["상추", "시금치", "쌈채", "엽채", "청경채", "부추"] },
  { key: "citrus", label: "감귤·만감류", icon: "🍊", monthNote: "수확기 열과·착색, 수분 급변 방지", aliases: ["감귤", "귤", "레드향", "한라봉", "천혜향", "만감"] },
  { key: "apple", label: "사과", icon: "🍎", monthNote: "수확 후 나무 회복(엽면·토양 영양), 낙엽 정리, 동해 예방", aliases: ["사과", "부사", "홍로"] },
  { key: "cabbage", label: "배추", icon: "🥬", monthNote: "김장철 수확 전 무름병 점검, 결구 상태 확인", aliases: ["배추", "김장", "무"] },
  { key: "gochu", label: "고추(노지)", icon: "🌶️", monthNote: "수확 마무리, 밭 정리와 잔재물 처리, 내년 밭 준비", aliases: ["고추", "홍고추", "건고추", "노지고추"] },
  { key: "garlic", label: "마늘", icon: "🧄", monthNote: "정식 후 뿌리 내림 확인, 비닐 피복·보온, 배수로 점검", aliases: ["마늘", "홍산마늘", "종구"] },
  { key: "onion", label: "양파", icon: "🧅", monthNote: "정식 후 활착, 월동 전 피복, 노균병 예방", aliases: ["양파"] },
  { key: "rice", label: "벼", icon: "🌾", monthNote: "수확 후 논 정리, 볏짚 환원, 월동 녹비 파종", aliases: ["벼", "논", "볏짚", "모내기"] },
];

export type SymptomKey =
  | "yellow-leaf"
  | "insects"
  | "fruit-crack"
  | "poor-color"
  | "wilting"
  | "mold"
  | "root"
  | "spots"
  | "growth";

export type Symptom = { key: SymptomKey; label: string; icon: string; aliases: string[] };

/** 증상 입구 */
export const SYMPTOMS: Symptom[] = [
  { key: "insects", label: "벌레가 보인다", icon: "🐛", aliases: ["벌레", "총채", "진딧물", "응애", "가루이", "나방", "굴파리", "선충", "달팽이"] },
  { key: "spots", label: "잎·열매에 반점", icon: "🟤", aliases: ["반점", "점", "얼룩", "탄저", "무름", "썩", "구멍"] },
  { key: "mold", label: "곰팡이·흰가루", icon: "⚪", aliases: ["곰팡이", "흰가루", "노균", "잿빛", "균핵", "역병", "하얀", "회색", "물방울", "이슬", "결로", "습해", "축축"] },
  { key: "yellow-leaf", label: "잎이 노랗다", icon: "🍂", aliases: ["노랗", "노래", "노란", "누렇", "누런", "누레", "황화", "잎이 변", "잎이 마", "잎이 탄", "잎끝", "밑잎", "아랫잎", "아래잎", "타들"] },
  { key: "fruit-crack", label: "열매가 터진다", icon: "💥", aliases: ["터", "갈라", "열과", "쪼개"] },
  { key: "poor-color", label: "색이 안 난다", icon: "🎨", aliases: ["색", "착색", "당도", "맛이 없", "크기가 작"] },
  { key: "wilting", label: "갑자기 시든다", icon: "🥀", aliases: ["시들", "시듦", "축 처", "말라", "죽"] },
  { key: "root", label: "뿌리가 이상하다", icon: "🌱", aliases: ["뿌리", "활착", "썩음", "혹", "안 자라", "안자라"] },
  { key: "growth", label: "생육·수확 후 관리", icon: "📈", aliases: ["수확", "생육", "거름", "비료", "영양", "월동", "정식", "육묘", "보온", "난방", "환기", "습도", "결로"] },
];

export type Problem = {
  slug: string;
  title: string;
  crop: CropKey;
  /** 같은 문제가 해당되는 다른 작물 (작물 페이지·매칭에 같이 씀) */
  alsoCrops?: CropKey[];
  symptoms: SymptomKey[];
  /** 지금 시기에 특히 중요한 문제 */
  seasonal?: boolean;
  /** 한 줄 요약 (목록 카드용) */
  summary: string;
  /** 원인 한 줄 */
  cause: string;
  /** 지금 할 일 3줄 (일반 원리) */
  actions: [string, string, string];
  /** 해답의 일반 원리 — 제품 소개 앞에 붙는 문장 */
  principle: string;
  /** 제품 매칭 키워드 (제품명·설명·대상작물에서 찾음) — 넓은 말 포함, 점수용 */
  productKeywords: string[];
  /** 이 중 하나는 반드시 제품 설명에 있어야 붙음 (없으면 productKeywords 전부가 필수 후보) */
  mustKeywords?: string[];
  /** 증상 사진 (외장하드 촬영본에서 고른 것. 없으면 사진 영역을 아예 안 보여줌) */
  imageUrls?: string[];
  /** true면 제품을 보여주지 않고 진단·문의만 */
  noProducts?: boolean;
  /** 관련 강의 영상 (유튜브 주소, 없으면 비움) */
  videoUrl?: string;
  /** 근거 (농진청·농사로 등 공공 자료 페이지) */
  sourceLabel?: string;
};

export const PROBLEMS: Problem[] = [
  {
    slug: "gochu-thrips",
    title: "고추 총채벌레",
    crop: "gochu",
    symptoms: ["insects", "spots"],
    summary: "새잎이 오그라들고 꽃이 떨어지며 열매에 흰 긁힌 자국",
    cause: "총채벌레가 새순·꽃·어린 열매를 빨아 먹고, 바이러스(TSWV)를 옮깁니다.",
    actions: [
      "끝잎과 꽃 속을 털어 흰 종이에 받아 보면 작은 벌레가 움직입니다. 주 1회 확인",
      "발생 초기에 해충 관리 자재를 쓰고, 한 가지 계통만 반복하지 않습니다",
      "하우스는 출입구·측창에 방충망, 주변 잡초 제거",
    ],
    principle: "총채벌레는 숨는 곳이 많아 초기 발견과 계통을 바꿔 가며 관리하는 것이 핵심입니다.",
    productKeywords: ["총채", "해충", "살충", "진딧물", "응애"],
    mustKeywords: ["총채"],
  },
  {
    slug: "gochu-anthracnose",
    title: "고추 탄저병",
    crop: "gochu",
    symptoms: ["spots"],
    summary: "열매에 움푹 파인 둥근 반점, 장마·비 온 뒤 급격히 번짐",
    cause: "곰팡이병으로 빗물에 포자가 튀어 번집니다. 병든 열매를 그대로 두면 다음 해까지 이어집니다.",
    actions: [
      "병든 열매는 바로 따서 밭 밖으로 — 땅에 떨어진 것도 치웁니다",
      "비 오기 전·후로 균 관리 자재를 예방 위주로 씁니다",
      "통풍이 되게 곁순 정리, 고랑에 물이 고이지 않게",
    ],
    principle: "탄저병은 치료보다 예방입니다. 비 전후 관리와 병든 열매 제거가 자재보다 먼저입니다.",
    productKeywords: ["탄저", "살균", "균", "병해", "곰팡이"],
    mustKeywords: ["탄저"],
  },
  {
    slug: "gochu-aphid-virus",
    title: "고추 진딧물·바이러스",
    crop: "gochu",
    symptoms: ["insects", "yellow-leaf"],
    summary: "잎 뒷면에 진딧물, 새잎이 쭈글쭈글 모자이크 무늬",
    cause: "진딧물이 즙을 빨며 바이러스를 옮깁니다. 바이러스는 걸리면 치료가 안 됩니다.",
    actions: [
      "바이러스 증상 포기는 뽑아서 밭 밖으로 (전염원 제거)",
      "진딧물은 발생 초기에 잎 뒷면 위주로 관리",
      "은색 멀칭·방충망으로 날아드는 것을 줄입니다",
    ],
    principle: "바이러스 자체는 약이 없습니다. 매개충(진딧물) 관리와 병든 포기 제거가 전부입니다.",
    productKeywords: ["진딧물", "해충", "살충", "총채"],
    mustKeywords: ["진딧물", "바이러스", "매개충"],
  },
  {
    slug: "garlic-rooting",
    title: "마늘 정식 후 뿌리 내림 불량",
    crop: "garlic",
    symptoms: ["root", "growth"],
    seasonal: true,
    summary: "심은 지 2~3주가 지나도 싹이 고르지 않고 뽑아 보면 뿌리가 짧다",
    cause: "토양 수분 부족이나 과습, 깊이 심기, 종구 상태 불량이 겹칩니다.",
    actions: [
      "몇 포기 뽑아 뿌리 길이를 봅니다. 흰 뿌리가 손가락 한 마디 이상이면 정상",
      "건조하면 충분히 관수, 과습이면 배수로를 먼저 정리",
      "뿌리 활착을 돕는 영양 자재는 토양이 적당히 젖은 상태에서",
    ],
    principle: "정식 후 뿌리 내림은 수분 관리가 8할입니다. 자재는 그 다음입니다.",
    productKeywords: ["뿌리", "활착", "발근", "아미노", "마늘", "양파"],
    mustKeywords: ["뿌리", "활착", "발근"],
  },
  {
    slug: "garlic-onion-overwinter",
    title: "마늘·양파 월동 준비",
    crop: "garlic",
    alsoCrops: ["onion"],
    symptoms: ["growth"],
    seasonal: true,
    summary: "12월 추위 전에 뿌리를 충분히 내리게 하고 피복으로 보온",
    cause: "뿌리가 덜 내린 채 얼면 봄에 들뜨고 결주가 납니다.",
    actions: [
      "비닐·부직포 피복은 땅이 얼기 전에. 구멍 뚫린 피복은 바람에 날리지 않게 고정",
      "배수로를 다시 치고 고랑에 물이 서지 않게",
      "월동 전 과한 질소는 피하고, 뿌리 중심의 영양 공급",
    ],
    principle: "월동은 '뿌리가 얼마나 내렸나'와 '물이 고이지 않나' 두 가지로 결정됩니다.",
    productKeywords: ["월동", "뿌리", "활착", "마늘", "양파", "부직포", "피복"],
    mustKeywords: ["월동", "보온", "부직포", "피복", "뿌리"],
  },
  {
    slug: "garlic-black-mold",
    title: "마늘 흑색썩음균핵병·잎마름",
    crop: "garlic",
    symptoms: ["mold", "yellow-leaf"],
    summary: "봄에 잎이 아래부터 노래지고 뽑으면 구 밑에 검은 균핵",
    cause: "토양 전염 곰팡이병. 연작 밭에서 심하고, 한번 들면 여러 해 갑니다.",
    actions: [
      "병든 포기는 흙째 들어내 밭 밖으로",
      "연작 밭은 심기 전 토양 처리와 윤작을 고려",
      "배수가 나쁜 곳부터 발생하므로 배수로 정비",
    ],
    principle: "토양병은 심기 전 예방이 거의 전부입니다. 발생 후에는 확산을 늦추는 관리입니다.",
    productKeywords: ["균핵", "토양", "살균", "마늘"],
    mustKeywords: ["균핵", "토양 소독", "토양소독"],
  },
  {
    slug: "onion-downy-mildew",
    title: "양파 노균병",
    crop: "onion",
    symptoms: ["mold", "yellow-leaf"],
    summary: "잎에 타원형 연한 반점, 아침이슬 때 회백색 곰팡이",
    cause: "서늘하고 습한 날이 이어질 때 번지는 곰팡이병. 가을 감염이 봄에 터집니다.",
    actions: [
      "가을 정식 후부터 예방 관리, 봄 비 온 뒤 다시 점검",
      "병든 잎은 따서 밭 밖으로, 밀식을 피해 통풍",
      "질소 과다 금지, 배수로 정비",
    ],
    principle: "노균병은 습도와 질소가 키웁니다. 통풍과 비 전후 관리가 기본입니다.",
    productKeywords: ["노균", "살균", "균", "양파"],
    mustKeywords: ["노균"],
  },
  {
    slug: "apple-postharvest",
    title: "사과 수확 후 나무 회복",
    crop: "apple",
    symptoms: ["growth"],
    seasonal: true,
    summary: "수확으로 지친 나무에 낙엽 전까지 저장양분을 채워야 내년 꽃눈이 좋다",
    cause: "수확 직후 잎이 살아 있는 동안 만든 양분이 뿌리·가지에 저장돼 내년 개화·착과를 좌우합니다.",
    actions: [
      "잎이 붙어 있는 동안 엽면 영양 공급 (낙엽 후엔 효과 없음)",
      "토양 수분 유지, 가을 거름은 낙엽 전후 적기에",
      "병든 낙엽·낙과는 모아 처리해 내년 전염원 줄이기",
    ],
    principle: "사과 농사의 내년은 올해 11월에 결정됩니다. 잎이 있을 때 저장양분을 채우는 것이 핵심입니다.",
    productKeywords: ["아미노", "수확 후", "회복", "엽면", "사과", "영양"],
    mustKeywords: ["수확 후", "수확후", "회복", "아미노", "엽면"],
  },
  {
    slug: "apple-coloring",
    title: "사과 착색 불량",
    crop: "apple",
    symptoms: ["poor-color"],
    summary: "수확기가 다가오는데 붉은색이 늦고 얼룩진다",
    cause: "일조 부족, 일교차 부족, 질소 과다, 잎에 가려짐이 겹칩니다.",
    actions: [
      "열매 주변 잎 따기·반사필름으로 빛을 들입니다",
      "질소는 수확 6주 전부터 끊습니다",
      "착색 보조 자재는 수확 3~4주 전, 기온이 내려간 뒤",
    ],
    principle: "착색은 빛·온도·질소 세 가지가 먼저이고, 자재는 마지막 보조입니다.",
    productKeywords: ["착색", "사과", "안토시아닌", "색"],
    mustKeywords: ["착색"],
  },
  {
    slug: "strawberry-mite",
    title: "딸기 응애",
    crop: "strawberry",
    symptoms: ["insects", "yellow-leaf"],
    seasonal: true,
    summary: "잎이 누렇게 바래고 뒷면에 거미줄 같은 것, 생육이 멈춤",
    cause: "점박이응애가 잎 뒷면에서 즙을 빨아 먹습니다. 고온 건조한 시설에서 폭발적으로 늡니다.",
    actions: [
      "정식 직후부터 잎 뒷면을 돋보기로 주 1회 확인",
      "발생 초기에 관리하고 계통을 바꿔 씁니다. 천적(칠레이리응애) 활용도 검토",
      "하우스 습도를 너무 낮추지 않고, 마른 잎 제거",
    ],
    principle: "응애는 늘어난 뒤에는 잡기 어렵습니다. 정식 직후 초기 관리가 한 해를 결정합니다.",
    productKeywords: ["응애", "해충", "살비", "딸기", "천적"],
    mustKeywords: ["응애"],
  },
  {
    slug: "strawberry-powdery-gray",
    title: "딸기 흰가루병·잿빛곰팡이",
    crop: "strawberry",
    alsoCrops: ["tomato", "cucumber", "paprika"],
    symptoms: ["mold"],
    summary: "잎·열매에 흰 가루, 또는 열매에 회색 곰팡이가 피어 물러짐",
    cause: "흰가루병은 건조할 때, 잿빛곰팡이는 습할 때. 환기와 습도 관리가 어긋나면 번갈아 옵니다.",
    actions: [
      "아침 환기로 결로를 없애고, 병든 잎·열매는 즉시 제거",
      "밀식·과번무를 피하고 늙은 잎 정리",
      "예방 위주 균 관리, 수확기엔 안전사용 기준 확인",
    ],
    principle: "두 병은 습도 관리로 같이 잡습니다. 환기 시간과 늙은 잎 정리가 자재보다 먼저입니다.",
    productKeywords: ["흰가루", "잿빛", "살균", "균", "딸기"],
    mustKeywords: ["흰가루", "잿빛"],
  },
  {
    slug: "strawberry-malformed",
    title: "딸기 기형과·수정 불량",
    crop: "strawberry",
    symptoms: ["growth"],
    summary: "열매가 울퉁불퉁하거나 끝이 뭉뚝, 씨가 한쪽에 몰림",
    cause: "벌 활동 부족(저온·흐린 날·약제 영향), 꽃가루 불량, 초기 영양 불균형",
    actions: [
      "벌통 상태와 활동 시간 확인, 약제 살포는 벌 활동 시간을 피해",
      "개화기 야간 온도가 너무 낮지 않게",
      "초기 생육 영양(특히 붕소·칼슘) 결핍 여부 점검",
    ],
    principle: "기형과는 '벌'과 '온도'가 7할입니다. 자재는 영양 균형을 돕는 보조입니다.",
    productKeywords: ["붕소", "칼슘", "개화", "수정", "딸기"],
    mustKeywords: ["붕소", "수정", "개화"],
  },
  {
    slug: "tomato-cracking",
    title: "토마토 열과(갈라짐)",
    crop: "tomato",
    alsoCrops: ["paprika"],
    symptoms: ["fruit-crack"],
    summary: "익어 가는 열매 꼭지 주변이 방사형·동심원으로 갈라진다",
    cause: "건조하다가 갑자기 물이 많아질 때, 과육이 껍질보다 빨리 커지며 터집니다.",
    actions: [
      "관수 간격을 일정하게 — 한 번에 많이보다 자주 조금",
      "급격한 온도 변화와 직사광 피하기(차광)",
      "칼슘·칼륨 균형 공급, 질소 과다 주의",
    ],
    principle: "열과는 물 관리의 문제입니다. 자재는 껍질 강화와 균형을 돕는 역할입니다.",
    productKeywords: ["열과", "칼슘", "터짐", "토마토", "아미노"],
    mustKeywords: ["열과", "칼슘", "터짐"],
  },
  {
    slug: "tomato-cucumber-whitefly",
    title: "토마토·오이 가루이(온실가루이)",
    crop: "tomato",
    alsoCrops: ["cucumber", "paprika", "strawberry"],
    symptoms: ["insects"],
    summary: "잎을 건드리면 흰 작은 벌레가 날아오르고, 잎에 끈적한 분비물·그을음",
    cause: "온실가루이가 잎 뒷면에서 즙을 빨고 바이러스(TYLCV)를 옮깁니다.",
    actions: [
      "황색 끈끈이트랩을 작물 위 20cm에 걸어 발생을 먼저 봅니다",
      "알·약충이 잎 뒷면에 있으니 뒷면까지 닿게 관리, 계통 교대",
      "하우스 출입구 방충망, 묘 반입 때 확인",
    ],
    principle: "가루이는 성충만 잡으면 다시 나옵니다. 알·약충 단계까지 잡는 반복 관리가 핵심입니다.",
    productKeywords: ["가루이", "해충", "살충", "끈끈이", "토마토", "오이"],
    mustKeywords: ["가루이", "끈끈이"],
  },
  {
    slug: "cucumber-downy-mildew",
    title: "오이 노균병",
    crop: "cucumber",
    symptoms: ["mold", "yellow-leaf"],
    summary: "잎맥에 막힌 각진 노란 반점, 뒷면에 회색 곰팡이",
    cause: "습하고 서늘할 때 급속히 번지는 곰팡이병. 환기 부족한 시설에서 흔합니다.",
    actions: [
      "아침 환기로 잎의 물기를 빨리 말립니다",
      "아래 늙은 잎부터 번지니 병든 잎 제거",
      "예방 위주 균 관리, 비 오기 전 점검",
    ],
    principle: "노균병은 잎이 젖어 있는 시간을 줄이는 것이 전부입니다.",
    productKeywords: ["노균", "살균", "균", "오이"],
    mustKeywords: ["노균"],
  },
  {
    slug: "citrus-cracking",
    title: "감귤·레드향 열과",
    crop: "citrus",
    symptoms: ["fruit-crack"],
    seasonal: true,
    summary: "가을 비 온 뒤 열매가 갈라져 떨어진다, 만감류에 특히 심함",
    cause: "건조 뒤 급격한 수분 공급으로 과육이 팽창하고, 껍질이 얇은 품종에서 터집니다.",
    actions: [
      "가뭄 때 소량씩 관수해 토양 수분 급변을 막습니다",
      "열매 껍질을 튼튼하게 하는 영양(칼슘·아미노산 계열) 공급",
      "배수로 정비, 지나친 결실은 적과",
    ],
    principle: "열과는 '물의 급변'이 원인입니다. 꾸준한 관수와 껍질 강화가 답입니다.",
    productKeywords: ["열과", "아미노", "칼슘", "감귤", "레드향", "만감"],
    mustKeywords: ["열과", "아미노", "칼슘"],
  },
  {
    slug: "cabbage-soft-rot",
    title: "배추 무름병",
    crop: "cabbage",
    symptoms: ["wilting", "spots"],
    seasonal: true,
    summary: "밑동부터 물러지며 썩는 냄새, 김장 직전에 포기가 주저앉음",
    cause: "세균병. 상처·해충 피해 부위로 들어가고, 배수 불량과 고온다습에서 급격히 번집니다.",
    actions: [
      "병든 포기는 즉시 뽑아 밭 밖으로, 손·도구 소독",
      "해충 피해(벼룩잎벌레 등)와 상처를 줄입니다",
      "배수로 정비, 수확 전 비 온 뒤 점검",
    ],
    principle: "무름병은 세균이라 곰팡이약이 안 듣습니다. 상처·해충·배수 관리가 먼저입니다.",
    productKeywords: ["무름", "세균", "배추", "살균"],
    mustKeywords: ["무름", "세균"],
  },
  {
    slug: "rice-postharvest-soil",
    title: "벼 수확 후 논 관리",
    crop: "rice",
    symptoms: ["growth"],
    seasonal: true,
    summary: "볏짚 환원과 월동 녹비로 내년 지력을 만든다",
    cause: "볏짚을 태우거나 걷어 내면 유기물이 빠져 지력이 떨어집니다.",
    actions: [
      "볏짚은 잘게 잘라 깔고 가을갈이로 섞어 넣습니다",
      "녹비(헤어리베치·호밀 등)는 10월 말~11월 초 파종",
      "배수 나쁜 논은 배수로를 쳐서 봄 작업을 쉽게",
    ],
    principle: "지력은 한 해에 안 만들어집니다. 수확 후 유기물 환원이 내년 비료값을 줄입니다.",
    productKeywords: ["볏짚", "녹비", "토양", "유기물", "로타리", "파쇄"],
    mustKeywords: ["볏짚", "녹비", "토양", "로타리", "파쇄"],
  },
  {
    slug: "paprika-thrips-powdery",
    title: "파프리카·시설고추 총채벌레·흰가루병",
    crop: "paprika",
    alsoCrops: ["gochu", "tomato"],
    symptoms: ["insects", "mold"],
    seasonal: true,
    summary: "꽃이 떨어지고 열매에 흰 긁힘, 잎에 흰 가루가 번진다",
    cause: "밀폐된 하우스에서 총채벌레가 번식하고, 건조하면 흰가루병이 뒤따릅니다.",
    actions: [
      "청색·황색 끈끈이트랩으로 발생을 먼저 보고, 꽃 속을 털어 확인",
      "총채는 계통을 바꿔 가며, 흰가루는 발생 초기에 예방 위주로",
      "측창 방충망, 하우스 안 습도를 너무 낮추지 않기",
    ],
    principle: "시설 작물은 밀폐될수록 해충이 폭발합니다. 트랩으로 보고, 초기에 잡고, 계통을 바꿉니다.",
    productKeywords: ["총채", "흰가루", "해충", "살충", "살균", "끈끈이", "파프리카", "고추"],
    mustKeywords: ["총채", "흰가루", "끈끈이"],
  },
  {
    slug: "greenhouse-condensation",
    title: "시설하우스 결로·습도 관리 (곰팡이병의 뿌리)",
    crop: "common",
    alsoCrops: ["strawberry", "tomato", "cucumber", "paprika", "leafy", "melon"],
    symptoms: ["mold", "growth"],
    seasonal: true,
    summary: "아침에 비닐·잎에 물방울이 맺히고, 며칠 뒤 잿빛곰팡이·노균병이 온다",
    cause: "밤새 식은 하우스 안 수증기가 새벽에 잎에 맺힙니다. 잎이 젖어 있는 시간이 곰팡이병을 키웁니다.",
    actions: [
      "해 뜨고 1시간 안에 짧게 환기해 습한 공기를 내보냅니다 (온도보다 습도 먼저)",
      "보온커튼은 해 뜬 뒤 바로 걷고, 바닥 멀칭으로 토양 수분 증발을 줄입니다",
      "온습도계를 작물 높이에 두고 새벽 습도를 봅니다. 90% 넘는 시간이 길면 병이 옵니다",
    ],
    principle: "시설 곰팡이병의 8할은 결로입니다. 자재보다 환기 시간과 보온커튼 운용이 먼저입니다.",
    productKeywords: ["온습도", "환기", "유동팬", "제습", "결로", "보온커튼", "센서"],
    mustKeywords: ["온습도", "환기", "유동팬", "제습", "결로", "보온커튼", "센서"],
  },
  {
    slug: "greenhouse-heating-prep",
    title: "시설하우스 보온·난방 준비",
    crop: "common",
    alsoCrops: ["strawberry", "tomato", "cucumber", "paprika", "leafy", "melon"],
    symptoms: ["growth"],
    seasonal: true,
    summary: "첫 추위 전에 이중비닐·보온커튼·난방기를 점검해야 저온 피해를 막는다",
    cause: "11월 첫 한파에 보온이 안 돼 있으면 생장점이 멈추고, 회복에 2~3주가 걸립니다.",
    actions: [
      "이중비닐·보온커튼 찢어진 곳 보수, 출입구 틈새 막기",
      "난방기 시운전과 연료 점검, 온도 센서 위치 확인(작물 높이)",
      "작물별 야간 최저온도 기준을 정하고 알람 설정",
    ],
    principle: "보온은 설비 문제입니다. 추위 오기 전 점검이 난방비보다 쌉니다.",
    productKeywords: ["난방", "보온", "커튼", "이중비닐", "온풍기", "열풍기", "온도", "센서", "알람"],
    mustKeywords: ["난방", "보온", "커튼", "이중비닐", "온풍기", "열풍기", "온도 센서", "알람"],
  },
  {
    slug: "greenhouse-salt-ec",
    title: "연작 하우스 염류 장해 (EC 과다)",
    crop: "common",
    alsoCrops: ["strawberry", "tomato", "cucumber", "paprika", "melon"],
    symptoms: ["wilting", "yellow-leaf", "root"],
    summary: "물을 줘도 시들고 잎 가장자리가 타며, 흙 표면이 하얗게 된다",
    cause: "해마다 준 비료가 하우스 안에 쌓여 뿌리가 물을 못 빨아들입니다. 비가 안 들어오는 시설에서 특히 심합니다.",
    actions: [
      "토양 EC를 재 봅니다. 작물마다 다르지만 2.0을 넘으면 의심",
      "담수 세척이나 제염 작물(옥수수·수단그라스) 재배, 유기물 투입",
      "정식 전 토양 검정을 받고 밑거름을 줄입니다",
    ],
    principle: "염류 장해는 영양제를 더 준다고 낫지 않습니다. 빼는 관리가 답입니다.",
    productKeywords: ["EC", "염류", "토양개량", "유기물", "미생물", "토양 검정"],
    mustKeywords: ["EC", "염류", "토양개량", "제염"],
  },
  {
    slug: "melon-seedling-prep",
    title: "참외·수박 접목묘 준비와 육묘",
    crop: "melon",
    symptoms: ["growth", "root"],
    seasonal: true,
    summary: "정식 40~50일 전 접목묘를 예약하고, 육묘상 온도·습도를 맞춘다",
    cause: "늦게 주문하면 원하는 품종·대목을 못 받고, 육묘상이 추우면 활착이 늦습니다.",
    actions: [
      "품종·대목을 정해 육묘장에 미리 예약 (연작 밭은 덩굴쪼김병 저항성 대목)",
      "육묘상 바닥 온도 유지, 낮밤 온도차 관리",
      "정식 전 토양 소독·태양열 소독 여부 결정",
    ],
    principle: "참외·수박 농사의 절반은 묘에서 결정됩니다. 좋은 묘를 제때 받는 게 첫 자재입니다.",
    productKeywords: ["접목묘", "육묘", "대목", "참외", "수박", "모종", "육묘상"],
    mustKeywords: ["접목묘", "육묘", "대목", "모종"],
  },
  {
    slug: "leafy-downy-sclerotinia",
    title: "상추·엽채 노균병·균핵병",
    crop: "leafy",
    symptoms: ["mold", "spots"],
    seasonal: true,
    summary: "잎에 누런 반점 뒤 흰 곰팡이, 밑동이 물러지며 흰 솜 같은 균사",
    cause: "저온 다습한 겨울 하우스에서 번집니다. 밀식과 결로가 원인입니다.",
    actions: [
      "병든 포기는 즉시 제거, 수확 후 잔재물 치우기",
      "아침 환기와 멀칭으로 잎·밑동이 젖는 시간 줄이기",
      "예방 위주 균 관리, 수확 주기가 짧으니 안전사용기준 확인",
    ],
    principle: "엽채는 수확이 잦아 약을 많이 쓸 수 없습니다. 환기와 잔재물 관리가 자재보다 먼저입니다.",
    productKeywords: ["노균", "균핵", "살균", "상추", "엽채", "시금치"],
    mustKeywords: ["노균", "균핵"],
  },
  {
    slug: "strawberry-bee-pollination",
    title: "딸기 벌 투입과 수정 관리",
    crop: "strawberry",
    symptoms: ["growth"],
    seasonal: true,
    summary: "개화 시작 전 벌통을 넣고, 약제·저온·흐린 날에 벌이 안 나오면 기형과가 는다",
    cause: "수정은 벌이 합니다. 벌 활동이 떨어지면 기형과·수량 감소로 바로 이어집니다.",
    actions: [
      "첫 꽃 피기 전 벌통 투입, 하우스 안에 물·햇빛 자리 확보",
      "약제 살포는 벌 활동이 없는 저녁에, 벌에 안전한 자재 위주",
      "흐린 날·저온이 이어지면 보조 수정(바람·붓) 검토",
    ],
    principle: "벌은 가장 싼 일꾼입니다. 벌을 지키는 운용이 수량을 지킵니다.",
    productKeywords: ["벌", "수정", "화분매개", "뒤영벌", "꿀벌", "딸기"],
    mustKeywords: ["뒤영벌", "꿀벌", "수정벌", "화분매개", "벌통"],
  },
  {
    slug: "cucumber-tomato-low-temp",
    title: "오이·토마토 저온기 생육 정체",
    crop: "cucumber",
    alsoCrops: ["tomato", "paprika", "strawberry", "melon"],
    symptoms: ["growth", "yellow-leaf"],
    seasonal: true,
    summary: "해가 짧아지며 생장이 느려지고 잎색이 옅어지며 착과가 떨어진다",
    cause: "지온·야간 온도 부족과 광 부족이 겹칩니다. 뿌리가 식으면 양분 흡수가 멈춥니다.",
    actions: [
      "지온을 먼저 올립니다 (멀칭·바닥 보온). 공기 온도보다 뿌리 온도",
      "광량 부족 시 보광 검토, 늙은 잎 정리로 빛 들이기",
      "저온기에는 질소를 줄이고 뿌리 활력 위주로",
    ],
    principle: "겨울 생육 정체는 영양 부족이 아니라 온도·빛 부족입니다. 비료를 더 주면 오히려 염류만 쌓입니다.",
    productKeywords: ["지온", "보광", "LED", "멀칭", "뿌리", "활력", "아미노", "오이", "토마토"],
    mustKeywords: ["지온", "보광", "LED", "뿌리 활력", "활력", "저온"],
  },
  {
    slug: "common-yellow-leaf",
    title: "잎이 노랗게 변한다 (작물 공통)",
    crop: "common",
    symptoms: ["yellow-leaf"],
    summary: "아래 잎부터인지, 새잎부터인지, 잎맥만 남는지에 따라 원인이 다름",
    cause: "질소·마그네슘·철 결핍, 과습, 뿌리 손상, 병해 등 원인이 여러 가지입니다.",
    actions: [
      "어느 잎부터 노래지는지 사진을 찍어 둡니다 (아래 잎: 질소·마그네슘 / 새잎: 철·황)",
      "뿌리를 뽑아 색과 냄새를 봅니다. 갈색·냄새면 과습·뿌리병",
      "원인을 모른 채 영양제를 먼저 주지 않습니다",
    ],
    principle: "노란 잎은 증상이지 병명이 아닙니다. 어느 잎부터인지가 원인을 가릅니다.",
    productKeywords: [],
    noProducts: true,
  },
  {
    slug: "common-sudden-wilt",
    title: "갑자기 시든다 (작물 공통)",
    crop: "common",
    symptoms: ["wilting", "root"],
    summary: "낮에 시들었다 밤에 회복하다가 결국 말라 죽는다",
    cause: "뿌리썩음·시들음병·배수 불량·염류 장해·선충 등. 지상부만 봐서는 구분이 안 됩니다.",
    actions: [
      "포기를 뽑아 뿌리와 줄기 단면을 봅니다. 갈변·물관 변색이면 병",
      "주변 포기로 번지는지 며칠 지켜봅니다",
      "배수와 염류(EC)부터 점검, 그다음 병 진단",
    ],
    principle: "시듦은 뿌리를 봐야 압니다. 사진 진단이나 문의로 원인을 먼저 가리고 자재는 그다음입니다.",
    productKeywords: [],
    noProducts: true,
  },
];

export function getProblem(slug: string): Problem | null {
  return PROBLEMS.find((p) => p.slug === slug) ?? null;
}

export function getCrop(key: string): Crop | null {
  return CROPS.find((c) => c.key === key) ?? null;
}

export function getSymptom(key: string): Symptom | null {
  return SYMPTOMS.find((s) => s.key === key) ?? null;
}

export function problemsByCrop(key: CropKey): Problem[] {
  // 작물 페이지에는 공통 문제도 끝에 붙임
  const own = PROBLEMS.filter((p) => p.crop === key || p.alsoCrops?.includes(key));
  const common = PROBLEMS.filter((p) => p.crop === "common" && !own.includes(p));
  return own.concat(common);
}

export function problemsBySymptom(key: SymptomKey): Problem[] {
  return PROBLEMS.filter((p) => p.symptoms.includes(key));
}

export function seasonalProblems(): Problem[] {
  return PROBLEMS.filter((p) => p.seasonal);
}
