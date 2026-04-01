import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FarmerPage() {
  const cookieStore = await cookies();
  const farmerId = cookieStore.get("expo_farmer_entry")?.value;

  if (!farmerId) {
    redirect("/login/farmer");
  }

  const supabase = await createSupabaseServerClient();

  const { data: farmer } = await supabase
    .from("expo_farmers")
    .select("*")
    .eq("id", farmerId)
    .maybeSingle();

  if (!farmer) {
    redirect("/login/farmer");
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>FARMER DASHBOARD</div>
        <h1 style={S.title}>농민 입장 완료</h1>

        <div style={S.infoBox}>
          <div><b>이름:</b> {farmer.name}</div>
          <div><b>전화번호:</b> {maskPhone(farmer.phone)}</div>
          <div><b>지역:</b> {farmer.region || "-"}</div>
          <div><b>작물:</b> {farmer.crop || "-"}</div>
          <div><b>이벤트 인증:</b> {farmer.verified_phone ? "완료" : "미완료"}</div>
        </div>

        <div style={S.note}>
          지금은 기본 입장 상태입니다. 경품 응모, 무료 샘플 신청, 특가 참여 시에만
          추가 인증을 붙이면 됩니다.
        </div>
      </div>
    </main>
  );
}

function maskPhone(phone: string) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length < 8) return d;
  return `${d.slice(0, 3)}-****-${d.slice(-4)}`;
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)",
    padding: 24,
  },
  card: {
    maxWidth: 900,
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
  },
  title: {
    margin: "10px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#111827",
  },
  infoBox: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    lineHeight: 2,
    color: "#111827",
  },
  note: {
    marginTop: 18,
    color: "#64748b",
    lineHeight: 1.8,
  },
};