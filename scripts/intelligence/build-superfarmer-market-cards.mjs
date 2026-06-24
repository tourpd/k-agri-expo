import fs from "fs";

const INPUT = "data/koaftv/intelligence/superfarmer_market_contexts.json";
const OUTPUT = "data/koaftv/intelligence/superfarmer_market_cards.json";

const rows = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const rules = [
  { type: "contract_farming", words: ["계약재배", "계약"] },
  { type: "group_purchase", words: ["공동구매", "뭉치면", "모아서"] },
  { type: "storage", words: ["저장", "창고", "저온", "보관"] },
  { type: "price", words: ["가격", "시세", "폭락", "폭등", "값"] },
  { type: "sales_channel", words: ["판매", "출하", "공판장", "상인", "농협", "도매시장"] },
  { type: "export", words: ["수출", "대만", "베트남", "해외"] },
  { type: "cost_reduction", words: ["인건비", "저렴", "가성비", "가격을 낮", "비싸"] },
  { type: "supply", words: ["물량", "재배면적", "많이 심", "부족", "과잉"] }
];

function classify(context) {
  return rules
    .filter(r => r.words.some(w => context.includes(w)))
    .map(r => r.type);
}

const cards = [];

for (const row of rows) {
  for (const c of row.contexts || []) {
    const types = classify(c.context);
    if (!types.length) continue;

    cards.push({
      source: "KOAF TV",
      cluster: "슈퍼농부",
      person: "이승민",
      video_id: row.video_id,
      title: row.title,
      url: `https://www.youtube.com/watch?v=${row.video_id}`,
      intelligence_types: types,
      evidence: c.context,
      status: "market_card_v1"
    });
  }
}

fs.writeFileSync(OUTPUT, JSON.stringify(cards, null, 2), "utf8");

console.log("cards:", cards.length);
console.log("output:", OUTPUT);
