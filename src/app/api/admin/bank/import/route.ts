import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await requireAdminUser();
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];

    if (items.length === 0) {
      return Response.json({ success: false, error: "items가 비어 있습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const rows = items.map((item: any) => ({
      amount_krw: Number(item.amount_krw || 0),
      depositor_name: String(item.depositor_name || ""),
      deposited_at: item.deposited_at || new Date().toISOString(),
      matched: false,
      raw_data: item,
      created_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("bank_transactions").insert(rows);

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, count: rows.length });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error?.message || "import failed" },
      { status: 500 }
    );
  }
}