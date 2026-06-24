import fs from "fs";
import path from "path";

const transcriptDir = "data/koaftv/transcripts_txt";
const videoListPath = "data/koaftv/videos/video_list.txt";
const outDir = "data/koaftv/situations";
const outPath = path.join(outDir, "koaftv_situations.json");

fs.mkdirSync(outDir, { recursive: true });

const videoMap = new Map();

if (fs.existsSync(videoListPath)) {
  const rows = fs.readFileSync(videoListPath, "utf8").split(/\r?\n/).filter(Boolean);
  for (const row of rows) {
    const [id, ...titleParts] = row.split("|");
    videoMap.set(id, titleParts.join("|").trim());
  }
}

const crops = [
  "고추", "마늘", "양파", "포도", "콩", "깨", "무", "옥수수", "생강",
  "사과", "쪽파", "감자", "가지", "토마토", "수박", "딸기", "오이",
  "복숭아", "배추", "참외", "배", "대파", "상추", "부추", "인삼", "벼"
];

const problems = [
  "탄저병", "역병", "흰가루병", "노균병", "청고병", "바이러스", "총채벌레",
  "진딧물", "응애", "나방", "병해충", "방제", "일소", "고온장해", "냉해",
  "습해", "침수", "가뭄", "장마", "칼슘결핍", "붕소결핍", "열과",
  "착색불량", "착과", "낙과", "낙화", "수확량", "품질저하", "인건비",
  "가격", "판로", "비료", "농약", "토양", "뿌리", "구 비대", "파종", "건조"
];

const problemTypes = [
  { type: "병해", terms: ["탄저병", "역병", "흰가루병", "노균병", "청고병", "바이러스"] },
  { type: "충해", terms: ["총채벌레", "진딧물", "응애", "나방", "벌레"] },
  { type: "생리장해", terms: ["칼슘결핍", "붕소결핍", "열과", "일소", "착색불량", "낙과", "낙화"] },
  { type: "기상문제", terms: ["고온", "폭염", "냉해", "장마", "침수", "습해", "가뭄"] },
  { type: "비용문제", terms: ["인건비", "비료값", "농약값", "비용"] },
  { type: "판로문제", terms: ["가격", "판로", "상인", "판매"] },
  { type: "토양문제", terms: ["토양", "뿌리", "배수", "염류"] }
];

const months = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

const regions = [
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
  "고흥", "해남", "무안", "영암", "나주", "상주", "김천", "안동", "의성",
  "영천", "밀양", "창녕", "논산", "부여", "익산", "김제", "남원", "진주"
];

const emotions = [
  { emotion: "불안", terms: ["걱정", "불안", "무섭", "어떡", "큰일"] },
  { emotion: "답답함", terms: ["답답", "모르", "안돼", "안 되", "힘들"] },
  { emotion: "분노", terms: ["화", "억울", "속상", "짜증"] },
  { emotion: "희망", terms: ["가능", "좋아질", "살릴", "해결"] },
  { emotion: "감사", terms: ["감사", "고맙"] },
  { emotion: "성취", terms: ["성공", "잘됐", "늘었", "증가", "돈 벌"] }
];

const solutionTerms = [
  "관주", "엽면시비", "방제", "살포", "배수", "배수관리", "토양관리",
  "추비", "웃거름", "비료", "농약", "칼슘", "붕소", "시설개선", "환기",
  "멀칭", "관수", "점적", "정식", "파종", "전정", "유인"
];

const resultTerms = [
  "증가", "감소", "줄", "늘", "향상", "개선", "절감", "회복",
  "수확량", "품질", "당도", "착과율", "매출", "소득"
];

const productTerms = [
  "비료", "영양제", "농약", "살균제", "살충제", "칼슘제", "붕소", "아미노산",
  "미생물", "유기질", "액비", "토양개량제", "점적호스", "관수자재"
];

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function pickTerms(text, list) {
  return uniq(list.filter(x => text.includes(x)));
}

function detectProblemType(text) {
  for (const item of problemTypes) {
    if (item.terms.some(t => text.includes(t))) return item.type;
  }
  return null;
}

function detectEmotion(text) {
  for (const item of emotions) {
    if (item.terms.some(t => text.includes(t))) return item.emotion;
  }
  return null;
}

function splitSentences(text) {
  return text
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?。！？]|다\.|요\.|죠\.|니다\.|세요\.|합니다\.|됩니다\.)\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 15 && s.length <= 280);
}

function scoreSentence(s) {
  let score = 0;
  if (pickTerms(s, crops).length) score += 2;
  if (pickTerms(s, problems).length) score += 4;
  if (pickTerms(s, solutionTerms).length) score += 3;
  if (pickTerms(s, resultTerms).length) score += 2;
  if (/(농민|농가|현장|실제|돈|비싸|손해|수확|품질|상인|판매|인건비)/.test(s)) score += 2;
  if (/(왜|어떻게|중요|필수|해야|하지 마|하지말|보세요|아십니까)/.test(s)) score += 1;
  return score;
}

function shortEvidence(sentences, keywordList, limit = 3) {
  return sentences
    .filter(s => keywordList.some(k => s.includes(k)))
    .map(s => s.slice(0, 240))
    .slice(0, limit);
}

function makeSituationId(n) {
  return `SIT-${String(n).padStart(6, "0")}`;
}

const files = fs.existsSync(transcriptDir)
  ? fs.readdirSync(transcriptDir).filter(f => f.endsWith(".txt"))
  : [];

const situations = [];
let seq = 1;

for (const file of files) {
  const videoId = file.replace(".txt", "");
  const title = videoMap.get(videoId) || "";
  const rawText = fs.readFileSync(path.join(transcriptDir, file), "utf8");
  const fullText = `${title}\n${rawText}`;

  const sentences = splitSentences(rawText);

  const cropTerms = pickTerms(fullText, crops);
  const problemTerms = pickTerms(fullText, problems);
  const monthTerms = pickTerms(fullText, months);
  const regionTerms = pickTerms(fullText, regions);
  const solutionFound = pickTerms(fullText, solutionTerms);
  const resultFound = pickTerms(fullText, resultTerms);
  const productFound = pickTerms(fullText, productTerms);

  const ranked = sentences
    .map(s => ({ text: s, score: scoreSentence(s) }))
    .filter(x => x.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const problemSeeds = problemTerms.length ? problemTerms.slice(0, 3) : [null];

  for (const problem of problemSeeds) {
    const evidence = problem
      ? shortEvidence(sentences, [problem], 3)
      : ranked.slice(0, 3).map(x => x.text);

    const evidenceText = evidence.join(" ");

    const situation = {
      situation_id: makeSituationId(seq++),
      source_type: "KOAF_TV",
      source_name: "한국농수산TV",
      source_id: videoId,
      source_url: `https://www.youtube.com/watch?v=${videoId}`,
      title,

      crop: cropTerms[0] || null,
      region: regionTerms[0] || null,
      season: monthTerms[0] || null,
      growth_stage: null,
      weather_context: pickTerms(fullText, ["고온", "폭염", "장마", "냉해", "가뭄", "침수", "습해"]).join(", ") || null,

      problem,
      problem_type: detectProblemType(`${problem || ""} ${fullText}`),
      cause: null,
      solution: solutionFound.slice(0, 5).join(", ") || null,
      result: resultFound.slice(0, 5).join(", ") || null,
      emotion: detectEmotion(fullText),

      farmer_quote: evidence[0] || null,
      expert_quote: null,

      product: productFound.slice(0, 5).join(", ") || null,
      company: null,
      material_type: productFound[0] || null,
      cost_info: /비싸|가격|돈|인건비|비용/.test(fullText) ? "비용 관련 언급 있음" : null,
      roi_hint: /수확량|매출|소득|절감|증가|감소/.test(fullText) ? "성과/ROI 관련 언급 있음" : null,

      content_angle: [cropTerms[0], problem, solutionFound[0]].filter(Boolean).join(" ") || title,
      chulsoo_point: problem ? `${problem} 상황에 철수 반전 멘트 가능` : "현장 농민 상황에 철수 투입 가능",
      business_point: productFound.length ? `${productFound[0]} 관련 캠페인 검토 가능` : null,

      confidence_score: Math.min(0.95, 0.45 + (ranked.length * 0.06) + (problem ? 0.12 : 0) + (cropTerms.length ? 0.08 : 0)),
      status: "extracted",

      evidence_sentences: evidence,
      raw_text_sample: rawText.slice(0, 1200)
    };

    situations.push(situation);
  }
}

fs.writeFileSync(outPath, JSON.stringify(situations, null, 2), "utf8");

console.log("KOAF TV Situation 추출 완료");
console.log("input files:", files.length);
console.log("situations:", situations.length);
console.log("output:", outPath);
