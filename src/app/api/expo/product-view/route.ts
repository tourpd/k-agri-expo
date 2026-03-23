import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const body = await req.json();

    const productId =
      typeof body?.product_id === "string" ? body.product_id.trim() : "";

    if (!productId) {
      return Response.json(
        { ok: false, error: "product_id required" },
        { status: 400 }
      );
    }

    await supabase.from("expo_product_views").insert({
      product_id: productId,
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error("product view api error", e);
    return Response.json({ ok: false });
  }
}