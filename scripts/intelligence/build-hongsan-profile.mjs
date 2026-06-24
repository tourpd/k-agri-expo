import fs from "fs";

const INPUT = "data/koaftv/intelligence/hongsan_garlic_cards.json";
const OUTPUT = "data/koaftv/intelligence/hongsan_lee_sungjun_profile_v1.json";

const cards = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const typeCounts = {};
const videoSet = new Set();

for (const card of cards) {
  videoSet.add(card.video_id);
  for (const t of card.intelligence_types) {
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }
}

const profile = {
  person_id: "hongsan_lee_sungjun",
  name: "홍산마늘 이성준",
  cluster: "홍산마늘",
  source: "KOAF TV",
  analyzed_video_count: videoSet.size,
  card_count: cards.length,
  intelligence_summary: typeCounts,
  inferred_roles: [
    "홍산마늘 품종 전도사",
    "홍산마늘연구회 조직가",
    "마늘 재배기술 강사",
    "마늘 기계화 실험가",
    "홍산마늘 유통/수매 실전가",
    "K-GARLIC 산업화 핵심 노드"
  ],
  core_questions: [
    "홍산마늘은 왜 국산마늘의 상징인가",
    "홍산마늘은 어떻게 키워야 하는가",
    "마늘 파종과 기계화는 어떻게 해야 하는가",
    "홍산마늘을 어떻게 유통하고 브랜드화할 것인가",
    "홍산마늘을 건강식품과 수출로 어떻게 확장할 것인가"
  ],
  status: "profile_v1"
};

fs.writeFileSync(OUTPUT, JSON.stringify(profile, null, 2), "utf8");

console.log("profile written:", OUTPUT);
