export type CreativeSeedRole =
  | "CHARACTER"
  | "PLACE"
  | "SUBJECT"
  | "OBJECT"
  | "PRODUCT"
  | "WORLD"
  | "GENRE"
  | "FORMAT"
  | "TONE"
  | "EMOTION"
  | "ENDING"
  | "AUDIENCE"
  | "THEME"
  | "UNKNOWN";

export type CreativeSeed = {
  text: string;
  role: CreativeSeedRole;
  confidence: "EXPLICIT" | "INFERRED";
};

export type CreativeBrief = {
  version: "JOPD_CREATIVE_BRIEF_V1";

  originalInput: string;

  seeds: CreativeSeed[];

  characters: string[];
  places: string[];
  subjects: string[];
  products: string[];
  worlds: string[];

  genres: string[];
  formats: string[];

  tones: string[];
  emotions: string[];
  endingConditions: string[];

  audience?: string[];

  creativeIntent: {
    desiredAudienceJourney: string[];
    mustPreserve: string[];
    openForCreation: string[];
  };

  intelligenceNeeds: {
    khosHumanMemory: boolean;
    broadcastIntelligence: boolean;
    characterIntelligence: boolean;
    jopdCreativeMemory: boolean;
    currentReality: boolean;
    workMemory: boolean;
  };

  nextEngines: Array<
    | "CHARACTER_LAB"
    | "STORY_LAB"
    | "FORMAT_ENGINE"
    | "SCRIPT_ENGINE"
    | "PRODUCTION_ENGINE"
  >;

  unresolved: string[];
};

/*
 * Creative Interpreter V1
 *
 * 역할:
 * 조PD가 던지는 짧은 단어/문장을
 * 곧바로 대본으로 만들어버리지 않고
 * 창작 시스템이 사용할 Creative Brief로 변환한다.
 *
 * 중요:
 * - 사실을 발명하지 않는다.
 * - UNKNOWN을 억지 분류하지 않는다.
 * - 이 단계에서는 좋은 이야기를 만들지 않는다.
 * - 이야기 창작은 Story Lab의 책임이다.
 * - 캐릭터 창작은 Character Lab의 책임이다.
 */

const CHARACTER_WORDS = [
  "판매왕",
  "할머니",
  "할아버지",
  "아버지",
  "어머니",
  "엄마",
  "아빠",
  "아들",
  "딸",
  "농부",
  "농민",
  "청년농부",
  "귀농인",
  "영업사원",
];

const PLACE_HINTS = [
  "농촌",
  "농가",
  "마을",
  "시장",
  "농장",
  "과수원",
  "논",
  "밭",
];

const PRODUCT_HINTS = [
  "PV5",
  "EV3",
  "EV4",
  "EV5",
  "EV6",
  "EV9",
  "봉고",
  "레이",
];

const GENRE_WORDS = [
  "시트콤",
  "예능",
  "코미디",
  "다큐",
  "다큐멘터리",
  "휴먼다큐",
  "광고",
  "드라마",
  "뉴스",
  "홈쇼핑",
  "라디오",
  "숏폼",
];

const FORMAT_WORDS = [
  "관찰예능",
  "페이크다큐",
  "다큐패러디",
  "뉴스패러디",
  "홈쇼핑패러디",
  "스포츠중계패러디",
  "동물프로패러디",
  "반전광고",
  "감동광고",
  "라디오꽁트",
  "보이는라디오",
];

const TONE_WORDS = [
  "웃긴",
  "웃기다",
  "유쾌한",
  "황당한",
  "엉뚱한",
  "진지한",
  "따뜻한",
  "잔잔한",
];

const EMOTION_WORDS = [
  "웃음",
  "감동",
  "눈물",
  "슬픔",
  "행복",
  "긴장",
  "놀람",
  "반전",
];

const ENDING_WORDS = [
  "해피엔딩",
  "새드엔딩",
  "반전엔딩",
  "열린결말",
];

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function tokenize(input: string) {
  return unique(
    input
      .replace(/[,\n/|]+/g, " ")
      .split(/\s+/)
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function includesAny(value: string, dictionary: string[]) {
  return dictionary.some(
    (candidate) =>
      value === candidate ||
      value.includes(candidate)
  );
}

function classifySeed(text: string): CreativeSeed {
  if (includesAny(text, CHARACTER_WORDS)) {
    return {
      text,
      role: "CHARACTER",
      confidence: "EXPLICIT",
    };
  }

  if (
    text.endsWith("시") ||
    text.endsWith("군") ||
    text.endsWith("도") ||
    includesAny(text, PLACE_HINTS)
  ) {
    return {
      text,
      role: "PLACE",
      confidence: "EXPLICIT",
    };
  }

  if (includesAny(text.toUpperCase(), PRODUCT_HINTS)) {
    return {
      text,
      role: "PRODUCT",
      confidence: "EXPLICIT",
    };
  }

  if (includesAny(text, FORMAT_WORDS)) {
    return {
      text,
      role: "FORMAT",
      confidence: "EXPLICIT",
    };
  }

  if (includesAny(text, GENRE_WORDS)) {
    return {
      text,
      role: "GENRE",
      confidence: "EXPLICIT",
    };
  }

  if (includesAny(text, ENDING_WORDS)) {
    return {
      text,
      role: "ENDING",
      confidence: "EXPLICIT",
    };
  }

  if (includesAny(text, EMOTION_WORDS)) {
    return {
      text,
      role: "EMOTION",
      confidence: "EXPLICIT",
    };
  }

  if (includesAny(text, TONE_WORDS)) {
    return {
      text,
      role: "TONE",
      confidence: "EXPLICIT",
    };
  }

  return {
    text,
    role: "UNKNOWN",
    confidence: "EXPLICIT",
  };
}

export function interpretCreativeInput(
  input: string
): CreativeBrief {
  const originalInput = input.trim();

  if (!originalInput) {
    throw new Error("Creative input이 비어 있습니다.");
  }

  const seeds = tokenize(originalInput).map(classifySeed);

  const byRole = (role: CreativeSeedRole) =>
    unique(
      seeds
        .filter((seed) => seed.role === role)
        .map((seed) => seed.text)
    );

  const characters = byRole("CHARACTER");
  const places = byRole("PLACE");
  const products = byRole("PRODUCT");
  const genres = byRole("GENRE");
  const formats = byRole("FORMAT");
  const tones = byRole("TONE");
  const emotions = byRole("EMOTION");
  const endingConditions = byRole("ENDING");

  const unknown = byRole("UNKNOWN");

  const desiredAudienceJourney = [
    ...emotions,
    ...endingConditions,
  ];

  const mustPreserve = unique([
    ...characters,
    ...places,
    ...products,
    ...genres,
    ...formats,
    ...tones,
    ...emotions,
    ...endingConditions,
  ]);

  return {
    version: "JOPD_CREATIVE_BRIEF_V1",

    originalInput,

    seeds,

    characters,
    places,
    subjects: unknown,
    products,
    worlds: [],

    genres,
    formats,

    tones,
    emotions,
    endingConditions,

    creativeIntent: {
      desiredAudienceJourney,
      mustPreserve,
      openForCreation: [
        "새로운 조연 캐릭터",
        "인물 관계",
        "인물의 욕망과 결함",
        "핵심 사건",
        "갈등",
        "정보 비대칭",
        "웃음 메커니즘",
        "감정 전환",
        "포맷 후보",
        "장면",
        "대사",
        "회수",
      ],
    },

    intelligenceNeeds: {
      khosHumanMemory: true,
      broadcastIntelligence: true,
      characterIntelligence: true,
      jopdCreativeMemory: true,
      currentReality:
        places.length > 0 ||
        products.length > 0,
      workMemory: true,
    },

    nextEngines: [
      "CHARACTER_LAB",
      "STORY_LAB",
      "FORMAT_ENGINE",
      "SCRIPT_ENGINE",
      "PRODUCTION_ENGINE",
    ],

    unresolved: unknown,
  };
}
