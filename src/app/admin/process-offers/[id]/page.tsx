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

function percent(v: unknown) {
  return `${Math.round(n(v) * 100)}%`;
}

function statusLabel(v?: string | null) {
  if (v === "draft") return "초안";
  if (v === "sent") return "제안발송";
  if (v === "accepted") return "수락";
  if (v === "processing") return "가공중";
  if (v === "completed") return "가공완료";
  if (v === "rejected") return "거절";
  return v || "-";
}

export default async function ProcessOfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: offer } = await supabase
    .from("agri_process_offers")
    .select("*")
    .eq("id", id)
    .single();

  if (!offer) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
        <Link href="/admin/process-offers" className="rounded bg-black px-4 py-3 font-black text-white">
          ← 가공제안센터
        </Link>
        <div className="mt-4 border bg-white p-6 font-black">가공제안을 찾을 수 없습니다.</div>
      </main>
    );
  }

  const rawValue = n(offer.raw_quantity) * 4500 * 1000;
  const processFee = n(offer.expected_processing_fee);
  const salesAmount = n(offer.expected_sales_amount);
  const addedRevenue = salesAmount - rawValue;
  const netAddedProfit = salesAmount - rawValue - processFee;

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2200px]">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/admin/process-offers" className="rounded bg-black px-4 py-3 font-black text-white">
            ← 가공제안센터
          </Link>

          <div className="flex gap-2">
            <button className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white">제안발송</button>
            <button className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white">가공수락</button>
            <button className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">거래제안 생성</button>
          </div>
        </div>

        <section className="mb-3 border bg-white p-4">
          <p className="text-xs font-black text-green-700">PROCESS OFFER CARD</p>
          <h1 className="mt-1 text-3xl font-black">{offer.title || "가공제안 상세"}</h1>
          <p className="mt-2 text-lg font-bold text-neutral-700">
            {offer.product_name || "-"} · {offer.owner_name || "-"} → {offer.processor_company_name || "-"}
          </p>
        </section>

        <section className="mb-3 grid grid-cols-6 gap-2">
          <Mini title="상태" value={statusLabel(offer.status)} />
          <Mini title="원물수량" value={`${n(offer.raw_quantity).toLocaleString()}${offer.raw_unit || ""}`} />
          <Mini title="예상수율" value={percent(offer.expected_yield_rate)} />
          <Mini title="예상생산" value={`${n(offer.expected_output_quantity).toLocaleString()}${offer.output_unit || ""}`} />
          <Mini title="예상가공비" value={won(processFee)} />
          <Mini title="예상판매액" value={won(salesAmount)} />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-3">
          <Box
            title="원물 정보"
            rows={[
              ["품목", offer.product_name || "-"],
              ["보유자", offer.owner_name || "-"],
              ["원물수량", `${n(offer.raw_quantity).toLocaleString()} ${offer.raw_unit || ""}`],
              ["원물기준가", "4,500원/kg"],
              ["원물판매 예상", won(rawValue)],
            ]}
          />

          <Box
            title="가공 계획"
            rows={[
              ["가공업체", offer.processor_company_name || "-"],
              ["담당자", offer.processor_contact_name || "-"],
              ["전화", offer.processor_phone || "-"],
              ["가공방식", offer.process_type || "-"],
              ["예상수율", percent(offer.expected_yield_rate)],
              ["예상생산", `${n(offer.expected_output_quantity).toLocaleString()} ${offer.output_unit || ""}`],
              ["예상가공비", won(processFee)],
            ]}
          />

          <Box
            title="수익 분석"
            rows={[
              ["원물판매", won(rawValue)],
              ["가공판매 예상", won(salesAmount)],
              ["매출 증가", won(addedRevenue)],
              ["가공비 차감", won(processFee)],
              ["추가 예상이익", won(netAddedProfit)],
            ]}
          />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-2">
          <Box
            title="AI 가공 추천"
            rows={[
              ["추천 1", "깐마늘 / 빠른 현금화 / 중간 수익"],
              ["추천 2", "냉동마늘 / 장기보관 / 식자재 납품"],
              ["추천 3", "흑마늘 / 고부가가치 / 건강식품 연계"],
              ["추천 4", "마늘분말 / 저장성 높음 / 가공식품 원료"],
            ]}
          />

          <Box
            title="다음 액션"
            rows={[
              ["1단계", "가공업체에 제안 발송"],
              ["2단계", "가공비·수율·납기 협의"],
              ["3단계", "가공완료 후 바이어센터 연결"],
              ["4단계", "거래제안 생성 후 정산센터 연결"],
            ]}
          />
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">가공 수익 비교</div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-200">
                <th className="border px-3 py-2 text-left">구분</th>
                <th className="border px-3 py-2 text-left">금액</th>
                <th className="border px-3 py-2 text-left">설명</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2 font-black">원물판매</td>
                <td className="border px-3 py-2 font-black">{won(rawValue)}</td>
                <td className="border px-3 py-2 font-bold">원물 그대로 판매할 경우</td>
              </tr>
              <tr>
                <td className="border px-3 py-2 font-black">가공판매</td>
                <td className="border px-3 py-2 font-black">{won(salesAmount)}</td>
                <td className="border px-3 py-2 font-bold">가공 후 판매 예상금액</td>
              </tr>
              <tr>
                <td className="border px-3 py-2 font-black">가공비</td>
                <td className="border px-3 py-2 font-black">{won(processFee)}</td>
                <td className="border px-3 py-2 font-bold">가공업체 지급 예상비용</td>
              </tr>
              <tr>
                <td className="border px-3 py-2 font-black">추가 예상이익</td>
                <td className="border px-3 py-2 font-black text-green-700">{won(netAddedProfit)}</td>
                <td className="border px-3 py-2 font-bold">가공으로 추가 확보 가능한 예상이익</td>
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
