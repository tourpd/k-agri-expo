// src/app/admin/farmer-crm/page.tsx

import { createClient } from "@supabase/supabase-js";
import FarmerCrmClient from "./FarmerCrmClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type FarmerCrmRow = {
  key: string;
  name: string;
  phone: string;
  region: string;
  crop: string;
  farmSize: string;
  orderCount: number;
  totalQuantity: number;
  latestOrderId: string;
  latestProduct: string;
  latestStatus: string;
  latestDate: string;
  latestRawDate: string;
  memo: string;

  profileStage: string;
  lastNoteDate: string;
  nextContactDate: string;
  repurchaseScore: number;
  repurchaseLabel: string;
};

type CustomerRow = {
  id: string;
  phone?: string | null;
  name?: string | null;
  region?: string | null;
  crop?: string | null;
  farm_size?: string | null;
  profile_stage?: string | null;
  repurchase_score?: number | null;
  vip_grade?: string | null;
  total_orders?: number | null;
  total_amount?: number | null;
  photodoctor_count?: number | null;
  last_activity_at?: string | null;
  next_contact_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

function scoreLabel(score: number) {
  if (score >= 80) return "★★★★★";
  if (score >= 60) return "★★★★☆";
  if (score >= 40) return "★★★☆☆";
  if (score >= 20) return "★★☆☆☆";
  return "★☆☆☆☆";
}

async function getRows(): Promise<FarmerCrmRow[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("repurchase_score", { ascending: false })
    .order("total_amount", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(10000);

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as CustomerRow[]).map((c) => {
    const phone = safe(c.phone);
    const score = Number(c.repurchase_score || 0);
    const orders = Number(c.total_orders || 0);
    const amount = Number(c.total_amount || 0);
    const photoCount = Number(c.photodoctor_count || 0);

    return {
      key: c.id || phone,
      name: safe(c.name) || "-",
      phone: phone || "-",
      region: safe(c.region) || "-",
      crop: safe(c.crop) || "-",
      farmSize: safe(c.farm_size) || "-",

      orderCount: orders,
      totalQuantity: photoCount,
      latestOrderId: "-",
      latestProduct: amount > 0 ? `${amount.toLocaleString()}원` : "-",
      latestStatus: safe(c.vip_grade) || "일반",
      latestDate: shortDate(c.last_activity_at || c.updated_at || c.created_at),
      latestRawDate: safe(c.last_activity_at || c.updated_at || c.created_at),

      memo: "-",

      profileStage: safe(c.profile_stage) || "신규",
      lastNoteDate: "-",
      nextContactDate: c.next_contact_at ? String(c.next_contact_at).slice(0, 10) : "-",

      repurchaseScore: score,
      repurchaseLabel: scoreLabel(score),
    };
  });
}

export default async function Page() {
  try {
    const rows = await getRows();

    return <FarmerCrmClient rows={rows} errorMessage="" />;
  } catch (e: any) {
    return (
      <FarmerCrmClient
        rows={[]}
        errorMessage={e?.message || "CRM 데이터를 불러오지 못했습니다."}
      />
    );
  }
}
