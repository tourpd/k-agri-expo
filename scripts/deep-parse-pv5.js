const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

function env() {
  if (!fs.existsSync(".env.local")) return;
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
env();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function extractJson(text) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1));
}

async function main() {
  const description = fs.readFileSync("data/pv5/v9mnqOlYWiQ_description.txt", "utf8");
  const subtitle = fs.readFileSync("data/pv5/subtitle/v9mnqOlYWiQ.ko.vtt", "utf8");
  const ocr = fs.readFileSync("data/pv5/v9mnqOlYWiQ_ocr_all.txt", "utf8");

  const source = `
==========DESCRIPTION==========
${description}

==========SUBTITLE==========
${subtitle}

==========OCR==========
${ocr}
`.slice(0, 160000);

  const prompt = `
너는 PV5 캠핑카 실자료 분석가다.
아래 원천자료에서 실제 확인되는 정보만 추출하라.
가격, 업체명, 주소, 연락처, 제품, 옵션, 공간구조를 우선한다.
추정 금지. JSON만 출력.

원천자료:
${source}

형식:
{
  "summary":"",
  "builder":{"name":"","location":"","contact":"","source_confirmed":true},
  "vehicle":{"model":"PV5","type":"Cargo | Passenger | Unknown","confirmed_features":[]},
  "main_category":"PV5 캠핑카",
  "sub_category":"",
  "confirmed_costs":[{"item":"","price_krw":0,"included":"","source_time_or_source":""}],
  "products":[{"name":"","category":"","brand":"","price_krw":0,"source":""}],
  "space_layout":[{"zone":"","element":"","purpose":"","source_time":""}],
  "electrical":[],
  "furniture":[],
  "human_activity":[],
  "target_customer":[],
  "design_rules":[],
  "pros":[],
  "cons":[],
  "cost_meaning":"",
  "writer_room_notes":"",
  "business_notes":"",
  "developer_notes":"",
  "content_notes":"",
  "evidence_times":[],
  "warnings":[]
}
`;

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_PV5_ANALYSIS_MODEL || "gpt-4.1-mini",
      input: prompt,
      store: false
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));

  const parsed = extractJson(data.output_text || data.output?.[0]?.content?.[0]?.text || "");

  const payload = {
    video_url: "https://youtu.be/v9mnqOlYWiQ",
    video_title: "디파트 PV5 캠핑카 Deep Harvest",
    source_channel: "유튜브",
    builder_name: parsed.builder?.name || "",
    builder_region: parsed.builder?.location || "",
    builder_contact: parsed.builder?.contact || "",
    vehicle_type: parsed.vehicle?.type || "",
    vehicle_model: parsed.vehicle?.model || "PV5",
    main_category: parsed.main_category || "PV5 캠핑카",
    sub_category: parsed.sub_category || "",
    summary: parsed.summary || "",
    target_customer: JSON.stringify(parsed.target_customer || []),
    confirmed_costs: parsed.confirmed_costs || [],
    products: parsed.products || [],
    space_layout: parsed.space_layout || [],
    electrical: parsed.electrical || [],
    furniture: parsed.furniture || [],
    human_activity: parsed.human_activity || [],
    design_rules: parsed.design_rules || [],
    cost_meaning: parsed.cost_meaning || "",
    writer_room_notes: parsed.writer_room_notes || "",
    business_notes: parsed.business_notes || "",
    developer_notes: parsed.developer_notes || "",
    content_notes: parsed.content_notes || "",
    transcript: source,
    raw_analysis: parsed,
    status: "deep_harvested_v2"
  };

  const saved = await supabase.from("pv5_video_analysis").insert(payload).select("id").single();
  if (saved.error) throw new Error(saved.error.message);

  console.log("DEEP HARVEST V2 SAVED:", saved.data.id);
  console.log(JSON.stringify(parsed, null, 2));
}

main().catch(e => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
