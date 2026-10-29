const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  if (!fs.existsSync(".env.local")) return;
  for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const URLS = [
"https://www.youtube.com/shorts/bRNz3GrDyo0",
"https://www.youtube.com/shorts/nTSSibciGc8",
"https://www.youtube.com/shorts/9R0_MqZ9xK0",
"https://youtu.be/PBAnRTr3XDs",
"https://youtu.be/HqNZCRMDoYo",
"https://www.youtube.com/shorts/HUNoFm6GiaY",
"https://www.youtube.com/shorts/sn-4oLvzwPc",
"https://www.youtube.com/shorts/LVhL2seW09M",
"https://www.youtube.com/shorts/-8_XqhEeW4A",
"https://www.youtube.com/shorts/JSzB_uJqruY",
"https://www.youtube.com/shorts/tCTOxubSXk4",
"https://www.youtube.com/shorts/VC5fYwUBjPE",
"https://www.youtube.com/shorts/xyobYC9hjU8",
"https://www.youtube.com/shorts/fPuywy70TMc",
"https://www.youtube.com/shorts/uQ_963_6P5k",
"https://www.youtube.com/shorts/-hBiY4-kyxA",
"https://www.youtube.com/shorts/4yn5AlBBPKE",
"https://www.youtube.com/shorts/43MjPOvjK2U",
"https://www.youtube.com/shorts/UHVSheCYorw",
"https://www.youtube.com/shorts/nPeXitWqlEU",
"https://www.youtube.com/shorts/UtYrjHjRK04",
"https://www.youtube.com/shorts/_CCK6FYXfQI",
"https://www.youtube.com/shorts/oA7TBLAx_yk",
"https://www.youtube.com/shorts/AuWq5PrNpvA",
"https://www.youtube.com/shorts/VUkeVKQsOfE",
"https://www.youtube.com/shorts/gjsMfngDbc0",
"https://www.youtube.com/shorts/fehMDPqppfU",
"https://www.youtube.com/shorts/4m6CfhL-7bw",
"https://www.youtube.com/shorts/-acxNiVyC2o",
"https://www.youtube.com/shorts/BaPO_tYmrcU",
"https://www.youtube.com/shorts/r8HMBRWej_w",
"https://www.youtube.com/shorts/hj6aLYEcVeY",
"https://www.youtube.com/shorts/q6rjTE1DMI0",
"https://www.youtube.com/shorts/us-M1CEJ40A",
"https://www.youtube.com/shorts/detKMBkpUSk",
"https://www.youtube.com/shorts/dmNQVjVpdoE",
"https://www.youtube.com/shorts/D2dlhS5mFHs",
"https://youtu.be/er6r01MCeMk",
"https://youtu.be/v9mnqOlYWiQ",
"https://youtu.be/-DNZ-yKT6II"
];

function sh(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function out(cmd) {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function safeRead(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}

function extractJson(text) {
  const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1));
}

async function analyzeAndSave({ url, id, title, description, channel, source }) {
  const prompt = `
너는 PV5 캠핑카 실자료 분석가다.
아래 원천자료에서 실제 확인되는 정보만 추출하라.
가격, 업체명, 주소, 연락처, 제품, 옵션, 공간구조, 차박 동선, 고객유형을 우선한다.
추정 금지. 없는 값은 빈 값. 반드시 JSON만 출력.

영상 URL:
${url}

원천자료:
${source.slice(0, 160000)}

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
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_PV5_ANALYSIS_MODEL || "gpt-4.1-mini",
      input: prompt,
      store: false,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));

  const parsed = extractJson(data.output_text || data.output?.[0]?.content?.[0]?.text || "");

  const payload = {
    video_url: url,
    video_title: title,
    source_channel: channel,
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
    status: "deep_harvested_v2_40"
  };

  const saved = await supabase.from("pv5_video_analysis").insert(payload).select("id").single();
  if (saved.error) throw new Error(saved.error.message);

  console.log("SAVED:", saved.data.id);
  console.log("SUMMARY:", parsed.summary);
}

async function main() {
  fs.mkdirSync("data/pv5/raw", { recursive: true });
  fs.mkdirSync("data/pv5/video", { recursive: true });
  fs.mkdirSync("data/pv5/subtitle", { recursive: true });
  fs.mkdirSync("data/pv5/frame", { recursive: true });
  fs.mkdirSync("data/pv5/ocr", { recursive: true });
  fs.mkdirSync("data/pv5/deep-source", { recursive: true });

  for (let i = 0; i < URLS.length; i++) {
    const url = URLS[i];
    console.log(`\n========== [${i + 1}/${URLS.length}] ${url} ==========`);

    try {
      const id = out(`yt-dlp --print id "${url}"`);
      console.log("ID:", id);

      sh(`yt-dlp --write-info-json --write-auto-sub --write-sub --sub-lang ko,en --skip-download -o "data/pv5/raw/%(id)s" "${url}" || true`);

      const infoPath = `data/pv5/raw/${id}.info.json`;
      const info = fs.existsSync(infoPath) ? JSON.parse(fs.readFileSync(infoPath, "utf8")) : {};
      const title = info.title || "";
      const description = info.description || "";
      const channel = info.channel || info.uploader || "";

      sh(`yt-dlp -f "bv*[height<=720]+ba/b[height<=720]/best" --merge-output-format mp4 -o "data/pv5/video/%(id)s.%(ext)s" "${url}" || true`);

      const videoPath = `data/pv5/video/${id}.mp4`;
      const frameDir = `data/pv5/frame/${id}`;
      fs.mkdirSync(frameDir, { recursive: true });

      if (fs.existsSync(videoPath)) {
        sh(`ffmpeg -y -i "${videoPath}" -vf fps=1/20 -q:v 3 "${frameDir}/${id}_%04d.jpg" >/dev/null 2>&1 || true`);
      }

      const ocrDir = `data/pv5/ocr/${id}`;
      fs.mkdirSync(ocrDir, { recursive: true });

      const frames = fs.existsSync(frameDir)
        ? fs.readdirSync(frameDir).filter(f => f.endsWith(".jpg")).slice(0, 120)
        : [];

      for (const f of frames) {
        const base = path.basename(f, ".jpg");
        sh(`tesseract "${frameDir}/${f}" "${ocrDir}/${base}" -l kor+eng >/dev/null 2>&1 || true`);
      }

      const ocrText = fs.existsSync(ocrDir)
        ? fs.readdirSync(ocrDir).filter(f => f.endsWith(".txt")).map(f => safeRead(path.join(ocrDir, f))).join("\n")
        : "";

      const subFiles = fs.readdirSync("data/pv5/raw").filter(f => f.startsWith(id) && (f.endsWith(".vtt") || f.endsWith(".srt")));
      const subtitles = subFiles.map(f => safeRead(`data/pv5/raw/${f}`)).join("\n");

      const source = `
========== META ==========
URL: ${url}
TITLE: ${title}
CHANNEL: ${channel}
VIEW_COUNT: ${info.view_count || ""}
UPLOAD_DATE: ${info.upload_date || ""}

========== DESCRIPTION ==========
${description}

========== SUBTITLES ==========
${subtitles}

========== OCR ==========
${ocrText}
`;

      fs.writeFileSync(`data/pv5/deep-source/${id}_deep_source.txt`, source);

      await analyzeAndSave({ url, id, title, description, channel, source });

    } catch (e) {
      console.error("FAILED:", url, e.message);
    }
  }
}

main();
