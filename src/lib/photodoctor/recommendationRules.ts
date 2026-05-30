export type RecommendationMode = "show_products" | "no_product";

export type IssueCategory = "insect" | "fungus" | "unknown";

export type ProductLink = {
  name: string;
  label: string;
  reason: string;
  caution: string;
  href: string;
};

export type RecommendationResult = {
  mode: RecommendationMode;
  category: IssueCategory;
  title: string;
  message: string;
};

function safeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalize(value: unknown) {
  return safeText(value).toLowerCase().replace(/\s+/g, "");
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(normalize(word)));
}

function getFinalDiagnosisText(result: any) {
  return normalize(
    result?.diagnosis ||
      result?.possible_causes?.[0]?.name ||
      result?.final_judgement ||
      ""
  );
}

function collectAllDiagnosisText(result: any) {
  const parts: string[] = [];

  parts.push(safeText(result?.diagnosis));
  parts.push(safeText(result?.final_judgement));

  if (Array.isArray(result?.possible_causes)) {
    for (const c of result.possible_causes) {
      parts.push(safeText(c?.name));
      parts.push(safeText(c?.reason));
    }
  }

  if (Array.isArray(result?.symptoms)) {
    for (const s of result.symptoms) parts.push(safeText(s));
  }

  if (Array.isArray(result?.do_now)) {
    for (const s of result.do_now) parts.push(safeText(s));
  }

  if (Array.isArray(result?.must_check)) {
    for (const s of result.must_check) parts.push(safeText(s));
  }

  return normalize(parts.filter(Boolean).join(" "));
}

/**
 * 제품 미노출 고정 키워드
 * - 시들음, 뿌리, 과습, 결핍, 생리장해는 원인이 다양함
 * - 제품을 바로 보여주면 광고처럼 보이고 오남용 위험이 있음
 */
const NO_PRODUCT_KEYWORDS = [
  "시들음",
  "시들음병",
  "시들",
  "위조",
  "뿌리",
  "뿌리썩음",
  "뿌리썩음병",
  "뿌리혹",
  "활착불량",
  "과습",
  "배수",
  "배수불량",
  "침수",
  "건조",
  "수분부족",
  "생리장해",
  "생리장애",
  "영양결핍",
  "결핍",
  "칼슘결핍",
  "마그네슘결핍",
  "붕소결핍",
  "질소결핍",
  "칼륨결핍",
  "인산결핍",
  "고온장해",
  "저온장해",
  "냉해",
  "일소",
  "약해",
  "비료장해",
  "염류",
  "염류장해",
  "가스장해",
  "원인불명",
  "확인필요",
];

/**
 * 해충 키워드
 * - 여기에 걸릴 때만 싹쓰리충 / 싹쓰리충 골드 노출
 */
const INSECT_KEYWORDS = [
  "총채벌레",
  "총채",
  "진딧물",
  "진딧",
  "응애",
  "나방",
  "담배나방",
  "파밤나방",
  "온실가루이",
  "가루이",
  "벼룩잎벌레",
  "굴파리",
  "잎굴파리",
  "노린재",
  "깍지벌레",
  "해충",
  "벌레",
  "충해",
  "유충",
  "성충",
  "알",
  "흡즙",
  "식해",
  "갉아",
  "가해흔",
  "벌레흔적",
];

/**
 * 균·병해 키워드
 * - 여기에 걸릴 때만 멸규니 노출
 * - 잎마름병, 흰가루병, 탄저병, 노균병 등은 균·병해로 분류
 */
const FUNGUS_KEYWORDS = [
  "흰가루병",
  "흰가루",
  "노균병",
  "노균",
  "탄저병",
  "탄저",
  "잿빛곰팡이병",
  "잿빛곰팡이",
  "곰팡이",
  "균핵병",
  "균핵",
  "역병",
  "잎마름병",
  "잎마름",
  "점무늬병",
  "점무늬",
  "갈색무늬병",
  "갈색무늬",
  "검은무늬병",
  "검은무늬",
  "과일썩음병",
  "과실썩음병",
  "썩음병",
  "무름병",
  "반점병",
  "반점",
  "병반",
  "병해",
  "세균병",
  "세균",
];

/**
 * 최종 분류 함수
 *
 * 원칙:
 * 1. 최종진단에 NO_PRODUCT 키워드가 있으면 무조건 unknown
 * 2. 전체 텍스트에 NO_PRODUCT 키워드가 있고, 명확한 해충/균 병해가 아니면 unknown
 * 3. 해충만 명확하면 insect
 * 4. 균·병해만 명확하면 fungus
 * 5. 둘 다 섞이면 최종진단명을 우선
 * 6. 애매하면 unknown
 */
export function classifyPhotoDoctorIssue(result: any): IssueCategory {
  const finalDiagnosis = getFinalDiagnosisText(result);
  const fullText = collectAllDiagnosisText(result);

  // ✅ 가장 중요한 1차 안전장치
  // 시들음/결핍/과습/뿌리 문제는 어떤 경우에도 제품 먼저 보여주지 않음
  if (hasAny(finalDiagnosis, NO_PRODUCT_KEYWORDS)) {
    return "unknown";
  }

  const finalHasInsect = hasAny(finalDiagnosis, INSECT_KEYWORDS);
  const finalHasFungus = hasAny(finalDiagnosis, FUNGUS_KEYWORDS);

  if (finalHasInsect && !finalHasFungus) {
    return "insect";
  }

  if (finalHasFungus && !finalHasInsect) {
    return "fungus";
  }

  const fullHasNoProduct = hasAny(fullText, NO_PRODUCT_KEYWORDS);
  const fullHasInsect = hasAny(fullText, INSECT_KEYWORDS);
  const fullHasFungus = hasAny(fullText, FUNGUS_KEYWORDS);

  // 시들음/과습/결핍 등이 섞여 있고 명확한 병해충 판단이 아니면 제품 미노출
  if (fullHasNoProduct && !fullHasInsect && !fullHasFungus) {
    return "unknown";
  }

  if (fullHasInsect && !fullHasFungus) {
    return "insect";
  }

  if (fullHasFungus && !fullHasInsect) {
    return "fungus";
  }

  // 둘 다 섞이면 최종진단 기준으로만 판단
  if (finalHasInsect) return "insect";
  if (finalHasFungus) return "fungus";

  return "unknown";
}

export function getPhotoDoctorRecommendation(result: any): RecommendationResult {
  const category = classifyPhotoDoctorIssue(result);

  if (category === "insect") {
    return {
      mode: "show_products",
      category: "insect",
      title: "진단 결과와 관련 있을 수 있는 해충 관리 자재",
      message:
        "포토닥터 진단 결과가 해충 피해 쪽으로 보입니다. 실제 사용 전에는 작물, 발생 정도, 제품 라벨을 반드시 확인하세요.",
    };
  }

  if (category === "fungus") {
    return {
      mode: "show_products",
      category: "fungus",
      title: "진단 결과와 관련 있을 수 있는 균·병해 관리 자재",
      message:
        "포토닥터 진단 결과가 균·병해 쪽으로 보입니다. 실제 사용 전에는 병해명, 발생 부위, 습도 조건, 제품 라벨을 반드시 확인하세요.",
    };
  }

  return {
    mode: "no_product",
    category: "unknown",
    title: "지금은 제품을 바로 추천하지 않습니다",
    message:
      "현재 진단은 시들음, 뿌리 문제, 과습, 영양결핍, 생리장해 또는 현장 확인이 필요한 증상일 수 있습니다. 농민에게 도움이 되지 않는 제품 노출은 하지 않고, 먼저 원인을 확인하도록 안내합니다.",
  };
}

export function getPhotoDoctorLinkedProducts(result: any): ProductLink[] {
  const category = classifyPhotoDoctorIssue(result);

  if (category === "insect") {
    return [
      {
        name: "싹쓰리충",
        label: "해충 관리 자재",
        reason:
          "총채벌레, 진딧물, 나방류, 응애 등 해충 피해가 의심될 때 검토할 수 있습니다.",
        caution:
          "해충 종류와 발생 밀도를 먼저 확인하고, 제품 라벨 기준에 맞춰 사용해야 합니다.",
        href: "/expo/search?q=%EC%8B%B9%EC%93%B0%EB%A6%AC%EC%B6%A9",
      },
      {
        name: "싹쓰리충 골드",
        label: "유기농 해충 관리 자재",
        reason:
          "해충 피해가 반복되거나 친환경 관리가 필요한 경우 검토할 수 있습니다.",
        caution:
          "유기농 사용 가능 여부와 적용 작물을 제품 라벨에서 반드시 확인하세요.",
        href: "/expo/search?q=%EC%8B%B9%EC%93%B0%EB%A6%AC%EC%B6%A9%20%EA%B3%A8%EB%93%9C",
      },
    ];
  }

  if (category === "fungus") {
    return [
      {
        name: "멸규니",
        label: "균·병해 관리 자재",
        reason:
          "흰가루병, 노균병, 탄저병, 잎마름병, 과일썩음병 등 균·병해가 의심될 때 검토할 수 있습니다.",
        caution:
          "병해 종류와 발생 정도를 확인하고, 제품 라벨 기준에 맞춰 사용해야 합니다.",
        href: "/expo/search?q=%EB%A9%B8%EA%B7%9C%EB%8B%88",
      },
    ];
  }

  return [];
}