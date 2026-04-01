export const dynamic = "force-dynamic";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import DealEditClient from "./DealEditClient";

export default async function VendorDealEditPage(props: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await props.params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div style={box}>
        <div style={h1}>업체 로그인 필요</div>
        <div style={p}>딜 편집은 업체 로그인 후 가능합니다.</div>
        <a href={`/login?next=/vendor/deals/${dealId}`} style={btn}>
          로그인 하러가기 →
        </a>
      </div>
    );
  }

  const { data: deal, error: dealErr } = await supabase
    .from("booth_deals")
    .select(
      "deal_id,booth_id,title,description,image_url,normal_price,expo_price,discount_percent,stock,start_at,end_at,is_active,consulting_count,created_at"
    )
    .eq("deal_id", dealId)
    .maybeSingle();

  if (dealErr) {
    return (
      <div style={box}>
        <div style={h1}>딜 조회 오류</div>
        <pre style={pre}>{dealErr.message}</pre>
      </div>
    );
  }

  if (!deal) {
    return (
      <div style={box}>
        <div style={h1}>딜이 없습니다</div>
        <div style={p}>deal_id: {dealId}</div>
      </div>
    );
  }

  const { data: assets } = await supabase
    .from("deal_assets")
    .select("id,kind,title,storage_path,url,sort_order,is_active,created_at")
    .eq("deal_id", dealId)
    .order("sort_order", { ascending: true });

  return <DealEditClient deal={deal} initialAssets={assets || []} />;
}

const box: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  background: "#f9fafb",
  padding: 16,
};

const h1: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 950,
  margin: 0,
};

const p: React.CSSProperties = {
  marginTop: 10,
  fontSize: 18,
  color: "#444",
  lineHeight: 1.7,
};

const btn: React.CSSProperties = {
  marginTop: 12,
  height: 56,
  borderRadius: 18,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  fontSize: 18,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 16px",
};

const pre: React.CSSProperties = {
  marginTop: 12,
  whiteSpace: "pre-wrap",
  fontSize: 16,
  color: "#444",
  lineHeight: 1.6,
};