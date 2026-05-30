import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    month?: string;
    q?: string;
    reason?: string;
  }>;
};

type SourceTable = "expo_orders" | "photodoctor_orders";

type ErrorOrder = {
  id: string;
  sourceTable: SourceTable;
  createdAt: string;
  brandName: string;
  productName: string;
  buyerName: string;
  buyerPhone: string;
  orderAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  vendorSettlementAmount: number;
  settlementStatus: string;
  errorReasons: string[];
};

function num(v: any) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function money(v: number) {
  return Math.round(v).toLocaleString("ko-KR");
}

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function nowKst() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

function currentMonthKey() {
  return nowKst().toISOString().slice(0, 7);
}

function validMonth(v?: string) {
  return v && /^\d{4}-\d{2}$/.test(v) ? v : currentMonthKey();
}

function monthStartIso(month: string) {
  return `${month}-01T00:00:00+09:00`;
}

function nextMonthStartIso(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));

  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
    2,
    "0"
  )}-01T00:00:00+09:00`;
}

function getAmount(row: any) {
  return (
    num(row.total_amount_krw) ||
    num(row.amount_krw) ||
    num(row.sale_price_krw) ||
    num(row.price_krw) ||
    num(row.order_amount_krw) ||
    num(row.total_price_krw) ||
    num(row.amount) ||
    num(row.price) ||
    num(row.total_price)
  );
}

function getBrandName(row: any, fallback = "") {
  return (
    row.brand_name ||
    row.vendor_name ||
    row.company_name ||
    row.brand_title ||
    row.brand?.name ||
    row.expo_brands?.name ||
    row.vendor?.company_name ||
    row.vendors?.company_name ||
    fallback ||
    ""
  );
}

function getProductName(row: any) {
  return (
    row.product_name ||
    row.product_title ||
    row.item_name ||
    row.title ||
    row.product?.name ||
    row.products?.name ||
    ""
  );
}

function getBuyerName(row: any) {
  return (
    row.buyer_name ||
    row.applicant_name ||
    row.farmer_name ||
    row.name ||
    row.customer_name ||
    ""
  );
}

function getBuyerPhone(row: any) {
  return (
    row.buyer_phone ||
    row.phone ||
    row.farmer_phone ||
    row.customer_phone ||
    ""
  );
}

function normalizeRate(row: any, fallback: number) {
  const raw = num(row.platform_fee_rate ?? row.commission_rate);

  if (!raw) return fallback;
  if (raw > 0 && raw <= 1) return raw;
  if (raw > 1 && raw <= 100) return raw / 100;

  return fallback;
}

function buildErrorReasons({
  brandName,
  productName,
  buyerName,
  buyerPhone,
  orderAmount,
  platformFeeRate,
}: {
  brandName: string;
  productName: string;
  buyerName: string;
  buyerPhone: string;
  orderAmount: number;
  platformFeeRate: number;
}) {
  const reasons: string[] = [];

  if (!brandName || brandName === "-") reasons.push("업체명 없음");
  if (!productName || productName === "상품명 없음") reasons.push("상품명 없음");
  if (orderAmount <= 0) reasons.push("주문금액 없음");
  if (!buyerName || buyerName === "-") reasons.push("구매자명 없음");
  if (!buyerPhone || buyerPhone === "-") reasons.push("연락처 없음");
  if (platformFeeRate <= 0 || platformFeeRate > 1) reasons.push("수수료율 이상");

  return reasons;
}

function normalizeExpo(row: any): ErrorOrder {
  const orderAmount = getAmount(row);
  const orderType = row.order_type || row.commission_type || "general";

  const fallbackRate =
    orderType === "photodoctor" ? 0.12 : orderType === "live" ? 0.3 : 0.18;

  const platformFeeRate = normalizeRate(row, fallbackRate);
  const platformFeeAmount =
    num(row.platform_fee_amount) ||
    num(row.platform_fee_amount_krw) ||
    Math.round(orderAmount * platformFeeRate);

  const vendorSettlementAmount =
    num(row.vendor_settlement_amount) ||
    num(row.vendor_settlement_amount_krw) ||
    Math.max(orderAmount - platformFeeAmount, 0);

  const brandName = getBrandName(row, "-");
  const productName = getProductName(row) || "상품명 없음";
  const buyerName = getBuyerName(row) || "-";
  const buyerPhone = getBuyerPhone(row) || "-";

  return {
    id: String(row.id),
    sourceTable: "expo_orders",
    createdAt: row.created_at || row.ordered_at || "",
    brandName,
    productName,
    buyerName,
    buyerPhone,
    orderAmount,
    platformFeeRate,
    platformFeeAmount,
    vendorSettlementAmount,
    settlementStatus: row.settlement_status || "pending",
    errorReasons: buildErrorReasons({
      brandName,
      productName,
      buyerName,
      buyerPhone,
      orderAmount,
      platformFeeRate,
    }),
  };
}

function normalizePhoto(row: any): ErrorOrder {
  const orderAmount = getAmount(row);
  const platformFeeRate = normalizeRate(row, 0.12);

  const platformFeeAmount =
    num(row.platform_fee_amount) ||
    num(row.platform_fee_amount_krw) ||
    Math.round(orderAmount * platformFeeRate);

  const vendorSettlementAmount =
    num(row.vendor_settlement_amount) ||
    num(row.vendor_settlement_amount_krw) ||
    Math.max(orderAmount - platformFeeAmount, 0);

  const brandName = getBrandName(row, "포토닥터");
  const productName = getProductName(row) || "상품명 없음";
  const buyerName = getBuyerName(row) || "-";
  const buyerPhone = getBuyerPhone(row) || "-";

  return {
    id: String(row.id),
    sourceTable: "photodoctor_orders",
    createdAt: row.created_at || row.ordered_at || "",
    brandName,
    productName,
    buyerName,
    buyerPhone,
    orderAmount,
    platformFeeRate,
    platformFeeAmount,
    vendorSettlementAmount,
    settlementStatus: row.settlement_status || "pending",
    errorReasons: buildErrorReasons({
      brandName,
      productName,
      buyerName,
      buyerPhone,
      orderAmount,
      platformFeeRate,
    }),
  };
}

function LinkButton({
  href,
  children,
  tone = "white",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "white" | "blue" | "red" | "dark";
}) {
  const cls =
    tone === "blue"
      ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
      : tone === "red"
        ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
        : tone === "dark"
          ? "bg-slate-950 text-white border-slate-950 hover:bg-slate-800"
          : "bg-white text-slate-950 border-slate-300 hover:bg-slate-100";

  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center justify-center rounded border px-4 text-sm font-black ${cls}`}
    >
      {children}
    </Link>
  );
}

export default async function SettlementErrorsPage({ searchParams }: PageProps) {
  const sp = (await searchParams) || {};
  const month = validMonth(sp.month);
  const q = String(sp.q || "").trim().toLowerCase();
  const reason = String(sp.reason || "").trim();

  const supabase = createSupabaseAdminClient();

  const [expoRes, photoRes] = await Promise.all([
    supabase
      .from("expo_orders")
      .select("*")
      .gte("created_at", monthStartIso(month))
      .lt("created_at", nextMonthStartIso(month))
      .order("created_at", { ascending: false })
      .limit(10000),

    supabase
      .from("photodoctor_orders")
      .select("*")
      .gte("created_at", monthStartIso(month))
      .lt("created_at", nextMonthStartIso(month))
      .order("created_at", { ascending: false })
      .limit(10000),
  ]);

  let errors = [
    ...(expoRes.data || []).map(normalizeExpo),
    ...(photoRes.data || []).map(normalizePhoto),
  ].filter((o) => o.errorReasons.length > 0);

  if (q) {
    errors = errors.filter((o) =>
      [
        o.id,
        o.sourceTable,
        o.brandName,
        o.productName,
        o.buyerName,
        o.buyerPhone,
        o.errorReasons.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  if (reason) {
    errors = errors.filter((o) => o.errorReasons.includes(reason));
  }

  const reasonCount = {
    업체명없음: errors.filter((o) => o.errorReasons.includes("업체명 없음")).length,
    상품명없음: errors.filter((o) => o.errorReasons.includes("상품명 없음")).length,
    주문금액없음: errors.filter((o) => o.errorReasons.includes("주문금액 없음")).length,
    연락처없음: errors.filter((o) => o.errorReasons.includes("연락처 없음")).length,
  };

  const th =
    "border border-red-200 bg-red-100 px-3 py-2 font-black text-slate-950";
  const td = "border border-red-100 px-3 py-2 text-slate-950";

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <header className="flex items-end justify-between border-b-2 border-slate-300 pb-4">
          <div>
            <h1 className="text-3xl font-black">정산 오류정리</h1>
            <p className="mt-2 text-sm font-bold text-slate-700">
              상품명·업체명·주문금액·연락처가 빠진 주문을 정산 전에 분리해서 확인합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <LinkButton href={`/admin/settlements?month=${month}`}>
              정산센터
            </LinkButton>
            <LinkButton href={`/admin/revenue/vendors?month=${month}`}>
              업체별 현황
            </LinkButton>
            <LinkButton href={`/admin/revenue/orders?month=${month}`}>
              수익원장
            </LinkButton>
            <LinkButton href="/admin/revenue" tone="dark">
              수익센터
            </LinkButton>
          </div>
        </header>

        <form
          action="/admin/settlements/errors"
          className="flex flex-wrap items-center gap-2 rounded border border-slate-300 bg-white p-3"
        >
          <input
            name="month"
            defaultValue={month}
            className="h-10 w-32 rounded border border-slate-300 bg-white px-3 text-sm font-black text-slate-950"
          />

          <input
            name="q"
            defaultValue={q}
            placeholder="업체명 / 상품명 / 구매자 / 연락처 검색"
            className="h-10 w-80 rounded border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950"
          />

          <select
            name="reason"
            defaultValue={reason}
            className="h-10 rounded border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950"
          >
            <option value="">전체 오류</option>
            <option value="업체명 없음">업체명 없음</option>
            <option value="상품명 없음">상품명 없음</option>
            <option value="주문금액 없음">주문금액 없음</option>
            <option value="연락처 없음">연락처 없음</option>
          </select>

          <button className="h-10 rounded bg-slate-950 px-6 text-sm font-black text-white">
            조회
          </button>
        </form>

        <div className="overflow-x-auto rounded border border-red-300 bg-white">
          <table className="w-full min-w-[1300px] border-collapse text-sm">
            <thead>
              <tr>
                <th className={`${th} text-left`}>구분</th>
                <th className={`${th} text-right`}>오류 주문</th>
                <th className={`${th} text-right`}>업체명 없음</th>
                <th className={`${th} text-right`}>상품명 없음</th>
                <th className={`${th} text-right`}>주문금액 없음</th>
                <th className={`${th} text-right`}>연락처 없음</th>
                <th className={`${th} text-left`}>처리 방향</th>
              </tr>
            </thead>

            <tbody>
              <tr className="bg-red-50 font-black">
                <td className={td}>{month} 오류 합계</td>
                <td className={`${td} text-right text-red-700`}>
                  {errors.length}
                </td>
                <td className={`${td} text-right text-red-700`}>
                  {reasonCount.업체명없음}
                </td>
                <td className={`${td} text-right text-red-700`}>
                  {reasonCount.상품명없음}
                </td>
                <td className={`${td} text-right text-red-700`}>
                  {reasonCount.주문금액없음}
                </td>
                <td className={`${td} text-right text-red-700`}>
                  {reasonCount.연락처없음}
                </td>
                <td className={td}>
                  수정 버튼에서 누락값 보정 후 정산센터에서 다시 확인
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded border border-red-300 bg-white">
          <table className="w-full min-w-[1800px] border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className={`${th} text-left`}>상태</th>
                <th className={`${th} text-left`}>일시</th>
                <th className={`${th} text-left`}>출처</th>
                <th className={`${th} text-left`}>업체명</th>
                <th className={`${th} text-left`}>상품명</th>
                <th className={`${th} text-left`}>구매자</th>
                <th className={`${th} text-left`}>연락처</th>
                <th className={`${th} text-right`}>주문금액</th>
                <th className={`${th} text-right`}>수수료율</th>
                <th className={`${th} text-right`}>플랫폼수익</th>
                <th className={`${th} text-right`}>업체정산</th>
                <th className={`${th} text-left`}>오류 사유</th>
                <th className={`${th} text-center`}>관리</th>
              </tr>
            </thead>

            <tbody>
              {errors.map((o) => (
                <tr key={`${o.sourceTable}-${o.id}`} className="hover:bg-yellow-50">
                  <td className={`${td} font-black text-red-700`}>오류</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {o.createdAt ? o.createdAt.slice(0, 10) : "-"}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{o.sourceTable}</td>
                  <td className={`${td} font-black`}>{o.brandName || "-"}</td>
                  <td className={`${td} font-black`}>{o.productName || "-"}</td>
                  <td className={td}>{o.buyerName}</td>
                  <td className={td}>{o.buyerPhone}</td>
                  <td className={`${td} text-right font-bold`}>
                    {money(o.orderAmount)}
                  </td>
                  <td className={`${td} text-right`}>
                    {pct(o.platformFeeRate)}
                  </td>
                  <td className={`${td} text-right font-black text-blue-700`}>
                    {money(o.platformFeeAmount)}
                  </td>
                  <td className={`${td} text-right font-black text-emerald-700`}>
                    {money(o.vendorSettlementAmount)}
                  </td>
                  <td className={`${td} font-black text-red-700`}>
                    {o.errorReasons.join(", ")}
                  </td>

                  <td className="border border-red-100 px-2 py-1 text-center">
                    <div className="flex justify-center gap-2">
                      <LinkButton
                        href={`/admin/settlements/errors/${encodeURIComponent(
                          o.id
                        )}?source=${o.sourceTable}&month=${month}`}
                        tone="red"
                      >
                        수정
                      </LinkButton>

                      <LinkButton
                        href={`/admin/revenue/orders?month=${month}&q=${encodeURIComponent(
                          o.id
                        )}`}
                      >
                        원장
                      </LinkButton>
                    </div>
                  </td>
                </tr>
              ))}

              {errors.length === 0 && (
                <tr>
                  <td
                    colSpan={13}
                    className="border border-red-100 p-10 text-center font-black text-slate-700"
                  >
                    오류 주문이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}