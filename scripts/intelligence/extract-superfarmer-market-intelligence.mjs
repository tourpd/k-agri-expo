import fs from "fs";

const MARKET_WORDS = [
  "가격",
  "시세",
  "수매",
  "저장",
  "창고",
  "출하",
  "농협",
  "공판장",
  "도매시장",
  "물량",
  "재배면적",
  "과잉",
  "부족",
  "상승",
  "하락",
  "폭락",
  "폭등",
  "판매",
  "팔아",
  "팔지",
  "심어",
  "심지",
  "확대",
  "축소",
  "유통"
];

const PLAYLIST =
  "data/koaftv/playlists/superfarmer_videos.json";

const OUTPUT =
  "data/koaftv/intelligence/superfarmer_market_intelligence.json";

const videos = JSON.parse(
  fs.readFileSync(PLAYLIST, "utf8")
);

const result = [];

for (const video of videos) {

  const txtFile =
    `data/koaftv/transcripts_txt/${video.video_id}.txt`;

  if (!fs.existsSync(txtFile))
    continue;

  const text =
    fs.readFileSync(txtFile, "utf8");

  const lines =
    text
      .split(/\n+/)
      .map(v => v.trim())
      .filter(Boolean);

  const marketSentences =
    lines.filter(line =>
      MARKET_WORDS.some(word =>
        line.includes(word)
      )
    );

  if (!marketSentences.length)
    continue;

  result.push({
    video_id: video.video_id,
    title: video.title,
    market_sentence_count:
      marketSentences.length,
    market_sentences:
      marketSentences.slice(0, 100)
  });
}

fs.writeFileSync(
  OUTPUT,
  JSON.stringify(result, null, 2),
  "utf8"
);

console.log(
  "videos:",
  result.length
);

console.log(
  "output:",
  OUTPUT
);
