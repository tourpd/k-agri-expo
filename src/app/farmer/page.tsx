import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FarmerPage() {
  const cookieStore = await cookies();

  const farmerId =
    cookieStore.get("expo_farmer_entry")?.value ||
    cookieStore.get("farmer_id")?.value;

  if (!farmerId) {
    redirect("/login/farmer");
  }

  const supabase = await createSupabaseServerClient();

  const { data: farmer } = await supabase
    .from("farmers")
    .select("*")
    .eq("farmer_id", farmerId)
    .maybeSingle();

  if (!farmer) {
    redirect("/login/farmer");
  }

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>K-AGRI EXPO FARMER</div>

        <h1 style={S.title}>농민 입장 완료</h1>

        <div style={S.infoBox}>
          <div>
            <b>이름 :</b> {farmer.name || "-"}
          </div>

          <div>
            <b>전화번호 :</b> {maskPhone(farmer.phone)}
          </div>

          <div>
            <b>지역 :</b> {farmer.region || "-"}
          </div>

          <div>
            <b>주작물 :</b> {farmer.main_crop || farmer.crop || "-"}
          </div>

          <div>
            <b>농장명 :</b> {farmer.farm_name || "-"}
          </div>

          <div>
            <b>VIP 등급 :</b> {farmer.vip_grade || "일반"}
          </div>
        </div>

        <div style={S.note}>
          K-Agri Expo 입장이 완료되었습니다.
          이제 농민 운영센터에서 부스 생성, 농산물 등록,
          주문관리, 소비자 판매를 진행할 수 있습니다.
        </div>

        <div style={S.buttonRow}>
          <Link href="/farmer/dashboard" style={S.primaryBtn}>
            🚜 농민 운영센터 이동
          </Link>

          <Link href="/expo" style={S.secondaryBtn}>
            박람회 둘러보기
          </Link>
        </div>
      </div>
    </main>
  );
}

function maskPhone(phone?: string) {
  const d = String(phone || "").replace(/\D/g, "");

  if (d.length < 8) return d;

  return `${d.slice(0, 3)}-****-${d.slice(-4)}`;
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg,#ecfdf5 0%,#ffffff 100%)",
    padding: 24,
  },

  card: {
    maxWidth: 1000,
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 24,
    padding: 32,
    boxShadow: "0 16px 40px rgba(15,23,42,0.06)",
  },

  kicker: {
    fontSize: 14,
    fontWeight: 900,
    color: "#16a34a",
  },

  title: {
    margin: "12px 0 0",
    fontSize: 42,
    fontWeight: 950,
    color: "#111827",
  },

  infoBox: {
    marginTop: 24,
    padding: 24,
    borderRadius: 20,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    lineHeight: 2.2,
    fontSize: 18,
    color: "#111827",
  },

  note: {
    marginTop: 20,
    fontSize: 18,
    lineHeight: 1.8,
    color: "#475569",
  },

  buttonRow: {
    marginTop: 28,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },

  primaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 16,
    padding: "18px 26px",
    fontSize: 18,
    fontWeight: 900,
  },

  secondaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    background: "#fff",
    color: "#111827",
    border: "1px solid #d1d5db",
    borderRadius: 16,
    padding: "18px 26px",
    fontSize: 18,
    fontWeight: 900,
  },
};