/**
 * JOPD IDEA MUTATION LAB V1
 *
 * PURPOSE
 * -------
 * 첫 아이디어를 바로 대본으로 쓰지 않는다.
 *
 * 평범한 장면 하나를 서로 다른 창작 원리로 강제 변이하고,
 * 상투적이거나 설명적인 후보를 죽이고,
 * 카메라로 먼저 작동하는 아이디어만 Story/Dialogue 단계로 보낸다.
 *
 * VERIFIED CREATIVE PRINCIPLE
 * ---------------------------
 * IDEA
 * → DIVERGENCE
 * → MUTATION
 * → KILL SAFE IDEAS
 * → VERSION B
 * → VISUAL / CHARACTER / ESCALATION / CALLBACK / AI-SMELL
 * → SURVIVOR
 *
 * 이 모듈은 작품 사실을 만드는 Reality Engine이 아니다.
 * 결과는 CREATED creative hypothesis다.
 */

export const IDEA_MUTATION_AXES = [
  "용도가 즉시 바뀐다",
  "소유권에 대한 생각이 다르다",
  "반환하거나 끝내려 했는데 아직 끝낼 수 없다",
  "완료하는 순간 새로운 일이 시작된다",
  "주인공만 상황을 완전히 잘못 이해한다",
  "상대 인물만 다음 일을 알고 있다",
  "상대가 주인공의 시스템을 자기 방식으로 이용한다",
  "주인공의 해결책 때문에 일이 더 커진다",
  "물건보다 빈 공간이 중요해진다",
  "물건의 일부만 필요하다",
  "끝난 줄 알았던 같은 물건이 다시 필요해진다",
  "행동 순서 자체가 틀렸다",
  "물건이나 행동이 다음 목적지를 결정한다",
  "누구도 소유권 자체에는 관심이 없다",
  "주인공이 완료 처리한 뒤 진짜 사건이 시작된다",
  "이상한 행동이 잠시 뒤 합리적으로 보인다",
  "상대의 생활 행동이 주인공의 체면을 무너뜨린다",
  "말 한마디 없이 정보 격차가 뒤집힌다",
  "처음 웃긴 행동이 후반에 다른 의미로 회수될 수 있다",
  "앞선 축과 겹치지 않는 자유 변이",
] as const;

export type IdeaMutationAxis = (typeof IDEA_MUTATION_AXES)[number];

export interface IdeaMutationContext {
  situation: string;

  protagonist: {
    name: string;
    behaviorRule: string;
    want?: string;
  };

  counterparts: Array<{
    name: string;
    behaviorRule: string;
    knowledge?: string;
  }>;

  knownFacts?: string[];
  continuityConstraints?: string[];
  realityWarnings?: string[];
}

export interface IdeaMutationCandidate {
  id: number;
  axis: IdeaMutationAxis;

  firstVisibleAction: string;
  protagonistExpectation: string;
  actualEvent: string;

  characterCausality: string;
  forcedNextEvent: string;

  versionB?: string;

  scores?: {
    visual: number;
    character: number;
    escalation: number;
    callback: number;
    aiSmell: number;
  };

  status?: "SURVIVE" | "KILL";
  killReason?: string;
}

export interface IdeaMutationResult {
  version: "JOPD_IDEA_MUTATION_V1";
  truthClass: "CREATED";

  mutations: IdeaMutationCandidate[];

  survivors: IdeaMutationCandidate[];

  best?: IdeaMutationCandidate;

  realityCheckRequired: string[];
}

const FORBIDDEN_SHORTCUTS = [
  "그냥 고마워한다",
  "추억을 설명한다",
  "숨겨진 편지나 사진이나 돈으로 해결한다",
  "갑작스러운 사고나 질병으로 긴장을 만든다",
  "동물 등장 자체를 웃음으로 사용한다",
  "사투리 자체를 웃음으로 사용한다",
  "넘어짐이나 물벼락만으로 웃긴다",
  "확인되지 않은 제품 기능을 발명한다",
  "교훈을 대사로 설명한다",
  "우연으로 해결한다",
  "소품만 바꾼 같은 아이디어를 반복한다",
] as const;

export function buildIdeaMutationPrompt(
  context: IdeaMutationContext,
): string {
  const counterpartText = context.counterparts
    .map(
      (person) =>
        `- ${person.name}: ${person.behaviorRule}${
          person.knowledge ? ` / 알고 있는 것: ${person.knowledge}` : ""
        }`,
    )
    .join("\n");

  const facts = (context.knownFacts ?? [])
    .map((value) => `- ${value}`)
    .join("\n");

  const continuity = (context.continuityConstraints ?? [])
    .map((value) => `- ${value}`)
    .join("\n");

  const warnings = (context.realityWarnings ?? [])
    .map((value) => `- ${value}`)
    .join("\n");

  return `
당신은 조PD AI 작가실의 IDEA MUTATION LAB이다.

대본을 바로 쓰지 않는다.
첫 아이디어를 사랑하지 않는다.
평범한 상황 하나에서 서로 다른 창작 원리의 사건을 발명한다.

[상황]
${context.situation}

[주인공]
- ${context.protagonist.name}
- 반복 행동 규칙: ${context.protagonist.behaviorRule}
${context.protagonist.want ? `- 현재 욕망: ${context.protagonist.want}` : ""}

[상대 인물]
${counterpartText || "- 없음"}

[확정 사실]
${facts || "- 별도 확정 사실 없음"}

[연속성 제약]
${continuity || "- 별도 제약 없음"}

[Reality 경고]
${warnings || "- 별도 경고 없음"}

==================================================
핵심 원칙
==================================================

좋은 아이디어는 설명을 듣고 좋아지는 아이디어가 아니다.

카메라가 먼저 보여 준다.

관객:
"뭐 하는 거야?"
→ 잠시 뒤
"아 그래서!"
또는
"아니 왜 일이 저렇게 커져?"

가 되어야 한다.

예상 밖이어야 하지만
나중에 보면 이 인물이라서 벌어진 일이어야 한다.

기괴함은 창의성이 아니다.
우연은 창의성이 아니다.
작가의 명언은 창의성이 아니다.

==================================================
MUTATION AXES
==================================================

${IDEA_MUTATION_AXES.map(
  (axis, index) =>
    `${String(index + 1).padStart(2, "0")}. ${axis}`,
).join("\n")}

정확히 20개를 만든다.
각 축을 정확히 한 번 사용한다.

각 후보는 반드시:

1. 화면에서 처음 보이는 행동
2. 주인공이 예상하는 것
3. 실제로 벌어지는 것
4. 왜 이 인물들이라서 벌어지는가
5. 무엇이 다음 사건을 강제하는가

를 가진다.

==================================================
FORBIDDEN SHORTCUTS
==================================================

${FORBIDDEN_SHORTCUTS.map((value) => `- ${value}`).join("\n")}

==================================================
KILL ROUND
==================================================

20개를 만든 뒤 안전하고 평범한 절반을 죽인다.

특히 죽여라:

- 설명해야 재미있는 아이디어
- 어디서 본 듯한 따뜻한 이야기
- 인물 이름을 바꿔도 그대로 성립하는 사건
- 다음 장면을 만들지 못하는 일회성 개그
- 같은 구조를 소품만 바꾼 후보
- "주인공이 틀리고 현지인이 맞다"만 반복하는 후보

==================================================
VERSION B
==================================================

살아남은 후보 중 가장 다른 5개를 고른다.

각 후보에 VERSION B를 만든다.

VERSION B는 더 황당하게 만드는 것이 아니다.

인물의:
- 욕망
- 고집
- 체면
- 습관
- 정보 차이

중 하나를 더 끝까지 밀어
빠져나오기 어려운 상황으로 만든다.

==================================================
CHARACTER BALANCE
==================================================

주인공이 항상 틀리고
상대가 항상 현명한 구조를 금지한다.

후보군 안에는 반드시 다음 가능성이 섞여야 한다.

- 주인공의 방식 때문에 문제가 생긴다.
- 주인공의 방식이 실제로 유용하다.
- 상대의 방식 때문에 문제가 생긴다.
- 두 방식이 결합되어야 해결된다.

==================================================
BROADCAST TEST
==================================================

최종 후보 각각을 0~10으로 평가한다.

VISUAL:
대사 없이 첫 5초가 궁금하거나 재미있는가?

CHARACTER:
다른 평범한 인물로 교체하면 사건이 무너지는가?

ESCALATION:
이 사건이 다음 사건을 강제로 만드는가?

CALLBACK:
후반에 다른 의미로 회수할 수 있는가?

AI_SMELL:
'잘 쓴 AI 이야기' 냄새가 얼마나 나는가?
높을수록 나쁘다.

AI_SMELL이 높은 후보는 죽인다.

==================================================
REALITY FIREWALL
==================================================

창작적으로 좋은 아이디어라도
제품 기능, 농업 작업 방식, 지역 관습, 안전,
물리적 가능성을 사실처럼 확정하지 않는다.

검증이 필요한 것은
realityCheckRequired에 따로 적는다.

==================================================
최종 원칙
==================================================

20개를 평균적으로 잘 쓰는 것이 목표가 아니다.

19개가 죽어도 된다.

단 하나라도
"이걸 어떻게 생각했지?"
하면서도
"저 사람이라면 저럴 수 있겠다"
라는 사건을 찾아라.
`.trim();
}

export function validateIdeaMutationResult(
  value: unknown,
): IdeaMutationResult {
  if (!value || typeof value !== "object") {
    throw new Error("IDEA_MUTATION_RESULT_NOT_OBJECT");
  }

  const result = value as Partial<IdeaMutationResult>;

  if (result.version !== "JOPD_IDEA_MUTATION_V1") {
    throw new Error("IDEA_MUTATION_VERSION_INVALID");
  }

  if (result.truthClass !== "CREATED") {
    throw new Error("IDEA_MUTATION_TRUTH_CLASS_INVALID");
  }

  if (!Array.isArray(result.mutations) || result.mutations.length !== 20) {
    throw new Error("IDEA_MUTATION_REQUIRES_EXACTLY_20_MUTATIONS");
  }

  const usedAxes = new Set<string>();

  result.mutations.forEach((candidate, index) => {
    if (candidate.id !== index + 1) {
      throw new Error(`IDEA_MUTATION_ID_INVALID_${index + 1}`);
    }

    if (!IDEA_MUTATION_AXES.includes(candidate.axis)) {
      throw new Error(`IDEA_MUTATION_AXIS_INVALID_${candidate.id}`);
    }

    if (usedAxes.has(candidate.axis)) {
      throw new Error(`IDEA_MUTATION_AXIS_DUPLICATE_${candidate.id}`);
    }

    usedAxes.add(candidate.axis);

    for (const key of [
      "firstVisibleAction",
      "protagonistExpectation",
      "actualEvent",
      "characterCausality",
      "forcedNextEvent",
    ] as const) {
      if (
        typeof candidate[key] !== "string" ||
        candidate[key].trim().length === 0
      ) {
        throw new Error(
          `IDEA_MUTATION_FIELD_INVALID_${candidate.id}_${key}`,
        );
      }
    }
  });

  if (
    !Array.isArray(result.survivors) ||
    result.survivors.length !== 5
  ) {
    throw new Error("IDEA_MUTATION_REQUIRES_EXACTLY_5_SURVIVORS");
  }

  result.survivors.forEach((candidate) => {
    if (!candidate.versionB?.trim()) {
      throw new Error(
        `IDEA_MUTATION_VERSION_B_REQUIRED_${candidate.id}`,
      );
    }

    const scores = candidate.scores;

    if (!scores) {
      throw new Error(
        `IDEA_MUTATION_SCORES_REQUIRED_${candidate.id}`,
      );
    }

    for (const key of [
      "visual",
      "character",
      "escalation",
      "callback",
      "aiSmell",
    ] as const) {
      const score = scores[key];

      if (
        typeof score !== "number" ||
        score < 0 ||
        score > 10
      ) {
        throw new Error(
          `IDEA_MUTATION_SCORE_INVALID_${candidate.id}_${key}`,
        );
      }
    }
  });

  if (!Array.isArray(result.realityCheckRequired)) {
    throw new Error("IDEA_MUTATION_REALITY_CHECK_INVALID");
  }

  return result as IdeaMutationResult;
}
