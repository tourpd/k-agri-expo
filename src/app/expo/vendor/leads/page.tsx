import { redirect } from "next/navigation";
import Link from "next/link";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function badgeStyle(status: string): React.CSSProperties {
  if (status === "won") return { ...S.badge, background: "#dcfce7", color: "#166534" };
  if (status === "quoted") return { ...S.badge, background: "#fef3c7", color: "#92400e" };
  if (status === "contacted") return { ...S.badge, background: "#dbeafe", color: "#1d4ed8" };
  return { ...S.badge, background: "#f3f4f6", color: "#374151" };
}

export default async function VendorLeadsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/vendor");
  }

  const admin = createSupabaseAdminClient();

  const { data: vendor } = await admin
    .from("vendors")
    .select("id, company_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!vendor) {
    redirect("/expo/vendor/apply");
  }

  const { data: rows } = await admin
    .from("expo_lead_assignments")
    .select(`
      assignment_id,
      created_at,
      rank_no,
      status,
      final_score,
      lead:expo_consult_leads (
        lead_id,
        user_name,
        phone,
        region,
        city,
        crop,
        category,
        problem_name,
        urgency_level,
        purchase_intent,
        question_text,
        ai_summary,
        conversion_status
      )
    `)
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false });

  const items = rows ?? [];

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.top}>
          <div>
            <div style={S.kicker}>VENDOR LEADS</div>
            <h1 style={S.title}>배정된 상담 리드</h1>
            <div style={S.desc}>{vendor.company_name || "업체"}에 배정된 상담 목록입니다.</div>
          </div>
        </div>

        {items.length === 0 ? (
          <div style={S.empty}>현재 배정된 리드가 없습니다.</div>
        ) : (
          <div style={S.list}>
            {items.map((row: any) => {
              const lead = row.lead;
              return (
                <article key={row.assignment_id} style={S.card}>
                  <div style={S.cardTop}>
                    <div>
                      <div style={S.name}>
                        {lead?.user_name || "이름 미입력"} · {lead?.crop || "작물 미입력"}
                      </div>
                      <div style={S.meta}>
                        {lead?.region || "지역 미입력"}
                        {lead?.city ? ` · ${lead.city}` : ""}
                        {lead?.category ? ` · ${lead.category}` : ""}
                        {lead?.problem_name ? ` · ${lead.problem_name}` : ""}
                      </div>
                    </div>

                    <div style={badgeStyle(row.status || "assigned")}>
                      {row.status || "assigned"}
                    </div>
                  </div>

                  <div style={S.question}>{lead?.question_text || "-"}</div>

                  <div style={S.meta2}>
                    <span>긴급도: {lead?.urgency_level || "-"}</span>
                    <span>구매의도: {lead?.purchase_intent || "-"}</span>
                    <span>배정순위: {row.rank_no}순위</span>
                    <span>점수: {row.final_score}</span>
                  </div>

                  <div style={S.actionRow}>
                    <Link
                      href={`/expo/vendor/leads/${row.assignment_id}`}
                      style={S.primaryBtn}
                    >
                      리드 상세 보기
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 24,
  },
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
  },
  top: {
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    fontWeight: 950,
    color: "#0f172a",
  },
  desc: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 1.8,
    color: "#64748b",
  },
  empty: {
    padding: 20,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    color: "#64748b",
  },
  list: {
    display: "grid",
    gap: 14,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
  },
  meta: {
    marginTop: 6,
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.6,
  },
  question: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#111827",
    lineHeight: 1.8,
  },
  meta2: {
    marginTop: 12,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    color: "#334155",
    fontSize: 13,
    fontWeight: 700,
  },
  badge: {
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },
  actionRow: {
    marginTop: 16,
  },
  primaryBtn: {
    textDecoration: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 900,
    display: "inline-block",
  },
};