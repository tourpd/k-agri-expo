import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ActionRow = {
  id: string;
  source_title?: string | null;
  page_number?: number | null;
  crop_name?: string | null;
  disease_name?: string | null;
  action_title?: string | null;
  action_detail?: string | null;
  urgency?: string | null;
  status?: string | null;
  risk_level?: string | null;
  priority?: number | null;
  deadline_hours?: number | null;
  step1?: string | null;
  step2?: string | null;
  step3?: string | null;
  expected_loss?: string | null;
  recommended_product?: string | null;
  economic_impact?: string | null;
  notification_message?: string | null;
  created_at?: string | null;
};

function riskLabel(v?: string | null) {
  if (v === "high") return "긴급";
  if (v === "medium") return "주의";
  if (v === "low") return "관찰";
  return "주의";
}

function statusLabel(v?: string | null) {
  if (v === "auto_approved") return "자동승인";
  if (v === "review_needed") return "검수필요";
  if (v === "approved") return "확정";
  if (v === "rejected") return "보류";
  return v || "후보";
}

export default async function ActionInstructionsPage() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("knowledge_action_instructions")
    .select("*")
    .order("priority", { ascending: true })
    .order("deadline_hours", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1000);

  const rows = (data || []) as ActionRow[];

  const total = rows.length;
  const high = rows.filter((r) => r.risk_level === "high").length;
  const medium = rows.filter((r) => !r.risk_level || r.risk_level === "medium").length;
  const low = rows.filter((r) => r.risk_level === "low").length;
  const within24 = rows.filter((r) => Number(r.deadline_hours || 72) <= 24).length;

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-4 text-black">
      <section className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI BRAIN / 고객 행동엔진
            </div>
            <h1 className="text-3xl font-black tracking-tight">
              행동지시센터 V2
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              고객이 오늘 무엇을 해야 하는지 위험도·우선순위·실행기한·3단계 행동으로 정리합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/admin/visual-knowledge" className="rounded-xl bg-white px-4 py-3 text-sm font-black">
              자료화면 AI DB
            </Link>
            <Link href="/admin/decision-rules" className="rounded-xl bg-black px-4 py-3 text-sm font-black text-white">
              판단규칙센터
            </Link>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-5 gap-2">
          <Stat label="전체 행동지시" value={total} />
          <Stat label="긴급" value={high} />
          <Stat label="주의" value={medium} />
          <Stat label="관찰" value={low} />
          <Stat label="24시간 이내" value={within24} />
        </div>

        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3 text-xs">
          <b>흐름</b> : 판단규칙 → 위험도 계산 → 우선순위 → 실행기한 → 3단계 행동 → 고객 알림 → 농사119
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error.message}
        </div>
      ) : (
        <section className="rounded-2xl border bg-white shadow">
          <div className="max-h-[76vh] overflow-auto">
            <table className="w-full min-w-[2100px] border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-gray-950 text-white">
                <tr>
                  <Th w="95px">위험도</Th>
                  <Th w="70px">우선</Th>
                  <Th w="95px">기한</Th>
                  <Th w="120px">작물</Th>
                  <Th w="160px">병해충</Th>
                  <Th w="230px">행동제목</Th>
                  <Th w="320px">1단계</Th>
                  <Th w="320px">2단계</Th>
                  <Th w="320px">3단계</Th>
                  <Th w="300px">예상손실</Th>
                  <Th w="260px">추천제품/자재</Th>
                  <Th w="320px">고객 알림문자</Th>
                  <Th w="100px">상태</Th>
                  <Th w="160px">출처</Th>
                  <Th w="70px">P</Th>
                </tr>
              </thead>

              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="p-10 text-center">
                      행동지시가 없습니다. 자료화면 AI DB에서 두뇌DB 생성을 먼저 실행하세요.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-green-50">
                      <Td><RiskBadge value={r.risk_level} /></Td>
                      <Td center>{r.priority || 3}</Td>
                      <Td center>{r.deadline_hours || 72}시간</Td>
                      <Td strong>{r.crop_name || "공통"}</Td>
                      <Td>{r.disease_name || "없음"}</Td>
                      <Td strong>{r.action_title || "-"}</Td>
                      <Td>{r.step1 || "-"}</Td>
                      <Td>{r.step2 || "-"}</Td>
                      <Td>{r.step3 || "-"}</Td>
                      <Td>{r.expected_loss || "-"}</Td>
                      <Td>{r.recommended_product || "-"}</Td>
                      <Td>{r.notification_message || "-"}</Td>
                      <Td><StatusBadge value={r.status} /></Td>
                      <Td>{r.source_title || "-"}</Td>
                      <Td center>{r.page_number || "-"}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="text-[11px] font-black text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-black">{value.toLocaleString()}</div>
    </div>
  );
}

function Th({ children, w }: { children: React.ReactNode; w: string }) {
  return (
    <th style={{ width: w }} className="border-r border-gray-800 px-3 py-3 text-left font-black">
      {children}
    </th>
  );
}

function Td({ children, center, strong }: { children: React.ReactNode; center?: boolean; strong?: boolean }) {
  return (
    <td
      className={[
        "max-w-[340px] overflow-hidden text-ellipsis whitespace-nowrap border-r px-3 py-2 align-middle",
        center ? "text-center" : "",
        strong ? "font-black" : "",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function RiskBadge({ value }: { value?: string | null }) {
  const label = riskLabel(value);
  const cls =
    value === "high"
      ? "bg-red-100 text-red-800"
      : value === "low"
      ? "bg-gray-100 text-gray-700"
      : "bg-yellow-100 text-yellow-800";

  return <span className={`rounded-full px-2 py-1 text-[11px] font-black ${cls}`}>{label}</span>;
}

function StatusBadge({ value }: { value?: string | null }) {
  const label = statusLabel(value);
  const cls =
    value === "approved" || value === "auto_approved"
      ? "bg-blue-100 text-blue-800"
      : value === "rejected"
      ? "bg-gray-200 text-gray-700"
      : "bg-yellow-100 text-yellow-800";

  return <span className={`rounded-full px-2 py-1 text-[11px] font-black ${cls}`}>{label}</span>;
}
