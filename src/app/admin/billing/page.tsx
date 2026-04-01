"use client";

import { useEffect, useMemo, useState } from "react";

type BillingItem = {
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

type VendorBillingGroup = {
  vendor_id: string;
  company_name: string;
  email: string;
  contact_name: string;
  plan_type: string;
  category_primary: string;
  total_count: number;
  pending_count: number;
  paid_count: number;
  pending_amount_krw: number;
  paid_amount_krw: number;
  total_amount_krw: number;
  items: BillingItem[];
};

type BillingResponse = {
  summary: {
    vendor_count: number;
    billing_count: number;
    pending_amount_krw: number;
    paid_amount_krw: number;
    total_amount_krw: number;
  };
  vendors: VendorBillingGroup[];
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

function statusBadgeClass(status?: string) {
  if (status === "paid") return "bg-emerald-100 text-emerald-700";
  if (status === "cancelled") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
}

export default function AdminBillingPage() {
  const [data, setData] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<VendorBillingGroup | null>(null);
  const [busyVendorId, setBusyVendorId] = useState("");

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
        ? `/api/admin/billing?${queryString}`
        : "/api/admin/billing";

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "청구 목록을 불러오지 못했습니다.");
      }

      setData({
        summary: json.summary,
        vendors: json.vendors || [],
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "청구 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [queryString]);

  async function markPaid(vendorId: string) {
    const ok = window.confirm("이 업체의 pending 청구를 모두 입금 완료 처리할까요?");
    if (!ok) return;

    try {
      setBusyVendorId(vendorId);
      setMessage("");

      const res = await fetch("/api/admin/billing/mark-paid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vendor_id: vendorId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "입금 완료 처리에 실패했습니다.");
      }

      await loadItems();

      if (selected?.vendor_id === vendorId) {
        setSelected(null);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "입금 완료 처리에 실패했습니다."
      );
    } finally {
      setBusyVendorId("");
    }
  }

  const summary = data?.summary || {
    vendor_count: 0,
    billing_count: 0,
    pending_amount_krw: 0,
    paid_amount_krw: 0,
    total_amount_krw: 0,
  };

  const vendors = data?.vendors || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-black text-emerald-700">ADMIN BILLING</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            업체 청구 대시보드
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            업체별 리드 과금, 청구 예정 금액, 입금 완료 금액을 한 번에 확인합니다.
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
        <SummaryBox title="업체 수" value={String(summary.vendor_count)} />
        <SummaryBox title="과금 건수" value={String(summary.billing_count)} />
        <SummaryBox title="청구 예정" value={fmtKrw(summary.pending_amount_krw)} />
        <SummaryBox title="입금 완료" value={fmtKrw(summary.paid_amount_krw)} />
        <SummaryBox title="총 과금액" value={fmtKrw(summary.total_amount_krw)} />
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
              placeholder="업체명 / 이메일 / 담당자 / 카테고리"
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
                <th className="px-4 py-3 text-left font-black text-slate-800">업체</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">플랜</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">건수</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">청구 예정</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">입금 완료</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">총액</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">관리</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    불러오는 중...
                  </td>
                </tr>
              ) : vendors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    청구 데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                vendors.map((item) => (
                  <tr
                    key={item.vendor_id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-900">{item.company_name}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.email || "-"}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">{item.plan_type || "basic"}</td>

                    <td className="px-4 py-3 text-slate-700">{item.total_count}건</td>

                    <td className="px-4 py-3 font-black text-amber-700">
                      {fmtKrw(item.pending_amount_krw)}
                    </td>

                    <td className="px-4 py-3 font-black text-emerald-700">
                      {fmtKrw(item.paid_amount_krw)}
                    </td>

                    <td className="px-4 py-3 font-black text-slate-900">
                      {fmtKrw(item.total_amount_krw)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {item.pending_amount_krw > 0 ? (
                          <button
                            type="button"
                            onClick={() => markPaid(item.vendor_id)}
                            disabled={busyVendorId === item.vendor_id}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                          >
                            {busyVendorId === item.vendor_id
                              ? "처리 중..."
                              : "입금 완료"}
                          </button>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
                            완료됨
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black text-slate-800"
                        >
                          상세
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto mt-8 max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  {selected.company_name}
                </h2>
                <div className="mt-2 text-sm text-slate-600">
                  {selected.email || "-"} / {selected.plan_type || "basic"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-black text-slate-800"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <SummaryBox title="총 건수" value={String(selected.total_count)} />
              <SummaryBox title="청구 예정" value={fmtKrw(selected.pending_amount_krw)} />
              <SummaryBox title="입금 완료" value={fmtKrw(selected.paid_amount_krw)} />
              <SummaryBox title="총액" value={fmtKrw(selected.total_amount_krw)} />
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-black text-slate-800">유형</th>
                      <th className="px-4 py-3 text-left font-black text-slate-800">금액</th>
                      <th className="px-4 py-3 text-left font-black text-slate-800">상태</th>
                      <th className="px-4 py-3 text-left font-black text-slate-800">설명</th>
                      <th className="px-4 py-3 text-left font-black text-slate-800">생성일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((row) => (
                      <tr key={row.billing_event_id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-slate-700">{row.event_type}</td>
                        <td className="px-4 py-3 font-black text-slate-900">
                          {fmtKrw(row.amount_krw)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${statusBadgeClass(
                              row.status
                            )}`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {row.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {fmtDateTime(row.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              {selected.pending_amount_krw > 0 ? (
                <button
                  type="button"
                  onClick={() => markPaid(selected.vendor_id)}
                  disabled={busyVendorId === selected.vendor_id}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"
                >
                  {busyVendorId === selected.vendor_id
                    ? "입금 처리 중..."
                    : "이 업체 입금 완료 처리"}
                </button>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-black text-slate-500">
                  pending 항목 없음
                </div>
              )}

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
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