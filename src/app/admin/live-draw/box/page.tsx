import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import BoxDrawClient from "./BoxDrawClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type BoxPrize = {
  id: string;
  title: string;
  sponsor: string | null;
  description: string | null;
  image_url: string | null;
  quantity: number | null;
  drawn_count: number | null;
  sort_order: number | null;
};

export default async function LiveBoxDrawPage() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("live_prizes")
    .select("id, title, sponsor, description, image_url, quantity, drawn_count, sort_order")
    .eq("draw_type", "box")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    return (
      <main style={{ padding: 30 }}>
        <h1>박스추첨 오류</h1>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return <BoxDrawClient prizes={(data || []) as BoxPrize[]} />;
}