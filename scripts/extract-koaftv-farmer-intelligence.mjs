import fs from "fs";
import path from "path";

const transcriptDir = "data/koaftv/transcripts_txt";
const videoListPath = "data/koaftv/videos/video_list.txt";
const outDir = "data/koaftv/farmer_intelligence";
const outPath = path.join(outDir, "koaftv_farmer_intelligence.json");

fs.mkdirSync(outDir, { recursive: true });

const videoMap = new Map();

if (fs.existsSync(videoListPath)) {
  const rows = fs.readFileSync(videoListPath, "utf8").split(/\r?\n/).filter(Boolean);
  for (const row of rows) {
    const [id, ...titleParts] = row.split("|");
    videoMap.set(id, titleParts.join("|").trim());
  }
}

function splitSentences(text) {
  return String(text || "")
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?。！？]|다\.|요\.|죠\.|니다\.|세요\.|합니다\.|됩니다\.)\s+/)
    .map(s => s.trim())
    .filter(s => s.length >= 12 && s.length <= 320);
}

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function findMatches(text, patterns) {
  const s = String(text || "");
  return uniq(
    patterns
      .filter(p => p.regex.test(s))
      .map(p => p.label)
  );
}

function evidence(sentences, regexes, limit = 3) {
  return sentences
    .filter(s => regexes.some(r => r.test(s)))
    .slice(0, limit);
}

const problemPatterns = [
  { label: "작목 선택 고민", regex: /(심어도|심을까|뭘 심|작목|품종|재배.*고민)/ },
  { label: "판매 시점 고민", regex: /(팔아도|언제 팔|출하|저장|수매|가격.*기다)/ },
  { label: "가격 불안", regex: /(가격|시세|폭락|폭등|값|단가|수취가)/ },
  { label: "판로 문제", regex: /(판로|거래처|납품|유통|상인|도매|공판장)/ },
  { label: "병해충 문제", regex: /(탄저|역병|총채|진딧|응애|나방|벌레|병해충|방제)/ },
  { label: "기상 피해", regex: /(장마|폭염|고온|냉해|가뭄|침수|습해|우박|일소)/ },
  { label: "비용 부담", regex: /(인건비|농약값|비료값|자재값|기름값|비용|돈이 많이)/ },
  { label: "노동력 부족", regex: /(일손|인력|사람 구하기|외국인|노동력)/ }
];

const emotionPatterns = [
  { label: "불안", regex: /(걱정|불안|무섭|큰일|어떡|망할|겁나)/ },
  { label: "후회", regex: /(후회|괜히|잘못|그때|하지 말걸)/ },
  { label: "분노", regex: /(화가|열받|억울|속상|짜증)/ },
  { label: "희망", regex: /(희망|가능성|좋아질|기대|살릴 수)/ },
  { label: "확신", regex: /(확실|분명|틀림없|반드시|무조건)/ },
  { label: "혼란", regex: /(모르겠|헷갈|어렵|복잡|판단이 안)/ },
  { label: "성취", regex: /(성공|잘됐|돈 벌|효과|수확.*늘|소득.*늘)/ }
];

const decisionPatterns = [
  { label: "재배 확대", regex: /(더 심|많이 심|확대|늘렸|늘릴)/ },
  { label: "재배 축소", regex: /(줄였|줄일|안 심|포기|접었)/ },
  { label: "저장", regex: /(저장|창고|보관|묵혀)/ },
  { label: "조기 출하", regex: /(빨리 팔|조기 출하|일찍 출하|먼저 팔)/ },
  { label: "분할 판매", regex: /(나눠서 팔|분할|일부만 팔)/ },
  { label: "직거래", regex: /(직거래|직접 팔|소비자|택배)/ },
  { label: "약제 교체", regex: /(약을 바꿨|약제.*교체|다른 약|방제.*바꿔)/ },
  { label: "비료 변경", regex: /(비료.*바꿨|영양제.*바꿨|추비|웃거름)/ }
];

const marketPatterns = [
  { label: "재배 증가 신호", regex: /(많이 심|면적.*늘|재배.*늘|다들.*심)/ },
  { label: "재배 감소 신호", regex: /(안 심|줄었|면적.*감소|포기.*농가)/ },
  { label: "저장 증가 신호", regex: /(저장.*많|창고.*가득|안 팔고|보관.*많)/ },
  { label: "가격 하락 우려", regex: /(가격.*떨어|폭락|값.*없|단가.*낮)/ },
  { label: "가격 상승 기대", regex: /(가격.*오를|값.*오를|상승.*기대|물량.*부족)/ },
  { label: "수요 증가 신호", regex: /(주문.*늘|찾는.*많|수요|납품.*늘)/ },
  { label: "수요 감소 신호", regex: /(주문.*줄|안 팔|소비.*줄|거래.*끊)/ }
];

const businessPatterns = [
  { label: "B2B 연결", regex: /(납품|식자재|급식|가공|수출|대량|업체|거래처)/ },
  { label: "공동구매", regex: /(공동구매|같이 사|단체 구매|대량 구매)/ },
  { label: "공동판매", regex: /(공동 판매|같이 팔|출하회|작목반|공동 출하)/ },
  { label: "교육", regex: /(교육|강의|세미나|배워|알려줘)/ },
  { label: "캠페인", regex: /(캠페인|홍보|기획|특집)/ },
  { label: "제품 검증", regex: /(제품.*효과|써보니|실험|비교|검증)/ }
];

function scoreItem(matches, ev) {
  return Math.min(0.95, 0.35 + matches.length * 0.1 + ev.length * 0.08);
}

const files = fs.existsSync(transcriptDir)
  ? fs.readdirSync(transcriptDir).filter(f => f.endsWith(".txt"))
  : [];

const results = [];

for (const file of files) {
  const videoId = file.replace(".txt", "");
  const title = videoMap.get(videoId) || "";
  const rawText = fs.readFileSync(path.join(transcriptDir, file), "utf8");
  const fullText = `${title}\n${rawText}`;
  const sentences = splitSentences(rawText);

  const farmerProblems = findMatches(fullText, problemPatterns);
  const emotions = findMatches(fullText, emotionPatterns);
  const decisions = findMatches(fullText, decisionPatterns);
  const marketSignals = findMatches(fullText, marketPatterns);
  const businessOpportunities = findMatches(fullText, businessPatterns);

  const allMatches = [
    ...farmerProblems,
    ...emotions,
    ...decisions,
    ...marketSignals,
    ...businessOpportunities
  ];

  if (!allMatches.length) continue;

  const problemEvidence = evidence(sentences, problemPatterns.map(x => x.regex), 3);
  const emotionEvidence = evidence(sentences, emotionPatterns.map(x => x.regex), 3);
  const decisionEvidence = evidence(sentences, decisionPatterns.map(x => x.regex), 3);
  const marketEvidence = evidence(sentences, marketPatterns.map(x => x.regex), 3);
  const businessEvidence = evidence(sentences, businessPatterns.map(x => x.regex), 3);

  results.push({
    source: "KOAF TV",
    video_id: videoId,
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,

    farmer_problems: farmerProblems,
    farmer_emotions: emotions,
    farmer_decisions: decisions,
    market_signals: marketSignals,
    business_opportunities: businessOpportunities,

    content_opportunities: [
      ...farmerProblems.map(x => `${x} 현장 브리핑`),
      ...marketSignals.map(x => `${x} 분석 콘텐츠`)
    ].slice(0, 5),

    evidence: {
      farmer_problem: problemEvidence,
      emotion: emotionEvidence,
      decision: decisionEvidence,
      market: marketEvidence,
      business: businessEvidence
    },

    confidence_score: scoreItem(allMatches, [
      ...problemEvidence,
      ...emotionEvidence,
      ...decisionEvidence,
      ...marketEvidence,
      ...businessEvidence
    ]),

    status: "extracted_v1",
    raw_text_sample: rawText.slice(0, 1000)
  });
}

fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");

console.log("KOAF Farmer Intelligence 추출 완료");
console.log("input files:", files.length);
console.log("results:", results.length);
console.log("output:", outPath);
