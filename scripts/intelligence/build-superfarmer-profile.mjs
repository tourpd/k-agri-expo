import fs from "fs";

const INPUT = "data/koaftv/intelligence/superfarmer_market_cards.json";
const OUTPUT = "data/koaftv/intelligence/superfarmer_profile_v1.json";

const cards = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const typeCounts = {};
const videoSet = new Set();

for (const card of cards) {
  videoSet.add(card.video_id);
  for (const t of card.intelligence_types) {
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  }
}

const topEvidence = {};

for (const type of Object.keys(typeCounts)) {
  topEvidence[type] = cards
    .filter(c => c.intelligence_types.includes(type))
    .slice(0, 10)
    .map(c => ({
      title: c.title,
      evidence: c.evidence,
      url: c.url
    }));
}

const profile = {
  person_id: "superfarmer_lee_seungmin",
  name: "슈퍼농부 이승민",
  cluster: "슈퍼농부",
  source: "KOAF TV",
  analyzed_video_count: videoSet.size,
  market_card_count: cards.length,
  intelligence_summary: typeCounts,
  inferred_roles: [
    "시장판단형 농민 리더",
    "유통/판매 실전가",
    "공동구매 기획자",
    "저장/출하 판단자",
    "계약재배 경험자",
    "농민 네트워크 영향력 노드"
  ],
  core_questions: [
    "올해 무엇을 심어야 하는가",
    "지금 팔아야 하는가 저장해야 하는가",
    "어떤 농자재를 공동구매해야 하는가",
    "어떤 판로가 유리한가",
    "농협/공판장/상인/수출 중 어디로 가야 하는가"
  ],
  top_evidence: topEvidence,
  status: "profile_v1"
};

fs.writeFileSync(OUTPUT, JSON.stringify(profile, null, 2), "utf8");

console.log("profile written:", OUTPUT);
