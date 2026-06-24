import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function detectMonth(text:string){
  const m = text.match(/([1-9]|1[0-2])월/);
  return m ? Number(m[1]) : null;
}

function detectStage(text:string){
  if(text.includes("정식")) return "정식";
  if(text.includes("육묘")) return "육묘";
  if(text.includes("개화")) return "개화";
  if(text.includes("착과")) return "착과";
  if(text.includes("비대")) return "비대";
  if(text.includes("수확")) return "수확";
  return "재배관리";
}

(async()=>{

  const { data: pages } = await supabase
    .from("knowledge_page_index")
    .select("*")
    .order("importance_score",{ascending:false})
    .limit(946);

  if(!pages){
    console.log("no pages");
    process.exit(0);
  }

  let count=0;

  for(const row of pages){

    const text = row.raw_text || "";

    const crop =
      row.crop ||
      row.visual_findings?.crop ||
      "공통";

    const monthNo =
      detectMonth(text) ||
      detectMonth(row.topic || "") ||
      null;

    const stage =
      detectStage(text);

    const problem =
      row.topic ||
      row.disease_name ||
      "재배관리";

    const action =
      row.action_instruction ||
      text.substring(0,120);

    await supabase
      .from("farm_calendar_actions")
      .insert({
        source_page_id: row.id,
        source_type: row.file_type,
        crop,
        month_no: monthNo,
        growth_stage: stage,
        problem_title: problem,
        action_instruction: action,
        shorts_title:
          `${crop} ${problem} 지금 꼭 확인하세요`,
        sms_message:
          `[농사119] ${crop} ${problem} 관리시기입니다.`,
        importance_score:
          row.importance_score || 0
      });

    count++;

    if(count % 50 === 0){
      console.log(count);
    }
  }

  console.log("DONE =",count);

})();
