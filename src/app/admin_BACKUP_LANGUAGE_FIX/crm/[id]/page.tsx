import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import SendActionButton from "../components/SendActionButton";

export const dynamic = "force-dynamic";

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function typeLabel(v?: string | null) {
  if (v === "garden") return "텃밭";
  if (v === "balcony") return "베란다";
  if (v === "plant_parent") return "식집사";
  if (v === "consumer") return "일반소비자";
  if (v === "health") return "건강고객";
  if (v === "creator") return "크리에이터";
  return "고객";
}

function activityLabel(v?: string | null) {
  if (v === "video_watch") return "영상시청";
  if (v === "product_click") return "상품클릭";
  if (v === "consult") return "상담";
  if (v === "order") return "주문";
  if (v === "education") return "교육";
  if (v === "groupbuy") return "공동구매";
  return v || "-";
}

function crmScore(item: any, logs: any[]) {
  let score = 0;
  score += logs.filter((l) => l.activity_type === "video_watch").length * 10;
  score += logs.filter((l) => l.activity_type === "product_click").length * 20;
  score += logs.filter((l) => l.activity_type === "consult").length * 30;
  score += logs.filter((l) => l.activity_type === "groupbuy").length * 40;
  score += logs.filter((l) => l.activity_type === "order").length * 50;
  score += n(item.order_count) * 8;
  score += n(item.consult_count) * 5;
  score += n(item.groupbuy_count) * 10;
  score += n(item.education_count) * 5;
  if (n(item.total_revenue_krw || item.total_purchase_amount) >= 1000000) score += 20;
  return Math.min(score, 100);
}

function status(score: number) {
  if (score >= 90) return "HOT";
  if (score >= 70) return "WARM";
  if (score >= 50) return "관심";
  return "관찰";
}

function prediction(item: any, logs: any[]) {
  const score = crmScore(item, logs);
  const revenue = n(item.total_revenue_krw || item.total_purchase_amount);
  const ltv = Math.max(revenue * 3, n(item.order_count) * 49900 * 6, 49900);
  const probability = Math.min(95, Math.max(35, score));
  const product =
    String(item.interest_products || "").includes("루테인") || n(item.eye_score) >= 80
      ? "루테인 눈건강 공동구매"
      : String(item.interest_products || "").includes("혈행") || n(item.blood_score) >= 75
      ? "혈행 건강 제품"
      : "MSM 관절 공동구매";

  return {
    ltv,
    probability,
    product,
    expected: product.includes("루테인") ? 59900 : 49900,
    reason: [
      n(item.joint_score) >= 70 ? "관절 관심 높음" : "",
      n(item.eye_score) >= 70 ? "눈건강 관심 있음" : "",
      logs.some((l) => l.activity_type === "product_click") ? "상품 클릭 이력" : "",
      logs.some((l) => l.activity_type === "video_watch") ? "영상 시청 이력" : "",
      n(item.order_count) > 0 ? "구매 이력 있음" : "",
    ].filter(Boolean).join(" / ") || "추가 관찰 필요",
  };
}

export default async function CrmCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: item } = await supabase.from("farmer_assets").select("*").eq("id", id).single();

  if (!item) {
    return <main className="p-5 font-black">고객 정보를 찾을 수 없습니다.</main>;
  }

  const { data: logs } = await supabase
    .from("customer_activity_logs")
    .select("*")
    .or(`customer_id.eq.${id},phone.eq.${item.phone}`)
    .order("created_at", { ascending: false });

  const { data: actions } = await supabase
    .from("crm_recommended_actions")
    .select("*")
    .eq("customer_id", id)
    .order("priority_no", { ascending: true });

  const activityLogs = logs ?? [];
  const recommendedActions = actions ?? [];
  const score = crmScore(item, activityLogs);
  const pred = prediction(item, activityLogs);
  const revenue = n(item.total_revenue_krw || item.total_purchase_amount);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2200px]">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/admin/crm" className="rounded bg-black px-4 py-3 font-black text-white">
            ← 통합 CRM 센터
          </Link>
          <div className="flex gap-2">
            <button className="h-10 rounded bg-green-700 px-4 text-sm font-black text-white">문자발송</button>
            <button className="h-10 rounded bg-blue-700 px-4 text-sm font-black text-white">상담 등록</button>
            <button className="h-10 rounded bg-orange-600 px-4 text-sm font-black text-white">공동구매 초대</button>
          </div>
        </div>

        <section className="mb-3 border bg-white p-4">
          <p className="text-xs font-black text-green-700">CRM CUSTOMER CARD</p>
          <h1 className="mt-1 text-3xl font-black">{item.name} CRM 고객카드</h1>
          <p className="mt-2 text-lg font-bold text-neutral-700">
            {typeLabel(item.customer_type)} · {item.region || "-"} · {item.crop || "-"} · {item.phone || "-"}
          </p>
        </section>

        <section className="mb-3 grid grid-cols-6 gap-2">
          <MiniStat title="CRM 상태" value={status(score)} />
          <MiniStat title="CRM 점수" value={`${score}점`} />
          <MiniStat title="구매확률" value={`${pred.probability}%`} />
          <MiniStat title="예상매출" value={`${pred.expected.toLocaleString()}원`} />
          <MiniStat title="LTV" value={`${pred.ltv.toLocaleString()}원`} />
          <MiniStat title="행동로그" value={`${activityLogs.length}건`} />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-2">
          <Box
            title="고객 기본정보"
            rows={[
              ["고객명", item.name || "-"],
              ["전화", item.phone || "-"],
              ["유형", typeLabel(item.customer_type)],
              ["단계", item.customer_stage || "-"],
              ["지역", item.region || "-"],
              ["작목", item.crop || "-"],
            ]}
          />

          <Box
            title="AI 매출 예측"
            rows={[
              ["고객가치(LTV)", `${pred.ltv.toLocaleString()}원`],
              ["구매확률", `${pred.probability}%`],
              ["추천상품", pred.product],
              ["예상매출", `${pred.expected.toLocaleString()}원`],
              ["추천사유", pred.reason],
              ["추천문자", `${pred.product} 안내 문자 발송 추천`],
            ]}
          />

          <Box
            title="건강·관심 프로필"
            rows={[
              ["관심제품", item.interest_products || "-"],
              ["관절", `${n(item.joint_score)}점`],
              ["혈행", `${n(item.blood_score)}점`],
              ["눈건강", `${n(item.eye_score)}점`],
              ["메모", item.memo || "-"],
            ]}
          />

          <Box
            title="구매·참여 프로필"
            rows={[
              ["주문", `${n(item.order_count)}회`],
              ["상담", `${n(item.consult_count)}회`],
              ["교육", `${n(item.education_count)}회`],
              ["공동구매", `${n(item.groupbuy_count)}회`],
              ["총매출", `${revenue.toLocaleString()}원`],
            ]}
          />
        </section>

        <section className="mb-3 border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            AI 추천 액션
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th>우선순위</Th>
                  <Th>액션유형</Th>
                  <Th>액션명</Th>
                  <Th>예상전환</Th>
                  <Th>예상매출</Th>
                  <Th>추천문구</Th>
                  <Th>완료</Th>
                  <Th>실행</Th>
                </tr>
              </thead>

              <tbody>
                {recommendedActions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border p-6 text-center font-black text-neutral-500">
                      등록된 AI 추천 액션이 없습니다.
                    </td>
                  </tr>
                ) : (
                  recommendedActions.map((a: any) => (
                    <tr key={a.id} className="hover:bg-green-50">
                      <Td strong>{a.priority_no}</Td>
                      <Td>{a.action_type || "-"}</Td>
                      <Td strong>{a.title || "-"}</Td>
                      <Td strong>{Number(a.expected_conversion || 0)}%</Td>
                      <Td strong>{Number(a.expected_revenue || 0).toLocaleString()}원</Td>
                      <Td>{a.action_message || "-"}</Td>
                      <Td>{a.is_completed ? "완료" : "대기"}</Td>
                      <Td>
                        <SendActionButton actionId={a.id} />
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">고객 활동 타임라인</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1600px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th>번호</Th>
                  <Th>일시</Th>
                  <Th>활동유형</Th>
                  <Th>활동내용</Th>
                  <Th>값</Th>
                  <Th>유입채널</Th>
                  <Th>페이지</Th>
                  <Th>메모</Th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((log: any, i: number) => (
                  <tr key={log.id} className="hover:bg-green-50">
                    <Td>{i + 1}</Td>
                    <Td>{String(log.created_at || "").slice(0, 16).replace("T", " ")}</Td>
                    <Td strong>{activityLabel(log.activity_type)}</Td>
                    <Td>{log.activity_title || "-"}</Td>
                    <Td>{log.activity_value || "-"}</Td>
                    <Td>{log.source_channel || "-"}</Td>
                    <Td>{log.source_page || "-"}</Td>
                    <Td>{log.memo || "-"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border bg-white px-4 py-3">
      <p className="text-xs font-black text-neutral-500">{title}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function Box({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="border bg-white">
      <h2 className="border-b bg-neutral-100 px-3 py-2 text-lg font-black">{title}</h2>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="w-44 border bg-neutral-50 px-3 py-2 font-black">{k}</td>
              <td className="border px-3 py-2 font-bold">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap border border-neutral-300 bg-neutral-200 px-2 py-2 text-left font-black">{children}</th>;
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <td className={`whitespace-nowrap border border-neutral-200 px-2 py-2 ${strong ? "font-black" : "font-bold text-neutral-700"}`}>{children}</td>;
}
