import fs from "fs";

const INPUT = "data/koaftv/intelligence/superfarmer_market_intelligence_classified.json";
const OUTPUT = "data/koaftv/intelligence/superfarmer_market_intelligence_refined.json";

const rows = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const badStorage = ["양분", "영양", "잎", "광합성", "작물 안에", "저장해놓은 양"];
const badSupply = ["양분", "영양", "부족한 점", "미흡", "눈이", "색깔"];
const marketStrong = ["가격", "시세", "판매", "출하", "수매", "농협", "공판장", "도매시장", "상인", "창고", "저온", "저장", "물량", "재배면적"];

function hasAny(s, words) {
  return words.some(w => s.includes(w));
}

function refineItem(item) {
  const s = item.sentence;
  let labels = [...item.labels];

  if (labels.includes("storage_decision") && hasAny(s, badStorage)) {
    labels = labels.filter(x => x !== "storage_decision");
  }

  if (labels.includes("supply_signal") && hasAny(s, badSupply)) {
    labels = labels.filter(x => x !== "supply_signal");
  }

  const isMarketStrong = hasAny(s, marketStrong);

  if (!labels.length) return null;

  return {
    ...item,
    labels,
    quality_score: isMarketStrong ? 0.8 : 0.45
  };
}

const output = rows.map(video => {
  const refined = (video.classified_sentences || [])
    .map(refineItem)
    .filter(Boolean)
    .filter(x => x.quality_score >= 0.8);

  const summary = {};
  for (const item of refined) {
    for (const label of item.labels) {
      summary[label] = (summary[label] || 0) + 1;
    }
  }

  return {
    video_id: video.video_id,
    title: video.title,
    refined_count: refined.length,
    summary,
    refined_sentences: refined
  };
}).filter(v => v.refined_count > 0);

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf8");

console.log("refined videos:", output.length);
console.log("output:", OUTPUT);
