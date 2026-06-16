import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SOURCE_TABLE = "knowledge_visual_pages";

function t(v: unknown, fallback = "") {
  return String(v ?? fallback).trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];

    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from(SOURCE_TABLE)
      .select("*")
      .not("ai_summary", "is", null)
      .limit(2000);

    if (ids.length > 0) query = query.in("id", ids);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data || [];

    const ruleRows = [];
    const broadcastRows = [];
    const shortsRows = [];
    const consultingRows = [];
    const actionRows = [];

    for (const row of rows) {
      const sourceTitle = t(row.source_title || row.source_name, "자료화면");
      const pageNumber = Number(row.page_no || row.page_number || 0) || null;
      const crop = t(row.crop || row.crop_name || row.ai_crop, "공통");
      const disease = t(row.disease_name || row.ai_disease, "없음");
      const growthStage = t(row.growth_stage || row.ai_growth_stage, "미분류");
      const keyInfo = t(row.key_info || row.ai_summary, "핵심정보 없음");
      const aiSummary = t(row.ai_summary, keyInfo);
      const actionGuide = t(row.action_guide || row.ai_action_guide, keyInfo);
      const broadcastAngle = t(row.broadcast_angle || row.ai_broadcast_topic, aiSummary);
      const shortsTopic = t(row.ai_shorts_topic || row.shorts_material, aiSummary);
      const confidence = Number(row.ai_confidence || row.confidence || 70);
      const status = confidence >= 80 ? "auto_approved" : "review_needed";

      ruleRows.push({
        source_visual_page_id: row.id,
        source_title: sourceTitle,
        page_number: pageNumber,
        crop_name: crop,
        disease_name: disease,
        growth_stage: growthStage,
        rule_title: `${crop} ${disease !== "없음" ? disease : "관리"} 판단규칙`,
        trigger_condition: keyInfo,
        action_instruction: actionGuide,
        confidence,
        status,
      });

      broadcastRows.push({
        source_visual_page_id: row.id,
        source_title: sourceTitle,
        page_number: pageNumber,
        title: `${crop} 농가에 필요한 현장 이슈`,
        angle: broadcastAngle,
        key_message: keyInfo,
        status,
      });

      shortsRows.push({
        source_visual_page_id: row.id,
        source_title: sourceTitle,
        page_number: pageNumber,
        hook: shortsTopic,
        title: shortsTopic,
        script_outline: `1. 문제 제기\n2. 핵심정보: ${keyInfo}\n3. 농민 행동: ${actionGuide}`,
        status,
      });

      consultingRows.push({
        source_visual_page_id: row.id,
        source_title: sourceTitle,
        page_number: pageNumber,
        crop_name: crop,
        disease_name: disease,
        question: `${crop} 농가가 지금 무엇을 조심해야 하나요?`,
        answer: actionGuide,
        status,
      });

      const riskLevel =
        confidence >= 90
          ? "high"
          : confidence >= 75
          ? "medium"
          : "low";

      const priority =
        riskLevel === "high"
          ? 1
          : riskLevel === "medium"
          ? 2
          : 3;

      const deadlineHours =
        riskLevel === "high"
          ? 24
          : riskLevel === "medium"
          ? 48
          : 72;

      const step1 =
        disease !== "없음"
          ? `${crop} 포장에서 ${disease} 의심 증상 여부를 먼저 확인하세요.`
          : `${crop} 포장 상태와 생육 변화를 먼저 확인하세요.`;

      const step2 =
        riskLevel === "high"
          ? "증상이 보이는 구역은 즉시 분리하고, 작업도구와 작업자의 이동을 제한하세요."
          : "포장 환경을 점검하고 환기·관수·배수 상태를 조정하세요.";

      const step3 =
        disease !== "없음"
          ? "확산 가능성이 있으면 지역 농업기술센터 또는 전문가 상담 후 등록약제·자재 사용 여부를 결정하세요."
          : "기상·생육 변화가 계속되면 추가 자료를 확인하고 관리계획을 조정하세요.";

      const expectedLoss =
        riskLevel === "high"
          ? "방치하면 수확량·상품성 저하 가능성이 큽니다. 조기 대응이 필요합니다."
          : riskLevel === "medium"
          ? "관리가 늦어지면 생육 저하나 품질 저하로 이어질 수 있습니다."
          : "즉각적인 큰 피해보다는 관찰과 기본 관리가 필요한 단계입니다.";

      const recommendedProduct =
        disease !== "없음"
          ? "등록약제, 방제자재, 환기·배수 관리 자재 검토"
          : "생육관리 자재, 영양관리 자재, 환경관리 자재 검토";

      const economicImpact =
        riskLevel === "high"
          ? "초기 대응 비용보다 방치 시 손실이 커질 수 있습니다."
          : "기본 관리 비용으로 손실 가능성을 줄이는 단계입니다.";

      const notificationMessage =
        disease !== "없음"
          ? `[K-AGRI] ${crop} ${disease} 주의. ${deadlineHours}시간 안에 예찰하고 확산 가능성을 확인하세요.`
          : `[K-AGRI] ${crop} 관리 알림. ${deadlineHours}시간 안에 포장 상태와 생육 변화를 확인하세요.`;

      actionRows.push({
        source_visual_page_id: row.id,
        source_title: sourceTitle,
        page_number: pageNumber,
        crop_name: crop,
        disease_name: disease,
        action_title: `${crop} 농가 ${riskLevel === "high" ? "긴급" : "관리"} 행동지시`,
        action_detail: actionGuide,
        urgency: riskLevel === "high" ? "high" : "normal",
        status,
        risk_level: riskLevel,
        priority,
        deadline_hours: deadlineHours,
        step1,
        step2,
        step3,
        expected_loss: expectedLoss,
        recommended_product: recommendedProduct,
        economic_impact: economicImpact,
        notification_message: notificationMessage,
      });
    }

    const insertMany = async (table: string, payload: any[]) => {
      if (payload.length === 0) return null;
      const { error } = await supabase.from(table).insert(payload);
      return error;
    };

    const errors = [];

    const e1 = await insertMany("knowledge_decision_rules", ruleRows);
    if (e1) errors.push(`decision_rules: ${e1.message}`);

    const e2 = await insertMany("knowledge_broadcast_materials", broadcastRows);
    if (e2) errors.push(`broadcast_materials: ${e2.message}`);

    const e3 = await insertMany("knowledge_shorts_materials", shortsRows);
    if (e3) errors.push(`shorts_materials: ${e3.message}`);

    const e4 = await insertMany("knowledge_farmer_consulting_answers", consultingRows);
    if (e4) errors.push(`consulting_answers: ${e4.message}`);

    const e5 = await insertMany("knowledge_action_instructions", actionRows);
    if (e5) errors.push(`action_instructions: ${e5.message}`);

    if (errors.length > 0) {
      return NextResponse.json(
        {
          error: "일부 두뇌DB 저장 실패",
          details: errors,
          source_count: rows.length,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      source_count: rows.length,
      decision_rules: ruleRows.length,
      broadcast_materials: broadcastRows.length,
      shorts_materials: shortsRows.length,
      consulting_answers: consultingRows.length,
      action_instructions: actionRows.length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "두뇌DB 생성 실패" },
      { status: 500 }
    );
  }
}
