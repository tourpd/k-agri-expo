import fs from "fs";

const INPUT = "data/koaftv/intelligence/superfarmer_market_intelligence.json";
const OUTPUT = "data/koaftv/intelligence/superfarmer_market_intelligence_classified.json";

const rows = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const categories = {
  storage_decision: ["저장", "창고", "보관", "냉장", "저온", "묵혀"],
  selling_decision: ["판매", "출하", "팔아", "팔지", "납품", "계약"],
  price_signal: ["가격", "시세", "폭락", "폭등", "상승", "하락", "값"],
  supply_signal: ["물량", "재배면적", "과잉", "부족", "많이 심", "적게 심", "생산량"],
  buyer_signal: ["농협", "공판장", "도매시장", "상인", "거래처", "수매"],
  cost_signal: ["인건비", "비료값", "농약값", "자재값", "비싸", "저렴", "가성비"]
};

function classifySentence(sentence) {
  const labels = [];

  for (const [key, words] of Object.entries(categories)) {
    if (words.some(w => sentence.includes(w))) {
      labels.push(key);
    }
  }

  return labels;
}

const output = rows.map(video => {
  const classified = [];

  for (const sentence of video.market_sentences || []) {
    const labels = classifySentence(sentence);

    if (labels.length) {
      classified.push({
        sentence,
        labels
      });
    }
  }

  const summary = {};

  for (const item of classified) {
    for (const label of item.labels) {
      summary[label] = (summary[label] || 0) + 1;
    }
  }

  return {
    video_id: video.video_id,
    title: video.title,
    classified_count: classified.length,
    summary,
    classified_sentences: classified
  };
}).filter(v => v.classified_count > 0);

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf8");

console.log("classified videos:", output.length);
console.log("output:", OUTPUT);
