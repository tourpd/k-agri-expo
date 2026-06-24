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

function detectMonth(text) {
  const s = String(text || "");
  const m = s.match(/([1-9]|1[0-2])월/);
  if (m) return Number(m[1]);

  if (s.includes("육묘")) return 3;
  if (s.includes("정식") || s.includes("활착")) return 4;
  if (s.includes("개화")) return 5;
  if (s.includes("착과") || s.includes("총채") || s.includes("고온")) return 6;
  if (s.includes("비대") || s.includes("탄저")) return 7;
  if (s.includes("수확")) return 8;
  if (s.includes("파종")) return 10;
  if (s.includes("월동")) return 12;

  return null;
}

function detectStage(text) {
  const s = String(text || "");
  if (s.includes("육묘")) return "육묘";
  if (s.includes("정식")) return "정식";
  if (s.includes("활착")) return "활착";
  if (s.includes("개화")) return "개화";
  if (s.includes("착과")) return "착과";
  if (s.includes("비대")) return "비대";
  if (s.includes("수확")) return "수확";
  if (s.includes("파종")) return "파종";
  if (s.includes("월동")) return "월동";
  return "재배관리";
}

function materialOf(text) {
  const s = String(text || "");
  const a = [];

  if (s.includes("총채") || s.includes("진딧") || s.includes("나방")) a.push("충해 방제 자재");
  if (s.includes("탄저") || s.includes("역병") || s.includes("바이러스")) a.push("병해 방제 자재");
  if (s.includes("고온") || s.includes("낙화") || s.includes("낙과")) a.push("고온장해 완화제");
  if (s.includes("칼슘")) a.push("칼슘제");
  if (s.includes("붕소")) a.push("붕소");
  if (s.includes("착과") || s.includes("비대")) a.push("착과·비대 영양제");

  return a.length ? Array.from(new Set(a)) : ["생육관리 영양제"];
}

function actionOf(row) {
  const crop = row.crop || row.visual_findings?.crop || "작물";
  const s = `${row.raw_text || ""} ${row.topic || ""} ${row.disease_name || ""}`;

  if (s.includes("총채")) return `${crop} 포장에 총채벌레 발생 여부를 잎 뒷면과 꽃 부위를 중심으로 예찰한다.`;
  if (s.includes("탄저")) return `${crop} 과실과 잎의 탄저병 의심 증상을 확인하고 비 온 뒤 확산 여부를 점검한다.`;
  if (s.includes("고온") || s.includes("낙화") || s.includes("낙과")) return `${crop} 고온기 낙화·낙과를 줄이기 위해 관수 상태와 착과 상태를 확인하고 고온장해 대비 관리를 시작한다.`;
  if (s.includes("칼슘")) return `${crop} 생장점과 과실 상태를 확인하고 칼슘 결핍 증상이 보이면 칼슘 보충 관리를 준비한다.`;
  if (s.includes("착과")) return `${crop} 착과 상태를 확인하고 착과 불량 구역은 영양상태와 온도 스트레스를 함께 점검한다.`;
  if (s.includes("비대")) return `${crop} 과실 비대 상태를 확인하고 수분·영양 공급이 끊기지 않도록 관리한다.`;
  if (s.includes("수확")) return `${crop} 수확기 품질과 병해 발생 여부를 확인하고 상품성 저하 요인을 먼저 제거한다.`;

  return `${crop} ${row.topic || row.disease_name || "재배관리"} 관련 핵심 관리 포인트를 농가 상황에 맞게 확인하고 필요한 작업을 준비한다.`;
}

(async () => {
  console.log("1) 기존 farm_calendar_actions 삭제");
  await supabase.from("farm_calendar_actions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("2) knowledge_page_index 읽는 중");
  const { data, error } = await supabase
    .from("knowledge_page_index")
    .select("*")
    .order("importance_score", { ascending: false })
    .limit(3000);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const pages = data || [];
  const inserts = [];

  for (const row of pages) {
    const body = `${row.raw_text || ""} ${row.topic || ""} ${row.disease_name || ""} ${row.growth_stage || ""}`;
    const crop = row.crop || row.visual_findings?.crop || "공통";

    if (!crop || crop === "공통") continue;

    const month_no = detectMonth(body);
    const growth_stage = detectStage(body);
    const problem_title = row.disease_name || row.topic || "재배관리";
    const action_instruction = actionOf(row);
    const recommended_materials = materialOf(body);

    inserts.push({
      source_page_id: row.id,
      source_type: row.file_type || "ppt",
      crop,
      month_no,
      growth_stage,
      problem_title,
      action_instruction,
      recommended_materials,
      shorts_title: `${crop} ${problem_title}, 지금 놓치면 손해봅니다`,
      sms_message: `[농사119] ${crop} ${problem_title} 관리 시기입니다. ${action_instruction}`,
      importance_score: row.importance_score || 0,
    });
  }

  console.log("3) 생성 후보:", inserts.length, "건");

  for (let i = 0; i < inserts.length; i += 500) {
    const chunk = inserts.slice(i, i + 500);
    const { error: insertError } = await supabase
      .from("farm_calendar_actions")
      .insert(chunk);

    if (insertError) {
      console.error("INSERT ERROR", insertError);
      process.exit(1);
    }

    console.log("저장:", Math.min(i + 500, inserts.length), "/", inserts.length);
  }

  console.log("✅ farm_calendar_actions 생성 완료:", inserts.length, "건");
})();
