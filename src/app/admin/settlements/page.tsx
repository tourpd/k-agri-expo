import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    month?: string;
    q?: string;
    status?: string;
    sort?: string;
  }>;
};

type SourceTable = "expo_orders" | "photodoctor_orders";

type SettlementOrder = {
  id: string;
  sourceTable: SourceTable;
  brandName: string;
  productName: string;
  orderAmount: number;
  platformFeeAmount: number;
  vendorSettlementAmount: number;
  settlementStatus: string;
  createdAt: string;
  hasError: boolean;
};

type VendorSettlement = {
  brandName: string;
  orderCount: number;
  totalSales: number;
  platformRevenue: number;
  pendingAmount: number;
  paidAmount: number;
  totalSettlement: number;
  errorCount: number;
  status: "정산대기" | "정산완료" | "오류확인";
};

function num(v: unknown) {
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
    num(row.order_amount_krw) ||
    num(row.total_price_krw)
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
    fallback
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

function normalizeRate(row: any, fallback: number) {
  const raw = num(row.platform_fee_rate ?? row.commission_rate);

  if (!raw) return fallback;
  if (raw > 0 && raw <= 1) return raw;
  if (raw > 1 && raw <= 100) return raw / 100;

  return fallback;
}

function normalizeOrder(row: any, sourceTable: SourceTable): SettlementOrder {
  const orderAmount = getAmount(row);
  const orderType = row.order_type || row.commission_type || "general";

  const fallbackRate =
    sourceTable === "photodoctor_orders"
      ? 0.12
      : orderType === "live"
        ? 0.3
        : orderType === "photodoctor"
          ? 0.12
          : 0.18;

  const rate = normalizeRate(row, fallbackRate);

  const platformFeeAmount =
    num(row.platform_fee_amount) || Math.round(orderAmount * rate);

  const vendorSettlementAmount =
    num(row.vendor_settlement_amount) ||
    Math.max(orderAmount - platformFeeAmount, 0);

  const brandName = getBrandName(
    row,
    sourceTable === "photodoctor_orders" ? "포토닥터" : "-"
  );

  const productName = getProductName(row);

  const hasError =
    !brandName ||
    brandName === "-" ||
    !productName ||
    productName === "상품명 없음" ||
    orderAmount <= 0;

  return {
    id: String(row.id),
    sourceTable,
    brandName,
    productName: productName || "상품명 없음",
    orderAmount,
    platformFeeAmount,
    vendorSettlementAmount,
    settlementStatus: row.settlement_status || "pending",
    createdAt: row.created_at || row.ordered_at || "",
    hasError,
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
      className={`inline-flex h-8 items-center justify-center rounded border px-3 text-xs font-black ${cls}`}
    >
      {children}
    </Link>
  );
}

export default async function AdminSettlementsPage({
  searchParams,
}: PageProps) {
  const sp = (await searchParams) || {};
  const month = validMonth(sp.month);
  const q = String(sp.q || "").trim().toLowerCase();
  const status = String(sp.status || "").trim();
  const sort = String(sp.sort || "pending");

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

  const orders: SettlementOrder[] = [
    ...(expoRes.data || []).map((row: any) => normalizeOrder(row, "expo_orders")),
    ...(photoRes.data || []).map((row: any) =>
      normalizeOrder(row, "photodoctor_orders")
    ),
  ];

  const vendorMap = new Map<string, VendorSettlement>();

  function getVendor(name: string) {
    const found = vendorMap.get(name);
    if (found) return found;

    const created: VendorSettlement = {
      brandName: name,
      orderCount: 0,
      totalSales: 0,
      platformRevenue: 0,
      pendingAmount: 0,
      paidAmount: 0,
      totalSettlement: 0,
      errorCount: 0,
      status: "정산완료",
    };

    vendorMap.set(name, created);
    return created;
  }

  for (const order of orders) {
    if (!order.brandName || order.brandName === "-") continue;

    const vendor = getVendor(order.brandName);

    if (order.hasError) {
      vendor.errorCount += 1;
      continue;
    }

    vendor.orderCount += 1;
    vendor.totalSales += order.orderAmount;
    vendor.platformRevenue += order.platformFeeAmount;
    vendor.totalSettlement += order.vendorSettlementAmount;

    if (order.settlementStatus === "paid") {
      vendor.paidAmount += order.vendorSettlementAmount;
    } else {
      vendor.pendingAmount += order.vendorSettlementAmount;
    }
  }

  let vendors = Array.from(vendorMap.values()).map((vendor) => ({
    ...vendor,
    status:
      vendor.errorCount > 0
        ? "오류확인"
        : vendor.pendingAmount > 0
          ? "정산대기"
          : "정산완료",
  })) as VendorSettlement[];

  if (q) {
    vendors = vendors.filter((vendor) =>
      vendor.brandName.toLowerCase().includes(q)
    );
  }

  if (status === "pending") {
    vendors = vendors.filter((vendor) => vendor.pendingAmount > 0);
  }

  if (status === "paid") {
    vendors = vendors.filter(
      (vendor) => vendor.pendingAmount <= 0 && vendor.orderCount > 0
    );
  }

  if (status === "error") {
    vendors = vendors.filter((vendor) => vendor.errorCount > 0);
  }

  vendors.sort((a, b) => {
    if (sort === "sales") return b.totalSales - a.totalSales;
    if (sort === "revenue") return b.platformRevenue - a.platformRevenue;
    if (sort === "orders") return b.orderCount - a.orderCount;
    if (sort === "error") return b.errorCount - a.errorCount;
    return b.pendingAmount - a.pendingAmount;
  });

  const totalSales = sum(vendors, (vendor) => vendor.totalSales);
  const totalRevenue = sum(vendors, (vendor) => vendor.platformRevenue);
  const totalPending = sum(vendors, (vendor) => vendor.pendingAmount);
  const totalPaid = sum(vendors, (vendor) => vendor.paidAmount);
  const totalSettlement = sum(vendors, (vendor) => vendor.totalSettlement);
  const totalOrders = sum(vendors, (vendor) => vendor.orderCount);
  const totalErrors = sum(vendors, (vendor) => vendor.errorCount);

  const th =
    "border border-slate-300 bg-slate-200 px-3 py-2 font-black text-slate-950";
  const td = "border border-slate-300 px-3 py-2 text-slate-950";

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950 dark:text-slate-950">
      <div className="mx-auto max-w-[1700px] space-y-4 text-slate-950 dark:text-slate-950">
        <header className="flex items-end justify-between border-b-2 border-slate-300 pb-4 text-slate-950">
          <div>
            <h1 className="text-3xl font-black text-slate-950">정산센터</h1>
            <p className="mt-2 text-sm font-bold text-slate-700">
              업체별 정산대기금, 정산완료금, 오류를 엑셀처럼 확인하고 처리합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <LinkButton href="/admin/revenue">수익센터</LinkButton>
            <LinkButton href="/admin/revenue/vendors">업체별 현황</LinkButton>
            <LinkButton href="/admin/revenue/orders">수익원장</LinkButton>
            <LinkButton href={`/admin/settlements/errors?month=${month}`} tone="red">
              오류정리
            </LinkButton>
          </div>
        </header>

        <form
          action="/admin/settlements"
          className="flex flex-wrap items-center gap-2 rounded border border-slate-300 bg-white p-3 text-slate-950"
        >
          <input
            name="month"
            defaultValue={month}
            className="h-9 w-28 rounded border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950"
          />

          <input
            name="q"
            defaultValue={q}
            className="h-9 w-60 rounded border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950"
            placeholder="업체명 검색"
          />

          <select
            name="status"
            defaultValue={status}
            className="h-9 rounded border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950"
          >
            <option value="">전체 상태</option>
            <option value="pending">정산대기</option>
            <option value="paid">정산완료</option>
            <option value="error">오류확인</option>
          </select>

          <select
            name="sort"
            defaultValue={sort}
            className="h-9 rounded border border-slate-300 bg-white px-3 text-sm font-bold text-slate-950"
          >
            <option value="pending">정산대기금순</option>
            <option value="sales">매출순</option>
            <option value="revenue">플랫폼수익순</option>
            <option value="orders">주문건수순</option>
            <option value="error">오류순</option>
          </select>

          <button className="h-9 rounded bg-slate-950 px-5 text-sm font-black text-white">
            조회
          </button>
        </form>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white text-slate-950">
          <table className="w-full min-w-[1450px] border-collapse text-sm text-slate-950">
            <thead>
              <tr>
                <th className={`${th} text-left`}>구분</th>
                <th className={`${th} text-right`}>업체 수</th>
                <th className={`${th} text-right`}>주문</th>
                <th className={`${th} text-right`}>총매출</th>
                <th className={`${th} text-right`}>플랫폼 수익</th>
                <th className={`${th} text-right`}>정산대기</th>
                <th className={`${th} text-right`}>정산완료</th>
                <th className={`${th} text-right`}>총정산금</th>
                <th className={`${th} text-right`}>오류</th>
              </tr>
            </thead>

            <tbody>
              <tr className="bg-blue-50 text-slate-950">
                <td className={`${td} font-black`}>{month} 정산 합계</td>
                <td className={`${td} text-right font-black`}>{vendors.length}</td>
                <td className={`${td} text-right font-black`}>{totalOrders}</td>
                <td className={`${td} text-right font-black`}>{money(totalSales)}</td>
                <td className={`${td} text-right font-black text-blue-700`}>
                  {money(totalRevenue)}
                </td>
                <td className={`${td} text-right font-black text-red-700`}>
                  {money(totalPending)}
                </td>
                <td className={`${td} text-right font-black text-emerald-700`}>
                  {money(totalPaid)}
                </td>
                <td className={`${td} text-right font-black`}>
                  {money(totalSettlement)}
                </td>
                <td className={`${td} text-right font-black text-red-700`}>
                  {totalErrors}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white text-slate-950">
          <table className="w-full min-w-[1650px] border-collapse text-sm text-slate-950">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className={`${th} text-left`}>상태</th>
                <th className={`${th} text-left`}>업체명</th>
                <th className={`${th} text-right`}>주문</th>
                <th className={`${th} text-right`}>총매출</th>
                <th className={`${th} text-right`}>플랫폼 수익</th>
                <th className={`${th} text-right`}>정산대기</th>
                <th className={`${th} text-right`}>정산완료</th>
                <th className={`${th} text-right`}>총정산금</th>
                <th className={`${th} text-right`}>오류</th>
                <th className={`${th} text-center`}>원장</th>
                <th className={`${th} text-center`}>정산</th>
                <th className={`${th} text-center`}>오류</th>
              </tr>
            </thead>

            <tbody>
              {vendors.map((vendor) => (
                <tr
                  key={vendor.brandName}
                  className="text-slate-950 hover:bg-yellow-50"
                >
                  <td className={`${td} whitespace-nowrap font-black`}>
                    <span
                      className={
                        vendor.status === "오류확인"
                          ? "text-red-700"
                          : vendor.status === "정산대기"
                            ? "text-blue-700"
                            : "text-emerald-700"
                      }
                    >
                      {vendor.status}
                    </span>
                  </td>

                  <td className={`${td} whitespace-nowrap font-black`}>
                    {vendor.brandName}
                  </td>

                  <td className={`${td} text-right font-bold`}>
                    {vendor.orderCount}
                  </td>

                  <td className={`${td} text-right font-bold`}>
                    {money(vendor.totalSales)}
                  </td>

                  <td className={`${td} text-right font-black text-blue-700`}>
                    {money(vendor.platformRevenue)}
                  </td>

                  <td className={`${td} text-right font-black text-red-700`}>
                    {money(vendor.pendingAmount)}
                  </td>

                  <td className={`${td} text-right font-black text-emerald-700`}>
                    {money(vendor.paidAmount)}
                  </td>

                  <td className={`${td} text-right font-bold`}>
                    {money(vendor.totalSettlement)}
                  </td>

                  <td className={`${td} text-right font-black text-red-700`}>
                    {vendor.errorCount}
                  </td>

                  <td className="border border-slate-300 px-2 py-1 text-center text-slate-950">
                    <LinkButton
                      href={`/admin/revenue/orders?brand=${encodeURIComponent(
                        vendor.brandName
                      )}&month=${month}`}
                    >
                      원장
                    </LinkButton>
                  </td>

                  <td className="border border-slate-300 px-2 py-1 text-center text-slate-950">
                    {vendor.pendingAmount > 0 ? (
                      <LinkButton
                        href={`/admin/settlements/${encodeURIComponent(
                          vendor.brandName
                        )}?month=${month}`}
                        tone="blue"
                      >
                        정산
                      </LinkButton>
                    ) : (
                      <span className="font-black text-slate-950">-</span>
                    )}
                  </td>

                  <td className="border border-slate-300 px-2 py-1 text-center text-slate-950">
                    {vendor.errorCount > 0 ? (
                      <LinkButton
                        href={`/admin/settlements/errors?month=${month}&q=${encodeURIComponent(
                          vendor.brandName
                        )}`}
                        tone="red"
                      >
                        오류정리
                      </LinkButton>
                    ) : (
                      <span className="font-black text-slate-950">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {vendors.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="border border-slate-300 p-10 text-center font-black text-slate-700"
                  >
                    정산할 업체 데이터가 없습니다.
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