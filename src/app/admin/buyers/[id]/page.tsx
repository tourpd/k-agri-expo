import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import VerifyBuyerButton from "./VerifyBuyerButton";

export const dynamic = "force-dynamic";

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function won(v: unknown) {
  return `${n(v).toLocaleString()}원`;
}

function gradeClass(g?: string | null) {
  if (g === "A+") return "bg-purple-700 text-white";
  if (g === "A") return "bg-green-700 text-white";
  if (g === "B") return "bg-blue-700 text-white";
  if (g === "D") return "bg-red-700 text-white";
  return "bg-neutral-400 text-white";
}

export default async function BuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: buyer } = await supabase
    .from("agri_buyers")
    .select("*")
    .eq("id", id)
    .single();

  if (!buyer) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
        <Link href="/admin/buyers" className="rounded bg-black px-4 py-3 font-black text-white no-underline">
          ← 바이어센터
        </Link>
        <div className="mt-4 border bg-white p-6 font-black">바이어를 찾을 수 없습니다.</div>
      </main>
    );
  }

  const { data: offers } = await supabase
    .from("agri_trade_offers")
    .select("*")
    .eq("buyer_company_name", buyer.company_name)
    .order("created_at", { ascending: false })
    .limit(20);

  const offerItems = offers || [];

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2200px]">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/admin/buyers" className="rounded bg-black px-4 py-3 font-black text-white no-underline">
            ← 바이어센터
          </Link>

          <div className="flex items-center gap-2">
            <VerifyBuyerButton buyerId={buyer.id} />
            <Link href="/admin/agri-assets" className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white no-underline">
              농산물 자산 보기
            </Link>
            <Link href="/admin/trade-offers" className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white no-underline">
              거래제안센터
            </Link>
          </div>
        </div>

        <section className="mb-3 border bg-white p-4">
          <p className="text-xs font-black text-green-700">K-AGRI VERIFIED BUYER CARD</p>
          <div className="mt-2 flex items-center gap-3">
            <span className={`inline-flex min-w-16 justify-center rounded px-4 py-2 text-lg font-black ${gradeClass(buyer.buyer_grade)}`}>
              {buyer.buyer_grade || "C"}
            </span>
            <h1 className="text-4xl font-black">{buyer.company_name || "바이어 상세"}</h1>
          </div>
          <p className="mt-2 text-lg font-bold text-neutral-700">
            {buyer.buyer_type || "-"} · {buyer.region || "-"} · 관심품목: {buyer.interest_products || "-"}
          </p>
        </section>

        <section className="mb-3 grid grid-cols-6 gap-2">
          <Mini title="등급" value={buyer.buyer_grade || "C"} />
          <Mini title="실거래" value={`${n(buyer.trade_count)}회`} />
          <Mini title="농민평점" value={`${n(buyer.farmer_rating).toFixed(1)}점`} />
          <Mini title="결제점수" value={`${n(buyer.payment_score)}점`} />
          <Mini title="AI점수" value={`${n(buyer.ai_score)}점`} />
          <Mini title="예상구매액" value={won(buyer.expected_purchase_amount)} />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-2">
          <Box
            title="바이어 기본정보"
            rows={[
              ["회사명", buyer.company_name || "-"],
              ["담당자", buyer.contact_name || "-"],
              ["전화", buyer.phone || "-"],
              ["구분", buyer.buyer_type || "-"],
              ["지역", buyer.region || "-"],
              ["상태", buyer.status || "-"],
            ]}
          />

          <Box
            title="검증 정보"
            rows={[
              ["등급", buyer.buyer_grade || "C"],
              ["검증자", buyer.verified_by || "-"],
              ["검증일", buyer.verification_date ? String(buyer.verification_date).slice(0, 10) : "-"],
              ["실거래", `${n(buyer.trade_count)}회`],
              ["농민평점", `${n(buyer.farmer_rating).toFixed(1)}점`],
              ["결제점수", `${n(buyer.payment_score)}점`],
            ]}
          />

          <Box
            title="구매 성향"
            rows={[
              ["관심품목", buyer.interest_products || "-"],
              ["월 구매량", `${n(buyer.monthly_purchase_qty).toLocaleString()}`],
              ["예상구매액", won(buyer.expected_purchase_amount)],
              ["AI점수", `${n(buyer.ai_score)}점`],
              ["메모", buyer.memo || "-"],
            ]}
          />

          <Box
            title="다음 액션"
            rows={[
              ["1단계", "농산물 자산에서 이 바이어에게 거래제안 생성"],
              ["2단계", "거래제안 열람/관심 확인"],
              ["3단계", "화상상담 예약"],
              ["4단계", "계약전환 및 정산 연결"],
            ]}
          />
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            이 바이어에게 발송된 거래제안 {offerItems.length}건
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-200">
                <th className="border px-3 py-2 text-left">품목</th>
                <th className="border px-3 py-2 text-left">판매자</th>
                <th className="border px-3 py-2 text-left">수량</th>
                <th className="border px-3 py-2 text-left">금액</th>
                <th className="border px-3 py-2 text-left">상태</th>
                <th className="border px-3 py-2 text-left">관리</th>
              </tr>
            </thead>
            <tbody>
              {offerItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border p-6 text-center font-black text-neutral-500">
                    아직 이 바이어에게 보낸 거래제안이 없습니다.
                  </td>
                </tr>
              ) : (
                offerItems.map((x: any) => (
                  <tr key={x.id}>
                    <td className="border px-3 py-2 font-black">{x.product_name || "-"}</td>
                    <td className="border px-3 py-2 font-bold">{x.seller_name || "-"}</td>
                    <td className="border px-3 py-2 font-bold">{n(x.offer_quantity).toLocaleString()} {x.unit || ""}</td>
                    <td className="border px-3 py-2 font-black">{won(x.offer_amount)}</td>
                    <td className="border px-3 py-2 font-bold">{x.status || "-"}</td>
                    <td className="border px-3 py-2">
                      <Link href={`/admin/trade-offers/${x.id}`} className="rounded bg-green-700 px-3 py-1 text-xs font-black text-white no-underline">
                        보기
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

function Mini({ title, value }: { title: string; value: string }) {
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
