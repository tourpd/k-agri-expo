import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RevenueLeadRow = {
  id: string;
  company_name?: string | null;
  contact_name?: string | null;
  vendor_id?: string | null;
  deal_amount_krw?: number | null;
  commission_rate?: number | null;
  commission_amount_krw?: number | null;
  net_revenue_krw?: number | null;
  contract_status?: string | null;
  contracted_at?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

type VendorRow = {
  id: string;
  company_name?: string | null;
};

type RangeKey = "this_month" | "last_month" | "this_year" | "all";

type VendorStat = {
  vendor_name: string;
  deal_count: number;
  paid_count: number;
  total_amount: number;
  paid_amount: number;
  total_commission: number;
  total_net_revenue: number;
};

function formatWon(value?: number | null) {
  return `${Number(value || 0).toLocaleString()}원`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function contractStatusLabel(value?: string | null) {
  switch (value) {
    case "none":
      return "미등록";
    case "verbal":
      return "구두합의";
    case "contract_sent":
      return "계약서발송";
    case "contracted":
      return "계약완료";
    case "paid":
      return "입금완료";
    case "closed":
      return "종결";
    default:
      return value || "-";
  }
}

function getRangeLabel(range: RangeKey) {
  switch (range) {
    case "this_month":
      return "이번 달";
    case "last_month":
      return "지난 달";
    case "this_year":
      return "올해";
    case "all":
      return "전체";
    default:
      return "이번 달";
  }
}

function getRangeDates(range: RangeKey, now: Date) {
  if (range === "this_month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  if (range === "last_month") {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }

  if (range === "this_year") {
    return {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear() + 1, 0, 1),
    };
  }

  return {
    start: null,
    end: null,
  };
}

export default async function AdminRevenuePage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string }>;
}) {
  const resolved = (await searchParams) || {};
  const requestedRange = resolved.range;

  const range: RangeKey =
    requestedRange === "last_month" ||
    requestedRange === "this_year" ||
    requestedRange === "all"
      ? requestedRange
      : "this_month";

  const supabase = createSupabaseAdminClient();
  const now = new Date();
  const { start, end } = getRangeDates(range, now);

  let query = supabase
    .from("deal_leads")
    .select(`
      id,
      company_name,
      contact_name,
      vendor_id,
      deal_amount_krw,
      commission_rate,
      commission_amount_krw,
      net_revenue_krw,
      contract_status,
      contracted_at,
      paid_at,
      created_at
    `)
    .eq("lead_stage", "won")
    .order("contracted_at", { ascending: false });

  if (start) {
    query = query.gte("contracted_at", start.toISOString());
  }

  if (end) {
    query = query.lt("contracted_at", end.toISOString());
  }

  const { data: revenueRows, error: revenueError } = await query;

  if (revenueError) {
    throw new Error(`매출 데이터 조회 실패: ${revenueError.message}`);
  }

  const rows = (revenueRows || []) as RevenueLeadRow[];

  const vendorIds = Array.from(
    new Set(rows.map((row) => row.vendor_id).filter(Boolean))
  ) as string[];

  const vendorMap = new Map<string, string>();

  if (vendorIds.length > 0) {
    const { data: vendorRows, error: vendorError } = await supabase
      .from("vendors")
      .select("id, company_name")
      .in("id", vendorIds);

    if (vendorError) {
      throw new Error(`벤더 조회 실패: ${vendorError.message}`);
    }

    (vendorRows || []).forEach((vendor: VendorRow) => {
      vendorMap.set(vendor.id, vendor.company_name || vendor.id);
    });
  }

  const totalDeals = rows.length;
  const totalAmount = rows.reduce(
    (sum, row) => sum + Number(row.deal_amount_krw || 0),
    0
  );
  const totalCommission = rows.reduce(
    (sum, row) => sum + Number(row.commission_amount_krw || 0),
    0
  );
  const totalNetRevenue = rows.reduce(
    (sum, row) => sum + Number(row.net_revenue_krw || 0),
    0
  );

  const paidRows = rows.filter((row) => row.contract_status === "paid");
  const paidCount = paidRows.length;
  const paidAmount = paidRows.reduce(
    (sum, row) => sum + Number(row.deal_amount_krw || 0),
    0
  );

  const statusCounts = rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.contract_status || "none";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const vendorStatsMap = new Map<string, VendorStat>();

  rows.forEach((row) => {
    const vendorId = row.vendor_id || "unknown";
    const vendorName = row.vendor_id
      ? vendorMap.get(row.vendor_id) || row.vendor_id
      : "미지정 벤더";

    if (!vendorStatsMap.has(vendorId)) {
      vendorStatsMap.set(vendorId, {
        vendor_name: vendorName,
        deal_count: 0,
        paid_count: 0,
        total_amount: 0,
        paid_amount: 0,
        total_commission: 0,
        total_net_revenue: 0,
      });
    }

    const stat = vendorStatsMap.get(vendorId)!;
    stat.deal_count += 1;
    stat.total_amount += Number(row.deal_amount_krw || 0);
    stat.total_commission += Number(row.commission_amount_krw || 0);
    stat.total_net_revenue += Number(row.net_revenue_krw || 0);

    if (row.contract_status === "paid") {
      stat.paid_count += 1;
      stat.paid_amount += Number(row.deal_amount_krw || 0);
    }
  });

  const vendorStats = Array.from(vendorStatsMap.values()).sort(
    (a, b) => b.total_commission - a.total_commission
  );

  const topVendorCommissionData = vendorStats.slice(0, 5).map((vendor) => ({
    label: vendor.vendor_name,
    value: vendor.total_commission,
  }));

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">매출 대시보드</h1>
            <p className="mt-1 text-sm text-neutral-600">
              {getRangeLabel(range)} 성사 건, 입금 현황, 수수료/순매출을 확인합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <RangeTab
              href="/admin/revenue?range=this_month"
              active={range === "this_month"}
            >
              이번 달
            </RangeTab>
            <RangeTab
              href="/admin/revenue?range=last_month"
              active={range === "last_month"}
            >
              지난 달
            </RangeTab>
            <RangeTab
              href="/admin/revenue?range=this_year"
              active={range === "this_year"}
            >
              올해
            </RangeTab>
            <RangeTab href="/admin/revenue?range=all" active={range === "all"}>
              전체
            </RangeTab>

            <Link
              href={`/api/admin/revenue/export?range=${range}`}
              className="rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              CSV 다운로드
            </Link>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard
            title={`${getRangeLabel(range)} 성사 건수`}
            value={`${totalDeals}건`}
          />
          <MetricCard title="총 계약금액" value={formatWon(totalAmount)} />
          <MetricCard title="총 수수료" value={formatWon(totalCommission)} />
          <MetricCard title="순매출" value={formatWon(totalNetRevenue)} />
          <MetricCard title="입금완료 건수" value={`${paidCount}건`} />
          <MetricCard title="입금완료 금액" value={formatWon(paidAmount)} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-lg font-semibold">최근 성사 리스트</div>

              {rows.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  선택한 기간의 성사 데이터가 없습니다.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200 text-left text-neutral-500">
                        <th className="px-3 py-3">계약일</th>
                        <th className="px-3 py-3">회사명</th>
                        <th className="px-3 py-3">담당자</th>
                        <th className="px-3 py-3">벤더</th>
                        <th className="px-3 py-3">계약금액</th>
                        <th className="px-3 py-3">수수료</th>
                        <th className="px-3 py-3">순매출</th>
                        <th className="px-3 py-3">계약상태</th>
                        <th className="px-3 py-3">입금일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id} className="border-b border-neutral-100">
                          <td className="px-3 py-3">{formatDate(row.contracted_at)}</td>
                          <td className="px-3 py-3 font-medium">
                            {row.company_name || "-"}
                          </td>
                          <td className="px-3 py-3">{row.contact_name || "-"}</td>
                          <td className="px-3 py-3">
                            {row.vendor_id
                              ? vendorMap.get(row.vendor_id) || row.vendor_id
                              : "-"}
                          </td>
                          <td className="px-3 py-3">{formatWon(row.deal_amount_krw)}</td>
                          <td className="px-3 py-3">
                            {formatWon(row.commission_amount_krw)}
                          </td>
                          <td className="px-3 py-3">
                            {formatWon(row.net_revenue_krw)}
                          </td>
                          <td className="px-3 py-3">
                            {contractStatusLabel(row.contract_status)}
                          </td>
                          <td className="px-3 py-3">{formatDate(row.paid_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-lg font-semibold">벤더 수수료 TOP5</div>

              {topVendorCommissionData.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  차트 데이터가 없습니다.
                </div>
              ) : (
                <SimpleBarChart data={topVendorCommissionData} />
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-lg font-semibold">계약 상태별 건수</div>

              <div className="space-y-3">
                {Object.keys(statusCounts).length === 0 ? (
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                    상태별 집계가 없습니다.
                  </div>
                ) : (
                  Object.entries(statusCounts).map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between rounded-2xl border border-neutral-200 px-4 py-3"
                    >
                      <span className="font-medium text-neutral-700">
                        {contractStatusLabel(status)}
                      </span>
                      <span className="font-bold text-neutral-900">{count}건</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="mb-4 text-lg font-semibold">벤더별 성과</div>

              {vendorStats.length === 0 ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  벤더별 집계가 없습니다.
                </div>
              ) : (
                <div className="space-y-3">
                  {vendorStats.map((vendor, idx) => (
                    <div
                      key={`${vendor.vendor_name}-${idx}`}
                      className="rounded-2xl border border-neutral-200 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">{vendor.vendor_name}</div>
                        <div className="text-sm text-neutral-500">
                          성사 {vendor.deal_count}건 / 입금 {vendor.paid_count}건
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-sm text-neutral-700">
                        <div className="flex items-center justify-between">
                          <span>총 계약금액</span>
                          <span className="font-medium">
                            {formatWon(vendor.total_amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>입금완료 금액</span>
                          <span className="font-medium">
                            {formatWon(vendor.paid_amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>총 수수료</span>
                          <span className="font-medium">
                            {formatWon(vendor.total_commission)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>순매출</span>
                          <span className="font-medium">
                            {formatWon(vendor.total_net_revenue)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-neutral-500">{title}</div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-neutral-900">
        {value}
      </div>
    </div>
  );
}

function RangeTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-black text-white"
          : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50"
      }`}
    >
      {children}
    </Link>
  );
}

function SimpleBarChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="space-y-4">
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-neutral-700">
              {d.label}
            </span>
            <span className="shrink-0 font-semibold text-neutral-900">
              {d.value.toLocaleString()}원
            </span>
          </div>
          <div className="h-3 rounded-full bg-neutral-200">
            <div
              className="h-3 rounded-full bg-black"
              style={{ width: `${(d.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}