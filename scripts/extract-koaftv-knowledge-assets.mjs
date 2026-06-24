import fs from "fs";
import path from "path";

const transcriptDir = "data/koaftv/transcripts_txt";
const videoListPath = "data/koaftv/videos/video_list.txt";

const outDir = "data/koaftv/knowledge_assets";
fs.mkdirSync(outDir, { recursive: true });

const videoMap = new Map();
if (fs.existsSync(videoListPath)) {
  const rows = fs.readFileSync(videoListPath, "utf8").split(/\r?\n/).filter(Boolean);
  for (const row of rows) {
    const [id, ...titleParts] = row.split("|");
    videoMap.set(id, titleParts.join("|"));
  }
}

const crops = ["고추", "마늘", "양파", "포도", "콩", "깨", "무", "옥수수", "생강", "사과", "쪽파"];
const problems = ["탄저병", "병해충", "방제", "일소", "추비", "엽면시비", "비료", "농약", "인건비", "수확량", "구 비대", "뿌리", "파종", "건조", "고온", "장마"];
const months = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function pickTerms(text, list) {
  return list.filter(x => text.includes(x));
}

function splitSentences(text) {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?。！？]|다\.|요\.|죠\.|니다\.|세요\.|합니다\.|됩니다\.)\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 12);
}

function scoreSentence(s) {
  let score = 0;
  if (/(해야|하지 마|하지말|중요|필수|막아|늘어|줄어|절감|폭망|수확|방제|뿌리|비대|탄저|인건비|농약|비료)/.test(s)) score += 3;
  if (/(농민|농가|사장님|회장님|현장|실제|돈|비싸|손해|남는|팔|상인)/.test(s)) score += 2;
  if (/(왜|어떻게|진짜|이거|이렇게|보세요|아십니까|모릅니다)/.test(s)) score += 1;
  return score;
}

const files = fs.existsSync(transcriptDir)
  ? fs.readdirSync(transcriptDir).filter(f => f.endsWith(".txt"))
  : [];

const rules = [];
const broadcast = [];
const shorts = [];
const quotes = [];

for (const file of files) {
  const id = file.replace(".txt", "");
  const title = videoMap.get(id) || "";
  const text = fs.readFileSync(path.join(transcriptDir, file), "utf8");
  const sentences = splitSentences(text);

  const cropTerms = pickTerms(title + " " + text, crops);
  const problemTerms = pickTerms(title + " " + text, problems);
  const monthTerms = pickTerms(title + " " + text, months);

  const top = sentences
    .map(s => ({ text: s, score: scoreSentence(s) }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 25);

  for (const item of top.slice(0, 10)) {
    rules.push({
      source: "KOAF TV",
      video_id: id,
      title,
      url: `https://www.youtube.com/watch?v=${id}`,
      crop: cropTerms[0] || null,
      month: monthTerms[0] || null,
      problem: problemTerms[0] || null,
      knowledge_type: "현장농사규칙",
      evidence_sentence: item.text,
      action_instruction: item.text,
      use_for: ["농사119", "작가실", "쇼츠", "방송소재"]
    });
  }

  for (const item of top.slice(0, 8)) {
    broadcast.push({
      source: "KOAF TV",
      video_id: id,
      title,
      url: `https://www.youtube.com/watch?v=${id}`,
      crop_terms: cropTerms,
      problem_terms: problemTerms,
      broadcast_material: item.text,
      reason: "현장성/농민공감/작업지시 가능성"
    });
  }

  for (const item of top.slice(0, 6)) {
    shorts.push({
      source: "KOAF TV",
      video_id: id,
      title,
      url: `https://www.youtube.com/watch?v=${id}`,
      shorts_hook_candidate: item.text,
      character_use: "철수동무/이장/영희 대사 원천 후보"
    });
  }

  const quoteCandidates = sentences
    .filter(s => /(돈|비싸|인건비|농약|비료|사람|어머니|엄마|고생|힘들|농민|상인|팔|남는|손해|진짜|왜)/.test(s))
    .slice(0, 15);

  for (const q of quoteCandidates) {
    quotes.push({
      source: "KOAF TV",
      video_id: id,
      title,
      url: `https://www.youtube.com/watch?v=${id}`,
      quote_candidate: q,
      possible_character: "철수동무/최만수/영희/박동무"
    });
  }
}

fs.writeFileSync(`${outDir}/rules/koaftv_rules.json`, JSON.stringify(rules, null, 2));
fs.writeFileSync(`${outDir}/broadcast_materials/koaftv_broadcast_materials.json`, JSON.stringify(broadcast, null, 2));
fs.writeFileSync(`${outDir}/shorts_materials/koaftv_shorts_materials.json`, JSON.stringify(shorts, null, 2));
fs.writeFileSync(`${outDir}/character_quotes/koaftv_character_quotes.json`, JSON.stringify(quotes, null, 2));

console.log("KOAF TV 지식자산 추출 완료");
console.log("rules:", rules.length);
console.log("broadcast:", broadcast.length);
console.log("shorts:", shorts.length);
console.log("quotes:", quotes.length);
