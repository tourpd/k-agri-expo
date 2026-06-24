import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const txt = fs.readFileSync(".env.local", "utf8");
  for (const line of txt.split(/\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
function pad(n) { return String(n).padStart(3, "0"); }

loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

let jobId = process.argv[2];

if (!jobId) {
  const { data, error } = await supabase
    .from("knowledge_file_jobs")
    .select("id,file_name,total_pages,image_count,created_at,status,pdf_path")
    .eq("status", "done")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  const target = (data || []).find(j => Number(j.total_pages || 0) > Number(j.image_count || 0));
  if (!target) {
    console.log("복구할 깨진 job이 없습니다.");
    process.exit(0);
  }

  jobId = target.id;
  console.log("자동 선택 job:", target.file_name, target.id, `${target.image_count}/${target.total_pages}`);
}

const { data: job, error: jobError } = await supabase
  .from("knowledge_file_jobs")
  .select("*")
  .eq("id", jobId)
  .maybeSingle();

if (jobError) throw jobError;
if (!job) throw new Error("job 없음: " + jobId);

const total = Number(job.total_pages || job.result?.slideCount || 0);
if (!total) throw new Error("total_pages 없음");

const pdfPath = job.pdf_path;
if (!pdfPath || !fs.existsSync(pdfPath)) throw new Error("PDF 없음: " + pdfPath);

const dirName = job.id;
const outDir = path.join(process.cwd(), "public", "uploads", "knowledge-pages", dirName);
fs.mkdirSync(outDir, { recursive: true });

console.log("복구 시작:", job.file_name);
console.log("총 페이지:", total);
console.log("PDF:", pdfPath);
console.log("이미지 폴더:", outDir);

for (let page = 1; page <= total; page++) {
  const prefix = path.join(outDir, `page-${pad(page)}`);
  const png = `${prefix}.png`;

  if (!fs.existsSync(png)) {
    execFileSync("pdftoppm", ["-png", "-f", String(page), "-l", String(page), "-singlefile", pdfPath, prefix], {
      stdio: "ignore",
    });
  }

  const url = `/uploads/knowledge-pages/${dirName}/page-${pad(page)}.png`;

  const { error } = await supabase
    .from("knowledge_page_index")
    .update({
      thumbnail_url: url,
      full_image_url: url,
      image_analysis_status: "asset_indexed",
    })
    .eq("job_id", job.id)
    .eq("page_number", page);

  if (error) console.error("DB 업데이트 실패 P" + page, error.message);

  if (page % 20 === 0 || page === total) {
    console.log(`진행 ${page}/${total}`);
  }
}

await supabase
  .from("knowledge_file_jobs")
  .update({
    processed_pages: total,
    image_count: total,
    stage: "전체 페이지 이미지 복구 완료",
    progress: 100,
  })
  .eq("id", job.id);

console.log("완료:", job.file_name, `${total}장`);
