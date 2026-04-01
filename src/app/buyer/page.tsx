import React from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BuyerPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/buyer");
  }

  const { data: buyer } = await supabase
    .from("buyers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main style={S.page}>
      <div style={S.card}>
        <div style={S.kicker}>BUYER DASHBOARD</div>
        <h1 style={S.title}>바이어 대시보드</h1>

        {!buyer ? (
          <div style={S.warn}>
            바이어 정보가 없습니다. 먼저 회원가입을 완료해 주세요.
          </div>
        ) : (
          <div style={S.infoBox}>
            <div><b>회사명:</b> {buyer.company_name}</div>
            <div><b>담당자:</b> {buyer.contact_name || "-"}</div>
            <div><b>이메일:</b> {buyer.email || user.email || "-"}</div>
          </div>
        )}

        <div style={S.note}>
          다음 단계에서는 관심 부스 저장, 상담 요청, 제안서 다운로드, 바이어 전용 문의 기능을 붙이면 됩니다.
        </div>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)",
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
    color: "#d97706",
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
  warn: {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    border: "1px solid #fed7aa",
    background: "#fff7ed",
    color: "#9a3412",
    lineHeight: 1.8,
    fontWeight: 800,
  },
  note: {
    marginTop: 18,
    color: "#64748b",
    lineHeight: 1.8,
  },
};