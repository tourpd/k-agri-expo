import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function approveVendor(userId: string) {
  "use server";

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/admin/vendor/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
    cache: "no-store",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error || "승인 처리 실패");
  }
}

export default async function AdminVendorPage() {
  const admin = createSupabaseAdminClient();

  const { data: vendors, error } = await admin
    .from("vendors")
    .select("id,user_id,company_name,email,status,verify_status,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return <main style={{ padding: 40 }}>오류: {error.message}</main>;
  }

  return (
    <main style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: 900 }}>업체 승인 관리</h1>

      <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
        {(vendors ?? []).map((v: any) => (
          <div
            key={v.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              padding: 18,
              background: "#fff",
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 900 }}>{v.company_name || "회사명 없음"}</div>
            <div style={{ marginTop: 8, color: "#475569", lineHeight: 1.8 }}>
              이메일: {v.email || "-"}<br />
              상태: {v.status || "-"} / 인증: {v.verify_status || "-"}
            </div>

            <div style={{ marginTop: 14 }}>
              {v.status === "pending" ? (
                <form action={approveVendor.bind(null, v.user_id)}>
                  <button
                    type="submit"
                    style={{
                      border: "none",
                      background: "#111827",
                      color: "#fff",
                      padding: "12px 16px",
                      borderRadius: 12,
                      fontWeight: 900,
                      cursor: "pointer",
                    }}
                  >
                    승인하기
                  </button>
                </form>
              ) : (
                <div style={{ fontWeight: 800, color: "#16a34a" }}>이미 처리됨</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}