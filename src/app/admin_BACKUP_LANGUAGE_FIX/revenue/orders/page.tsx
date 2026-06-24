import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    month?: string;
    q?: string;
    brand?: string;
    type?: string;
    status?: string;
    settlement?: string;
  }>;
};

type RevenueOrder = {
  id: string;
  tableName: "expo_orders" | "photodoctor_orders";
  createdAt: string;
  orderType: string;
  brandName: string;
  productName: string;
  buyerName: string;
  buyerPhone: string;
  orderAmount: number;
  platformFeeRate: number;
  platformFeeAmount: number;
  vendorSettlementAmount: number;
  settlementStatus: string;
  orderStatus: string;
  hasError: boolean;
  errorReason: string;
};

function num(v: any) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

function money(v: number) {
  return Math.round(v).toLocaleString("ko-KR");
}

function pct(v: number) {
  return `${Math.round(num(v) * 100)}%`;
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

function normalizeRate(row: any, fallback: number) {
  const raw = num(row.platform_fee_rate);
  if (!raw) return fallback;
  if (raw > 0 && raw <= 1) return raw;
  if (raw > 1 && raw <= 100) return raw / 100;
  return fallback;
}

function normalizeExpo(row: any): RevenueOrder {
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

  const productName = row.product_name || row.product_title || "상품명 없음";
  const brandName =
    row.brand_name ||
    row.vendor_name ||
    row.company_name ||
    row.brand_title ||
    "-";

  const errors: string[] = [];
  if (!productName || productName === "상품명 없음") errors.push("상품명 없음");
  if (!brandName || brandName === "-") errors.push("브랜드명 없음");
  if (orderAmount <= 0) errors.push("주문금액 없음");

  return {
    id: String(row.id),
    tableName: "expo_orders",
    createdAt: row.created_at || "",
    orderType,
    brandName,
    productName,
    buyerName: row.buyer_name || row.applicant_name || "-",
    buyerPhone: row.buyer_phone || row.phone || "-",
    orderAmount,
    platformFeeRate,
    platformFeeAmount,
    vendorSettlementAmount,
    settlementStatus: row.settlement_status || "pending",
    orderStatus: row.order_status || row.status || "pending",
    hasError: errors.length > 0,
    errorReason: errors.join(", "),
  };
}

function normalizePhoto(row: any): RevenueOrder {
  const orderAmount = getAmount(row);
  const platformFeeRate = normalizeRate(row, 0.5);
  const platformFeeAmount =
    num(row.platform_fee_amount) || Math.round(orderAmount * platformFeeRate);
  const vendorSettlementAmount =
    num(row.vendor_settlement_amount) ||
    Math.max(orderAmount - platformFeeAmount, 0);

  const productName = row.product_name || row.product_title || "상품명 없음";
  const brandName = row.brand_name || row.vendor_name || "포토닥터";

  const errors: string[] = [];
  if (!productName || productName === "상품명 없음") errors.push("상품명 없음");
  if (orderAmount <= 0) errors.push("주문금액 없음");

  return {
    id: String(row.id),
    tableName: "photodoctor_orders",
    createdAt: row.created_at || "",
    orderType: "photodoctor",
    brandName,
    productName,
    buyerName: row.buyer_name || row.applicant_name || "-",
    buyerPhone: row.buyer_phone || row.phone || "-",
    orderAmount,
    platformFeeRate,
    platformFeeAmount,
    vendorSettlementAmount,
    settlementStatus: row.settlement_status || "pending",
    orderStatus: row.order_status || row.status || "pending",
    hasError: errors.length > 0,
    errorReason: errors.join(", "),
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
  tone?: "white" | "blue" | "red";
}) {
  const cls =
    tone === "blue"
      ? "bg-blue-600 text-white border-blue-600"
      : tone === "red"
        ? "bg-red-600 text-white border-red-600"
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

export default async function AdminRevenueOrdersPage({
  searchParams,
}: PageProps) {
  const sp = (await searchParams) || {};
  const month = validMonth(sp.month);
  const q = String(sp.q || "").trim().toLowerCase();
  const brand = String(sp.brand || "").trim();
  const type = String(sp.type || "").trim();
  const status = String(sp.status || "").trim();
  const settlement = String(sp.settlement || "").trim();

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

  let orders = [
    ...(expoRes.data || []).map(normalizeExpo),
    ...(photoRes.data || []).map(normalizePhoto),
  ].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  if (q) {
    orders = orders.filter((o) => {
      const hay = `${o.productName} ${o.brandName} ${o.buyerName} ${o.buyerPhone}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (brand) {
    if (brand === "unassigned") {
      orders = orders.filter((o) => !o.brandName || o.brandName === "-");
    } else {
      orders = orders.filter((o) => o.brandName === brand);
    }
  }

  if (type) {
    orders = orders.filter((o) => o.orderType === type);
  }

  if (status === "error") {
    orders = orders.filter((o) => o.hasError);
  }

  if (settlement) {
    orders = orders.filter((o) => o.settlementStatus === settlement);
  }

  const normalOrders = orders.filter((o) => !o.hasError);
  const errorOrders = orders.filter((o) => o.hasError);

  const totalOrderAmount = sum(normalOrders, (o) => o.orderAmount);
  const totalPlatformFee = sum(normalOrders, (o) => o.platformFeeAmount);
  const totalSettlement = sum(normalOrders, (o) => o.vendorSettlementAmount);
  const pendingSettlement = sum(
    normalOrders.filter((o) => o.settlementStatus !== "paid"),
    (o) => o.vendorSettlementAmount
  );

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950">
      <div className="mx-auto max-w-[1800px] space-y-4">
        <header className="flex items-end justify-between border-b-2 border-slate-300 pb-4">
          <div>
            <h1 className="text-3xl font-black">수익 원장</h1>
            <p className="mt-2 text-sm font-bold text-slate-600">
              주문별 매출·수수료·플랫폼 수익·업체 정산금을 엑셀처럼 확인합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <LinkButton href="/admin/revenue">수익센터</LinkButton>
            <LinkButton href="/admin/revenue/vendors">업체별 현황</LinkButton>
            <LinkButton href="/admin/settlements" tone="blue">
              정산센터
            </LinkButton>
          </div>
        </header>

        <form
          action="/admin/revenue/orders"
          className="flex flex-wrap items-center gap-2 rounded border border-slate-300 bg-white p-3"
        >
          <input
            name="month"
            defaultValue={month}
            className="h-9 w-28 rounded border border-slate-300 px-3 text-sm font-bold"
          />
          <input
            name="q"
            defaultValue={q}
            className="h-9 w-64 rounded border border-slate-300 px-3 text-sm font-bold"
            placeholder="상품/업체/구매자/연락처 검색"
          />
          <input
            name="brand"
            defaultValue={brand}
            className="h-9 w-48 rounded border border-slate-300 px-3 text-sm font-bold"
            placeholder="업체명"
          />
          <select
            name="type"
            defaultValue={type}
            className="h-9 rounded border border-slate-300 px-3 text-sm font-bold"
          >
            <option value="">전체 수익원</option>
            <option value="photodoctor">포토닥터</option>
            <option value="general">일반</option>
            <option value="live">라이브</option>
          </select>
          <select
            name="settlement"
            defaultValue={settlement}
            className="h-9 rounded border border-slate-300 px-3 text-sm font-bold"
          >
            <option value="">전체 정산상태</option>
            <option value="pending">정산대기</option>
            <option value="paid">정산완료</option>
          </select>
          <select
            name="status"
            defaultValue={status}
            className="h-9 rounded border border-slate-300 px-3 text-sm font-bold"
          >
            <option value="">전체 주문</option>
            <option value="error">오류 주문</option>
          </select>
          <button className="h-9 rounded bg-slate-950 px-5 text-sm font-black text-white">
            조회
          </button>
        </form>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1500px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">구분</th>
                <th className="border border-slate-300 px-3 py-2 text-right">주문</th>
                <th className="border border-slate-300 px-3 py-2 text-right">주문금액</th>
                <th className="border border-slate-300 px-3 py-2 text-right">플랫폼 수익</th>
                <th className="border border-slate-300 px-3 py-2 text-right">업체 정산금</th>
                <th className="border border-slate-300 px-3 py-2 text-right">정산대기</th>
                <th className="border border-slate-300 px-3 py-2 text-right">오류</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-50 font-black">
                <td className="border border-slate-300 px-3 py-2">{month} 합계</td>
                <td className="border border-slate-300 px-3 py-2 text-right">{normalOrders.length}</td>
                <td className="border border-slate-300 px-3 py-2 text-right">{money(totalOrderAmount)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right text-blue-700">{money(totalPlatformFee)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right text-emerald-700">{money(totalSettlement)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right text-red-700">{money(pendingSettlement)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right text-red-700">{errorOrders.length}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1800px] border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">상태</th>
                <th className="border border-slate-300 px-3 py-2 text-left">일시</th>
                <th className="border border-slate-300 px-3 py-2 text-left">출처</th>
                <th className="border border-slate-300 px-3 py-2 text-left">수익원</th>
                <th className="border border-slate-300 px-3 py-2 text-left">업체</th>
                <th className="border border-slate-300 px-3 py-2 text-left">상품</th>
                <th className="border border-slate-300 px-3 py-2 text-left">구매자</th>
                <th className="border border-slate-300 px-3 py-2 text-left">연락처</th>
                <th className="border border-slate-300 px-3 py-2 text-right">주문금액</th>
                <th className="border border-slate-300 px-3 py-2 text-right">수수료율</th>
                <th className="border border-slate-300 px-3 py-2 text-right">플랫폼수익</th>
                <th className="border border-slate-300 px-3 py-2 text-right">업체정산</th>
                <th className="border border-slate-300 px-3 py-2 text-center">정산</th>
                <th className="border border-slate-300 px-3 py-2 text-left">오류</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={`${o.tableName}-${o.id}`} className="hover:bg-yellow-50">
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2 font-black">
                    {o.hasError ? (
                      <span className="text-red-700">오류</span>
                    ) : (
                      <span className="text-emerald-700">정상</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2">
                    {o.createdAt ? o.createdAt.slice(0, 10) : "-"}
                  </td>
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2">
                    {o.tableName}
                  </td>
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2 font-bold">
                    {o.orderType}
                  </td>
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2 font-bold">
                    {o.brandName}
                  </td>
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2 font-bold">
                    {o.productName}
                  </td>
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2">
                    {o.buyerName}
                  </td>
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2">
                    {o.buyerPhone}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                    {money(o.orderAmount)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {pct(o.platformFeeRate)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-black text-blue-700">
                    {money(o.platformFeeAmount)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-black text-emerald-700">
                    {money(o.vendorSettlementAmount)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-center font-bold">
                    {o.settlementStatus}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-red-700">
                    {o.errorReason || "-"}
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan={14}
                    className="border border-slate-300 p-10 text-center font-black text-slate-600"
                  >
                    조회된 주문 수익 원장이 없습니다.
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