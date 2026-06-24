import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { payVendorSettlement } from "../actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ brand: string }>;
  searchParams?: Promise<{ month?: string }>;
};

type SettlementOrder = {
  id: string;
  sourceTable: "expo_orders" | "photodoctor_orders";
  createdAt: string;
  productName: string;
  buyerName: string;
  buyerPhone: string;
  orderAmount: number;
  platformFeeAmount: number;
  vendorSettlementAmount: number;
  settlementStatus: string;
};

function num(v: any) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function money(v: number) {
  return Math.round(v).toLocaleString("ko-KR");
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
    num(row.order_amount_krw)
  );
}

function getBrandName(row: any, fallback = "") {
  return (
    row.brand_name ||
    row.vendor_name ||
    row.company_name ||
    row.brand_title ||
    fallback
  );
}

function getProductName(row: any) {
  return row.product_name || row.product_title || row.item_name || row.title || "-";
}

function normalizeRate(row: any, fallback: number) {
  const raw = num(row.platform_fee_rate);

  if (!raw) return fallback;
  if (raw > 0 && raw <= 1) return raw;
  if (raw > 1 && raw <= 100) return raw / 100;

  return fallback;
}

function normalizeExpo(row: any): SettlementOrder {
  const orderAmount = getAmount(row);
  const orderType = row.order_type || row.commission_type || "general";
  const fallbackRate =
    orderType === "photodoctor" ? 0.5 : orderType === "live" ? 0.3 : 0.18;

  const platformFeeRate = normalizeRate(row, fallbackRate);
  const platformFeeAmount =
    num(row.platform_fee_amount) || Math.round(orderAmount * platformFeeRate);
  const vendorSettlementAmount =
    num(row.vendor_settlement_amount) ||
    Math.max(orderAmount - platformFeeAmount, 0);

  return {
    id: String(row.id),
    sourceTable: "expo_orders",
    createdAt: row.created_at || "",
    productName: getProductName(row),
    buyerName: row.buyer_name || row.applicant_name || "-",
    buyerPhone: row.buyer_phone || row.phone || "-",
    orderAmount,
    platformFeeAmount,
    vendorSettlementAmount,
    settlementStatus: row.settlement_status || "pending",
  };
}

function normalizePhoto(row: any): SettlementOrder {
  const orderAmount = getAmount(row);
  const platformFeeRate = normalizeRate(row, 0.5);
  const platformFeeAmount =
    num(row.platform_fee_amount) || Math.round(orderAmount * platformFeeRate);
  const vendorSettlementAmount =
    num(row.vendor_settlement_amount) ||
    Math.max(orderAmount - platformFeeAmount, 0);

  return {
    id: String(row.id),
    sourceTable: "photodoctor_orders",
    createdAt: row.created_at || "",
    productName: getProductName(row),
    buyerName: row.buyer_name || row.applicant_name || "-",
    buyerPhone: row.buyer_phone || row.phone || "-",
    orderAmount,
    platformFeeAmount,
    vendorSettlementAmount,
    settlementStatus: row.settlement_status || "pending",
  };
}

function sum<T>(list: T[], pick: (item: T) => number) {
  return list.reduce((acc, item) => acc + pick(item), 0);
}

function LinkButton({
  href,
  children,
  tone = "white",
}: {
  href: string;
  children: React.ReactNode;
  tone?: "white" | "blue" | "dark";
}) {
  const cls =
    tone === "blue"
      ? "bg-blue-600 text-white border-blue-600"
      : tone === "dark"
        ? "bg-slate-950 text-white border-slate-950"
        : "bg-white text-slate-900 border-slate-300";

  return (
    <Link
      href={href}
      className={`inline-flex h-8 items-center justify-center rounded border px-3 text-xs font-black ${cls}`}
    >
      {children}
    </Link>
  );
}

export default async function SettlementBrandDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { brand } = await params;
  const sp = (await searchParams) || {};

  const brandName = decodeURIComponent(brand);
  const month = validMonth(sp.month);

  const supabase = createSupabaseAdminClient();

  const [expoRes, photoRes, logsRes] = await Promise.all([
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
    supabase
      .from("settlement_logs")
      .select("*")
      .eq("brand_name", brandName)
      .eq("month", month)
      .order("paid_at", { ascending: false })
      .limit(100),
  ]);

  const expoOrders = (expoRes.data || [])
    .filter((row: any) => getBrandName(row, "-") === brandName)
    .map(normalizeExpo);

  const photoOrders = (photoRes.data || [])
    .filter((row: any) => getBrandName(row, "포토닥터") === brandName)
    .map(normalizePhoto);

  const orders = [...expoOrders, ...photoOrders].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt))
  );

  const pendingOrders = orders.filter((o) => o.settlementStatus !== "paid");
  const paidOrders = orders.filter((o) => o.settlementStatus === "paid");

  const totalSales = sum(orders, (o) => o.orderAmount);
  const totalRevenue = sum(orders, (o) => o.platformFeeAmount);
  const pendingAmount = sum(pendingOrders, (o) => o.vendorSettlementAmount);
  const paidAmount = sum(paidOrders, (o) => o.vendorSettlementAmount);
  const totalSettlement = sum(orders, (o) => o.vendorSettlementAmount);

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950">
      <div className="mx-auto max-w-[1700px] space-y-4">
        <header className="flex items-end justify-between border-b-2 border-slate-300 pb-4">
          <div>
            <h1 className="text-3xl font-black">업체 정산 상세</h1>
            <p className="mt-2 text-sm font-bold text-slate-600">
              {brandName} · {month} 정산 대상 주문을 확인하고 정산 완료 처리합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <LinkButton href="/admin/settlements">정산센터</LinkButton>

            <LinkButton
              href={`/admin/revenue/orders?brand=${encodeURIComponent(
                brandName
              )}&month=${month}`}
            >
              수익원장
            </LinkButton>

            <LinkButton href="/admin/revenue" tone="dark">
              수익센터
            </LinkButton>
          </div>
        </header>

        <form
          action={`/admin/settlements/${encodeURIComponent(brandName)}`}
          className="flex items-center gap-2 rounded border border-slate-300 bg-white p-3"
        >
          <input
            name="month"
            defaultValue={month}
            className="h-9 w-28 rounded border border-slate-300 px-3 text-sm font-bold"
          />

          <button className="h-9 rounded bg-slate-950 px-5 text-sm font-black text-white">
            조회
          </button>
        </form>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">
                  업체
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  주문
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  총매출
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  플랫폼 수익
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  정산대기
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  정산완료
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  총정산금
                </th>
              </tr>
            </thead>

            <tbody>
              <tr className="bg-blue-50 font-black">
                <td className="border border-slate-300 px-3 py-2">
                  {brandName}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {orders.length}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {money(totalSales)}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right text-blue-700">
                  {money(totalRevenue)}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right text-red-700">
                  {money(pendingAmount)}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right text-emerald-700">
                  {money(paidAmount)}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {money(totalSettlement)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <section className="rounded border border-slate-300 bg-white p-4">
          <div className="mb-3 text-lg font-black">정산 처리</div>

          {pendingAmount > 0 ? (
            <form
              action={payVendorSettlement}
              className="flex flex-wrap items-center gap-2"
            >
              <input type="hidden" name="brand_name" value={brandName} />
              <input type="hidden" name="month" value={month} />

              <input
                name="memo"
                placeholder="정산 메모"
                className="h-9 w-80 rounded border border-slate-300 px-3 text-sm font-bold"
              />

              <input
                name="paid_by"
                defaultValue="admin"
                className="h-9 w-32 rounded border border-slate-300 px-3 text-sm font-bold"
              />

              <button className="h-9 rounded bg-blue-600 px-5 text-sm font-black text-white">
                정산완료 처리
              </button>
            </form>
          ) : (
            <div className="font-bold text-slate-600">
              정산대기 금액이 없습니다.
            </div>
          )}
        </section>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1500px] border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">
                  정산
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left">
                  일시
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left">
                  출처
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left">
                  상품
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left">
                  구매자
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left">
                  연락처
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  주문금액
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  플랫폼수익
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  정산금
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr
                  key={`${o.sourceTable}-${o.id}`}
                  className="hover:bg-yellow-50"
                >
                  <td className="border border-slate-300 px-3 py-2 font-black">
                    {o.settlementStatus === "paid" ? (
                      <span className="text-emerald-700">완료</span>
                    ) : (
                      <span className="text-red-700">대기</span>
                    )}
                  </td>

                  <td className="border border-slate-300 px-3 py-2">
                    {o.createdAt ? o.createdAt.slice(0, 10) : "-"}
                  </td>

                  <td className="border border-slate-300 px-3 py-2">
                    {o.sourceTable}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 font-bold">
                    {o.productName}
                  </td>

                  <td className="border border-slate-300 px-3 py-2">
                    {o.buyerName}
                  </td>

                  <td className="border border-slate-300 px-3 py-2">
                    {o.buyerPhone}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                    {money(o.orderAmount)}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 text-right font-black text-blue-700">
                    {money(o.platformFeeAmount)}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 text-right font-black text-red-700">
                    {money(o.vendorSettlementAmount)}
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="border border-slate-300 p-10 text-center font-black text-slate-600"
                  >
                    정산 대상 주문이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1000px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">
                  정산일
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left">
                  출처
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  주문
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  금액
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left">
                  처리자
                </th>
                <th className="border border-slate-300 px-3 py-2 text-left">
                  메모
                </th>
              </tr>
            </thead>

            <tbody>
              {(logsRes.data || []).map((log: any) => (
                <tr key={log.id}>
                  <td className="border border-slate-300 px-3 py-2">
                    {log.paid_at ? String(log.paid_at).slice(0, 10) : "-"}
                  </td>

                  <td className="border border-slate-300 px-3 py-2">
                    {log.source_table}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {log.order_count}
                  </td>

                  <td className="border border-slate-300 px-3 py-2 text-right font-black">
                    {money(num(log.settlement_amount))}
                  </td>

                  <td className="border border-slate-300 px-3 py-2">
                    {log.paid_by || "-"}
                  </td>

                  <td className="border border-slate-300 px-3 py-2">
                    {log.memo || "-"}
                  </td>
                </tr>
              ))}

              {(logsRes.data || []).length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="border border-slate-300 p-8 text-center font-black text-slate-600"
                  >
                    정산 처리 이력이 없습니다.
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