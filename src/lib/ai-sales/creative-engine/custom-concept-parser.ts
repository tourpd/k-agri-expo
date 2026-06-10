export type CustomConceptParseResult = {
  rawInput: string;
  genres: string[];
  tones: string[];
  parodyStyles: string[];
  musicVideoStyles: string[];
  outputFormats: string[];
  safetyNote: string;
};

export function parseCustomConcept(input?: string | null): CustomConceptParseResult {
  const raw = String(input || "").trim();
  const text = raw.toLowerCase();

  const genres: string[] = [];
  const tones: string[] = [];
  const parodyStyles: string[] = [];
  const musicVideoStyles: string[] = [];
  const outputFormats: string[] = [];

  if (/왕의|사극|광대|임금|궁궐/.test(raw)) {
    genres.push("historical_comedy");
    parodyStyles.push("사극 광대극 스타일");
  }

  if (/뉴스|속보|앵커|기자/.test(raw)) {
    genres.push("news_show");
    tones.push("urgent");
  }

  if (/다큐|현장|취재|인터뷰/.test(raw)) {
    genres.push("documentary");
    tones.push("trust");
  }

  if (/홈쇼핑|쇼호스트|매진|한정/.test(raw)) {
    genres.push("home_shopping");
    tones.push("sales_pressure");
  }

  if (/트로트|미스터트롯|노래|뮤직비디오|mv/.test(text)) {
    musicVideoStyles.push("trot_music_video");
    outputFormats.push("music_video");
  }

  if (/발라드|감성/.test(raw)) {
    musicVideoStyles.push("emotional_ballad");
    tones.push("emotional");
  }

  if (/힙합|랩/.test(raw)) {
    musicVideoStyles.push("hiphop_music_video");
    tones.push("energetic");
  }

  if (/쇼츠|릴스|틱톡|shorts|reels|tiktok/.test(text)) {
    outputFormats.push("shorts");
  }

  if (/상세페이지|랜딩|판매페이지/.test(raw)) {
    outputFormats.push("detail_page");
  }

  if (/공동구매|공구|마감/.test(raw)) {
    outputFormats.push("groupbuy");
    tones.push("urgency");
  }

  if (/웃긴|코믹|개그|시트콤/.test(raw)) {
    genres.push("rural_sitcom");
    tones.push("comedy");
  }

  if (/전문가|설명|비교|실험|리뷰/.test(raw)) {
    genres.push("expert_review");
    tones.push("trust");
  }

  return {
    rawInput: raw,
    genres: Array.from(new Set(genres)),
    tones: Array.from(new Set(tones)),
    parodyStyles: Array.from(new Set(parodyStyles)),
    musicVideoStyles: Array.from(new Set(musicVideoStyles)),
    outputFormats: Array.from(new Set(outputFormats)),
    safetyNote:
      "특정 작품·인물·상표를 그대로 복제하지 말고 분위기, 장르 문법, 구조만 안전하게 변형하십시오.",
  };
}
