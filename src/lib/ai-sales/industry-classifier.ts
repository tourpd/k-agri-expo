export type IndustryGroup =
  | "agri_material"
  | "agri_machine"
  | "seed_seedling_tree"
  | "smartfarm_facility"
  | "dryer_storage"
  | "produce_food"
  | "fishery"
  | "health_food"
  | "flower_landscape"
  | "livestock_beekeeping_forestry"
  | "future_food_healing"
  | "energy_solar"
  | "packaging_distribution"
  | "farm_tour_education"
  | "unknown";

export const industryGroupLabels: Record<IndustryGroup, string> = {
  agri_material: "농자재·비료·병해충",
  agri_machine: "농기계·작업기·농작업 공구",
  seed_seedling_tree: "종자·묘종·묘목·품종",
  smartfarm_facility: "스마트농업·시설자재",
  dryer_storage: "건조기·저장설비",
  produce_food: "농산물·가공식품",
  fishery: "수산물·양식기자재",
  health_food: "건강기능식품",
  flower_landscape: "화훼·꽃·조경",
  livestock_beekeeping_forestry: "축산·양봉·임업",
  future_food_healing: "미래식량·치유농업",
  energy_solar: "태양광·에너지",
  packaging_distribution: "포장·선별·유통",
  farm_tour_education: "농촌체험·교육·관광",
  unknown: "미분류·기타",
};

export type ClassifyInput = {
  industry: string;
  productName: string;
  imageAnalysis: string;
  pdfAnalysis: string;
  youtubeAnalysis: string;
  aiProductAnalysis: string;
  notes: string;
};

export function classifyIndustry(input: ClassifyInput): IndustryGroup {
  const text = [
    input.industry,
    input.productName,
    input.imageAnalysis,
    input.pdfAnalysis,
    input.youtubeAnalysis,
    input.aiProductAnalysis,
    input.notes,
  ]
    .join(" ")
    .toLowerCase();

  if (
    /비료|영양제|농약|살충|살균|총채|응애|가루이|탄저|노균|칼슘|켈팍|싹쓰리충|멸규니|토양개량|상토|퇴비|미생물|액비/.test(
      text
    )
  ) {
    return "agri_material";
  }

  if (
    /트랙터|로타리|영진|관리기|파종기|수확기|콩파종|마늘파종|마늘수확|돌수집|제초기|방제기|운반차|작업기|농기계|공구|작업공구/.test(
      text
    )
  ) {
    return "agri_machine";
  }

  if (
    /종자|씨앗|묘종|묘목|품종|고추품종|마늘종구|양파종자|딸기묘|과수묘|배추묘|육묘/.test(
      text
    )
  ) {
    return "seed_seedling_tree";
  }

  if (
    /스마트팜|스마트농업|센서|양액|관수|자동급수|환기|온습도|led|식물재배등|개폐기|하우스|시설자재/.test(
      text
    )
  ) {
    return "smartfarm_facility";
  }

  if (
    /건조기|고추건조|마늘건조|양파건조|차압식|저온저장|저장고|예냉|선별기|세척기|콜드체인/.test(
      text
    )
  ) {
    return "dryer_storage";
  }

  if (
    /마늘|고추|사과|배|감귤|딸기|쌀|잡곡|김치|장아찌|가공식품|선물세트|산지직송|농산물/.test(
      text
    )
  ) {
    return "produce_food";
  }

  if (/수산|생선|김|새우|전복|굴|양식|수산물|어업/.test(text)) {
    return "fishery";
  }

  if (
    /건강기능식품|관절|msm|콘드로이친|콜라겐|혈당|혈행|면역|다이어트|근력|눈건강|수면|피로/.test(
      text
    )
  ) {
    return "health_food";
  }

  if (
    /화훼|꽃|국화|장미|난|분화|절화|관엽|꽃묘|조경|조경수|정원수|잔디|정원/.test(
      text
    )
  ) {
    return "flower_landscape";
  }

  if (
    /축산|사료|축사|악취|양봉|벌꿀|벌통|임업|산림|표고|산양삼|임산물/.test(
      text
    )
  ) {
    return "livestock_beekeeping_forestry";
  }

  if (
    /갈색거저리|고소애|곤충|미래식량|치유농업|스마트 사육|전량수매|청년농|정착마을/.test(
      text
    )
  ) {
    return "future_food_healing";
  }

  if (/태양광|에너지|전기요금|유휴부지|인허가|발전/.test(text)) {
    return "energy_solar";
  }

  if (/포장|박스|스티커|택배|소포장|패키지|유통|브랜드포장/.test(text)) {
    return "packaging_distribution";
  }

  if (/농촌체험|팜파티|체험농장|농촌관광|치유관광|교육|아카데미|귀농|귀촌/.test(text)) {
    return "farm_tour_education";
  }

  return "unknown";
}