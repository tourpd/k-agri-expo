import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getProblem } from "@/lib/problems/catalog";
import type { DoseRule } from "@/lib/problems/partner-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 기업 셀프 제품 등록 (로그인 없음)
 * - 제출 → status 'pending' → 운영자가 /admin/submissions 에서 승인해야 노출
 * - 과다 제출은 proxy의 forms 횟수 제한(IP당)으로 막음 + 꿀단지(honeypot) 필드
 */
const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown, max = 20) =>
  (Array.isArray(v) ? v.map((x) => s(x, 60)) : s(v, 600).split(/[,，·\n]/).map((x) => x.trim()))
    .filter(Boolean)
    .slice(0, max);
const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

function parseDose(body: Record<string, unknown>): DoseRule[] {
  const out: DoseRule[] = [];
  const method = (["엽면", "관주", "살포", "토양", "침지"].includes(s(body.dose_method, 10)) ? s(body.dose_method, 10) : "엽면") as "엽면" | "관주" | "살포" | "토양" | "침지";
  const ratio = num(body.dilution_ratio);
  const ratioMax = num(body.dilution_ratio_max);
  if (ratio) out.push({ kind: "dilution", ratio, ratioMax: ratioMax && ratioMax > ratio ? ratioMax : undefined, method: method === "토양" ? "살포" : method });
  const amount = num(body.area_amount);
  const area = num(body.area_pyeong);
  const unitRaw = s(body.area_unit, 4);
  const unit = (["ml", "L", "g", "kg"].includes(unitRaw) ? unitRaw : "ml") as "ml" | "L" | "g" | "kg";
  if (amount && area) {
    out.push({ kind: "perArea", amount, unit, areaPyeong: area, waterL: num(body.area_water_l) ?? undefined, method: method === "침지" ? "살포" : method });
  }
  const text = s(body.dose_text, 300);
  if (!out.length && text) out.push({ kind: "text", text });
  return out;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    if (s(body.website, 100)) return NextResponse.json({ ok: true, notice: "접수되었습니다." }); // 꿀단지: 봇만 채움

    const company_name = s(body.company_name, 80);
    const company_phone = s(body.company_phone, 30).replace(/[^\d-]/g, "");
    const product_name = s(body.product_name, 80);
    const agree = body.agree === true;
    if (!company_name) return NextResponse.json({ ok: false, error: "회사 이름을 적어 주세요." }, { status: 400 });
    if (company_phone.replace(/\D/g, "").length < 8) return NextResponse.json({ ok: false, error: "농민이 걸 수 있는 전화번호를 적어 주세요." }, { status: 400 });
    if (!product_name) return NextResponse.json({ ok: false, error: "제품 이름을 적어 주세요." }, { status: 400 });
    if (!agree) return NextResponse.json({ ok: false, error: "등록 동의가 필요합니다." }, { status: 400 });

    const problem_slugs = list(body.problem_slugs, 10).filter((slug) => getProblem(slug));
    const dose_rules = parseDose(body);
    if (!dose_rules.length) return NextResponse.json({ ok: false, error: "사용량을 적어 주세요. (희석배수 또는 ○ml/○평, 둘 중 하나)" }, { status: 400 });

    const row = {
      status: "pending",
      company_name,
      company_phone,
      company_email: s(body.company_email, 120) || null,
      contact_name: s(body.contact_name, 40) || null,
      homepage_url: s(body.homepage_url, 300) || null,
      product_name,
      product_group: s(body.product_group, 40) || null,
      feature: s(body.feature, 200) || null,
      ingredients: s(body.ingredients, 300) || null,
      crops: list(body.crops, 30),
      uses: list(body.uses, 20),
      problem_slugs,
      dose_rules,
      timing: s(body.timing, 300) || null,
      cautions: list(body.cautions, 10),
      packages: list(body.packages, 6),
      price_krw: num(body.price_krw) ? Math.round(num(body.price_krw)!) : null,
      buy_url: s(body.buy_url, 300) || null,
      image_url: s(body.image_url, 300) || null,
      organic_cert_no: s(body.organic_cert_no, 40) || null,
      sellable: body.sellable !== false,
      source_ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    };

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("expo_product_submissions").insert(row);
    if (error) {
      if (/does not exist|42P01|schema cache/i.test(error.message)) {
        return NextResponse.json({ ok: false, error: "등록 기능을 준비 중입니다. 잠시 후 다시 시도하거나 전화로 알려 주세요." }, { status: 503 });
      }
      console.error("[register/product]", error.message);
      return NextResponse.json({ ok: false, error: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
    }
    return NextResponse.json({ ok: true, notice: "접수되었습니다. 운영자 확인 후 농민에게 보입니다(보통 1~2일)." });
  } catch (error) {
    console.error("[register/product]", error);
    return NextResponse.json({ ok: false, error: "오류가 났습니다." }, { status: 500 });
  }
}
