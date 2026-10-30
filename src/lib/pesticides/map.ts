import type { CropKey, Problem } from "@/lib/problems/catalog";

/** 우리 작물 키 → 농진청 작물명 (등록 농약 검색용) */
export const PSIS_CROP_NAME: Partial<Record<CropKey, string>> = {
  gochu: "고추",
  garlic: "마늘",
  onion: "양파",
  apple: "사과",
  strawberry: "딸기",
  tomato: "토마토",
  cucumber: "오이",
  citrus: "감귤",
  cabbage: "배추",
  rice: "벼",
  melon: "참외",
  paprika: "파프리카",
  leafy: "상추",
};

/** 문제 → 농진청 병해충명 (농약 등록 명칭). 없는 문제는 농약 칸을 만들지 않습니다(비료·환경 문제). */
export const PROBLEM_PESTS: Record<string, string[]> = {
  "gochu-thrips": ["총채벌레", "꽃노랑총채벌레"],
  "gochu-anthracnose": ["탄저병"],
  "gochu-aphid-virus": ["진딧물", "복숭아혹진딧물"],
  "garlic-black-mold": ["흑색썩음균핵병"],
  "onion-downy-mildew": ["노균병"],
  "strawberry-mite": ["점박이응애", "응애"],
  "strawberry-powdery-gray": ["흰가루병", "잿빛곰팡이병"],
  "tomato-cucumber-whitefly": ["온실가루이", "담배가루이"],
  "cucumber-downy-mildew": ["노균병"],
  "cabbage-soft-rot": ["무름병"],
  "paprika-thrips-powdery": ["총채벌레", "흰가루병"],
  "leafy-downy-sclerotinia": ["균핵병", "노균병"],
};

export function pesticideQueriesFor(problem: Problem): Array<{ crop: string; pest: string }> {
  const pests = PROBLEM_PESTS[problem.slug];
  const crop = PSIS_CROP_NAME[problem.crop];
  if (!pests || !crop) return [];
  return pests.map((pest) => ({ crop, pest }));
}
