import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type LeadRow = {
  lead_id?: string | null;
  user_name?: string | null;
  phone?: string | null;
  region?: string | null;
  city?: string | null;
  crop?: string | null;
  category?: string | null;
  problem_name?: string | null;
  urgency_level?: string | null;
  purchase_intent?: string | null;
  question_text?: string | null;
  ai_summary?: string | null;
  conversion_status?: string | null;
};

type AssignmentRow = {
  assignment_id: string;
  created_at?: string | null;
  rank_no?: number | null;
  status?: string | null;
  final_score?: number | null;
  lead?: LeadRow | LeadRow[] | null;
};

type VendorRow = {
  id: string;
  company_name?: string | null;
};

function safe(v: unknown, fallback = "-") {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : fallback;
}

function normalizeLead(lead: AssignmentRow["lead"]): LeadRow | null {
  if (!lead) return null;
  if (Array.isArray(lead)) return lead[0] ?? null;
  return lead;
}

function badgeStyle(status: string): React.CSSProperties {
  if (status === "won") {
    return { ...S.badge, background: "#dcfce7", color: "#166534" };
  }
  if (status === "quoted") {
    return { ...S.badge, background: "#fef3c7", color: "#92400e" };
  }
  if (status === "contacted") {
    return { ...S.badge, background: "#dbeafe", color: "#1d4ed8" };
  }
  if (status === "opened") {
    return { ...S.badge, background: "#e0f2fe", color: "#0369a1" };
  }
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

  const { data: vendorData } = await admin
    .from("vendors")
    .select("id, company_name")
    .eq("user_id", user.id)
    .maybeSingle();

  const vendor = (vendorData as VendorRow | null) ?? null;

  if (!vendor) {
    redirect("/expo/vendor/apply");
  }

  const { data: rowsData } = await admin
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

  const rawItems = (rowsData ?? []) as AssignmentRow[];

  const items: Array<
    Omit<AssignmentRow, "lead"> & {
      lead: LeadRow | null;
    }
  > = rawItems.map((row) => ({
    ...row,
    lead: normalizeLead(row.lead),
  }));

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.top}>
          <div>
            <div style={S.kicker}>VENDOR LEADS</div>
            <h1 style={S.title}>배정된 상담 리드</h1>
            <div style={S.desc}>
              {safe(vendor.company_name, "업체")}에 배정된 상담 목록입니다.
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div style={S.empty}>현재 배정된 리드가 없습니다.</div>
        ) : (
          <div style={S.list}>
            {items.map((row) => {
              const lead = row.lead;
              const status = safe(row.status, "assigned");

              return (
                <article key={row.assignment_id} style={S.card}>
                  <div style={S.cardTop}>
                    <div>
                      <div style={S.name}>
                        {safe(lead?.user_name, "이름 미입력")} ·{" "}
                        {safe(lead?.crop, "작물 미입력")}
                      </div>

                      <div style={S.meta}>
                        {safe(lead?.region, "지역 미입력")}
                        {lead?.city ? ` · ${lead.city}` : ""}
                        {lead?.category ? ` · ${lead.category}` : ""}
                        {lead?.problem_name ? ` · ${lead.problem_name}` : ""}
                      </div>
                    </div>

                    <div style={badgeStyle(status)}>{status}</div>
                  </div>

                  <div style={S.question}>{safe(lead?.question_text, "-")}</div>

                  <div style={S.meta2}>
                    <span>긴급도: {safe(lead?.urgency_level, "-")}</span>
                    <span>구매의도: {safe(lead?.purchase_intent, "-")}</span>
                    <span>배정순위: {row.rank_no ?? "-"}순위</span>
                    <span>점수: {row.final_score ?? "-"}</span>
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