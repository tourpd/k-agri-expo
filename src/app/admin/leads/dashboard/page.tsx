"use client";

import { useEffect, useState } from "react";

type DashboardResponse = {
  success: boolean;
  month_label: string;
  summary: {
    total_leads: number;
    new_count: number;
    contacted_count: number;
    quoted_count: number;
    won_count: number;
    lost_count: number;
    closed_count: number;
    total_sales: number;
    total_commission: number;
  };
  by_source: { source_type: string; count: number }[];
  by_status: { status: string; count: number }[];
  by_crop: { crop_name: string; count: number }[];
  by_vendor: {
    vendor_id: string;
    total_leads: number;
    won_count: number;
    total_sales: number;
    total_commission: number;
  }[];
};

function formatKrw(value?: number | null) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

export default function AdminLeadsDashboardPage() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [message, setMessage] = useState("");

  async function loadDashboard(offset = 0) {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `/api/admin/booth-leads/dashboard?month_offset=${offset}`,
        { cache: "no-store" }
      );
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "대시보드 조회 실패");
      }

      setData(json);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "대시보드 조회 실패"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard(monthOffset);
  }, [monthOffset]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">월 매출 대시보드</h1>
          <p className="mt-2 text-sm text-neutral-600">
            상담, 거래 성사, 수수료를 월 단위로 집계합니다.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMonthOffset((prev) => prev - 1)}
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            이전 달
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset(0)}
            className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            이번 달
          </button>
        </div>
      </div>

      {data && (
        <div className="mt-4 text-lg font-bold text-emerald-700">
          {data.month_label}
        </div>
      )}

      {message && (
        <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}

      {loading ? (
        <div className="mt-10 text-neutral-500">불러오는 중...</div>
      ) : data ? (
        <>
          <section className="mt-6 grid gap-4 md:grid-cols-5">
            <SummaryBox title="상담 건수" value={String(data.summary.total_leads)} />
            <SummaryBox title="거래 성사" value={String(data.summary.won_count)} />
            <SummaryBox title="총 거래액" value={formatKrw(data.summary.total_sales)} />
            <SummaryBox
              title="총 수수료"
              value={formatKrw(data.summary.total_commission)}
            />
            <SummaryBox
              title="견적 진행"
              value={String(data.summary.quoted_count)}
            />
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <Card title="상태별 건수">
              <SimpleTable
                headers={["상태", "건수"]}
                rows={data.by_status.map((x) => [x.status, String(x.count)])}
              />
            </Card>

            <Card title="유입 경로별 건수">
              <SimpleTable
                headers={["유입 경로", "건수"]}
                rows={data.by_source.map((x) => [x.source_type, String(x.count)])}
              />
            </Card>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-2">
            <Card title="작물별 상담 TOP 10">
              <SimpleTable
                headers={["작물", "건수"]}
                rows={data.by_crop.map((x) => [x.crop_name, String(x.count)])}
              />
            </Card>

            <Card title="업체별 실적">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">vendor_id</th>
                      <th className="px-4 py-3 text-left font-semibold">상담</th>
                      <th className="px-4 py-3 text-left font-semibold">성사</th>
                      <th className="px-4 py-3 text-left font-semibold">거래액</th>
                      <th className="px-4 py-3 text-left font-semibold">수수료</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_vendor.map((row) => (
                      <tr key={row.vendor_id} className="border-t border-neutral-100">
                        <td className="px-4 py-3">{row.vendor_id}</td>
                        <td className="px-4 py-3">{row.total_leads}</td>
                        <td className="px-4 py-3">{row.won_count}</td>
                        <td className="px-4 py-3">{formatKrw(row.total_sales)}</td>
                        <td className="px-4 py-3">{formatKrw(row.total_commission)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </>
      ) : null}
    </main>
  );
}

function SummaryBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5">
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5">
      <div className="mb-4 text-lg font-semibold">{title}</div>
      {children}
    </div>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-neutral-100">
              {row.map((cell, cidx) => (
                <td key={cidx} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}