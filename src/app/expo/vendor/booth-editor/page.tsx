import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import BoothEditorClient from "./BoothEditorClient";

export const dynamic = "force-dynamic";

export default async function VendorBoothEditorPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/vendor");
  }

  const { data: vendorRow } = await supabase
    .from("vendors")
    .select("id,user_id,company_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vendorRow) {
    return (
      <main style={wrap}>
        <h1 style={title}>업체 정보가 없습니다.</h1>
        <p style={muted}>현재 로그인한 계정과 연결된 vendor가 없습니다.</p>
      </main>
    );
  }

  const vendor = {
    id: vendorRow.id,
    vendor_id: vendorRow.id,
    user_id: vendorRow.user_id,
    company_name: vendorRow.company_name,
  };

  // ✅ 핵심 수정: owner_user_id 기준 조회
  const { data: booth } = await supabase
    .from("booths")
    .select("*")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (!booth) {
    return (
      <main style={wrap}>
        <h1 style={title}>부스가 아직 없습니다.</h1>
        <p style={muted}>
          관리자 승인 후 자동 생성되거나, 부스 생성 API가 먼저 실행되어야 합니다.
        </p>
      </main>
    );
  }

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .eq("booth_id", booth.booth_id)
    .not("status", "eq", "deleted") // 🔥 안전
    .order("created_at", { ascending: false });

  return (
    <BoothEditorClient
      vendor={vendor}
      booth={booth}
      initialProducts={products ?? []}
    />
  );
}

const wrap: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  padding: "28px 16px",
  minHeight: "100vh",
  background: "#fff",
};

const title: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 950,
  margin: 0,
  color: "#111",
};

const muted: React.CSSProperties = {
  marginTop: 10,
  color: "#666",
  lineHeight: 1.8,
};