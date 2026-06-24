import fs from "fs";

const PLAYLIST = "data/koaftv/playlists/superfarmer_videos.json";
const OUTPUT = "data/koaftv/intelligence/superfarmer_market_contexts.json";

const MARKET_WORDS = [
  "가격","시세","수매","저장","창고","출하","농협","공판장","도매시장",
  "상인","물량","재배면적","과잉","부족","폭락","폭등","판매","팔아",
  "심어","심지","유통","계약","수출","공동구매"
];

const videos = JSON.parse(fs.readFileSync(PLAYLIST, "utf8"));
const output = [];

for (const video of videos) {
  const txtFile = `data/koaftv/transcripts_txt/${video.video_id}.txt`;
  if (!fs.existsSync(txtFile)) continue;

  const lines = fs.readFileSync(txtFile, "utf8")
    .split(/\n+/)
    .map(x => x.trim())
    .filter(Boolean);

  const contexts = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!MARKET_WORDS.some(w => line.includes(w))) continue;

    const before = lines[i - 1] || "";
    const after = lines[i + 1] || "";
    const context = [before, line, after].filter(Boolean).join(" ");

    contexts.push({
      line,
      context
    });
  }

  if (contexts.length) {
    output.push({
      video_id: video.video_id,
      title: video.title,
      context_count: contexts.length,
      contexts: contexts.slice(0, 80)
    });
  }
}

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf8");

console.log("market context videos:", output.length);
console.log("output:", OUTPUT);
