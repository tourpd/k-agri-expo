// src/app/expo/admin/hall/[hallId]/page.tsx
export const dynamic = "force-dynamic";

import React from "react";
import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import AdminSlotAssigner, {
  type AdminBoothRow,
  type AdminSlotRow,
} from "@/components/expo/admin/AdminSlotAssigner";

const ALLOWED_HALLS = new Set(["agri-inputs", "machinery", "seeds", "smartfarm"]);

type PageProps = {
  params: Promise<{ hallId: string }>;
};

export default async function AdminHallPage({ params }: PageProps) {
  const { hallId } = await params;

  if (!ALLOWED_HALLS.has(hallId)) notFound();

  const supabase = await createSupabaseServerClient();

  // ✅ 로그인 체크
  const { data: userRes, error: userErr } = await supabase.auth.getUser();
  const userId = userRes?.user?.id ?? null;

  if (userErr || !userId) {
    redirect("/login"); // 프로젝트에 맞는 로그인 경로로 바꿔도 됩니다.
  }

  // ✅ 운영자 권한 체크: expo_admins(user_id uuid)
  const { data: adminRow, error: adminErr } = await supabase
    .from("expo_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminErr || !adminRow) {
    // 운영자 아니면 404로 숨김 처리(보안상 권장)
    notFound();
  }

  // ✅ booths (해당 hall의 업체)
  const { data: boothsData, error: boothErr } = await supabase
    .from("booths")
    .select("booth_id,name,region,category_primary,intro,hall_id,phone")
    .eq("hall_id", hallId)
    .order("name", { ascending: true })
    .limit(2000);

  // ✅ slots (지도)
  const { data: slotsData, error: slotsErr } = await supabase
    .from("hall_booth_slots")
    .select("hall_id,slot_id,x,y,w,h,booth_id")
    .eq("hall_id", hallId)
    .order("y", { ascending: true })
    .order("x", { ascending: true })
    .limit(5000);

  if (boothErr || slotsErr) {
    // 운영자 화면이므로 원인 파악 쉬우라고 에러를 그대로 노출
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>운영자 부스 배정</h1>
        <p style={{ marginTop: 12, color: "#b00020" }}>
          데이터 로드 실패: {boothErr?.message ?? slotsErr?.message ?? "unknown"}
        </p>
      </div>
    );
  }

  const booths = (boothsData ?? []) as AdminBoothRow[];
  const slots = (slotsData ?? []) as AdminSlotRow[];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
        <h1 style={{ fontSize: 24, fontWeight: 900 }}>운영자: 부스 배정</h1>
        <span style={{ color: "#666" }}>hall: {hallId}</span>
      </div>

      <div style={{ marginTop: 10, color: "#666", lineHeight: 1.5 }}>
        ✅ 왼쪽 “미배정 업체”를 드래그해서 슬롯(A1, A2…)에 드롭하면 즉시 저장됩니다. <br />
        ✅ 이미 배정된 슬롯에 드롭하면 교체됩니다. <br />
        ✅ 슬롯의 “비우기” 버튼으로 배정을 해제할 수 있습니다.
      </div>

      <div style={{ marginTop: 20 }}>
        <AdminSlotAssigner hallId={hallId} booths={booths} slots={slots} />
      </div>
    </div>
  );
}