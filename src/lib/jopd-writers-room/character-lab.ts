import type {
  CreativeBrief,
} from "./creative-interpreter";

export type CharacterCandidate = {
  id: string;
  name: string;
  roleInStory: string;

  surface: {
    ageRange?: string;
    occupation?: string;
    visibleTraits: string[];
  };

  engine: {
    wants: string[];
    needsButDoesNotKnow: string[];
    fears: string[];
    falseBeliefs: string[];
    contradictions: string[];
    flaws: string[];
    pride: string[];
    secrets: string[];
  };

  behavior: {
    underPressure: string[];
    repeatedHabits: string[];
    neverDoes: string[];
    physicalBehaviors: string[];
  };

  voice: {
    speechRhythm: string;
    vocabulary: string[];
    verbalHabits: string[];
    avoidsSaying: string[];
    sampleLines: string[];
  };

  relationshipHooks: Array<{
    withCharacter: string;
    wantsFromThem: string;
    conflict: string;
    hiddenFeeling: string;
    statusDynamic: string;
  }>;

  storyPower: {
    comedyGenerators: string[];
    emotionGenerators: string[];
    conflictGenerators: string[];
    episodeGenerators: string[];
    callbackPotential: string[];
  };

  arc: {
    startingState: string;
    canChange: string[];
    mustNotChange: string[];
    possiblePayoff: string[];
  };

  originalityCheck: {
    stereotypeRisks: string[];
    differentiators: string[];
  };
};

export type CharacterLabResult = {
  version: "JOPD_CHARACTER_LAB_V1";
  truthClass: "CREATED";

  sourceBrief: {
    originalInput: string;
    characters: string[];
    places: string[];
    products: string[];
    emotions: string[];
    endingConditions: string[];
  };

  existingCharacters: string[];

  candidates: CharacterCandidate[];

  ensembleDesign: {
    centralRelationship: string;
    relationshipTensions: string[];
    missingCharacterFunctions: string[];
  };

  auditionQuestions: string[];

  nextStep:
    | "JOPD_CHARACTER_SELECTION"
    | "STORY_LAB";
};

/*
 * Character Lab 원칙
 *
 * 캐릭터는 프로필이 아니라 STORY GENERATOR다.
 *
 * 좋은 캐릭터는:
 * 1. 원하는 것이 있다.
 * 2. 결함과 모순이 있다.
 * 3. 다른 인물과 부딪힌다.
 * 4. 압박받으면 고유한 행동을 한다.
 * 5. 고유한 말의 리듬이 있다.
 * 6. 반복 가능한 웃음 장치가 있다.
 * 7. 감정적으로 드러날 약점이 있다.
 * 8. 여러 에피소드를 발생시킬 수 있다.
 *
 * 금지:
 * - "착하지만 따뜻하다" 같은 형용사 프로필
 * - 농촌/연령/직업에 대한 상투적 고정관념
 * - 모든 인물이 같은 말투
 * - 웃기기만 하는 일회용 캐릭터
 * - 감동을 위해 갑자기 성격이 바뀌는 인물
 * - 실제 인물에 대한 확인되지 않은 사실 생성
 */

export function buildCharacterLabInput(
  brief: CreativeBrief
) {
  return {
    mission:
      "Creative Brief를 바탕으로 반복 출연 가능한 캐릭터 후보와 관계 엔진을 설계한다.",

    truthClass: "CREATED",

    constraints: {
      preserve:
        brief.creativeIntent.mustPreserve,

      audienceJourney:
        brief.creativeIntent.desiredAudienceJourney,

      places: brief.places,
      products: brief.products,

      existingCharacters:
        brief.characters,

      requiredCandidateCount: 3,

      requirements: [
        "후보 3명은 서로 기능과 성격이 확실히 달라야 한다.",
        "각 후보는 판매왕 또는 기존 중심인물과 충돌할 이유가 있어야 한다.",
        "웃음과 감정을 모두 발생시킬 잠재력이 있어야 한다.",
        "대사는 성격 설명이 아니라 캐릭터의 욕망과 관계에서 나와야 한다.",
        "각 후보는 최소 5개 이상의 다른 에피소드 씨앗을 발생시킬 수 있어야 한다.",
        "캐릭터의 결함이 웃음의 원인이 될 수 있어야 한다.",
        "캐릭터의 숨은 욕망 또는 결핍이 감정의 원인이 될 수 있어야 한다.",
        "지역·농업·연령에 대한 상투적 고정관념에 의존하지 않는다.",
        "확인되지 않은 현실 정보는 캐릭터 사실로 만들지 않는다.",
      ],

      outputUse:
        "조PD가 후보를 선택·수정한 뒤 Character Bible과 Story Lab으로 넘긴다.",
    },
  };
}
