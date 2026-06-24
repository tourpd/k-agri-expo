const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function detectCrop(text) {
  const s = String(text || "");
  const crops = ["고추", "마늘", "감자", "가지", "토마토", "수박", "딸기", "오이", "양파", "복숭아", "배추", "무"];
  return crops.filter(c => s.includes(c));
}

function detectAssetTypes(text) {
  const s = String(text || "");
  const tags = ["교육자료"];

  if (/표|비교|처리구|대조구|수치|함량|농도|비율|결과|시험/.test(s)) tags.push("표");
  if (/그래프|증가|감소|추이|곡선|변화|분포|비교도/.test(s)) tags.push("그래프");
  if (/사진|모습|포장|현장|잎|줄기|꽃|과실|열매|뿌리/.test(s)) tags.push("작물사진");
  if (/총채|진딧|나방|응애|탄저|역병|바이러스|청고|흰가루|균핵|시들음|갈변|반점|괴저/.test(s)) tags.push("병해충사진");
  if (/약제|농약|살균제|살충제|영양제|칼슘|붕소|아미노산|유인제|방제|살포/.test(s)) tags.push("자재/약제");
  if (/고온|저온|장마|가뭄|폭염|냉해|침수|습해|기후|온도|습도/.test(s)) tags.push("기후자료");
  if (/수확|수량|품질|상품성|가격|판매|소득|매출/.test(s)) tags.push("수익자료");

  return uniq(tags);
}

function detectIssues(text) {
  const s = String(text || "");
  const tags = [];

  if (/총채/.test(s)) tags.push("총채벌레");
  if (/진딧/.test(s)) tags.push("진딧물");
  if (/나방/.test(s)) tags.push("나방류");
  if (/탄저/.test(s)) tags.push("탄저병");
  if (/역병/.test(s)) tags.push("역병");
  if (/바이러스/.test(s)) tags.push("바이러스");
  if (/청고/.test(s)) tags.push("청고병");
  if (/흰가루/.test(s)) tags.push("흰가루병");
  if (/칼슘/.test(s)) tags.push("칼슘");
  if (/고온|폭염|낙화|낙과/.test(s)) tags.push("고온장해");
  if (/착과/.test(s)) tags.push("착과");
  if (/비대/.test(s)) tags.push("비대");
  if (/수확/.test(s)) tags.push("수확");
  if (/웃거름|추비/.test(s)) tags.push("웃거름");

  return uniq(tags);
}

function detectUses(assetTypes, issues) {
  const uses = ["자료검색"];

  if (issues.length) uses.push("농민상담", "방송소재", "쇼츠소재");
  if (assetTypes.includes("병해충사진")) uses.push("병해충콘텐츠");
  if (assetTypes.includes("자재/약제")) uses.push("제품추천", "공동구매소재");
  if (assetTypes.includes("기후자료")) uses.push("기후콘텐츠");
  if (assetTypes.includes("수익자료")) uses.push("매출콘텐츠");

  return uniq(uses);
}

function sitcomSeed(crop, issues) {
  const issue = issues[0] || "농사 문제";
  return `${crop} ${issue} 때문에 박씨가 또 사고 치는 농촌시트콤 소재`;
}

(async () => {
  console.log("1) knowledge_page_index 전체 색인 시작");

  const { data: pages, error } = await supabase
    .from("knowledge_page_index")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) {
    console.error("PAGE SELECT ERROR:", error);
    process.exit(1);
  }

  console.log("대상 페이지:", pages.length);

  let done = 0;

  for (const p of pages) {
    const text = [
      p.source_title,
      p.raw_text,
      p.crop,
      p.topic,
      p.disease_name,
      p.symptom,
      p.cause,
      p.countermeasure
    ].join(" ");

    const crops = detectCrop(text);
    const crop = p.crop && p.crop !== "공통" ? p.crop : (crops[0] || "공통");
    const assetTypes = detectAssetTypes(text);
    const issues = detectIssues(text);
    const uses = detectUses(assetTypes, issues);

    const visualFindings = {
      indexed_mode: "light_asset_index",
      note: "이미지 진단이 아니라 자료 재사용을 위한 색인",
      source_title: p.source_title,
      page_number: p.page_number,
      crop,
      crops,
      issue_tags: issues,
      asset_types: assetTypes,
      usage_tags: uses,
      sitcom_seed: sitcomSeed(crop, issues),
      thumbnail_url: p.thumbnail_url,
      full_image_url: p.full_image_url
    };

    const visualSummary =
      `${crop} / ${assetTypes.join(", ")} / ${issues.length ? issues.join(", ") : "일반재배"} / 활용: ${uses.join(", ")}`;

    const { error: updateError } = await supabase
      .from("knowledge_page_index")
      .update({
        crop,
        visual_summary: visualSummary,
        visual_findings: visualFindings,
        image_analysis_status: "asset_indexed",
        auto_analyzed_at: new Date().toISOString()
      })
      .eq("id", p.id);

    if (updateError) {
      console.error("UPDATE ERROR:", updateError);
      process.exit(1);
    }

    done++;
    if (done % 100 === 0) console.log("색인:", done, "/", pages.length);
  }

  console.log("2) 진행 중 job 강제 완료 처리");

  const { data: jobs } = await supabase
    .from("knowledge_file_jobs")
    .select("*")
    .in("status", ["uploaded", "processing", "pending", "running"])
    .limit(100);

  for (const j of jobs || []) {
    const { count } = await supabase
      .from("knowledge_page_index")
      .select("*", { count: "exact", head: true })
      .eq("job_id", j.id);

    await supabase
      .from("knowledge_file_jobs")
      .update({
        status: count && count > 0 ? "done" : "failed",
        progress: count && count > 0 ? 100 : 0,
        stage: count && count > 0 ? `이미지 색인 완료: ${count}페이지` : "색인 페이지 없음",
        error_message: count && count > 0 ? null : "색인 페이지 없음"
      })
      .eq("id", j.id);
  }

  console.log("✅ 이미지 저장 + 색인 완료:", done, "페이지");
})();
