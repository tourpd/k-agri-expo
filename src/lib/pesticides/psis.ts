import "server-only";

/**
 * 농촌진흥청 농약안전정보시스템 OpenAPI (등록 농약 검색)
 *  - 요청: http://psis.rda.go.kr/openApi/service.do?apiKey=…&serviceCode=SVC01&serviceType=AA001&cropName=…&diseaseWeedName=…
 *  - 이용허락: 출처표시 + 변경금지 → 숫자는 그대로 보여 주고 "자료: 농촌진흥청 농약안전정보시스템"을 붙입니다.
 *  - 인증키는 환경변수 PSIS_API_KEY. 없으면 null → 화면은 "준비 중" 안내.
 *  - 도메인 등록이 필요합니다(ERR_105). kagri-expo.com 으로 신청.
 */
export type PesticideItem = {
  cropName: string;
  pest: string; // 적용병해충
  use: string; // 용도 (살충제/살균제…)
  item: string; // 품목명
  brand: string; // 상표명
  company: string;
  ingredient: string; // 주성분 함량
  moa: string; // 작용기작
  method: string; // 사용방법
  dilution: string; // 희석배수(10a당 사용량)
  phi: string; // 안전사용기준(수확~일전)
  maxTimes: string; // 안전사용기준(~회 이내)
  pestiCode: string;
  diseaseUseSeq: string;
};

export const PSIS_SOURCE = {
  label: "농촌진흥청 농약안전정보시스템",
  url: "https://psis.rda.go.kr",
  license: "출처표시 + 변경금지",
};

const HOST = "http://psis.rda.go.kr/openApi/service.do";
const cache = new Map<string, { at: number; items: PesticideItem[] }>();
const TTL = 6 * 60 * 60 * 1000;

export function psisEnabled() {
  return Boolean(process.env.PSIS_API_KEY);
}

function tag(xml: string, name: string) {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
}

function parse(xml: string): PesticideItem[] {
  const items: PesticideItem[] = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const x = m[1];
    items.push({
      cropName: tag(x, "cropName"),
      pest: tag(x, "diseaseWeedName"),
      use: tag(x, "useName"),
      item: tag(x, "pestiKorName"),
      brand: tag(x, "pestiBrandName"),
      company: tag(x, "compName"),
      ingredient: tag(x, "engName"),
      moa: tag(x, "indictSymbl"),
      method: tag(x, "pestiUse"),
      dilution: tag(x, "dilutUnit"),
      phi: tag(x, "useSuittime"),
      maxTimes: tag(x, "useNum"),
      pestiCode: tag(x, "pestiCode"),
      diseaseUseSeq: tag(x, "diseaseUseSeq"),
    });
  }
  return items;
}

/** 작물 + 병해충으로 등록 농약 찾기. 키 없으면 null, 오류면 [] */
export async function searchPesticides(opts: { crop: string; pest: string; limit?: number }): Promise<PesticideItem[] | null> {
  if (!psisEnabled()) return null;
  const key = `${opts.crop}|${opts.pest}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.items.slice(0, opts.limit ?? 50);
  const q = new URLSearchParams({
    apiKey: process.env.PSIS_API_KEY!,
    serviceCode: "SVC01",
    serviceType: "AA001",
    displayCount: "50",
    startPoint: "1",
    cropName: opts.crop,
    cropCheck: "Y",
    diseaseWeedName: opts.pest,
    similarFlag: "Y",
  });
  try {
    const res = await fetch(`${HOST}?${q.toString()}`, { next: { revalidate: 21600 } });
    const xml = await res.text();
    if (!res.ok || /ERR_\d{3}/.test(xml)) {
      console.error("[psis] error", res.status, xml.slice(0, 200));
      return [];
    }
    const items = parse(xml);
    cache.set(key, { at: Date.now(), items });
    return items.slice(0, opts.limit ?? 50);
  } catch (error) {
    console.error("[psis] fetch error", error);
    return [];
  }
}

/** "2,000배" / "20ml/20L" / "500ml/10a" 같은 희석 표기를 평수로 환산 (못 하면 null) */
export function explainDilution(dilution: string, areaPyeong = 300, tankL = 20): string | null {
  const t = dilution.replace(/\s/g, "");
  const bae = t.match(/([\d,]+)배/);
  if (bae) {
    const ratio = parseInt(bae[1].replace(/,/g, ""), 10);
    if (ratio > 0) {
      const perTank = (tankL * 1000) / ratio;
      const waterL = (areaPyeong / 300) * 500; // 300평당 500L 관행 살포량
      const total = (waterL * 1000) / ratio;
      return `${tankL}L 한 통에 약 ${perTank < 10 ? perTank.toFixed(1) : Math.round(perTank)}ml(g) · ${areaPyeong.toLocaleString()}평이면 물 약 ${Math.round(waterL)}L, 약 ${total >= 1000 ? `${(total / 1000).toFixed(2)}L` : `${Math.round(total)}ml`} (300평당 500L 기준)`;
    }
  }
  const perA = t.match(/([\d.]+)(ml|mL|L|g|kg)\/10a/i);
  if (perA) {
    const amt = parseFloat(perA[1]) * (areaPyeong / 300);
    return `${areaPyeong.toLocaleString()}평이면 약 ${amt % 1 ? amt.toFixed(1) : amt}${perA[2]} (10a=300평 기준)`;
  }
  return null;
}
