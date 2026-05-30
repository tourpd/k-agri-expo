import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ month?: string; sort?: string; q?: string }>;
};

type SourceType = "photodoctor_orders" | "expo_brand_orders";
type OrderType = "photodoctor" | "general" | "live";

type RevenueOrder = {
  brandName: string;
  orderType: OrderType;
  orderAmount: number;
  platformFeeAmount: number;
  vendorSettlementAmount: number;
  settlementStatus: string;
  hasError: boolean;
};

type VendorStat = {
  brandName: string;
  status: string;
  orderCount: number;
  totalSales: number;
  platformRevenue: number;
  pendingSettlement: number;
  avgOrderAmount: number;
  revenueRate: number;
  photoCount: number;
  generalCount: number;
  liveCount: number;
  errorCount: number;
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

function getOrderAmount(row: any) {
  return (
    num(row.total_amount_krw) ||
    num(row.total_price_krw) ||
    num(row.order_amount_krw) ||
    num(row.sale_price_krw) ||
    num(row.price_krw) ||
    num(row.amount_krw)
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

function getBrandName(row: any, source: SourceType) {
  const name =
    row.brand_name ||
    row.vendor_name ||
    row.company_name ||
    row.brand_title ||
    row.brand?.name ||
    row.expo_brands?.name ||
    row.vendor?.company_name ||
    row.vendors?.company_name ||
    "";

  if (name) return name;
  if (source === "photodoctor_orders") return "포토닥터";
  return "";
}

function getRate(row: any, source: SourceType) {
  if (source === "photodoctor_orders") return 0.5;

  const raw = num(row.platform_fee_rate ?? row.commission_rate);

  if (!raw) return row.order_type === "live" ? 0.3 : 0.18;
  if (raw > 0 && raw <= 1) return raw;
  if (raw > 1 && raw <= 100) return raw / 100;

  return row.order_type === "live" ? 0.3 : 0.18;
}

function normalizeOrder(row: any, source: SourceType): RevenueOrder {
  const orderType: OrderType =
    source === "photodoctor_orders"
      ? "photodoctor"
      : row.order_type === "live"
        ? "live"
        : "general";

  const orderAmount = getOrderAmount(row);
  const brandName = getBrandName(row, source);
  const productName = getProductName(row);
  const rate = getRate(row, source);
  const platformFeeAmount = Math.round(orderAmount * rate);

  return {
    brandName: brandName || "",
    orderType,
    orderAmount,
    platformFeeAmount,
    vendorSettlementAmount: Math.max(orderAmount - platformFeeAmount, 0),
    settlementStatus: row.settlement_status || "pending",
    hasError: !brandName || !productName || orderAmount <= 0,
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

export default async function AdminRevenueVendorsPage({
  searchParams,
}: PageProps) {
  const sp = (await searchParams) || {};
  const month = validMonth(sp.month);
  const q = String(sp.q || "").trim();
  const sort = String(sp.sort || "revenue");

  const supabase = createSupabaseAdminClient();

  const [photoRes, expoRes] = await Promise.all([
    supabase
      .from("photodoctor_orders")
      .select("*")
      .gte("created_at", monthStartIso(month))
      .lt("created_at", nextMonthStartIso(month))
      .order("created_at", { ascending: false })
      .limit(10000),
    supabase
      .from("expo_brand_orders")
      .select("*")
      .gte("created_at", monthStartIso(month))
      .lt("created_at", nextMonthStartIso(month))
      .order("created_at", { ascending: false })
      .limit(10000),
  ]);

  const allOrders = [
    ...(photoRes.data || []).map((row) =>
      normalizeOrder(row, "photodoctor_orders")
    ),
    ...(expoRes.data || []).map((row) =>
      normalizeOrder(row, "expo_brand_orders")
    ),
  ];

  const validOrders = allOrders.filter((o) => !o.hasError);
  const errorOrders = allOrders.filter((o) => o.hasError);

  const vendorMap = new Map<string, VendorStat>();
  let unassignedErrorCount = 0;

  function getVendor(name: string) {
    const prev = vendorMap.get(name);
    if (prev) return prev;

    const created: VendorStat = {
      brandName: name,
      status: "정상",
      orderCount: 0,
      totalSales: 0,
      platformRevenue: 0,
      pendingSettlement: 0,
      avgOrderAmount: 0,
      revenueRate: 0,
      photoCount: 0,
      generalCount: 0,
      liveCount: 0,
      errorCount: 0,
    };

    vendorMap.set(name, created);
    return created;
  }

  for (const o of validOrders) {
    if (!o.brandName) continue;

    const v = getVendor(o.brandName);
    v.orderCount += 1;
    v.totalSales += o.orderAmount;
    v.platformRevenue += o.platformFeeAmount;

    if (o.settlementStatus !== "paid") {
      v.pendingSettlement += o.vendorSettlementAmount;
    }

    if (o.orderType === "photodoctor") v.photoCount += 1;
    if (o.orderType === "general") v.generalCount += 1;
    if (o.orderType === "live") v.liveCount += 1;
  }

  for (const o of errorOrders) {
    if (!o.brandName) {
      unassignedErrorCount += 1;
      continue;
    }

    const v = getVendor(o.brandName);
    v.errorCount += 1;
  }

  let vendors = Array.from(vendorMap.values()).map((v) => {
    const avgOrderAmount = v.orderCount > 0 ? v.totalSales / v.orderCount : 0;
    const revenueRate = v.totalSales > 0 ? v.platformRevenue / v.totalSales : 0;

    return {
      ...v,
      avgOrderAmount,
      revenueRate,
      status:
        v.pendingSettlement > 0
          ? "정산필요"
          : v.errorCount > 0
            ? "오류확인"
            : "정상",
    };
  });

  if (q) {
    vendors = vendors.filter((v) =>
      v.brandName.toLowerCase().includes(q.toLowerCase())
    );
  }

  vendors.sort((a, b) => {
    if (sort === "sales") return b.totalSales - a.totalSales;
    if (sort === "settlement") return b.pendingSettlement - a.pendingSettlement;
    if (sort === "orders") return b.orderCount - a.orderCount;
    if (sort === "error") return b.errorCount - a.errorCount;
    return b.platformRevenue - a.platformRevenue;
  });

  const totalSales = sum(vendors, (v) => v.totalSales);
  const totalRevenue = sum(vendors, (v) => v.platformRevenue);
  const totalPending = sum(vendors, (v) => v.pendingSettlement);
  const totalOrders = sum(vendors, (v) => v.orderCount);
  const vendorErrorCount = sum(vendors, (v) => v.errorCount);
  const totalErrors = vendorErrorCount + unassignedErrorCount;

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <header className="flex items-end justify-between border-b-2 border-slate-300 pb-4">
          <div>
            <h1 className="text-3xl font-black">업체별 수익 현황</h1>
            <p className="mt-2 text-sm font-bold text-slate-600">
              엑셀처럼 업체별 매출·수익·정산·오류를 한 줄에서 확인합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <LinkButton href="/admin/revenue">수익센터</LinkButton>
            <LinkButton href="/admin/revenue/orders">수익원장</LinkButton>
            <LinkButton href="/admin/settlements" tone="blue">
              정산센터
            </LinkButton>
          </div>
        </header>

        <form
          action="/admin/revenue/vendors"
          className="flex items-center gap-2 rounded border border-slate-300 bg-white p-3"
        >
          <input
            name="month"
            defaultValue={month}
            className="h-9 w-28 rounded border border-slate-300 px-3 text-sm font-bold"
          />
          <input
            name="q"
            defaultValue={q}
            className="h-9 w-60 rounded border border-slate-300 px-3 text-sm font-bold"
            placeholder="업체명 검색"
          />
          <select
            name="sort"
            defaultValue={sort}
            className="h-9 rounded border border-slate-300 px-3 text-sm font-bold"
          >
            <option value="revenue">플랫폼 수익순</option>
            <option value="sales">매출순</option>
            <option value="settlement">정산대기순</option>
            <option value="orders">주문건수순</option>
            <option value="error">오류순</option>
          </select>
          <button className="h-9 rounded bg-slate-950 px-5 text-sm font-black text-white">
            조회
          </button>
        </form>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1450px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">
                  구분
                </th>
                <th className="border border-slate-300 px-3 py-2 text-right">
                  업체 수
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
                  오류
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-blue-50 font-black">
                <td className="border border-slate-300 px-3 py-2">
                  {month} 업체 합계
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {vendors.length}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {totalOrders}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right">
                  {money(totalSales)}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right text-blue-700">
                  {money(totalRevenue)}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right text-red-700">
                  {money(totalPending)}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right text-red-700">
                  {totalErrors}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1450px] border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">상태</th>
                <th className="border border-slate-300 px-3 py-2 text-left">업체명</th>
                <th className="border border-slate-300 px-3 py-2 text-right">주문</th>
                <th className="border border-slate-300 px-3 py-2 text-right">총매출</th>
                <th className="border border-slate-300 px-3 py-2 text-right">플랫폼 수익</th>
                <th className="border border-slate-300 px-3 py-2 text-right">정산대기</th>
                <th className="border border-slate-300 px-3 py-2 text-right">객단가</th>
                <th className="border border-slate-300 px-3 py-2 text-right">수익률</th>
                <th className="border border-slate-300 px-3 py-2 text-right">포토닥터</th>
                <th className="border border-slate-300 px-3 py-2 text-right">일반</th>
                <th className="border border-slate-300 px-3 py-2 text-right">라이브</th>
                <th className="border border-slate-300 px-3 py-2 text-right">오류</th>
                <th className="border border-slate-300 px-3 py-2 text-center">주문</th>
                <th className="border border-slate-300 px-3 py-2 text-center">정산</th>
                <th className="border border-slate-300 px-3 py-2 text-center">오류</th>
              </tr>
            </thead>

            <tbody>
              {vendors.map((v) => (
                <tr key={v.brandName} className="hover:bg-yellow-50">
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2 font-black">
                    <span
                      className={
                        v.status === "오류확인"
                          ? "text-red-700"
                          : v.status === "정산필요"
                            ? "text-blue-700"
                            : "text-emerald-700"
                      }
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap border border-slate-300 px-3 py-2 font-black">
                    {v.brandName}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                    {v.orderCount}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-bold">
                    {money(v.totalSales)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-black text-blue-700">
                    {money(v.platformRevenue)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-black text-red-700">
                    {money(v.pendingSettlement)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {money(v.avgOrderAmount)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {pct(v.revenueRate)}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {v.photoCount}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {v.generalCount}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right">
                    {v.liveCount}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-black text-red-700">
                    {v.errorCount}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    <LinkButton
                      href={`/admin/revenue/orders?brand=${encodeURIComponent(
                        v.brandName
                      )}&month=${month}`}
                    >
                      주문
                    </LinkButton>
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    <LinkButton
                      href={`/admin/settlements?brand=${encodeURIComponent(
                        v.brandName
                      )}&month=${month}`}
                      tone="blue"
                    >
                      정산
                    </LinkButton>
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    {v.errorCount > 0 ? (
                      <LinkButton
                        href={`/admin/revenue/orders?brand=${encodeURIComponent(
                          v.brandName
                        )}&status=error&month=${month}`}
                        tone="red"
                      >
                        오류
                      </LinkButton>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}

              {vendors.length === 0 && (
                <tr>
                  <td
                    colSpan={15}
                    className="border border-slate-300 p-10 text-center font-black text-slate-600"
                  >
                    업체별 수익 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {unassignedErrorCount > 0 && (
          <div className="overflow-x-auto rounded border border-red-300 bg-white">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="bg-red-100 text-red-900">
                  <th className="border border-red-300 px-3 py-2 text-left">
                    구분
                  </th>
                  <th className="border border-red-300 px-3 py-2 text-right">
                    오류 주문
                  </th>
                  <th className="border border-red-300 px-3 py-2 text-left">
                    설명
                  </th>
                  <th className="border border-red-300 px-3 py-2 text-center">
                    처리
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-black">
                  <td className="border border-red-300 px-3 py-2 text-red-700">
                    미지정 오류 주문
                  </td>
                  <td className="border border-red-300 px-3 py-2 text-right text-red-700">
                    {unassignedErrorCount}
                  </td>
                  <td className="border border-red-300 px-3 py-2">
                    브랜드명 또는 업체 연결이 없는 주문입니다. 업체별 표에는 포함하지 않았습니다.
                  </td>
                  <td className="border border-red-300 px-3 py-2 text-center">
                    <LinkButton
                      href={`/admin/revenue/orders?status=error&brand=unassigned&month=${month}`}
                      tone="red"
                    >
                      오류정리
                    </LinkButton>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}