import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mkdir, readFile, readdir } from "fs/promises";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);
const soffice = "/opt/homebrew/bin/soffice";
const pdftotext = "/opt/homebrew/bin/pdftotext";
const pdftoppm = "/opt/homebrew/bin/pdftoppm";
const pdfinfo = "/opt/homebrew/bin/pdfinfo";

async function updateJob(id: string, patch: Record<string, any>) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("knowledge_file_jobs").update(patch).eq("id", id);
}

function absPublicPath(publicPath: string) {
  return path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
}

function safeDirName(name: string) {
  return name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "_")
    .slice(0, 80) + "_" + Date.now();
}

async function convertWithSoffice(inputPath: string, outDir: string, format: string) {
  await execFileAsync(soffice, [
    "--headless",
    "--convert-to",
    format,
    "--outdir",
    outDir,
    inputPath,
  ]);

  const base = path.basename(inputPath, path.extname(inputPath));
  const ext = format.split(":")[0];
  return path.join(outDir, `${base}.${ext}`);
}

async function getPdfPageCount(pdfPath: string) {
  try {
    const { stdout } = await execFileAsync(pdfinfo, [pdfPath]);
    const m = stdout.match(/Pages:\s+(\d+)/);
    return m ? Number(m[1]) : 0;
  } catch {
    return 0;
  }
}

async function extractPdfText(pdfPath: string, outTxt: string) {
  try {
    await execFileAsync(pdftotext, ["-layout", pdfPath, outTxt]);
    return await readFile(outTxt, "utf8");
  } catch {
    return "";
  }
}

async function renderPdfPages(params: {
  jobId: string;
  pdfPath: string;
  publicDirName: string;
  pageCount: number;
}) {
  const outDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "knowledge-pages",
    params.publicDirName
  );

  await mkdir(outDir, { recursive: true });

  const maxPages = Math.min(params.pageCount || 999, 20);
  const urls: string[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const prefix = path.join(outDir, `page-${String(page).padStart(3, "0")}`);

    try {
      await execFileAsync(pdftoppm, [
        "-f",
        String(page),
        "-l",
        String(page),
        "-png",
        "-r",
        "110",
        params.pdfPath,
        prefix,
      ]);
    } catch {
      break;
    }

    const files = (await readdir(outDir))
      .filter((x) => x.startsWith(`page-${String(page).padStart(3, "0")}`) && x.endsWith(".png"))
      .sort();

    for (const f of files) {
      urls.push(`/uploads/knowledge-pages/${params.publicDirName}/${f}`);
    }

    const progress = Math.min(85, 35 + Math.round((page / maxPages) * 50));

    await updateJob(params.jobId, {
      stage: `대표 썸네일 생성 중 ${page}/${maxPages}페이지`,
      progress,
      processed_pages: page,
      image_count: urls.length,
    });
  }

  return urls;
}


function splitTextToPages(text: string, pageCount: number) {
  const cleaned = String(text || "").trim();
  if (!cleaned) return [];

  const pages = cleaned
    .split(/\f/g)
    .map((x) => x.trim())
    .filter(Boolean);

  if (pages.length > 1) return pages;

  const chunkSize = Math.max(1200, Math.ceil(cleaned.length / Math.max(pageCount || 1, 1)));
  return cleaned.match(new RegExp(`[\\s\\S]{1,${chunkSize}}`, "g")) || [];
}

function inferSimpleIndex(raw: string, sourceTitle: string, pageNumber: number) {
  const text = `${sourceTitle}\n${raw}`;

  const crops = ["고추","마늘","양파","딸기","오이","수박","멜론","감자","대파","배추","상추","참깨","인삼","토마토","생강","블루베리","복숭아","콩","들깨"];
  const diseases = ["탄저병","역병","청고병","바이러스","총채벌레","진딧물","응애","흰가루병","노균병","잿빛곰팡이","시들음병","무름병","칼슘결핍","마그네슘결핍","붕소결핍","생리장해"];
  const months = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월","장마","정식","수확","육묘"];

  const crop = crops.find((x) => text.includes(x)) || "공통";
  const disease = diseases.find((x) => text.includes(x)) || "";
  const month = months.find((x) => text.includes(x)) || "";

  let score = 30;
  if (crop !== "공통") score += 15;
  if (disease) score += 25;
  if (month) score += 10;
  if (/방제|예방|수확|피해|증상|대책|관리|주의|발생/.test(text)) score += 15;
  if (/농가|농민|수량|소득|품질|상품성/.test(text)) score += 5;

  score = Math.min(100, score);

  const topic =
    disease ||
    (text.match(/.{0,8}(관리|방제|예방|수확|정식|육묘|장해).{0,8}/)?.[0] || "일반자료");

  const contentUse =
    score >= 80
      ? "작가실 우선 검토: 쇼츠·방송소재·농민 행동지시로 활용 가능"
      : score >= 60
      ? "콘텐츠 후보: 카드뉴스·상담답변·월별 작업지시 후보"
      : "보관 및 검색용 색인";

  return {
    crop,
    month_text: month,
    growth_stage: month,
    topic,
    disease_name: disease,
    symptom: disease ? `${disease} 관련 증상 또는 관리 포인트` : "",
    cause: "",
    countermeasure: "",
    importance_score: score,
    farmer_value_score: score,
    content_score: score >= 70 ? score : Math.max(0, score - 10),
    shorts_score: disease ? score : Math.max(0, score - 20),
    broadcast_score: score,
    consulting_score: disease ? score : Math.max(0, score - 15),
    business_score: Math.max(0, score - 30),
    content_use: contentUse,
    writer_room_memo: `${crop} ${topic} 페이지. 원문 확인 후 콘텐츠화 검토.`,
    action_instruction: disease
      ? `${crop} 농가는 ${disease} 관련 증상을 확인하고 예방·방제 시기를 점검하세요.`
      : `${crop} 관련 재배관리 포인트를 확인하세요.`,
  };
}

async function savePageIndex(params: {
  jobId: string;
  fileName: string;
  fileType: string;
  text: string;
  pageCount: number;
  thumbnails: string[];
}) {
  const supabase = createSupabaseAdminClient();
  const pages = splitTextToPages(params.text, params.pageCount);

  const rows = pages.map((raw, idx) => {
    const inferred = inferSimpleIndex(raw, params.fileName, idx + 1);

    return {
      job_id: params.jobId,
      source_title: params.fileName,
      file_type: params.fileType,
      page_number: idx + 1,
      raw_text: raw.slice(0, 8000),
      ...inferred,
      thumbnail_url: params.thumbnails[idx] || null,
      status: "indexed",
    };
  });

  let inserted = 0;
  const batchSize = 100;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("knowledge_page_index").insert(batch);
    if (error) throw new Error(`page_index 저장 실패: ${error.message}`);
    inserted += batch.length;
  }

  return inserted;
}


async function saveVisualPages(params: {
  fileName: string;
  fileType: string;
  imageUrls: string[];
  text: string;
}) {
  const supabase = createSupabaseAdminClient();

  const rows = params.imageUrls.map((url, idx) => ({
    source_title: params.fileName,
    source_name: params.fileName,
    source_type: params.fileType,
    page_number: idx + 1,
    image_url: url,
    crop: "분석필요",
    visual_type: "자료화면",
    key_info: String(params.text || "").slice(0, 1000),
    ai_status: "pending",
    db_destination: "knowledge_visual_pages",
    usage_flow: "자료화면 → 이미지분석 → 판단규칙 → 방송소재 → 쇼츠 → 농민상담 → 행동지시",
  }));

  if (rows.length === 0) return 0;

  let inserted = 0;
  const batchSize = 50;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("knowledge_visual_pages").insert(batch);
    if (error) throw new Error(error.message);
    inserted += batch.length;
  }

  return inserted;
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseAdminClient();

  try {
    const body = await req.json();
    const id = String(body.id || body.job_id || "").trim();

    if (!id) {
      return NextResponse.json({ error: "job id가 필요합니다." }, { status: 400 });
    }

    const { data: job, error } = await supabase
      .from("knowledge_file_jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: error?.message || "job을 찾지 못했습니다." }, { status: 404 });
    }

    await updateJob(id, {
      status: "processing",
      stage: "처리 시작",
      progress: 15,
      started_at: new Date().toISOString(),
      error_message: null,
    });

    const sourceAbs = absPublicPath(job.source_path);
    const workDir = path.dirname(sourceAbs);
    const fileName = job.file_name;
    const fileType = String(job.file_type || "").toLowerCase();
    const assetDir = safeDirName(fileName);

    let pdfPath = "";
    let text = "";

    if (fileType === "pdf") {
      pdfPath = sourceAbs;
    } else {
      await updateJob(id, { stage: "PDF 변환 중", progress: 25 });
      pdfPath = await convertWithSoffice(sourceAbs, workDir, "pdf");
    }

    await updateJob(id, { stage: "PDF 텍스트 추출 중", progress: 30, pdf_path: pdfPath });

    const txtPath = path.join(workDir, "out.txt");
    text = await extractPdfText(pdfPath, txtPath);

    const pageCount = await getPdfPageCount(pdfPath);

    await updateJob(id, {
      stage: `PDF 분석 완료 / ${pageCount || "미확인"}페이지`,
      progress: 35,
      total_pages: pageCount || 0,
      text_length: text.length,
    });

    const imageUrls = await renderPdfPages({
      jobId: id,
      pdfPath,
      publicDirName: assetDir,
      pageCount,
    });

    await updateJob(id, { stage: "페이지 색인 DB 저장 중", progress: 90 });

    const indexInserted = await savePageIndex({
      jobId: id,
      fileName,
      fileType,
      text,
      pageCount,
      thumbnails: imageUrls,
    });

    const result = {
      ok: true,
      fileName,
      fileType,
      text,
      imageUrls,
      slideCount: pageCount || imageUrls.length,
      page_index_inserted: indexInserted,
    };

    await updateJob(id, {
      status: "done",
      stage: "고속 색인 완료",
      progress: 100,
      text_length: text.length,
      image_count: imageUrls.length,
      visual_inserted: indexInserted,
      result,
      finished_at: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (e: any) {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || body.job_id || "").trim();

    if (id) {
      await updateJob(id, {
        status: "failed",
        stage: "실패",
        error_message: e?.message || "처리 실패",
        finished_at: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { error: e?.message || "job 처리 실패" },
      { status: 500 }
    );
  }
}
