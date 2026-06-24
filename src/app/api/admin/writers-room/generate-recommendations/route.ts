import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return String(v ?? "").replace(/\s+/g, " ").trim();
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function makePDTitle(row: any, type: string) {
  const topic = clean(row.topic);
  const crop = clean(row.crop);
  const disease = clean(row.disease_name);
  const base = topic || disease || "농업 현장 이슈";

  if (base.includes("풋고추") && base.includes("다수확")) return "풋고추 수량을 올리는 진짜 관리 포인트";
  if (base.includes("과다수분")) return "고추가 비 때문에 망한 줄 알았는데, 진짜 원인은 과다수분이었다";
  if (base.includes("모자이크")) return "고추 모자이크 바이러스, 영양결핍으로 착각하면 망합니다";
  if (base.includes("총채벌레")) return "총채벌레를 늦게 잡으면 바이러스까지 따라옵니다";
  if (base.includes("탄저병")) return "고추 탄저병, 보이는 순간 이미 늦을 수 있습니다";
  if (base.includes("역병")) return "장마철 고추 역병, 물길 관리 못 하면 한순간에 무너집니다";
  if (base.includes("활착장해")) return "정식 후 고추가 못 크는 이유, 활착장해부터 봐야 합니다";
  if (base.includes("과실 장해") || base.includes("과실장해")) return "고추 열매가 이상해지는 이유, 병이 아닐 수도 있습니다";
  if (base.includes("약제") || base.includes("방제처방")) return "고추 약제 방제, 아무 때나 치면 돈만 버립니다";
  if (base.includes("토양 미생물")) return "토양 미생물을 모르면 비료를 넣어도 작물이 못 먹습니다";

  if (crop && crop !== "공통") return `${crop} ${base}`;
  return base;
}

function makeReason(row: any, type: string) {
  const page = row.page_number;
  const crop = clean(row.crop);
  const topic = clean(row.topic);
  const action = clean(row.action_instruction);
  const memo = clean(row.writer_room_memo);
  const reason = action || memo || clean(row.visual_summary) || clean(row.raw_text).slice(0, 160);

  if (type === "shorts") return `[원본 ${page}p] ${reason}`;
  return `[원본 ${page}p] ${crop ? crop + " · " : ""}${topic} — ${reason}`;
}

function textPack(row: any) {
  return [
    row.topic,
    row.crop,
    row.disease_name,
    row.symptom,
    row.cause,
    row.countermeasure,
    row.action_instruction,
    row.writer_room_memo,
    row.raw_text,
  ].map(clean).join(" ");
}

function farmerScore(row: any) {
  const t = textPack(row);
  let s = Number(row.farmer_value_score ?? 0);
  for (const w of ["수확량", "다수확", "상품성", "낙과", "장해", "바이러스", "역병", "탄저병", "총채벌레", "과다수분", "활착"]) {
    if (t.includes(w)) s += 5;
  }
  return clamp(s);
}

function moneyScore(row: any) {
  const t = textPack(row);
  let s = Number(row.business_score ?? 0);
  for (const w of ["수확량", "다수확", "상품성", "품질", "대과", "착과", "낙과", "수확기", "공동구매", "비료", "영양제", "약제"]) {
    if (t.includes(w)) s += 6;
  }
  return clamp(s);
}

function viewScore(row: any) {
  const t = textPack(row);
  let s = Number(row.content_score ?? 0);
  for (const w of ["망", "착각", "비밀", "이유", "늦", "보이는 순간", "병이 아닐", "반토막", "바이러스", "총채벌레"]) {
    if (t.includes(w)) s += 6;
  }
  return clamp(s);
}

function commerceScore(row: any) {
  const t = textPack(row);
  let s = 40;
  for (const w of ["아미노산", "칼슘", "붕사", "마그네슘", "발근제", "영양제", "비료", "살균제", "살충제", "약제", "총채벌레", "진딧물"]) {
    if (t.includes(w)) s += 7;
  }
  return clamp(s);
}

function urgencyScore(row: any) {
  const t = textPack(row);
  let s = 50;
  for (const w of ["6월", "7월", "장마", "정식", "착과", "수확기", "고온", "과습", "초기", "발생시기", "지금"]) {
    if (t.includes(w)) s += 7;
  }
  return clamp(s);
}

function finalScore(row: any, type: string) {
  const f = farmerScore(row);
  const m = moneyScore(row);
  const v = viewScore(row);
  const c = commerceScore(row);
  const u = urgencyScore(row);

  const typeBonus = type === "shorts" ? Number(row.shorts_score ?? 0) * 0.05 : Number(row.broadcast_score ?? 0) * 0.05;

  return clamp(f * 0.3 + m * 0.25 + v * 0.25 + c * 0.1 + u * 0.1 + typeBonus);
}

function grade(score: number) {
  if (score >= 95) return "S+";
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

export async function POST() {
  const supabase = createSupabaseAdminClient();

  const { data: pages, error: pageError } = await supabase
    .from("knowledge_page_index")
    .select("*")
    .order("importance_score", { ascending: false })
    .limit(500);

  if (pageError) {
    return NextResponse.json({ ok: false, error: pageError }, { status: 500 });
  }

  const rows: any[] = [];
  const seen = new Set<string>();

  for (const page of pages ?? []) {
    for (const type of ["broadcast", "shorts"]) {
      const title = makePDTitle(page, type);
      const score = finalScore(page, type);

      if (score < 55) continue;

      const key = `${type}:${title}:${page.page_number}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        title,
        content_type: type,
        source_job_id: page.job_id,
        source_page_id: page.id,
        source_page_number: Number(page.page_number ?? 0),
        reason: makeReason(page, type),
        score,
        farmer_score: farmerScore(page),
        money_score: moneyScore(page),
        view_score: viewScore(page),
        commerce_score: commerceScore(page),
        urgency_score: urgencyScore(page),
        grade: grade(score),
        expected_views: Math.round(score * (type === "shorts" ? 1200 : 950)),
        status: "recommended",
      });
    }
  }

  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.money_score - a.money_score;
  });

  await supabase
    .from("writers_room_recommendations")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  const finalRows = rows.slice(0, 120);

  const { error } = await supabase
    .from("writers_room_recommendations")
    .insert(finalRows);

  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    inserted: finalRows.length,
    source: "knowledge_page_index",
    decision_engine: true,
  });
}
