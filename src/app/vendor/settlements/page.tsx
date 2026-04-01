"use client";

import { useEffect, useMemo, useState } from "react";

type SettlementItem = {
  billing_event_id: string;
  vendor_id: string;
  lead_id: string | null;
  event_type: string;
  amount_krw: number;
  status: string;
  description: string | null;
  meta: any;
  created_at: string | null;
};

type SettlementResponse = {
  summary: {
    total_count: number;
    pending_count: number;
    paid_count: number;
    pending_amount_krw: number;
    paid_amount_krw: number;
    total_amount_krw: number;
  };
  items: SettlementItem[];
};

function fmtKrw(value?: number | null) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function fmtDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
}

function badgeClass(status?: string) {
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

function eventLabel(eventType?: string) {
  switch (eventType) {
    case "lead_accept_fee":
      return "상담 수락 과금";
    case "deal_commission":
      return "거래 수수료";
    case "manual_adjustment":
      return "수동 조정";
    default:
      return eventType || "-";
  }
}

export default function VendorSettlementsPage() {
  const [data, setData] = useState<SettlementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [statusFilter, q]);

  async function loadItems() {
    setLoading(true);
    setMessage("");

    try {
      const url = queryString
        ? `/api/vendor/settlements?${queryString}`
        : "/api/vendor/settlements";

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "정산 내역을 불러오지 못했습니다.");
      }

      setData({
        summary: json.summary,
        items: json.items || [],
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "정산 내역을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [queryString]);

  const summary = data?.summary || {
    total_count: 0,
    pending_count: 0,
    paid_count: 0,
    pending_amount_krw: 0,
    paid_amount_krw: 0,
    total_amount_krw: 0,
  };

  const items = data?.items || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-black text-emerald-700">VENDOR SETTLEMENTS</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            정산 내역
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            상담 수락 과금과 거래 수수료 내역을 확인합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={loadItems}
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-800"
        >
          새로고침
        </button>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-5">
        <SummaryBox title="전체 건수" value={String(summary.total_count)} />
        <SummaryBox title="청구 예정 건수" value={String(summary.pending_count)} />
        <SummaryBox title="입금 완료 건수" value={String(summary.paid_count)} />
        <SummaryBox title="청구 예정 금액" value={fmtKrw(summary.pending_amount_krw)} />
        <SummaryBox title="총 누적 금액" value={fmtKrw(summary.total_amount_krw)} />
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <div className="mb-2 text-sm font-black text-slate-800">상태</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-black"
            >
              <option value="all">전체</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>

          <label className="block md:col-span-3">
            <div className="mb-2 text-sm font-black text-slate-800">검색</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="과금 유형 / 설명"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-black"
            />
          </label>
        </div>
      </section>

      {message ? (
        <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {message}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-black text-slate-800">유형</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">금액</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">상태</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">설명</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">리드ID</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">생성일</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    불러오는 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    정산 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.billing_event_id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {eventLabel(row.event_type)}
                    </td>
                    <td className="px-4 py-3 font-black text-slate-900">
                      {fmtKrw(row.amount_krw)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${badgeClass(
                          row.status
                        )}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.description || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {row.lead_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {fmtDateTime(row.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function SummaryBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}