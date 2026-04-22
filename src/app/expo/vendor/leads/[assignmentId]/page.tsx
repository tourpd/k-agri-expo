import { redirect } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type AssignmentParams = {
  assignmentId: string;
};

type VendorRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  company_name: string | null;
};

type AssignmentRow = {
  assignment_id: string;
  lead_id: string;
  vendor_id: string | null;
  rank_no: number | null;
  status: string | null;
  match_score: number | null;
  sponsor_score: number | null;
  performance_score: number | null;
  final_score: number | null;
  created_at: string | null;
  first_opened_at: string | null;
  first_contacted_at: string | null;
  quoted_at: string | null;
  won_at: string | null;
  memo: string | null;
};

type LeadRow = {
  user_name: string | null;
  phone: string | null;
  region: string | null;
  city: string | null;
  crop: string | null;
  category: string | null;
  problem_name: string | null;
  urgency_level: string | null;
  purchase_intent: string | null;
  question_text: string | null;
  ai_summary: string | null;
};

type ConversionRow = {
  conversion_id: string;
  product_name: string | null;
  quantity: string | null;
  quoted_amount: number | null;
  final_amount: number | null;
  won_at: string | null;
  memo: string | null;
};

type LogRow = {
  log_id: string;
  action_type: string | null;
  created_at: string | null;
  actor_type: string | null;
  actor_id: string | null;
  note: string | null;
};

function safe(v: unknown, fallback = "-") {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s : fallback;
}

function fmtMoney(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}

function fmtDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
}

async function resolveCurrentVendor(userId: string, email?: string | null) {
  const admin = createSupabaseAdminClient();

  let vendor: VendorRow | null = null;

  {
    const { data } = await admin
      .from("vendors")
      .select("id, user_id, email, company_name")
      .eq("user_id", userId)
      .maybeSingle();

    vendor = (data as VendorRow | null) ?? null;
  }

  if (!vendor && email) {
    const { data } = await admin
      .from("vendors")
      .select("id, user_id, email, company_name")
      .eq("email", email)
      .maybeSingle();

    vendor = (data as VendorRow | null) ?? null;
  }

  return vendor;
}

export default async function VendorLeadDetailPage({
  params,
}: {
  params: Promise<AssignmentParams>;
}) {
  const { assignmentId } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/vendor");
  }

  const admin = createSupabaseAdminClient();
  const vendor = await resolveCurrentVendor(user.id, user.email);

  if (!vendor) {
    redirect("/expo/vendor/apply");
  }

  const { data: assignmentData } = await admin
    .from("expo_lead_assignments")
    .select(`
      assignment_id,
      lead_id,
      vendor_id,
      rank_no,
      status,
      match_score,
      sponsor_score,
      performance_score,
      final_score,
      created_at,
      first_opened_at,
      first_contacted_at,
      quoted_at,
      won_at,
      memo
    `)
    .eq("assignment_id", assignmentId)
    .maybeSingle();

  const assignment = (assignmentData as AssignmentRow | null) ?? null;

  if (!assignment || assignment.vendor_id !== vendor.id) {
    redirect("/expo/vendor/leads");
  }

  const { data: leadData } = await admin
    .from("expo_consult_leads")
    .select(`
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
      ai_summary
    `)
    .eq("lead_id", assignment.lead_id)
    .maybeSingle();

  const lead = (leadData as LeadRow | null) ?? null;

  const { data: logsData } = await admin
    .from("expo_lead_logs")
    .select("log_id, action_type, created_at, actor_type, actor_id, note")
    .eq("lead_id", assignment.lead_id)
    .order("created_at", { ascending: false });

  const logs = (logsData as LogRow[] | null) ?? [];

  const { data: conversionsData } = await admin
    .from("expo_conversions")
    .select("conversion_id, product_name, quantity, quoted_amount, final_amount, won_at, memo")
    .eq("lead_id", assignment.lead_id)
    .eq("vendor_id", vendor.id)
    .order("won_at", { ascending: false });

  const conversions = (conversionsData as ConversionRow[] | null) ?? [];

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.topRow}>
          <div>
            <div style={S.kicker}>VENDOR LEAD DETAIL</div>
            <h1 style={S.title}>리드 상세</h1>
            <div style={S.desc}>
              {vendor.company_name || "업체"}에 배정된 상담 리드 상세 화면입니다.
            </div>
          </div>

          <Link href="/expo/vendor/leads" style={S.ghostBtn}>
            ← 리드 목록
          </Link>
        </div>

        <section style={S.card}>
          <div style={S.sectionTitle}>기본 정보</div>

          <div style={S.grid2}>
            <Info label="이름" value={safe(lead?.user_name)} />
            <Info label="연락처" value={safe(lead?.phone)} />
            <Info
              label="지역"
              value={`${safe(lead?.region)}${lead?.city ? ` / ${lead.city}` : ""}`}
            />
            <Info label="작물" value={safe(lead?.crop)} />
            <Info label="카테고리" value={safe(lead?.category)} />
            <Info label="문제명" value={safe(lead?.problem_name)} />
            <Info label="긴급도" value={safe(lead?.urgency_level)} />
            <Info label="구매의도" value={safe(lead?.purchase_intent)} />
            <Info label="배정 순위" value={`${assignment.rank_no ?? "-"}순위`} />
            <Info label="배정 상태" value={safe(assignment.status)} />
          </div>

          <div style={S.questionBox}>
            <div style={S.label}>원본 질문</div>
            <div style={S.questionText}>{safe(lead?.question_text)}</div>
          </div>

          <div style={S.questionBox}>
            <div style={S.label}>AI 요약</div>
            <div style={S.questionText}>{safe(lead?.ai_summary, "요약 없음")}</div>
          </div>
        </section>

        <section style={S.card}>
          <div style={S.sectionTitle}>배정 점수</div>
          <div style={S.grid4}>
            <Info label="적합도" value={String(assignment.match_score ?? 0)} />
            <Info label="광고/협찬 점수" value={String(assignment.sponsor_score ?? 0)} />
            <Info label="성과 점수" value={String(assignment.performance_score ?? 0)} />
            <Info label="최종 점수" value={String(assignment.final_score ?? 0)} />
          </div>
        </section>

        <section style={S.card}>
          <div style={S.sectionTitle}>상태 변경</div>

          <div style={S.actionGrid}>
            <StatusButton assignmentId={assignment.assignment_id} status="opened" label="열람 처리" />
            <StatusButton assignmentId={assignment.assignment_id} status="contacted" label="연락 시도" />
            <StatusButton assignmentId={assignment.assignment_id} status="quoted" label="견적 발송" />
            <StatusButton assignmentId={assignment.assignment_id} status="won" label="판매 완료 처리" />
          </div>

          <div style={S.timeline}>
            <Info label="배정 시각" value={fmtDate(assignment.created_at)} />
            <Info label="첫 열람" value={fmtDate(assignment.first_opened_at)} />
            <Info label="첫 연락" value={fmtDate(assignment.first_contacted_at)} />
            <Info label="견적 시각" value={fmtDate(assignment.quoted_at)} />
            <Info label="판매 완료" value={fmtDate(assignment.won_at)} />
          </div>
        </section>

        <section style={S.card}>
          <div style={S.sectionTitle}>판매 완료 등록</div>
          <ConversionForm assignmentId={assignment.assignment_id} />
        </section>

        <section style={S.card}>
          <div style={S.sectionTitle}>매출 기록</div>

          {conversions.length === 0 ? (
            <div style={S.empty}>아직 판매 완료 기록이 없습니다.</div>
          ) : (
            <div style={S.list}>
              {conversions.map((c) => (
                <div key={c.conversion_id} style={S.logCard}>
                  <div style={S.logTitle}>
                    {safe(c.product_name, "제품명 미입력")} / 수량 {safe(c.quantity, "-")}
                  </div>
                  <div style={S.logMeta}>
                    견적 {fmtMoney(c.quoted_amount)} · 최종 {fmtMoney(c.final_amount)} ·{" "}
                    {fmtDate(c.won_at)}
                  </div>
                  <div style={S.logNote}>{safe(c.memo, "메모 없음")}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={S.card}>
          <div style={S.sectionTitle}>리드 로그</div>

          {logs.length === 0 ? (
            <div style={S.empty}>로그가 없습니다.</div>
          ) : (
            <div style={S.list}>
              {logs.map((log) => (
                <div key={log.log_id} style={S.logCard}>
                  <div style={S.logTitle}>
                    {safe(log.action_type)} / {fmtDate(log.created_at)}
                  </div>
                  <div style={S.logMeta}>
                    {safe(log.actor_type)} {log.actor_id ? `/ ${log.actor_id}` : ""}
                  </div>
                  <div style={S.logNote}>{safe(log.note, "메모 없음")}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.infoBox}>
      <div style={S.label}>{label}</div>
      <div style={S.value}>{value}</div>
    </div>
  );
}

function StatusButton({
  assignmentId,
  status,
  label,
}: {
  assignmentId: string;
  status: string;
  label: string;
}) {
  return (
    <form action="/api/expo/vendor-leads/update" method="post">
      <input type="hidden" name="assignment_id" value={assignmentId} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" style={S.primaryBtn}>
        {label}
      </button>
    </form>
  );
}

function ConversionForm({ assignmentId }: { assignmentId: string }) {
  return (
    <form action="/api/expo/vendor-leads/convert" method="post" style={S.form}>
      <input type="hidden" name="assignment_id" value={assignmentId} />

      <div style={S.grid2}>
        <input name="product_name" placeholder="판매 제품명" style={S.input} />
        <input name="quantity" placeholder="수량 (예: 20개 / 1톤 / 500평분)" style={S.input} />
      </div>

      <div style={S.grid2}>
        <input name="quoted_amount" placeholder="견적 금액" style={S.input} />
        <input name="final_amount" placeholder="최종 판매 금액" style={S.input} />
      </div>

      <textarea
        name="memo"
        placeholder="상담 메모 / 판매 메모"
        style={S.textarea}
      />

      <button type="submit" style={S.primaryBtn}>
        판매 완료 기록
      </button>
    </form>
  );
}

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 24,
  },
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    flexWrap: "wrap",
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
  ghostBtn: {
    textDecoration: "none",
    background: "#fff",
    color: "#0f172a",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 900,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 950,
    color: "#111827",
    marginBottom: 14,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  grid4: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  infoBox: {
    padding: 14,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  label: {
    fontSize: 12,
    fontWeight: 900,
    color: "#64748b",
  },
  value: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 800,
    color: "#111827",
    lineHeight: 1.7,
  },
  questionBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  questionText: {
    marginTop: 8,
    color: "#111827",
    lineHeight: 1.8,
  },
  actionGrid: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  timeline: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 12,
    marginTop: 16,
  },
  form: {
    display: "grid",
    gap: 12,
  },
  input: {
    width: "100%",
    height: 46,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    boxSizing: "border-box",
    fontSize: 14,
  },
  textarea: {
    width: "100%",
    minHeight: 110,
    borderRadius: 12,
    border: "1px solid #cbd5e1",
    padding: 14,
    boxSizing: "border-box",
    fontSize: 14,
    resize: "vertical",
  },
  primaryBtn: {
    border: "none",
    background: "#0f172a",
    color: "#fff",
    borderRadius: 12,
    padding: "12px 16px",
    fontWeight: 900,
    cursor: "pointer",
  },
  empty: {
    padding: 16,
    borderRadius: 14,
    background: "#f8fafc",
    color: "#64748b",
    border: "1px solid #e5e7eb",
  },
  list: {
    display: "grid",
    gap: 10,
  },
  logCard: {
    padding: 14,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  logTitle: {
    fontWeight: 900,
    color: "#111827",
  },
  logMeta: {
    marginTop: 6,
    fontSize: 13,
    color: "#64748b",
  },
  logNote: {
    marginTop: 8,
    color: "#334155",
    lineHeight: 1.7,
  },
};