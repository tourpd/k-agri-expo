const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

(async () => {
  const { data: jobs, error } = await supabase
    .from("knowledge_file_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("JOB SELECT ERROR:", error);
    process.exit(1);
  }

  console.log("최근 JOB:");
  console.dir(jobs, { depth: null });

  const target = jobs?.find((j) =>
    ["processing", "uploaded", "pending", "running"].includes(String(j.status || ""))
  ) || jobs?.[0];

  if (!target) {
    console.log("복구할 job 없음");
    return;
  }

  const jobId = target.id;

  const { count: pageCount } = await supabase
    .from("knowledge_page_index")
    .select("*", { count: "exact", head: true })
    .eq("job_id", jobId);

  console.log("복구 대상 job:", jobId);
  console.log("색인 페이지 수:", pageCount);

  const patch = {
    status: pageCount && pageCount > 0 ? "done" : "failed",
    progress: pageCount && pageCount > 0 ? 100 : target.progress,
    stage: pageCount && pageCount > 0
      ? `강제 완료: 색인 ${pageCount}페이지 확인`
      : "실패: 색인 페이지 없음",
    error_message: pageCount && pageCount > 0 ? null : "색인 페이지가 없어 실패 처리",
    updated_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("knowledge_file_jobs")
    .update(patch)
    .eq("id", jobId);

  if (updateError) {
    console.error("UPDATE ERROR:", updateError);
    process.exit(1);
  }

  console.log("✅ stuck job 복구 완료");
})();
