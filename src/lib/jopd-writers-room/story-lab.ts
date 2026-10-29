import type { CreativeBrief } from "./creative-interpreter";

export type StoryDialogueFuel = {
  AWant: string;
  BWant: string;
  informationGap: string;
  power: string;
  unspokenTruth: string;
};

export type StoryBeat = {
  order: number;
  beat: string;
  because: string;
  therefore: string;
  dialogueFuel: StoryDialogueFuel;
};

export type StoryCandidate = {
  id: string;
  title: string;

  logline: string;
  hook: string;

  eventCause: string;
  centralConflict: string;
  protagonistChoice: string;
  emotionalReversal: string;
  payoff: string;

  pv5Function: string;
  comedicMechanism: string;
  stakes: string;

  beats: StoryBeat[];

  dialogueFuel: StoryDialogueFuel;

  selfCheck: {
    causalChain: string;
    humorChangesPlot: boolean;
    emotionRequiresExposition: boolean;
    pv5Replaceability: string;
    realCostForProtagonist: string;
    seedPayoff: string;
    risk: string;
  };
};

export type StoryLabResult = {
  version: "JOPD_STORY_LAB_V1";
  truthClass: "CREATED";
  candidates: StoryCandidate[];
};

export function buildStoryLabInput(
  brief: CreativeBrief
) {
  return {
    mission:
      "짧은 Creative Brief에서 서로 다른 강한 방송 구성안 3개를 만든다.",

    truthClass: "CREATED",

    source: {
      originalInput: brief.originalInput,
      mustPreserve:
        brief.creativeIntent.mustPreserve,
      audienceJourney:
        brief.creativeIntent.desiredAudienceJourney,
      characters: brief.characters,
      places: brief.places,
      products: brief.products,
      genres: brief.genres,
      formats: brief.formats,
    },

    requirements: [
      "구성안은 정확히 3개다.",

      "세 구성안은 같은 줄거리를 포맷만 바꾼 것이어서는 안 된다.",

      "각 구성안의 핵심 사건 발생 원인과 주인공의 선택이 달라야 한다.",

      "장면은 나열하지 않고 원인과 결과로 연결한다.",

      "각 beat는 이전 사건 때문에 발생하고 다음 사건을 발생시켜야 한다.",

      "주인공은 최소 한 번 실제 선택을 해야 하며 그 선택에는 결과가 있어야 한다.",

      "웃음은 농담 삽입이 아니라 인물의 욕망, 오해, 행동, 관계 충돌에서 발생해야 한다.",

      "웃긴 사건은 상황 또는 관계를 변화시켜야 한다.",

      "감동은 인물이 감정을 설명해서 만들지 않는다.",

      "앞에서 웃음이나 일상으로 보였던 행동, 물건, 습관, 관계가 뒤에서 다른 의미로 발견되게 할 수 있다.",

      "해피엔딩이라도 문제를 우연이나 설명으로 해결하지 않는다.",

      "엔딩은 앞에서 심은 요소를 최소 하나 회수한다.",

      "제품은 광고 문구처럼 끼워 넣지 않고 사건 또는 인물 선택에 기능적으로 연결한다.",

      "확인되지 않은 현실 정보는 사실처럼 만들지 않는다.",

      "각 구성안에는 이후 Dialogue Engine이 대사를 만들 수 있도록 장면별 욕망 충돌과 말하지 않는 진실을 남긴다.",
    ],

    qualityGate: {
      rejectIf: [
        "첫 장면부터 상황 설명만 한다.",
        "우연이 연속해서 사건을 해결한다.",
        "악역 한 명 때문에 모든 갈등이 생긴다.",
        "모든 인물이 주인공에게 협조적이다.",
        "웃음 장면을 빼도 줄거리가 그대로다.",
        "감동 장면을 대사로 설명해야만 이해된다.",
        "PV5를 다른 아무 물건으로 바꿔도 이야기가 동일하다.",
        "세 구성안의 인물 이름과 포맷만 다르고 사건 구조가 같다.",
      ],
    },
  };
}
