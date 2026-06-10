import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "expo-assets";
const PAGES_PER_CHUNK = 20;
const MAX_CHUNKS_TO_ANALYZE = 10;
const CONCURRENCY = 2;

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  basic: 3,
  growth: 10,
  premium: 20,
  vip: 50,
};

function clean(v: unknown) {
  return String(v || "").trim();
}

function normalizePlan(v: unknown) {
  const plan = clean(v).toLowerCase();
  return PLAN_LIMITS[plan] ? plan : "free";
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function productKey(name: string) {
  return clean(name).toLowerCase().replace(/\s+/g, "");
}

function addLog(logs: string[], text: string) {
  const line = `[catalog-import] ${text}`;
  logs.push(line);
  console.log(line);
}

async function splitPdfIntoChunks(buffer: Buffer) {
  const sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();

  const chunks: { startPage: number; endPage: number; bytes: Uint8Array }[] = [];

  const totalChunks = Math.min(
    Math.ceil(totalPages / PAGES_PER_CHUNK),
    MAX_CHUNKS_TO_ANALYZE,
  );

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startIndex = chunkIndex * PAGES_PER_CHUNK;
    const endIndex = Math.min(startIndex + PAGES_PER_CHUNK, totalPages);

    const chunkPdf = await PDFDocument.create();

    const pageIndexes = Array.from(
      { length: endIndex - startIndex },
      (_, i) => startIndex + i,
    );

    const copiedPages = await chunkPdf.copyPages(sourcePdf, pageIndexes);
    copiedPages.forEach((page) => chunkPdf.addPage(page));

    const bytes = await chunkPdf.save();

    chunks.push({
      startPage: startIndex + 1,
      endPage: endIndex,
      bytes,
    });
  }

  return { totalPages, chunks };
}

async function extractProductNamesFromChunk({
  pdfUrl,
  pageLabel,
  vendorMemo,
}: {
  pdfUrl: string;
  pageLabel: string;
  vendorMemo: string;
}) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되어 있지 않습니다.");
  }

  const prompt = `
너는 K-Agri Expo 카탈로그 제품명 추출 담당자다.

이 PDF 카탈로그 일부(${pageLabel})에서 제품명 후보만 빠르게 추출하라.

중요:
- 제품명만 뽑아라.
- 회사 소개, 인사말, 목차, 카테고리명, 메뉴명은 제품으로 만들지 마라.
- 농자재, 비료, 영양제, 병해충관리제, 종자, 농기계, 건강식품, 곤충식품, 스마트농업 상품은 추출하라.
- 성분, 사용법, 긴 설명은 지금 추출하지 마라.
- 중복은 가능하면 제거하라.
- 결과는 반드시 JSON만 반환하라.

업체 의견:
${vendorMemo || "없음"}

반환 형식:
{
  "products": [
    {
      "product_name": "제품명",
      "category_hint": "대략 분류",
      "page_hint": "${pageLabel}"
    }
  ]
}
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_AUTO_IMPORT_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_file", file_url: pdfUrl },
          ],
        },
      ],
      temperature: 0.1,
    }),
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json?.error?.message || `${pageLabel} 제품명 추출 실패`);
  }

  const outputText =
    json.output_text ||
    json.output
      ?.flatMap((item: any) => item.content || [])
      .map((content: any) => content.text || "")
      .join("\n") ||
    "";

  const parsed = safeJsonParse(outputText);

  if (!parsed || !Array.isArray(parsed.products)) {
    return [];
  }

  return parsed.products;
}

function mergeProductNames(products: any[]) {
  const map = new Map<string, any>();

  for (const item of products) {
    const name = clean(item?.product_name);
    if (!name) continue;

    const key = productKey(name);
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, item);
      continue;
    }

    const existing = map.get(key);

    map.set(key, {
      ...existing,
      category_hint: clean(existing?.category_hint) || clean(item?.category_hint),
      page_hint: [clean(existing?.page_hint), clean(item?.page_hint)]
        .filter(Boolean)
        .join(", "),
    });
  }

  return Array.from(map.values());
}

function normalizeListProduct(item: any, index: number, productLimit: number) {
  const name = clean(item?.product_name);

  return {
    temp_id: `pdf-list-${index + 1}`,
    product_name: name || `제품 후보 ${index + 1}`,
    category: clean(item?.category_hint) || "AI 확인 필요",
    recommended_hall: "AI 확인 필요",
    short_description: "",
    ingredients: "",
    usage: "",
    target_crop: "",
    selling_point: "",
    farmer_pain_point: "",
    priority: "중",
    priority_reason:
      "카탈로그에서 제품명 후보로 추출되었습니다. 정밀분석 후 우선순위를 확정해야 합니다.",
    proof_needed: "",
    kafs_tv_strategy: "",
    legal_notice: "",
    image_url: "",
    evidence_images: [],
    source: "pdf_product_list",
    selected: index < productLimit,
    page_hint: clean(item?.page_hint),
    needs_deep_analysis: true,
  };
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number,
) {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const current = index;
      index += 1;
      results[current] = await tasks[current]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker()),
  );

  return results;
}

export async function POST(req: Request) {
  const progressLogs: string[] = [];

  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const vendorMemo = clean(formData.get("vendor_memo"));
    const vendorPlan = normalizePlan(formData.get("vendor_plan"));
    const productLimit = PLAN_LIMITS[vendorPlan] || 1;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "PDF 파일이 없습니다." },
        { status: 400 },
      );
    }

    addLog(progressLogs, `파일 수신 완료: ${file.name}`);
    addLog(progressLogs, `요금제: ${vendorPlan}, 자동 선택 수: ${productLimit}개`);

    const supabase = createSupabaseAdminClient();

    const safeFileName = file.name.replace(/[^\w.\-가-힣]/g, "_");
    const timestamp = Date.now();

    addLog(progressLogs, "PDF 파일을 읽는 중입니다.");

    const buffer = Buffer.from(await file.arrayBuffer());
    const { totalPages, chunks } = await splitPdfIntoChunks(buffer);

    addLog(
      progressLogs,
      `총 ${totalPages}페이지 확인. ${PAGES_PER_CHUNK}페이지씩 ${chunks.length}개 구간으로 나눴습니다.`,
    );

    if (totalPages > PAGES_PER_CHUNK * MAX_CHUNKS_TO_ANALYZE) {
      addLog(
        progressLogs,
        `대용량 PDF라서 우선 앞 ${PAGES_PER_CHUNK * MAX_CHUNKS_TO_ANALYZE}페이지까지만 분석합니다.`,
      );
    }

    const allNameCandidates: any[] = [];
    const analyzedRanges: string[] = [];
    const failedRanges: string[] = [];

    const tasks = chunks.map((chunk, i) => async () => {
      const pageLabel = `${chunk.startPage}~${chunk.endPage}페이지`;
      const chunkPath = `catalogs/product-list/${timestamp}-${i + 1}-${safeFileName}`;

      try {
        addLog(progressLogs, `${pageLabel} 업로드 시작`);

        const { error: uploadChunkError } = await supabase.storage
          .from(BUCKET)
          .upload(chunkPath, Buffer.from(chunk.bytes), {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadChunkError) {
          const msg = `${pageLabel}: 업로드 실패 - ${uploadChunkError.message}`;
          failedRanges.push(msg);
          addLog(progressLogs, msg);
          return [];
        }

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(chunkPath);
        const chunkUrl = data.publicUrl;

        addLog(progressLogs, `${pageLabel} 제품명 추출 시작`);

        const products = await extractProductNamesFromChunk({
          pdfUrl: chunkUrl,
          pageLabel,
          vendorMemo,
        });

        analyzedRanges.push(pageLabel);
        addLog(progressLogs, `${pageLabel} 완료: ${products.length}개`);

        return products;
      } catch (chunkError) {
        const msg = `${pageLabel}: ${
          chunkError instanceof Error ? chunkError.message : "제품명 추출 실패"
        }`;

        console.error(`[catalog-import] ${msg}`, chunkError);
        failedRanges.push(msg);
        addLog(progressLogs, msg);

        return [];
      }
    });

    addLog(progressLogs, `동시 ${CONCURRENCY}개 구간씩 제품명 추출을 시작합니다.`);

    const chunkResults = await runWithConcurrency(tasks, CONCURRENCY);

    for (const result of chunkResults) {
      allNameCandidates.push(...result);
    }

    addLog(progressLogs, `원본 제품명 후보 ${allNameCandidates.length}개 수집 완료`);

    const merged = mergeProductNames(allNameCandidates);

    addLog(progressLogs, `중복 제거 후 ${merged.length}개 제품명 후보 정리 완료`);

    const products = merged
      .slice(0, 300)
      .map((item, index) => normalizeListProduct(item, index, productLimit));

    addLog(progressLogs, `최종 화면 표시용 제품 ${products.length}개 생성 완료`);

    return NextResponse.json({
      ok: true,
      source: "pdf_product_list",
      mode: "product_name_only",
      vendor_plan: vendorPlan,
      product_limit: productLimit,
      total_pages: totalPages,
      pages_per_chunk: PAGES_PER_CHUNK,
      analyzed_chunks: analyzedRanges.length,
      failed_chunks: failedRanges.length,
      analyzed_ranges: analyzedRanges,
      failed_ranges: failedRanges.slice(0, 10),
      progress_logs: progressLogs,
      total: products.length,
      company_summary:
        "카탈로그에서 제품명 후보만 우선 추출했습니다. 원하는 제품을 선택한 뒤 정밀분석을 진행하십시오.",
      recommended_plan: null,
      top_recommendations: [
        `현재 등급 기준으로 우선 ${productLimit}개 제품이 자동 선택되었습니다.`,
        "올해 밀고 싶은 대표 제품을 직접 선택한 뒤 정밀분석을 진행하십시오.",
      ],
      kafs_tv_package_suggestion:
        "제품명 추출 단계입니다. 정밀분석 후 한국농수산TV 촬영·쇼츠·공동구매 전략을 제안합니다.",
      final_comment:
        "대용량 카탈로그는 제품명 추출 → 업체 선택 → 선택제품 정밀분석 순서가 가장 빠릅니다.",
      products,
      message: `PDF ${totalPages}페이지 중 ${analyzedRanges.length}개 구간에서 ${products.length}개 제품명 후보를 추출했습니다.`,
    });
  } catch (error) {
    console.error("[catalog-import product-list]", error);

    return NextResponse.json(
      {
        ok: false,
        progress_logs: progressLogs,
        error:
          error instanceof Error
            ? error.message
            : "PDF 제품명 추출 중 오류가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}