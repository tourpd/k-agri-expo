// src/app/vendor/deals/[dealId]/edit/page.tsx
export const dynamic = "force-dynamic";

import React from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import DealEditClient, { type DealEditInitial } from "./DealEditClient";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export default async function VendorDealEditPage(props: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await props.params;

  if (!dealId || !isUuid(dealId)) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 18, fontFamily: "system-ui" }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 950 }}>딜 편집 오류</h1>
        <div style={{ marginTop: 10, fontSize: 16 }}>
          dealId가 올바르지 않습니다. URL에 <b>{"<deal_id>"}</b> 를 그대로 넣으면 안 됩니다.
        </div>
        <div style={{ marginTop: 10, fontSize: 15, color: "#555" }}>
          예) /vendor/deals/<b>71ccda41-ae1f-4758-99a2-5cd57d35978e</b>/edit
        </div>
        <div style={{ marginTop: 16 }}>
          <a href="/vendor" style={{ fontSize: 16 }}>← 업체 대시보드로</a>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  // ✅ 로그인 확인(업체만 접근)
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 18, fontFamily: "system-ui" }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 950 }}>로그인이 필요합니다</h1>
        <div style={{ marginTop: 12, fontSize: 16 }}>업체 계정으로 로그인 후 이용해 주십시오.</div>
        <div style={{ marginTop: 16 }}>
          <a href="/login" style={{ fontSize: 16 }}>로그인으로 이동</a>
        </div>
      </main>
    );
  }

  // ✅ booth_deals 조회
  const { data: deal, error: dealErr } = await supabase
    .from("booth_deals")
    .select("deal_id, booth_id, title, description, image_url, normal_price, expo_price, discount_percent, stock, start_at, end_at, is_active, consulting_count, youtube_url")
    .eq("deal_id", dealId)
    .maybeSingle();

  if (dealErr) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 18, fontFamily: "system-ui" }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 950 }}>딜 조회 오류</h1>
        <pre style={{ marginTop: 12, whiteSpace: "pre-wrap", fontSize: 14, color: "#b91c1c" }}>{dealErr.message}</pre>
        <div style={{ marginTop: 16 }}>
          <a href="/vendor" style={{ fontSize: 16 }}>← 업체 대시보드로</a>
        </div>
      </main>
    );
  }

  if (!deal) {
    return (
      <main style={{ maxWidth: 900, margin: "0 auto", padding: 18, fontFamily: "system-ui" }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 950 }}>딜이 없습니다</h1>
        <div style={{ marginTop: 10, fontSize: 16 }}>deal_id: {dealId}</div>
        <div style={{ marginTop: 16 }}>
          <a href="/vendor" style={{ fontSize: 16 }}>← 업체 대시보드로</a>
        </div>
      </main>
    );
  }

  // ✅ deal_assets 목록(있다면)
  const { data: assets } = await supabase
    .from("deal_assets")
    .select("id, deal_id, kind, title, url, file_path, created_at")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });

  const initial: DealEditInitial = {
    deal_id: deal.deal_id,
    booth_id: deal.booth_id,
    title: deal.title ?? "",
    description: deal.description ?? "",
    youtube_url: (deal as any).youtube_url ?? "",
    normal_price: deal.normal_price ?? null,
    expo_price: deal.expo_price ?? null,
    stock: deal.stock ?? null,
    end_at: deal.end_at ?? null,
    is_active: !!deal.is_active,
    image_url: deal.image_url ?? "",
    assets: (assets ?? []).map((a: any) => ({
      id: a.id,
      kind: a.kind ?? "file",
      title: a.title ?? "",
      url: a.url ?? "",
      file_path: a.file_path ?? "",
      created_at: a.created_at ?? null,
    })),
  };

  return <DealEditClient initial={initial} />;
}