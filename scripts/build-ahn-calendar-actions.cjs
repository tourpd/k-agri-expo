const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.join(process.cwd(), ".env.local");
const envText = fs.readFileSync(envPath, "utf8");

for (const line of envText.split("\n")) {
  const m = line.match(/^([^#=\s]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

function monthOf(r) {
  const t = `${r.month_text || ""} ${r.growth_stage || ""} ${r.topic || ""} ${r.raw_text || ""}`;

  if (t.includes("1월")) return 1;
  if (t.includes("2월")) return 2;
  if (t.includes("3월") || t.includes("육묘")) return 3;
  if (t.includes("4월") || t.includes("정식") || t.includes("활착")) return 4;
  if (t.includes("5월") || t.includes("개화")) return 5;
  if (t.includes("6월") || t.includes("착과") || t.includes("총채") || t.includes("고온")) return 6;
  if (t.includes("7월") || t.includes("비대") || t.includes("탄저")) return 7;
  if (t.includes("8월") || t.includes("수확")) return 8;
  if (t.includes("9월")) return 9;
  if (t.includes("10월") || t.includes("파종")) return 10;
  if (t.includes("11월")) return 11;
  if (t.includes("12월") || t.includes("월동")) return 12;

  return null;
}

function stageOf(r) {
  const t = `${r.growth_stage || ""} ${r.topic || ""} ${r.raw_text || ""}`;

  if (t.includes("육묘")) return "육묘기";
  if (t.includes("정식")) return "정식기";
  if (t.includes("활착")) return "활착기";
  if (t.includes("개화")) return "개화기";
  if (t.includes("착과")) return "착과기";
  if (t.includes("비대")) return "비대기";
  if (t.includes("수확")) return "수확기";
  if (t.includes("월동")) return "월동기";
  if (t.includes("파종")) return "파종기";
  if (t.includes("총채") || t.includes("탄저") || t.includes("역병")) return "병해충 관리기";
  if (t.includes("고온") || t.includes("낙화") || t.includes("낙과")) return "고온장해 관리기";

  return r.growth_stage || "생육관리";
}

function issueOf(r) {
  const t = `${r.disease_name || ""} ${r.topic || ""} ${r.raw_text || ""}`;

  if (t.includes("총채")) return "총채벌레";
  if (t.includes("탄저")) return "탄저병";
  if (t.includes("역병")) return "역병";
  if (t.includes("진딧")) return "진딧물";
  if (t.includes("바이러스")) return "바이러스";
  if (t.includes("고온")) return "고온장해";
  if (t.includes("낙화")) return "낙화";
  if (t.includes("낙과")) return "낙과";
  if (t.includes("칼슘")) return "칼슘관리";
  if (t.includes("붕소")) return "붕소관리";
  if (t.includes("비대")) return "비대관리";
  if (t.includes("착과")) return "착과관리";

  return r.disease_name || r.topic || "생육관리";
}

function actionOf(r) {
  const crop = r.crop || "작물";
  const t = `${r.raw_text || ""} ${r.topic || ""} ${r.disease_name || ""}`;
  const issue = issueOf(r);

  if (t.includes("총채")) return `${crop} 포장에 총채벌레 발생 여부를 확인하고, 잎 뒷면과 꽃 부위를 중심으로 예찰한다.`;
  if (t.includes("탄저")) return `${crop} 과실과 잎의 탄저병 의심 증상을 확인하고, 비 온 뒤 병 확산 여부를 집중 점검한다.`;
  if (t.includes("역병")) return `${crop} 배수 상태와 뿌리 부패 증상을 확인하고, 물 고임이 있는 구역을 우선 관리한다.`;
  if (t.includes("고온") || t.includes("낙화") || t.includes("낙과")) return `${crop} 고온기 낙화·낙과를 줄이기 위해 관수 상태와 착과 상태를 점검하고 고온장해 대비 관리를 시작한다.`;
  if (t.includes("칼슘")) return `${crop} 생장점과 과실 상태를 확인하고 칼슘 결핍 증상이 보이면 칼슘 보충 관리를 준비한다.`;
  if (t.includes("붕소")) return `${crop} 착과와 생장 상태를 확인하고 붕소 부족 가능성에 대비해 미량요소 관리를 준비한다.`;
  if (t.includes("착과")) return `${crop} 착과 상태를 확인하고 착과 불량 구역은 영양상태와 온도 스트레스를 함께 점검한다.`;
  if (t.includes("비대")) return `${crop} 과실 비대 상태를 확인하고 수분·영양 공급이 끊기지 않도록 관리한다.`;
  if (t.includes("수확")) return `${crop} 수확기 품질과 병해 발생 여부를 확인하고 상품성 저하 요인을 먼저 제거한다.`;

  return `${crop} ${issue} 관련 핵심 관리 포인트를 농가 상황에 맞게 확인하고 필요한 작업을 준비한다.`;
}

function rejectBad(action) {
  const bad = ["확인하세요", "점검하세요", "관리하세요", "주의하세요", "필요합니다"];
  if (!action || action.length < 25) return true;
  if (bad.includes(action.trim())) return true;
  return false;
}

function materialsOf(r) {
  const t = `${r.raw_text || ""} ${r.topic || ""} ${r.disease_name || ""}`;
  const a = [];

  if (t.includes("총채") || t.includes("진딧") || t.includes("나방")) a.push("충해 방제 자재");
  if (t.includes("탄저") || t.includes("역병") || t.includes("바이러스")) a.push("병해 방제 자재");
  if (t.includes("고온") || t.includes("낙화") || t.includes("낙과")) a.push("고온장해 완화제");
  if (t.includes("칼슘")) a.push("칼슘제");
  if (t.includes("붕소")) a.push("붕소");
  if (t.includes("착과") || t.includes("비대")) a.push("착과·비대 영양제");

  return [...new Set(a.length ? a : ["생육관리 영양제"])];
}

(async () => {
  console.log("1) 테이블 생성 RPC 대신 SQL 파일을 먼저 만듭니다.");

  const migration = `
create table if not exists public.agri_calendar_actions (
  id uuid primary key default gen_random_uuid(),
  source_page_id uuid,
  job_id uuid,
  source_title text,
  source_type text default 'ppt',
  crop text not null,
  month int,
  growth_stage text,
  issue text,
  action_instruction text not null,
  reason text,
  alert_timing text default '작업 2주 전',
  recommended_materials text[] default '{}',
  content_angle text,
  shorts_title text,
  broadcast_title text,
  sms_message text,
  quality_score int default 0,
  source_page_number int,
  thumbnail_url text,
  status text default 'draft',
  created_at timestamptz default now(),
  unique(source_page_id, crop, month, issue)
);
`;

  fs.writeFileSync("supabase/migrations/20260617_agri_calendar_actions.sql", migration);

  console.log("2) Supabase에 테이블 생성 시도");
  const { error: createError } = await supabase.rpc("exec_sql", { sql: migration }).catch((e) => ({ error: e }));

  if (createError) {
    console.log("RPC exec_sql 없음 또는 실패. Supabase SQL Editor에서 아래 파일을 실행해야 할 수 있음:");
    console.log("supabase/migrations/20260617_agri_calendar_actions.sql");
  }

  console.log("3) 기존 데이터 삭제");
  await supabase.from("agri_calendar_actions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("4) knowledge_page_index 읽는 중");
  const { data, error } = await supabase
    .from("knowledge_page_index")
    .select("*")
    .order("importance_score", { ascending: false })
    .limit(3000);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const rows = data || [];
  const actions = [];

  for (const r of rows) {
    const crop = r.crop || "";
    if (!crop || crop === "공통") continue;

    const month = monthOf(r);
    const growth_stage = stageOf(r);
    const issue = issueOf(r);
    const action_instruction = actionOf(r);

    if (rejectBad(action_instruction)) continue;

    const recommended_materials = materialsOf(r);
    const contentText = String(r.raw_text || r.visual_summary || "").slice(0, 120);

    actions.push({
      source_page_id: r.id,
      job_id: r.job_id,
      source_title: r.source_title,
      source_type: r.file_type || "ppt",
      crop,
      month,
      growth_stage,
      issue,
      action_instruction,
      reason: contentText,
      alert_timing: "작업 2주 전",
      recommended_materials,
      content_angle: `${crop} ${issue} 관리법`,
      shorts_title: `${crop} ${issue}, 지금 놓치면 손해봅니다`,
      broadcast_title: `${crop} 농가가 꼭 알아야 할 ${issue} 관리`,
      sms_message: `[K-AGRI] ${crop} ${issue} 관리 시기입니다. ${action_instruction}`,
      quality_score: Math.max(r.importance_score || 0, r.farmer_value_score || 0, r.content_score || 0),
      source_page_number: r.page_number,
      thumbnail_url: r.thumbnail_url,
      status: "draft",
    });
  }

  console.log(`5) 생성 후보: ${actions.length}건`);

  for (let i = 0; i < actions.length; i += 500) {
    const chunk = actions.slice(i, i + 500);
    const { error: upsertError } = await supabase
      .from("agri_calendar_actions")
      .upsert(chunk, { onConflict: "source_page_id,crop,month,issue" });

    if (upsertError) {
      console.error("UPSERT ERROR", upsertError);
      process.exit(1);
    }
  }

  console.log("✅ 안이영 자료 → agri_calendar_actions 변환 완료");
})();
