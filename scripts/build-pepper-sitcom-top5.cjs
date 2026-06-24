const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(".env.local", "utf8");
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();
const supabase = createClient(url, key);

function pickProduct(materials = [], problem = "") {
  const s = `${problem} ${(materials || []).join(" ")}`;
  if (/총채|바이러스|충해/.test(s)) return "총채벌레 유인제 / 충해 방제 자재";
  if (/탄저|역병|균핵|입고|잿빛|병해/.test(s)) return "병해 방제 자재";
  if (/고온|낙화|낙과/.test(s)) return "고온장해 완화제";
  if (/칼슘/.test(s)) return "칼슘제";
  return (materials || []).join(", ") || "추천 자재 검토";
}

function makeEpisode(r, idx) {
  const product = pickProduct(r.recommended_materials, r.problem_title);
  const issue = r.problem_title || "고추 문제";

  return {
    source_action_id: r.id,
    crop: r.crop,
    problem_title: issue,
    sitcom_score: r.importance_score || 80,

    episode_title: `EP${String(idx + 1).padStart(3, "0")} 박씨가 ${issue} 때문에 또 사고 친 날`,

    episode_8s:
`[8초]
박씨: "아이고 또 망했네! 고추가 이상혀!"
영희: "또 확인도 안 하고 난리여?"
몽몽이: "멍!"
자막: ${issue}, 지금 확인 안 하면 돈 나갑니다.`,

    episode_16s:
`[16초]
박씨: "약부터 쳐야겠어!"
영희: "아따, 맨날 약부터 치니 돈이 남아?"
농사PD: "박씨 어르신, 원인 확인부터 하셔야죠."
박씨: "그럼 뭐부터 봐야 하는디?"
자막: ${r.action_instruction}`,

    episode_24s:
`[24초]
박씨: "올해 고추농사 또 끝났네!"
영희: "끝난 건 농사가 아니라 박씨 성질이여."
농사PD: "잎 뒷면, 꽃, 과실부터 확인하겠습니다."
홍산마늘회장: "농사는 감이 아니라 확인입니다."
몽몽이: "멍멍!"
자막: ${issue} 관리 시기. 필요 자재: ${product}`,

    gemini_prompt:
`Create a vertical 9:16 Korean rural comedy sitcom video, realistic style, 24 seconds.
Scene: Korean pepper farm in summer.
Characters:
1. 농사PD, Korean male farming YouTube producer, holding microphone, calm but sharp.
2. 투덜이 박씨, Korean pepper farmer, worried and funny, wearing farm hat.
3. 영희, witty rural woman, gives sarcastic comments in Korean countryside dialect.
4. 홍산마늘회장, wise senior farmer, appears as problem solver.
5. 몽몽이, small rural dog, comic reaction.

Story:
Pepper farmer Park panics because of "${issue}".
Younghee teases him for trying to spray chemicals before checking the real cause.
농사PD checks the pepper leaves, flowers, and fruits.
홍산마늘회장 says: "농사는 감이 아니라 확인입니다."
Mongmong barks at the end.
Tone: funny, fast, Korean rural sitcom, educational but not lecture-like.
End caption: "${issue} 관리 시기. ${product} 준비하세요."
No subtitles burned except the final Korean caption.`,

    product_hook: product,
    joint_purchase_item: product,
    status: "draft"
  };
}

(async () => {
  console.log("1) 기존 고추 시트콤 후보 삭제");
  await supabase.from("sitcom_materials").delete().eq("crop", "고추");

  console.log("2) 고추 TOP5 읽기");
  const { data, error } = await supabase
    .from("farm_calendar_actions")
    .select("*")
    .eq("crop", "고추")
    .order("importance_score", { ascending: false })
    .limit(5);

  if (error) {
    console.error(error);
    process.exit(1);
  }

  const rows = data.map(makeEpisode);

  console.log("3) 시트콤 후보 생성:", rows.length);
  const { error: insertError } = await supabase
    .from("sitcom_materials")
    .insert(rows);

  if (insertError) {
    console.error("INSERT ERROR:", insertError);
    process.exit(1);
  }

  console.log("✅ 고추 시트콤 TOP5 생성 완료");
})();
