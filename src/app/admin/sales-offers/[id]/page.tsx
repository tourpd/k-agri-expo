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

function statusLabel(v?: string | null) {
  if (v === "draft") return "초안";
  if (v === "sent") return "제안발송";
  if (v === "opened") return "열람";
  if (v === "interested") return "관심";
  if (v === "negotiating") return "협상중";
  if (v === "contracted") return "계약완료";
  if (v === "closed") return "종료";
  return v || "-";
}

export default async function SalesOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: offer } = await supabase
    .from("agri_sales_offers")
    .select("*")
    .eq("id", id)
    .single();

  if (!offer) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
        <Link href="/admin/sales-offers" className="rounded bg-black px-4 py-3 font-black text-white">
          ← 판매제안센터
        </Link>
        <div className="mt-4 border bg-white p-6 font-black">판매제안을 찾을 수 없습니다.</div>
      </main>
    );
  }

  const platformFeeRate = 0.03;
  const platformFee = Math.round(n(offer.offer_amount) * platformFeeRate);
  const settlementAmount = n(offer.offer_amount) - platformFee;

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2200px]">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/admin/sales-offers" className="rounded bg-black px-4 py-3 font-black text-white">
            ← 판매제안센터
          </Link>

          <div className="flex gap-2">
            <button className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white">제안발송</button>
            <button className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white">계약전환</button>
            <button className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">정산생성</button>
          </div>
        </div>

        <section className="mb-3 border bg-white p-4">
          <p className="text-xs font-black text-green-700">SALES OFFER CARD</p>
          <h1 className="mt-1 text-3xl font-black">{offer.title || "판매제안 상세"}</h1>
          <p className="mt-2 text-lg font-bold text-neutral-700">
            {offer.processed_product_name || "-"} · {offer.owner_name || "-"} → {offer.sales_company_name || "-"}
          </p>
        </section>

        <section className="mb-3 grid grid-cols-6 gap-2">
          <Mini title="상태" value={statusLabel(offer.status)} />
          <Mini title="원물" value={offer.product_name || "-"} />
          <Mini title="가공품" value={offer.processed_product_name || "-"} />
          <Mini title="수량" value={`${n(offer.offer_quantity).toLocaleString()}${offer.offer_unit || ""}`} />
          <Mini title="단가" value={won(offer.offer_price)} />
          <Mini title="제안금액" value={won(offer.offer_amount)} />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-2">
          <Box
            title="판매제안 기본정보"
            rows={[
              ["원물", offer.product_name || "-"],
              ["가공품", offer.processed_product_name || "-"],
              ["보유자", offer.owner_name || "-"],
              ["판매처", offer.sales_company_name || "-"],
              ["담당자", offer.sales_contact_name || "-"],
              ["전화", offer.sales_phone || "-"],
              ["상태", statusLabel(offer.status)],
            ]}
          />

          <Box
            title="금액 정보"
            rows={[
              ["제안수량", `${n(offer.offer_quantity).toLocaleString()} ${offer.offer_unit || ""}`],
              ["제안단가", won(offer.offer_price)],
              ["총 제안금액", won(offer.offer_amount)],
              ["플랫폼 수수료 3%", won(platformFee)],
              ["정산예상", won(settlementAmount)],
            ]}
          />

          <Box
            title="제안 메시지"
            rows={[
              ["제목", offer.title || "-"],
              ["메시지", offer.message || "-"],
              ["메모", offer.memo || "-"],
              ["등록일", String(offer.created_at || "").slice(0, 10)],
            ]}
          />

          <Box
            title="다음 액션"
            rows={[
              ["1단계", "판매처에 제안 발송"],
              ["2단계", "열람·관심 여부 확인"],
              ["3단계", "가격·수량 협상"],
              ["4단계", "계약완료 후 정산센터 연결"],
            ]}
          />
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
