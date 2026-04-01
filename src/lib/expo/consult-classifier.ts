export function needsPhotoDoctor(query: string) {
  const q = query.toLowerCase();

  const photoKeywords = [
    "병",
    "병해",
    "해충",
    "벌레",
    "총채",
    "응애",
    "진딧물",
    "노균",
    "탄저",
    "반점",
    "잎이 이상",
    "사진",
    "증상",
    "무늬",
    "곰팡이",
    "말림",
    "썩음",
  ];

  return photoKeywords.some((k) => q.includes(k));
}

export function extractTopic(query: string) {
  const q = query.toLowerCase();

  if (q.includes("마늘")) return "마늘";
  if (q.includes("고추")) return "고추";
  if (q.includes("딸기")) return "딸기";
  if (q.includes("오이")) return "오이";
  if (q.includes("토마토")) return "토마토";
  if (q.includes("양파")) return "양파";
  return "일반";
}