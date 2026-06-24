import fs from "fs";

const PLAYLIST = "data/koaftv/playlists/hongsan_garlic_videos.json";
const OUTPUT = "data/koaftv/intelligence/hongsan_garlic_cards.json";

const videos = JSON.parse(fs.readFileSync(PLAYLIST, "utf8"));

const RULES = [
  { type: "variety_story", words: ["홍산", "국산", "품종", "마늘 독립", "K-마늘"] },
  { type: "cultivation", words: ["파종", "추비", "엽면시비", "비대", "구비대", "수확량", "재배"] },
  { type: "mechanization", words: ["파종기", "기계", "두둑", "비닐멀칭", "로타리", "트랙터"] },
  { type: "education", words: ["특강", "강의", "교육", "알려", "배워"] },
  { type: "organization", words: ["연구회", "농가", "회원", "조직"] },
  { type: "distribution", words: ["판매", "수매", "유통", "하나로", "양재", "구입문의"] },
  { type: "branding", words: ["브랜드", "K-마늘", "독립", "홍산마늘", "국산 마늘"] },
  { type: "health_food", words: ["흑마늘", "알리신", "당도", "즙", "건강", "기능성"] }
];

function splitLines(text) {
  return text.split(/\n+/).map(x => x.trim()).filter(Boolean);
}

function classify(context) {
  return RULES.filter(r => r.words.some(w => context.includes(w))).map(r => r.type);
}

const cards = [];

for (const video of videos) {
  const txtPath = `data/koaftv/transcripts_txt/${video.video_id}.txt`;
  if (!fs.existsSync(txtPath)) continue;

  const lines = splitLines(fs.readFileSync(txtPath, "utf8"));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const before = lines[i - 1] || "";
    const after = lines[i + 1] || "";
    const context = [before, line, after].filter(Boolean).join(" ");

    const types = classify(context);
    if (!types.length) continue;

    cards.push({
      source: "KOAF TV",
      cluster: "홍산마늘",
      person: "이성준",
      video_id: video.video_id,
      title: video.title,
      url: `https://www.youtube.com/watch?v=${video.video_id}`,
      intelligence_types: types,
      evidence: context,
      status: "hongsan_card_v1"
    });
  }
}

fs.writeFileSync(OUTPUT, JSON.stringify(cards, null, 2), "utf8");

console.log("cards:", cards.length);
console.log("output:", OUTPUT);
