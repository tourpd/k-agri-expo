import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function LiveLeadsPage() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("live_product_leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <main style={{ padding: 20 }}>
      <h1>상담/주문 신청 목록</h1>

      {data?.map((item) => (
        <div key={item.id} style={{
          border: "1px solid #ddd",
          padding: 16,
          marginBottom: 12,
          borderRadius: 12
        }}>
          <b>{item.farmer_name}</b> ({item.farmer_phone})
          <br />
          {item.region} / {item.crop} / {item.farm_size}
          <br />
          요청: {item.request_type}
          <br />
          내용: {item.message}
        </div>
      ))}
    </main>
  );
}
