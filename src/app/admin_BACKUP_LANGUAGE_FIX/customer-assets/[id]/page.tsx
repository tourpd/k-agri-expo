import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function won(v: unknown) {
  return `${n(v).toLocaleString()}원`;
}

function typeLabel(v?: string | null) {
  if (v === "farmer") return "고객";
  if (v === "consumer") return "일반소비자";
  if (v === "plant_lover") return "식집사";
  if (v === "garden") return "텃밭";
  if (v === "buyer") return "바이어";
  if (v === "vendor") return "업체";
  if (v === "student") return "교육생";
  if (v === "visitor") return "방문객";
  return v || "-";
}

function stageLabel(v?: string | null) {
  if (v === "visitor") return "방문자";
  if (v === "viewer") return "관람객";
  if (v === "lead") return "관심고객";
  if (v === "consult") return "상담고객";
  if (v === "buyer") return "구매고객";
  if (v === "repeat") return "재구매고객";
  if (v === "vip") return "VIP";
  return v || "-";
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).slice(0, 10);
}

export default async function CustomerAssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: customer } = await supabase
    .from("customer_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (!customer) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
        <Link href="/admin/customer-assets" className="rounded bg-black px-4 py-3 font-black text-white">
          ← 고객 자산센터
        </Link>
        <div className="mt-4 border bg-white p-6 font-black">고객 정보를 찾을 수 없습니다.</div>
      </main>
    );
  }

  const { data: purchases } = await supabase
    .from("customer_purchase_logs")
    .select("*")
    .or(`customer_id.eq.${id},phone.eq.${customer.phone}`)
    .order("purchased_at", { ascending: false });

  const { data: activities } = await supabase
    .from("customer_activity_logs")
    .select("*")
    .or(`customer_id.eq.${id},phone.eq.${customer.phone}`)
    .order("created_at", { ascending: false });

  const purchaseLogs = purchases ?? [];
  const activityLogs = activities ?? [];
  const totalPurchase = purchaseLogs.reduce((sum: number, x: any) => sum + n(x.amount_krw), 0);
  const orderCount = purchaseLogs.length || n(customer.order_count);
  const ltv = n(customer.ltv) || Math.max(totalPurchase * 3, orderCount * 49900 * 6);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2400px]">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/admin/customer-assets" className="rounded bg-black px-4 py-3 font-black text-white">
            ← 고객 자산센터
          </Link>

          <div className="flex gap-2">
            <Link href="/admin/crm" className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">
              CRM 보기
            </Link>
            <button className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white">문자발송</button>
            <button className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white">직거래 매칭</button>
          </div>
        </div>

        <section className="mb-3 border bg-white p-4">
          <p className="text-xs font-black text-green-700">CUSTOMER ASSET CARD</p>
          <h1 className="mt-1 text-3xl font-black">{customer.customer_name} 고객 자산카드</h1>
          <p className="mt-2 text-lg font-bold text-neutral-700">
            {typeLabel(customer.customer_type)} · {stageLabel(customer.customer_stage)} · {customer.region || "-"} · {customer.phone || "-"}
          </p>
        </section>

        <section className="mb-3 grid grid-cols-7 gap-2">
          <MiniStat title="AI등급" value={customer.ai_grade || "-"} />
          <MiniStat title="CRM점수" value={`${n(customer.crm_score)}점`} />
          <MiniStat title="총구매액" value={won(totalPurchase || customer.total_purchase_amount)} />
          <MiniStat title="LTV" value={won(ltv)} />
          <MiniStat title="구매건수" value={`${orderCount}건`} />
          <MiniStat title="활동로그" value={`${activityLogs.length}건`} />
          <MiniStat title="최근구매" value={customer.last_purchase_product || "-"} />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-2">
          <Box
            title="고객 기본정보"
            rows={[
              ["고객명", customer.customer_name || "-"],
              ["전화", customer.phone || "-"],
              ["유형", typeLabel(customer.customer_type)],
              ["단계", stageLabel(customer.customer_stage)],
              ["지역", customer.region || "-"],
              ["메모", customer.memo || "-"],
            ]}
          />

          <Box
            title="관심·AI 분석"
            rows={[
              ["대표작목", customer.main_crop || "-"],
              ["대표카테고리", customer.main_category || customer.interest_category || "-"],
              ["건강관심", customer.health_interest || "-"],
              ["작물관심", customer.crop_interest || "-"],
              ["관심제품", customer.interest_products || "-"],
              ["추천상품", customer.recommended_product || "-"],
              ["추천액션", customer.recommended_action || "-"],
            ]}
          />

          <Box
            title="구매 자산"
            rows={[
              ["주문수", `${n(customer.order_count)}회`],
              ["재구매", `${n(customer.repurchase_count)}회`],
              ["최근구매", customer.last_purchase_product || "-"],
              ["최근구매일", shortDate(customer.last_purchase_date)],
              ["누적구매", won(totalPurchase || customer.total_purchase_amount)],
              ["예상 LTV", won(ltv)],
            ]}
          />

          <Box
            title="활동 자산"
            rows={[
              ["상담", `${n(customer.consult_count)}회`],
              ["교육", `${n(customer.education_count)}회`],
              ["공동구매", `${n(customer.groupbuy_count)}회`],
              ["영상시청", `${n(customer.video_watch_count)}회`],
              ["문자발송", `${n(customer.sms_sent_count)}회`],
              ["카카오발송", `${n(customer.kakao_sent_count)}회`],
            ]}
          />
        </section>

        <section className="mb-3 border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">구매이력</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1700px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th>번호</Th>
                  <Th>구매일</Th>
                  <Th>상품명</Th>
                  <Th>브랜드</Th>
                  <Th>카테고리</Th>
                  <Th>수량</Th>
                  <Th>단가</Th>
                  <Th>금액</Th>
                  <Th>구매경로</Th>
                </tr>
              </thead>
              <tbody>
                {purchaseLogs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border p-6 text-center font-black text-neutral-500">구매이력이 없습니다.</td>
                  </tr>
                ) : (
                  purchaseLogs.map((x: any, i: number) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td>{i + 1}</Td>
                      <Td>{shortDate(x.purchased_at)}</Td>
                      <Td strong>{x.product_name || "-"}</Td>
                      <Td>{x.brand_name || "-"}</Td>
                      <Td>{x.category || "-"}</Td>
                      <Td>{n(x.quantity)}</Td>
                      <Td>{won(x.unit_price_krw)}</Td>
                      <Td strong>{won(x.amount_krw)}</Td>
                      <Td>{x.order_source || "-"}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-3 border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">활동이력</div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1700px] border-collapse text-[13px]">
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
                {activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="border p-6 text-center font-black text-neutral-500">활동이력이 없습니다.</td>
                  </tr>
                ) : (
                  activityLogs.map((x: any, i: number) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td>{i + 1}</Td>
                      <Td>{String(x.created_at || "").slice(0, 16).replace("T", " ")}</Td>
                      <Td strong>{x.activity_type || "-"}</Td>
                      <Td>{x.activity_title || "-"}</Td>
                      <Td>{x.activity_value || "-"}</Td>
                      <Td>{x.source_channel || "-"}</Td>
                      <Td>{x.source_page || "-"}</Td>
                      <Td>{x.memo || "-"}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">직거래 자산</div>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className="w-52 border bg-neutral-50 px-3 py-2 font-black">고객일 경우</td>
                <td className="border px-3 py-2 font-bold">생산품 등록 · 예약주문 · 공동구매 · 직거래 매출 관리 대상</td>
              </tr>
              <tr>
                <td className="border bg-neutral-50 px-3 py-2 font-black">소비자일 경우</td>
                <td className="border px-3 py-2 font-bold">관심작목 · 관심생산자 · 예약구매 · 공동구매 참여 관리 대상</td>
              </tr>
              <tr>
                <td className="border bg-neutral-50 px-3 py-2 font-black">AI 매칭</td>
                <td className="border px-3 py-2 font-bold">{customer.main_crop || customer.crop_interest || "관심작목"} 기반 직거래 매칭 준비</td>
              </tr>
            </tbody>
          </table>
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
