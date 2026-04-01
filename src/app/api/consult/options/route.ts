import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getSeasonKey(month: number) {
  if ([3, 4, 5].includes(month)) return "spring";
  if ([6, 7, 8].includes(month)) return "summer";
  if ([9, 10, 11].includes(month)) return "fall";
  return "winter";
}

export async function GET() {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const seasonKey = getSeasonKey(currentMonth);

    const [cropsRes, symptomsRes, intentsRes, presetsRes] = await Promise.all([
      supabaseAdmin
        .from("consult_crops")
        .select("crop_key, label, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("consult_symptoms")
        .select("crop_key, symptom_key, label, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("consult_intents")
        .select("intent_key, label, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabaseAdmin
        .from("consult_question_presets")
        .select(`
          id,
          crop_key,
          symptom_key,
          intent_key,
          question_text,
          sort_order,
          preset_type,
          active_months,
          season_key,
          priority_score,
          is_featured
        `)
        .eq("is_active", true),
    ]);

    if (cropsRes.error) {
      return NextResponse.json(
        { ok: false, error: cropsRes.error.message },
        { status: 500 }
      );
    }

    if (symptomsRes.error) {
      return NextResponse.json(
        { ok: false, error: symptomsRes.error.message },
        { status: 500 }
      );
    }

    if (intentsRes.error) {
      return NextResponse.json(
        { ok: false, error: intentsRes.error.message },
        { status: 500 }
      );
    }

    if (presetsRes.error) {
      return NextResponse.json(
        { ok: false, error: presetsRes.error.message },
        { status: 500 }
      );
    }

    const crops = cropsRes.data ?? [];
    const symptoms = symptomsRes.data ?? [];
    const intents = intentsRes.data ?? [];
    const allPresets = presetsRes.data ?? [];

    const featuredPresets = allPresets
      .filter((item: any) => {
        const presetType = String(item.preset_type ?? "monthly");
        const months = Array.isArray(item.active_months) ? item.active_months : [];
        const itemSeasonKey = String(item.season_key ?? "");

        if (presetType === "always") return true;

        if (presetType === "monthly") {
          return months.includes(currentMonth);
        }

        if (presetType === "seasonal") {
          return itemSeasonKey === seasonKey;
        }

        if (presetType === "campaign") {
          return !!item.is_featured;
        }

        return false;
      })
      .sort((a: any, b: any) => {
        if ((a.is_featured ? 1 : 0) !== (b.is_featured ? 1 : 0)) {
          return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
        }
        if ((a.priority_score ?? 0) !== (b.priority_score ?? 0)) {
          return (b.priority_score ?? 0) - (a.priority_score ?? 0);
        }
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      })
      .slice(0, 6)
      .map((item: any) => ({
        id: item.id,
        crop_key: item.crop_key,
        symptom_key: item.symptom_key,
        intent_key: item.intent_key,
        question_text: item.question_text,
      }));

    const symptomMap = symptoms.reduce((acc: Record<string, any[]>, row: any) => {
      if (!acc[row.crop_key]) acc[row.crop_key] = [];
      acc[row.crop_key].push({
        symptom_key: row.symptom_key,
        label: row.label,
      });
      return acc;
    }, {});

    return NextResponse.json({
      ok: true,
      current_month: currentMonth,
      season_key: seasonKey,
      crops: crops.map((row: any) => ({
        crop_key: row.crop_key,
        label: row.label,
      })),
      symptoms: symptomMap,
      intents: intents.map((row: any) => ({
        intent_key: row.intent_key,
        label: row.label,
      })),
      featured_presets: featuredPresets,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}