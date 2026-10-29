export type JopdChannel =
  | "한국농수산TV"
  | "PandaTV"
  | "K-AGRI"
  | "PV5"
  | "기업 홍보영상";

export type JopdDuration =
  | "쇼츠"
  | "3분"
  | "10분"
  | "20분";

export type JopdProgramType =
  | "현장취재"
  | "농민 성공사례"
  | "제품 검증"
  | "농법 소개"
  | "다큐멘터리"
  | "뉴스형"
  | "인터뷰"
  | "기업 홍보영상";

export type StudioAnalyzeInput = {
  channel: string;
  duration: string;
  programType: string;
  sourceUrl?: string;
  memo?: string;
  sourceText?: string;
  fileNames?: string[];
};

export type PdJudgement = {
  whyNow: string;
  audienceQuestion: string;
  strongestPerson: string;
  strongestNumber: string;
  conflict: string;
  twist: string;
  firstFiveSeconds: string;
  additionalShooting: string[];
};

export type StoryBeat = {
  order: number;
  section: string;
  purpose: string;
  content: string;
};

export type JopdAnalysis = {
  engine: string;
  version: string;

  channel: string;
  duration: string;
  programType: string;

  materialSummary: string;

  pdJudgement: PdJudgement;

  titleCandidates: string[];
  thumbnailCandidates: string[];

  openingHook: string;
  coreMessage: string;

  storyStructure: StoryBeat[];

  interviewQuestions: string[];
  shootingChecklist: string[];

  warnings: string[];

  nextAction: string;
};


/**
 * 조PD 방송 판단 원칙
 *
 * 이 엔진은 단순 요약기가 아니다.
 *
 * 자료
 * → 방송 가치 판단
 * → 시청자 질문
 * → 인물
 * → 숫자
 * → 갈등
 * → 반전
 * → 첫 장면
 * → 전체 구성
 *
 * 순서로 판단한다.
 */

export function analyzeWithJopdEngine(
  input: StudioAnalyzeInput,
): JopdAnalysis {
  const channel =
    input.channel?.trim() || "한국농수산TV";

  const duration =
    input.duration?.trim() || "10분";

  const programType =
    input.programType?.trim() || "현장취재";

  const memo = input.memo?.trim() || "";
  const sourceText = input.sourceText?.trim() || "";

  const combinedMaterial = [
    sourceText,
    memo,
    input.sourceUrl || "",
    ...(input.fileNames || []),
  ]
    .filter(Boolean)
    .join("\n");

  const materialSummary =
    combinedMaterial.length > 0
      ? combinedMaterial.slice(0, 500)
      : "아직 분석할 원문 자료가 입력되지 않았습니다.";

  const channelRule = getChannelRule(channel);

  const durationRule = getDurationRule(duration);

  const pdJudgement: PdJudgement = {
    whyNow:
      "이 소재가 지금 시청자에게 필요한 이유를 가장 먼저 찾아야 합니다.",

    audienceQuestion:
      channelRule.audienceQuestion,

    strongestPerson:
      "자료 속에서 변화·성과·갈등을 직접 겪은 사람을 중심인물로 선정합니다.",

    strongestNumber:
      "매출, 생산량, 면적, 기간, 비용, 수익률처럼 화면에 크게 제시할 수 있는 숫자를 우선 탐색합니다.",

    conflict:
      "방송 전반을 끌고 갈 문제 → 시도 → 결과의 구조를 찾습니다.",

    twist:
      "시청자의 예상과 실제 결과가 다른 지점을 탐색합니다.",

    firstFiveSeconds:
      durationRule.firstFiveSeconds,

    additionalShooting:
      [
        "주인공 얼굴 클로즈업",
        "현장을 한눈에 보여주는 와이드샷",
        "핵심 숫자를 증명하는 실제 장면",
        "문제가 발생한 대상의 상세 화면",
        "결과를 비교할 수 있는 전·후 장면",
      ],
  };

  return {
    engine: "JOPD PD ENGINE",
    version: "0.1.0",

    channel,
    duration,
    programType,

    materialSummary,

    pdJudgement,

    titleCandidates: [
      makeTitle(channel, programType, 1),
      makeTitle(channel, programType, 2),
      makeTitle(channel, programType, 3),
    ],

    thumbnailCandidates: [
      "결과를 가장 강한 숫자 하나로 표현",
      "주인공 얼굴 + 핵심 결과",
      "문제 장면과 결과 장면을 대비",
    ],

    openingHook:
      durationRule.openingHook,

    coreMessage:
      channelRule.coreMessage,

    storyStructure:
      buildStoryStructure(
        duration,
        programType,
      ),

    interviewQuestions:
      buildInterviewQuestions(channel),

    shootingChecklist:
      buildShootingChecklist(programType),

    warnings: [
      "광고성 표현보다 실제 근거와 현장 확인을 우선할 것",
      "자료에 없는 숫자나 효과를 임의로 만들지 말 것",
      "제품 효과와 농민 개인 경험을 구분할 것",
      "첫 장면에서 설명부터 시작하지 말 것",
    ],

    nextAction:
      "AI 분석 모델을 연결해 입력 자료에서 실제 인물·숫자·갈등·반전을 추출합니다.",
  };
}


function getChannelRule(channel: string) {
  switch (channel) {
    case "한국농수산TV":
      return {
        audienceQuestion:
          "농민에게 실제로 도움이 되는가? 돈을 벌거나 손실을 줄일 수 있는가?",
        coreMessage:
          "농민이 보고 나서 실제 농사에서 무엇을 해야 하는지가 남아야 합니다.",
      };

    case "PandaTV":
      return {
        audienceQuestion:
          "판다의 행동과 관계에서 시청자가 감정을 느낄 장면은 무엇인가?",
        coreMessage:
          "정보보다 캐릭터와 감정의 흐름을 중심으로 이야기를 만듭니다.",
      };

    case "PV5":
      return {
        audienceQuestion:
          "이 차량이나 기능이 실제 사용자의 일과 생활을 어떻게 바꾸는가?",
        coreMessage:
          "스펙 나열보다 실제 사용 상황과 효용을 보여줍니다.",
      };

    case "K-AGRI":
      return {
        audienceQuestion:
          "이 정보가 농업의 판단과 행동을 어떻게 바꾸는가?",
        coreMessage:
          "자료를 행동 가능한 농업 정보로 바꾸는 것이 핵심입니다.",
      };

    default:
      return {
        audienceQuestion:
          "시청자가 이 기업이나 제품을 왜 알아야 하는가?",
        coreMessage:
          "기업의 주장보다 고객이 얻는 실제 변화를 보여줍니다.",
      };
  }
}


function getDurationRule(duration: string) {
  switch (duration) {
    case "쇼츠":
      return {
        firstFiveSeconds:
          "결론 또는 가장 놀라운 장면을 1~2초 안에 먼저 보여줍니다.",
        openingHook:
          "설명 없이 가장 강한 결과부터 시작합니다.",
      };

    case "3분":
      return {
        firstFiveSeconds:
          "문제와 결과를 동시에 암시하는 장면으로 시작합니다.",
        openingHook:
          "15초 안에 왜 끝까지 봐야 하는지 약속합니다.",
      };

    case "20분":
      return {
        firstFiveSeconds:
          "전체 이야기의 결말을 궁금하게 만드는 결정적 장면을 먼저 보여줍니다.",
        openingHook:
          "강한 장면 → 질문 → 인물 소개 순서로 진입합니다.",
      };

    default:
      return {
        firstFiveSeconds:
          "가장 강한 인물·숫자·결과 중 하나를 먼저 보여줍니다.",
        openingHook:
          "첫 30초 안에 문제, 인물, 시청 이유를 제시합니다.",
      };
  }
}


function makeTitle(
  channel: string,
  programType: string,
  version: number,
) {
  if (channel === "한국농수산TV") {
    if (version === 1)
      return "농민들이 주목해야 할 진짜 이유, 현장에서 확인했습니다";

    if (version === 2)
      return "말로만 듣던 방법, 실제 농가에서 확인해봤습니다";

    return "결과가 이렇게 다릅니다… 농민이 직접 보여줬습니다";
  }

  if (channel === "PandaTV") {
    if (version === 1)
      return "아무도 예상하지 못한 판다의 행동";

    if (version === 2)
      return "이 장면을 본 순간 모두가 웃었습니다";

    return "판다가 보여준 뜻밖의 반응";
  }

  return `${programType}에서 확인한 예상 밖의 결과 ${version}`;
}


function buildStoryStructure(
  duration: string,
  programType: string,
): StoryBeat[] {
  if (duration === "쇼츠") {
    return [
      {
        order: 1,
        section: "0~3초",
        purpose: "스크롤 정지",
        content: "가장 강한 결과 또는 장면",
      },
      {
        order: 2,
        section: "3~12초",
        purpose: "궁금증",
        content: "왜 이런 결과가 나왔는지 질문",
      },
      {
        order: 3,
        section: "12~35초",
        purpose: "증명",
        content: "핵심 장면과 숫자",
      },
      {
        order: 4,
        section: "35~50초",
        purpose: "반전",
        content: "예상과 다른 사실",
      },
      {
        order: 5,
        section: "50~60초",
        purpose: "결론",
        content: "시청자가 기억할 한 문장",
      },
    ];
  }

  return [
    {
      order: 1,
      section: "오프닝",
      purpose: "시청 지속",
      content: "가장 강한 장면과 결과를 먼저 공개",
    },
    {
      order: 2,
      section: "문제 제기",
      purpose: "시청 이유 형성",
      content: "현장에서 해결해야 할 문제 제시",
    },
    {
      order: 3,
      section: "인물",
      purpose: "감정 연결",
      content: "문제를 직접 겪은 중심인물 등장",
    },
    {
      order: 4,
      section: "시도",
      purpose: "과정",
      content: `${programType}의 핵심 과정과 선택을 보여줌`,
    },
    {
      order: 5,
      section: "검증",
      purpose: "신뢰",
      content: "숫자·비교·현장 화면으로 결과 확인",
    },
    {
      order: 6,
      section: "반전",
      purpose: "재집중",
      content: "예상과 달랐던 사실 또는 변수",
    },
    {
      order: 7,
      section: "결론",
      purpose: "행동",
      content: "시청자가 기억하고 행동할 한 가지",
    },
  ];
}


function buildInterviewQuestions(
  channel: string,
): string[] {
  const base = [
    "처음 가장 큰 문제는 무엇이었습니까?",
    "그 문제 때문에 실제로 어떤 손해를 봤습니까?",
    "왜 이 방법을 선택했습니까?",
    "하기 전과 후가 가장 크게 달라진 것은 무엇입니까?",
    "숫자로 설명하면 어느 정도 차이가 납니까?",
    "예상과 달랐던 점은 무엇입니까?",
    "다시 한다면 무엇을 다르게 하시겠습니까?",
  ];

  if (channel === "한국농수산TV") {
    base.push(
      "다른 농민에게 딱 한 가지만 알려준다면 무엇입니까?",
    );
  }

  return base;
}


function buildShootingChecklist(
  programType: string,
): string[] {
  return [
    "현장 전체 와이드",
    "주인공 작업 장면",
    "주인공 인터뷰",
    "손·도구·작물 등 디테일",
    "문제 상태 클로즈업",
    "결과 상태 클로즈업",
    "전후 비교 화면",
    "핵심 숫자의 근거 화면",
    `${programType} 핵심 과정`,
    "엔딩용 자연스러운 현장 장면",
  ];
}
