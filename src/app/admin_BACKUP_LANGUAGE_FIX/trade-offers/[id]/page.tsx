import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import ContractButton from "./ContractButton";

export const dynamic = "force-dynamic";

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function won(v: unknown) {
  return `${n(v).toLocaleString()}원`;
}

function statusLabel(v?: string | null) {
  if (v === "sent") return "발송";
  if (v === "opened") return "열람";
  if (v === "interested") return "관심";
  if (v === "negotiating") return "협상중";
  if (v === "contracted") return "계약완료";
  if (v === "closed") return "종료";
  return v || "-";
}

export default async function TradeOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: offer } = await supabase
    .from("agri_trade_offers")
    .select("*")
    .eq("id", id)
    .single();

  if (!offer) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
        <Link href="/admin/trade-offers" className="rounded bg-black px-4 py-3 font-black text-white">
          ← 거래제안센터
        </Link>
        <div className="mt-4 border bg-white p-6 font-black">거래제안을 찾을 수 없습니다.</div>
      </main>
    );
  }

  const platformFeeRate = 0.03;
  const platformFee = n(offer.offer_amount) * platformFeeRate;
  const sellerSettlement = n(offer.offer_amount) - platformFee;

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2200px]">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/admin/trade-offers" className="rounded bg-black px-4 py-3 font-black text-white">
            ← 거래제안센터
          </Link>

          <div className="flex gap-2">
            <button className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white">문자발송</button>
            <ContractButton offerId={offer.id} />
            <button className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">정산생성</button>
          </div>
        </div>

        <section className="mb-3 border bg-white p-4">
          <p className="text-xs font-black text-green-700">TRADE OFFER CARD</p>
          <h1 className="mt-1 text-3xl font-black">{offer.title || "거래제안 상세"}</h1>
          <p className="mt-2 text-lg font-bold text-neutral-700">
            {offer.product_name || "-"} · {offer.seller_name || "-"} → {offer.buyer_company_name || "-"}
          </p>
        </section>

        <section className="mb-3 grid grid-cols-6 gap-2">
          <Mini title="상태" value={statusLabel(offer.status)} />
          <Mini title="제안수량" value={`${n(offer.offer_quantity).toLocaleString()}${offer.unit || ""}`} />
          <Mini title="제안가" value={won(offer.offer_price)} />
          <Mini title="제안금액" value={won(offer.offer_amount)} />
          <Mini title="예상수수료 3%" value={won(platformFee)} />
          <Mini title="판매자정산" value={won(sellerSettlement)} />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-2">
          <Box
            title="거래 기본정보"
            rows={[
              ["품목", offer.product_name || "-"],
              ["판매자", offer.seller_name || "-"],
              ["바이어", offer.buyer_company_name || "-"],
              ["담당자", offer.buyer_contact_name || "-"],
              ["전화", offer.buyer_phone || "-"],
              ["상태", statusLabel(offer.status)],
            ]}
          />

          <Box
            title="제안 금액"
            rows={[
              ["수량", `${n(offer.offer_quantity).toLocaleString()} ${offer.unit || ""}`],
              ["단가", won(offer.offer_price)],
              ["총 제안금액", won(offer.offer_amount)],
              ["플랫폼 수수료 3%", won(platformFee)],
              ["판매자 정산예정", won(sellerSettlement)],
            ]}
          />

          <Box
            title="제안 메시지"
            rows={[
              ["제목", offer.title || "-"],
              ["내용", offer.message || "-"],
              ["발송일", String(offer.sent_at || offer.created_at || "").slice(0, 10)],
              ["메모", offer.memo || "-"],
            ]}
          />

          <Box
            title="다음 액션"
            rows={[
              ["1단계", "바이어 열람 확인"],
              ["2단계", "관심 응답 시 협상중 전환"],
              ["3단계", "계약완료 시 거래센터 생성"],
              ["4단계", "정산센터에서 수수료·정산금 관리"],
            ]}
          />
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">거래 진행 단계</div>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr>
                <td className="w-52 border bg-neutral-50 px-3 py-2 font-black">발송</td>
                <td className="border px-3 py-2 font-bold">거래 제안이 바이어에게 발송된 상태</td>
              </tr>
              <tr>
                <td className="border bg-neutral-50 px-3 py-2 font-black">열람</td>
                <td className="border px-3 py-2 font-bold">바이어가 제안을 확인한 상태</td>
              </tr>
              <tr>
                <td className="border bg-neutral-50 px-3 py-2 font-black">관심</td>
                <td className="border px-3 py-2 font-bold">바이어가 구매 의사를 보인 상태</td>
              </tr>
              <tr>
                <td className="border bg-neutral-50 px-3 py-2 font-black">협상중</td>
                <td className="border px-3 py-2 font-bold">가격·수량·출하조건 협의 상태</td>
              </tr>
              <tr>
                <td className="border bg-neutral-50 px-3 py-2 font-black">계약완료</td>
                <td className="border px-3 py-2 font-bold">거래센터와 정산센터로 넘길 상태</td>
              </tr>
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
