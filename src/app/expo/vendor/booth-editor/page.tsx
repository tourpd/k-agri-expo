import React from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getCurrentVendor } from "@/lib/vendor/getCurrentVendor";
import BoothEditorClient from "./BoothEditorClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VendorRow = {
  vendor_id?: string | null;
  user_id?: string | null;
  company_name?: string | null;
};

type BoothRow = {
  booth_id?: string | null;
  vendor_id?: string | null;
  vendor_user_id?: string | null;
  name?: string | null;
  region?: string | null;
  category_primary?: string | null;
  intro?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  hall_id?: string | null;
};

type ProductRow = {
  product_id?: string | null;
  booth_id?: string | null;
  name?: string | null;
  description?: string | null;
  price_text?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
  image_url?: string | null;
  youtube_url?: string | null;
  catalog_url?: string | null;
  catalog_filename?: string | null;
};

function safe(v: unknown, fallback = "") {
  const s = typeof v === "string" ? v : "";
  return s.trim() ? s.trim() : fallback;
}

export default async function VendorBoothEditorPage() {
  const { user, vendor } = await getCurrentVendor();

  const userId = user.id;
  const vendorId = safe(vendor?.vendor_id, "");

  const supabase = createSupabaseAdminClient();

  const vendorRes = await supabase
    .from("vendors")
    .select("vendor_id,user_id,company_name")
    .eq("vendor_id", vendorId)
    .maybeSingle();

  const vendorRow = ((vendorRes.data ?? vendor) as VendorRow | null) ?? null;

  if (!vendorRow?.vendor_id) {
    return (
      <main style={wrap}>
        <h1 style={title}>업체 정보가 없습니다.</h1>
        <p style={muted}>현재 로그인한 계정과 연결된 vendor가 없습니다.</p>
      </main>
    );
  }

  const normalizedVendor = {
    vendor_id: safe(vendorRow.vendor_id, ""),
    user_id: safe(vendorRow.user_id, userId),
    company_name: safe(vendorRow.company_name, ""),
  };

  let booth: BoothRow | null = null;

  // 1순위: vendor_id 기준 조회
  const boothByVendorRes = await supabase
    .from("booths")
    .select("*")
    .eq("vendor_id", normalizedVendor.vendor_id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (!boothByVendorRes.error) {
    const rows = (boothByVendorRes.data ?? []) as BoothRow[];
    if (rows.length > 0) {
      booth = rows[0];
    }
  }

  // 2순위: 구데이터 호환용 vendor_user_id fallback
  if (!booth?.booth_id) {
    const boothByUserRes = await supabase
      .from("booths")
      .select("*")
      .eq("vendor_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!boothByUserRes.error) {
      const rows = (boothByUserRes.data ?? []) as BoothRow[];
      if (rows.length > 0) {
        booth = rows[0];
      }
    }
  }

  if (!booth?.booth_id) {
    return (
      <main style={wrap}>
        <h1 style={title}>부스가 아직 없습니다.</h1>
        <p style={muted}>
          관리자 승인 후 자동 생성되거나, 부스 연결이 완료되어야 편집 화면으로 들어갈 수 있습니다.
        </p>
      </main>
    );
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("booth_id", booth.booth_id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const normalizedProducts =
    !productsError && Array.isArray(products)
      ? (products as ProductRow[])
          .filter((p) => safe((p as any)?.status, "") !== "deleted")
          .map((p, idx) => ({
            product_id: safe(p.product_id, `temp-${idx + 1}`),
            booth_id: safe(p.booth_id, booth!.booth_id ?? ""),
            name: p.name ?? "",
            description: p.description ?? "",
            price_text: p.price_text ?? "",
            sort_order:
              typeof p.sort_order === "number" && Number.isFinite(p.sort_order)
                ? p.sort_order
                : idx + 1,
            is_active: p.is_active !== false,
            image_url: p.image_url ?? "",
            youtube_url: p.youtube_url ?? "",
            catalog_url: p.catalog_url ?? "",
            catalog_filename: p.catalog_filename ?? "",
          }))
      : [];

  const normalizedBooth = {
    booth_id: safe(booth.booth_id, ""),
    vendor_id: safe(booth.vendor_id, normalizedVendor.vendor_id),
    name: booth.name ?? "",
    region: booth.region ?? "",
    category_primary: booth.category_primary ?? "",
    intro: booth.intro ?? "",
    description: booth.description ?? "",
    phone: booth.phone ?? "",
    email: booth.email ?? "",
    hall_id: booth.hall_id ?? "",
  };

  return (
    <BoothEditorClient
      vendor={normalizedVendor}
      booth={normalizedBooth}
      initialProducts={normalizedProducts}
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