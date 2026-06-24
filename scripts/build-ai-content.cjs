const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(url, key);

(async () => {
  console.log("1. 기존 AI 콘텐츠 삭제");
  const { error: delError } = await supabase
    .from("ai_content_materials")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (delError) {
    console.error("DELETE ERROR:", delError);
    process.exit(1);
  }

  console.log("2. 행동지시 읽기");
  const { data, error } = await supabase
    .from("farm_calendar_actions")
    .select("*")
    .order("importance_score", { ascending: false });

  if (error) {
    console.error("SELECT ERROR:", error);
    process.exit(1);
  }

  console.log("행동지시:", data.length);

  const rows = data.map((r) => ({
    source_action_id: r.id,
    source_page_id: r.source_page_id,
    crop: r.crop,
    month_no: r.month_no,
    action_instruction: r.action_instruction,
    video_title: `${r.crop} ${r.problem_title}, 지금 확인해야 합니다`,
    video_outline: r.action_instruction,
    shorts_title: `${r.crop} ${r.problem_title} 놓치면 손해`,
    shorts_script: r.action_instruction,
    ad_title: `${r.crop} 농가 필수 관리`,
    ad_script: r.action_instruction,
    group_buy_item: (r.recommended_materials || []).join(", "),
    group_buy_reason: r.problem_title,
    priority_score: r.importance_score || 50,
  }));

  console.log("생성:", rows.length);

  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);

    const { error: insertError } = await supabase
      .from("ai_content_materials")
      .insert(chunk);

    if (insertError) {
      console.error("INSERT ERROR:", insertError);
      process.exit(1);
    }

    console.log("저장:", Math.min(i + 500, rows.length), "/", rows.length);
  }

  const { count, error: countError } = await supabase
    .from("ai_content_materials")
    .select("*", { count: "exact", head: true });

  if (countError) console.error("COUNT ERROR:", countError);

  console.log("최종 COUNT =", count);
})();
