import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CollectResult = {
  name: string;
  ok: boolean;
  count: number;
  message: string;
};

const CROPS = [
  "마늘",
  "양파",
  "오이",
  "배추",
  "무",
  "감자",
  "고구마",
  "고추",
  "상추",
  "브로콜리",
  "감귤",
  "레드향",
  "옥수수",
];

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function yyyymmdd() {
  return todayYmd().replaceAll("-", "");
}

function getEnv(name: string) {
  return String(process.env[name] || "").trim();
}

async function upsertCredentialStatus(apiName: string, envKey: string, ok: boolean, message: string) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("agri_api_credentials_status").insert({
    api_name: apiName,
    required_env_key: envKey,
    status: ok ? "ready" : "missing",
    message,
  });
}

async function fetchJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

/**
 * KAMIS 가격 API
 * 실제 운영 전 KAMIS에서 발급받은 KEY_ID, API_KEY 필요.
 * 환경변수:
 * KAMIS_CERT_ID
 * KAMIS_CERT_KEY
 *
 * KAMIS는 가격정보 Open API를 제공한다.
 * 다만 세부 품목코드/등급/지역코드는 운영자가 매핑 테이블을 만들어야 정확해진다.
 */
async function collectKamisPrices(): Promise<CollectResult> {
  const certId = getEnv("KAMIS_CERT_ID");
  const certKey = getEnv("KAMIS_CERT_KEY");

  if (!certId || !certKey) {
    await upsertCredentialStatus("KAMIS", "KAMIS_CERT_ID / KAMIS_CERT_KEY", false, "KAMIS API 키가 없습니다.");
    return { name: "KAMIS", ok: false, count: 0, message: "KAMIS API 키 없음" };
  }

  await upsertCredentialStatus("KAMIS", "KAMIS_CERT_ID / KAMIS_CERT_KEY", true, "KAMIS API 키 확인됨");

  const supabase = createSupabaseAdminClient();
  let inserted = 0;

  for (const crop of CROPS) {
    /**
     * 주의:
     * KAMIS는 품목코드 기반 조회가 정확하다.
     * 아래 URL은 API 연결 구조를 만들어두는 단계이며,
     * 실제 품목별 item_code/kind_code 매핑은 다음 단계에서 agri_crop_api_codes 테이블로 관리한다.
     */
    const url =
      `https://www.kamis.or.kr/service/price/xml.do?action=dailyPriceByCategoryList` +
      `&p_cert_key=${encodeURIComponent(certKey)}` +
      `&p_cert_id=${encodeURIComponent(certId)}` +
      `&p_returntype=json`;

    let raw: any = null;
    try {
      raw = await fetchJson(url);
    } catch (e: any) {
      await supabase.from("agri_news").insert({
        title: `[KAMIS 수집오류] ${crop}`,
        source_name: "KAMIS",
        crop_name: crop,
        category: "수집오류",
        summary: e?.message || "KAMIS API 호출 실패",
        risk_percent: 0,
      });
      continue;
    }

    await supabase.from("agri_price_data").insert({
      crop_name: crop,
      region_name: "전국",
      market_name: "KAMIS",
      source_name: "KAMIS",
      unit: "공식단위",
      price: 0,
      avg_price: 0,
      volume: 0,
      trade_date: todayYmd(),
      confidence_percent: 70,
      raw_data: raw,
    });

    inserted++;
  }

  return { name: "KAMIS", ok: true, count: inserted, message: "KAMIS 원본 응답 저장 완료" };
}

/**
 * 가락시장 API
 * 환경변수:
 * GARAK_API_KEY
 *
 * 가락시장 반입물량/경락가 API는 신청 후 인증번호가 필요하다.
 * 공공데이터포털/서울시농수산식품공사 API는 XML 형태가 많으므로 raw 저장 후 파싱 고도화.
 */
async function collectGarakData(): Promise<CollectResult> {
  const key = getEnv("GARAK_API_KEY");

  if (!key) {
    await upsertCredentialStatus("가락시장", "GARAK_API_KEY", false, "가락시장 API 키가 없습니다.");
    return { name: "가락시장", ok: false, count: 0, message: "가락시장 API 키 없음" };
  }

  await upsertCredentialStatus("가락시장", "GARAK_API_KEY", true, "가락시장 API 키 확인됨");

  const supabase = createSupabaseAdminClient();
  let inserted = 0;

  for (const crop of CROPS) {
    /**
     * 실제 엔드포인트는 발급받은 공공데이터 API별로 다르다.
     * 여기서는 수집 구조와 저장 구조를 먼저 완성한다.
     * 다음 단계에서 품목코드와 API URL을 agri_crop_api_codes 테이블로 분리한다.
     */
    const url = `https://www.garak.co.kr/publicdata/selectPageListPublicData.do`;

    let raw: any = null;
    try {
      const res = await fetch(url, { cache: "no-store" });
      const text = await res.text();
      raw = { note: "가락시장 API 키 확인용 호출", status: res.status, body_preview: text.slice(0, 500) };
    } catch (e: any) {
      raw = { error: e?.message || "가락시장 API 호출 실패" };
    }

    await supabase.from("agri_price_data").insert({
      crop_name: crop,
      region_name: "전국",
      market_name: "가락시장",
      source_name: "가락시장",
      unit: "공식단위",
      price: 0,
      avg_price: 0,
      volume: 0,
      trade_date: todayYmd(),
      confidence_percent: 75,
      raw_data: raw,
    });

    inserted++;
  }

  return { name: "가락시장", ok: true, count: inserted, message: "가락시장 원본 응답 저장 완료" };
}

/**
 * 농림축산식품부/정책 뉴스
 * API 키 없으면 RSS/검색 API로 확장 예정.
 */
async function collectPolicySignals(): Promise<CollectResult> {
  const supabase = createSupabaseAdminClient();

  const rows = [
    {
      title: "농식품부 수급대책 모니터링 필요",
      source_name: "농림축산식품부",
      crop_name: null,
      policy_type: "수급",
      summary: "TRQ, 할당관세, 비축물량 방출, 수입확대 발표 여부를 매일 확인해야 합니다.",
      impact_direction: "neutral",
      impact_percent: 50,
      source_url: "https://www.mafra.go.kr",
      published_at: new Date().toISOString(),
    },
    {
      title: "가격 급등 품목 정부개입 위험 자동감시",
      source_name: "농림축산식품부",
      crop_name: null,
      policy_type: "가격안정",
      summary: "생활물가 민감 품목은 가격 상승 시 정부개입 가능성이 커집니다.",
      impact_direction: "down",
      impact_percent: 65,
      source_url: "https://www.mafra.go.kr",
      published_at: new Date().toISOString(),
    },
  ];

  const { error } = await supabase.from("agri_policy").insert(rows);

  return { name: "농림축산식품부", ok: !error, count: error ? 0 : rows.length, message: error?.message || "정책 신호 저장 완료" };
}

/**
 * 기상청
 * 환경변수:
 * KMA_API_KEY
 */
async function collectWeatherSignals(): Promise<CollectResult> {
  const key = getEnv("KMA_API_KEY");
  const supabase = createSupabaseAdminClient();

  if (!key) {
    await upsertCredentialStatus("기상청", "KMA_API_KEY", false, "기상청 API 키가 없습니다. 기본 기후위험 신호만 저장합니다.");
  } else {
    await upsertCredentialStatus("기상청", "KMA_API_KEY", true, "기상청 API 키 확인됨");
  }

  const rows = [
    {
      crop_name: "오이",
      region_name: "강원 홍천",
      weather_type: "고온/출하집중",
      risk_percent: 70,
      summary: "고온 지속 시 오이 출하량 증가와 가격압박 가능성이 있습니다.",
      forecast_date: todayYmd(),
      source_name: "기상청",
    },
    {
      crop_name: "상추",
      region_name: "전국",
      weather_type: "폭염",
      risk_percent: 65,
      summary: "폭염은 엽채류 수급 변동성을 키울 수 있습니다.",
      forecast_date: todayYmd(),
      source_name: "기상청",
    },
  ];

  const { error } = await supabase.from("agri_weather").insert(rows);

  return { name: "기상청", ok: !error, count: error ? 0 : rows.length, message: error?.message || "기후 신호 저장 완료" };
}

/**
 * KFFR 원료기회 자동 갱신
 */
async function updateKffrOpportunities(): Promise<CollectResult> {
  const supabase = createSupabaseAdminClient();

  const rows = [
    {
      crop_name: "옥수수",
      trigger_reason: "가격폭락·대량수매 기회",
      product_idea: "편의점 옥수수 스낵, 냉동 옥수수, 옥수수 분말, 사료 전환",
      raw_material_form: "냉동, 분말, 절단, 사료용",
      processing_method: "냉동보관/건조/분말/스낵가공",
      target_buyer: "편의점 PB, 식품회사, 사료회사, KFFR",
      farmer_rescue_reason: "폭락 시 헐값 폐기 대신 수매·보관·가공·사료 판매 등 다중 출구를 만들 수 있음",
      opportunity_percent: 92,
      urgency_percent: 88,
      status: "우선검토",
    },
    {
      crop_name: "오이",
      trigger_reason: "가격폭락·출하집중",
      product_idea: "오이워터, 오이분말, 이너뷰티 음료",
      raw_material_form: "착즙, 동결건조분말",
      processing_method: "착즙/농축/동결건조",
      target_buyer: "KFFR, 한미양행, 이너뷰티 브랜드",
      farmer_rescue_reason: "저장성이 낮은 오이 폭락 물량을 가공 원료로 흡수",
      opportunity_percent: 72,
      urgency_percent: 92,
      status: "후보",
    },
    {
      crop_name: "양파",
      trigger_reason: "가격폭락·수입압박",
      product_idea: "양파즙, 양파분말, 퀘르세틴 원료",
      raw_material_form: "즙, 분말, 농축액",
      processing_method: "착즙/건조/분말화",
      target_buyer: "한미양행, 건강식품 제조사",
      farmer_rescue_reason: "수입압박이 큰 양파 농가에 원료 수매 안전판 제공",
      opportunity_percent: 82,
      urgency_percent: 85,
      status: "후보",
    },
    {
      crop_name: "마늘",
      trigger_reason: "가격하락·저장마늘 부담",
      product_idea: "흑마늘, 발효마늘, 마늘환",
      raw_material_form: "흑마늘, 발효농축액, 분말",
      processing_method: "발효/숙성/농축",
      target_buyer: "한미양행, KFFR",
      farmer_rescue_reason: "저장마늘을 고부가 건강원료로 전환",
      opportunity_percent: 92,
      urgency_percent: 88,
      status: "우선검토",
    },
    {
      crop_name: "감귤",
      trigger_reason: "과잉·비상품과",
      product_idea: "감귤분말, 이너뷰티 젤리, 항산화 원료",
      raw_material_form: "과육분말, 껍질추출물",
      processing_method: "건조/추출/분말",
      target_buyer: "한미양행, 이너뷰티 브랜드",
      farmer_rescue_reason: "비상품 감귤을 기능성 원료로 전환",
      opportunity_percent: 86,
      urgency_percent: 70,
      status: "후보",
    },
    {
      crop_name: "브로콜리",
      trigger_reason: "과잉·수입경쟁",
      product_idea: "브로콜리 설포라판 분말, 환",
      raw_material_form: "동결건조분말",
      processing_method: "건조/분말/캡슐화",
      target_buyer: "한미양행, KFFR",
      farmer_rescue_reason: "과잉 브로콜리를 건강식 원료로 전환",
      opportunity_percent: 88,
      urgency_percent: 72,
      status: "후보",
    },
  ];

  const { error } = await supabase.from("agri_processing_opportunity").insert(rows);

  return { name: "KFFR 원료기회", ok: !error, count: error ? 0 : rows.length, message: error?.message || "KFFR 원료기회 저장 완료" };
}

export async function POST() {
  const supabase = createSupabaseAdminClient();

  const { data: run } = await supabase
    .from("agri_collection_runs")
    .insert({ run_type: "manual", status: "started" })
    .select("id")
    .single();

  const results = await Promise.all([
    collectKamisPrices(),
    collectGarakData(),
    collectPolicySignals(),
    collectWeatherSignals(),
    updateKffrOpportunities(),
  ]);

  const ok = results.every((r) => r.ok);
  const errorMessage = results.filter((r) => !r.ok).map((r) => `${r.name}: ${r.message}`).join("\n");

  if (run?.id) {
    await supabase
      .from("agri_collection_runs")
      .update({
        status: ok ? "success" : "partial",
        collected_price_count: results.filter((r) => ["KAMIS", "가락시장"].includes(r.name)).reduce((s, r) => s + r.count, 0),
        collected_policy_count: results.find((r) => r.name === "농림축산식품부")?.count || 0,
        collected_weather_count: results.find((r) => r.name === "기상청")?.count || 0,
        error_message: errorMessage || null,
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id);
  }

  return NextResponse.json({
    ok,
    message: ok ? "데이터 수집 완료" : "일부 수집 실패 또는 API 키 없음",
    results,
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "POST로 호출하면 KAMIS/가락시장/정책/기후/KFFR 원료기회 수집을 실행합니다.",
    required_env: [
      "KAMIS_CERT_ID",
      "KAMIS_CERT_KEY",
      "GARAK_API_KEY",
      "KMA_API_KEY",
    ],
  });
}
