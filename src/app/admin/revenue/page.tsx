import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SourceType = "expo_orders" | "photodoctor_orders";
type OrderType = "photodoctor" | "general" | "live";

type RevenueOrder = {
  sourceTable: SourceType;
  orderType: OrderType;
  brandName: string;
  productName: string;
  orderAmount: number;
  platformFeeAmount: number;
  vendorSettlementAmount: number;
  settlementStatus: string;
  createdAt: string;
  hasError: boolean;
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

function todayKey() {
  return nowKst().toISOString().slice(0, 10);
}

function currentMonthKey() {
  return nowKst().toISOString().slice(0, 7);
}

function monthStartIso(month: string) {
  return `${month}-01T00:00:00+09:00`;
}

function nextMonthStartIso(month: string) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01T00:00:00+09:00`;
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
  return row.brand_name || row.vendor_name || row.company_name || row.brand_title || fallback;
}

function getProductName(row: any) {
  return row.product_name || row.product_title || row.item_name || row.title || "";
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
  const orderType: OrderType =
    row.order_type === "photodoctor" ? "photodoctor" : row.order_type === "live" ? "live" : "general";

  const fallbackRate = orderType === "photodoctor" ? 0.5 : orderType === "live" ? 0.3 : 0.18;
  const rate = normalizeRate(row, fallbackRate);
  const platformFeeAmount = num(row.platform_fee_amount) || Math.round(orderAmount * rate);
  const vendorSettlementAmount =
    num(row.vendor_settlement_amount) || Math.max(orderAmount - platformFeeAmount, 0);

  const brandName = getBrandName(row, "-");
  const productName = getProductName(row);

  return {
    sourceTable: "expo_orders",
    orderType,
    brandName,
    productName,
    orderAmount,
    platformFeeAmount,
    vendorSettlementAmount,
    settlementStatus: row.settlement_status || "pending",
    createdAt: row.created_at || "",
    hasError: !brandName || brandName === "-" || !productName || orderAmount <= 0,
  };
}

function normalizePhoto(row: any): RevenueOrder {
  const orderAmount = getAmount(row);
  const rate = normalizeRate(row, 0.5);
  const platformFeeAmount = num(row.platform_fee_amount) || Math.round(orderAmount * rate);
  const vendorSettlementAmount =
    num(row.vendor_settlement_amount) || Math.max(orderAmount - platformFeeAmount, 0);

  const productName = getProductName(row);

  return {
    sourceTable: "photodoctor_orders",
    orderType: "photodoctor",
    brandName: getBrandName(row, "포토닥터"),
    productName,
    orderAmount,
    platformFeeAmount,
    vendorSettlementAmount,
    settlementStatus: row.settlement_status || "pending",
    createdAt: row.created_at || "",
    hasError: !productName || orderAmount <= 0,
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
      ? "bg-blue-600 text-white border-blue-600"
      : tone === "red"
        ? "bg-red-600 text-white border-red-600"
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

export default async function AdminRevenuePage() {
  const month = currentMonthKey();
  const today = todayKey();
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

  const orders = [
    ...(expoRes.data || []).map(normalizeExpo),
    ...(photoRes.data || []).map(normalizePhoto),
  ];

  const normalOrders = orders.filter((o) => !o.hasError);
  const errorOrders = orders.filter((o) => o.hasError);
  const todayOrders = normalOrders.filter((o) => o.createdAt.startsWith(today));

  const totalSales = sum(normalOrders, (o) => o.orderAmount);
  const todaySales = sum(todayOrders, (o) => o.orderAmount);
  const totalRevenue = sum(normalOrders, (o) => o.platformFeeAmount);
  const todayRevenue = sum(todayOrders, (o) => o.platformFeeAmount);
  const totalSettlement = sum(normalOrders, (o) => o.vendorSettlementAmount);
  const todaySettlement = sum(todayOrders, (o) => o.vendorSettlementAmount);
  const pendingOrders = normalOrders.filter((o) => o.settlementStatus !== "paid");
  const pendingSettlement = sum(pendingOrders, (o) => o.vendorSettlementAmount);
  const avgRate = totalSales > 0 ? totalRevenue / totalSales : 0;

  const photoOrders = normalOrders.filter((o) => o.orderType === "photodoctor");
  const generalOrders = normalOrders.filter((o) => o.orderType === "general");
  const liveOrders = normalOrders.filter((o) => o.orderType === "live");

  const sourceRows = [
    { label: "포토닥터", desc: "AI 진단 후 연결 수익", orders: photoOrders, href: "/admin/revenue/orders?type=photodoctor" },
    { label: "엑스포 일반", desc: "브랜드관·상품관 주문", orders: generalOrders, href: "/admin/revenue/orders?type=general" },
    { label: "라이브 특가", desc: "방송·공동구매 주문", orders: liveOrders, href: "/admin/revenue/orders?type=live" },
  ];

  const taskRows = [
    {
      label: "정산대기",
      desc: "업체에 지급해야 할 금액",
      count: pendingOrders.length,
      amount: pendingSettlement,
      href: "/admin/settlements",
      action: "정산처리",
      tone: "blue" as const,
    },
    {
      label: "오류주문",
      desc: "상품명·브랜드명·금액 누락 주문",
      count: errorOrders.length,
      amount: 0,
      href: "/admin/revenue/orders?status=error",
      action: "오류정리",
      tone: "red" as const,
    },
    {
      label: "업체별 확인",
      desc: "업체별 매출·수익·정산 확인",
      count: 0,
      amount: 0,
      href: "/admin/revenue/vendors",
      action: "업체보기",
      tone: "white" as const,
    },
    {
      label: "수익원장",
      desc: "전체 주문 수익 원장",
      count: normalOrders.length,
      amount: totalRevenue,
      href: "/admin/revenue/orders",
      action: "원장보기",
      tone: "dark" as const,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-5 text-slate-950">
      <div className="mx-auto max-w-[1700px] space-y-4">
        <header className="flex items-end justify-between border-b-2 border-slate-300 pb-4">
          <div>
            <h1 className="text-3xl font-black">수익센터</h1>
            <p className="mt-2 text-sm font-bold text-slate-600">
              전체 매출·수익·정산·오류를 엑셀형으로 관리합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <LinkButton href="/admin/revenue/orders">수익원장</LinkButton>
            <LinkButton href="/admin/revenue/vendors">업체별 현황</LinkButton>
            <LinkButton href="/admin/settlements" tone="blue">
              정산센터
            </LinkButton>
          </div>
        </header>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1300px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">구분</th>
                <th className="border border-slate-300 px-3 py-2 text-right">오늘</th>
                <th className="border border-slate-300 px-3 py-2 text-right">이번 달</th>
                <th className="border border-slate-300 px-3 py-2 text-right">건수/비율</th>
                <th className="border border-slate-300 px-3 py-2 text-center">바로가기</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="border border-slate-300 px-3 py-2 font-black">총 주문금액</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-bold">{money(todaySales)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-black">{money(totalSales)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-bold">{normalOrders.length}건</td>
                <td className="border border-slate-300 px-2 py-1 text-center">
                  <LinkButton href="/admin/product-orders">주문조회</LinkButton>
                </td>
              </tr>

              <tr className="bg-blue-50">
                <td className="border border-slate-300 px-3 py-2 font-black">플랫폼 수익</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-black text-blue-700">{money(todayRevenue)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-black text-blue-700">{money(totalRevenue)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-bold">평균 {pct(avgRate)}</td>
                <td className="border border-slate-300 px-2 py-1 text-center">
                  <LinkButton href="/admin/revenue/orders" tone="blue">수익원장</LinkButton>
                </td>
              </tr>

              <tr>
                <td className="border border-slate-300 px-3 py-2 font-black">업체 정산금</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-black text-emerald-700">{money(todaySettlement)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-black text-emerald-700">{money(totalSettlement)}</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-bold">대기 {pendingOrders.length}건</td>
                <td className="border border-slate-300 px-2 py-1 text-center">
                  <LinkButton href="/admin/settlements" tone="blue">정산처리</LinkButton>
                </td>
              </tr>

              <tr>
                <td className="border border-slate-300 px-3 py-2 font-black">업체별 현황</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-bold">-</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-bold">업체 단위 확인</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-bold">매출·수익·정산</td>
                <td className="border border-slate-300 px-2 py-1 text-center">
                  <LinkButton href="/admin/revenue/vendors">업체보기</LinkButton>
                </td>
              </tr>

              <tr className="bg-red-50">
                <td className="border border-slate-300 px-3 py-2 font-black text-red-700">오류 주문</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-black text-red-700">-</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-black text-red-700">{errorOrders.length}건</td>
                <td className="border border-slate-300 px-3 py-2 text-right font-bold text-red-700">수익 제외</td>
                <td className="border border-slate-300 px-2 py-1 text-center">
                  <LinkButton href="/admin/revenue/orders?status=error" tone="red">오류정리</LinkButton>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1300px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">수익원</th>
                <th className="border border-slate-300 px-3 py-2 text-left">설명</th>
                <th className="border border-slate-300 px-3 py-2 text-right">주문</th>
                <th className="border border-slate-300 px-3 py-2 text-right">주문금액</th>
                <th className="border border-slate-300 px-3 py-2 text-right">플랫폼 수익</th>
                <th className="border border-slate-300 px-3 py-2 text-right">평균 수익률</th>
                <th className="border border-slate-300 px-3 py-2 text-center">관리</th>
              </tr>
            </thead>

            <tbody>
              {sourceRows.map((row) => {
                const sales = sum(row.orders, (o) => o.orderAmount);
                const revenue = sum(row.orders, (o) => o.platformFeeAmount);
                const rate = sales > 0 ? revenue / sales : 0;

                return (
                  <tr key={row.label} className="hover:bg-yellow-50">
                    <td className="border border-slate-300 px-3 py-2 font-black">{row.label}</td>
                    <td className="border border-slate-300 px-3 py-2 font-bold">{row.desc}</td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-bold">{row.orders.length}</td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-bold">{money(sales)}</td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-black text-blue-700">{money(revenue)}</td>
                    <td className="border border-slate-300 px-3 py-2 text-right font-bold">{pct(rate)}</td>
                    <td className="border border-slate-300 px-2 py-1 text-center">
                      <LinkButton href={row.href}>보기</LinkButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto rounded border border-slate-300 bg-white">
          <table className="w-full min-w-[1300px] border-collapse text-sm">
            <thead>
              <tr className="bg-slate-200 text-slate-950">
                <th className="border border-slate-300 px-3 py-2 text-left">업무</th>
                <th className="border border-slate-300 px-3 py-2 text-left">설명</th>
                <th className="border border-slate-300 px-3 py-2 text-right">건수</th>
                <th className="border border-slate-300 px-3 py-2 text-right">금액</th>
                <th className="border border-slate-300 px-3 py-2 text-center">처리</th>
              </tr>
            </thead>

            <tbody>
              {taskRows.map((row) => (
                <tr key={row.label} className="hover:bg-yellow-50">
                  <td className="border border-slate-300 px-3 py-2 font-black">{row.label}</td>
                  <td className="border border-slate-300 px-3 py-2 font-bold">{row.desc}</td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-black">
                    {row.count > 0 ? `${row.count}건` : "-"}
                  </td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-black">
                    {row.amount > 0 ? money(row.amount) : "-"}
                  </td>
                  <td className="border border-slate-300 px-2 py-1 text-center">
                    <LinkButton href={row.href} tone={row.tone}>
                      {row.action}
                    </LinkButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}