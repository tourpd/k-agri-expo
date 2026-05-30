import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import ProductLeadClient from "./ProductLeadClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ prizeId: string }>;
};

export default async function ExpoLiveProductPage({ params }: PageProps) {
  const { prizeId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: prize, error } = await supabase
    .from("live_prizes")
    .select("*")
    .eq("id", prizeId)
    .single();

  if (error || !prize) {
    return (
      <main style={{ padding: 30 }}>
        <h1>상품 정보를 찾을 수 없습니다</h1>
        <p>라이브 상품이 삭제되었거나 비공개 상태일 수 있습니다.</p>
      </main>
    );
  }

  await supabase
    .from("live_prizes")
    .update({ view_count: Number(prize.view_count || 0) + 1 })
    .eq("id", prizeId);

  return <ProductLeadClient prize={prize} />;
}