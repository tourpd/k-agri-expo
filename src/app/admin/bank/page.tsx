"use client";

import { useEffect, useMemo, useState } from "react";

type TxItem = {
  tx_id: string;
  amount_krw: number;
  depositor_name: string | null;
  deposited_at: string | null;
  matched: boolean;
  matched_order_id: string | null;
  matched_at: string | null;
  match_note: string | null;
  raw_data: any;
  created_at: string | null;
  matched_order?: {
    order_id: string;
    event_id: string;
    farmer_name: string;
    farmer_phone: string;
    depositor_name: string | null;
    total_amount_krw: number;
    payment_status: string;
    created_at: string | null;
  } | null;
};

type ResponseShape = {
  summary: {
    total_count: number;
    matched_count: number;
    unmatched_count: number;
    total_amount_krw: number;
  };
  items: TxItem[];
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

export default function AdminBankPage() {
  const [data, setData] = useState<ResponseShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [matchedFilter, setMatchedFilter] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<TxItem | null>(null);
  const [matching, setMatching] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (matchedFilter !== "all") params.set("matched", matchedFilter);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [matchedFilter, q]);

  async function loadItems() {
    setLoading(true);
    setMessage("");
    try {
      const url = queryString
        ? `/api/admin/bank/transactions?${queryString}`
        : "/api/admin/bank/transactions";

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "입금 로그를 불러오지 못했습니다.");
      }

      setData({
        summary: json.summary,
        items: json.items || [],
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "입금 로그를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  async function runAutoMatch() {
    try {
      setMatching(true);
      setMessage("");

      const res = await fetch("/api/admin/bank/match", { method: "POST" });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "자동 매칭 실패");
      }

      await loadItems();
      setMessage(`자동 매칭 완료: ${json.matched}건 매칭, ${json.skipped}건 보류`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "자동 매칭 실패");
    } finally {
      setMatching(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [queryString]);

  const summary = data?.summary || {
    total_count: 0,
    matched_count: 0,
    unmatched_count: 0,
    total_amount_krw: 0,
  };

  const items = data?.items || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-black text-emerald-700">ADMIN BANK LOGS</div>
          <h1 className="mt-2 text-3xl font-black text-slate-900">입금 로그 관리</h1>
          <p className="mt-2 text-sm text-slate-600">
            통장 입금 내역과 주문 매칭 상태를 확인합니다.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadItems}
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-black"
          >
            새로고침
          </button>
          <button
            type="button"
            onClick={runAutoMatch}
            disabled={matching}
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-black text-white"
          >
            {matching ? "매칭 중..." : "입금 자동 매칭"}
          </button>
        </div>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <SummaryBox title="전체 입금" value={String(summary.total_count)} />
        <SummaryBox title="매칭 완료" value={String(summary.matched_count)} />
        <SummaryBox title="미매칭" value={String(summary.unmatched_count)} />
        <SummaryBox title="총 입금액" value={fmtKrw(summary.total_amount_krw)} />
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <div className="mb-2 text-sm font-black">매칭 여부</div>
            <select
              value={matchedFilter}
              onChange={(e) => setMatchedFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="all">전체</option>
              <option value="true">매칭됨</option>
              <option value="false">미매칭</option>
            </select>
          </label>

          <label className="block md:col-span-3">
            <div className="mb-2 text-sm font-black">검색</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="입금자명 / 매칭 메모"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            />
          </label>
        </div>
      </section>

      {message ? (
        <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
          {message}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-black">입금자명</th>
                <th className="px-4 py-3 text-left font-black">금액</th>
                <th className="px-4 py-3 text-left font-black">입금시각</th>
                <th className="px-4 py-3 text-left font-black">매칭</th>
                <th className="px-4 py-3 text-left font-black">주문</th>
                <th className="px-4 py-3 text-left font-black">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center">불러오는 중...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center">입금 로그가 없습니다.</td></tr>
              ) : items.map((item) => (
                <tr key={item.tx_id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold">{item.depositor_name || "-"}</td>
                  <td className="px-4 py-3 font-black">{fmtKrw(item.amount_krw)}</td>
                  <td className="px-4 py-3 text-slate-500">{fmtDateTime(item.deposited_at || item.created_at)}</td>
                  <td className="px-4 py-3">
                    {item.matched ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">
                        매칭됨
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-700">
                        미매칭
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.matched_order?.order_id || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black"
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto mt-8 max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black">입금 상세</h2>
                <div className="mt-2 text-sm text-slate-500">{selected.tx_id}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-black"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <DetailCard
                title="입금 정보"
                rows={[
                  ["입금자명", selected.depositor_name || "-"],
                  ["입금 금액", fmtKrw(selected.amount_krw)],
                  ["입금 시각", fmtDateTime(selected.deposited_at || selected.created_at)],
                  ["매칭 여부", selected.matched ? "예" : "아니오"],
                  ["매칭 시각", fmtDateTime(selected.matched_at)],
                ]}
              />

              <DetailCard
                title="매칭 주문"
                rows={[
                  ["주문번호", selected.matched_order?.order_id || "-"],
                  ["주문자", selected.matched_order?.farmer_name || "-"],
                  ["주문자 연락처", selected.matched_order?.farmer_phone || "-"],
                  ["주문 금액", fmtKrw(selected.matched_order?.total_amount_krw || 0)],
                  ["결제 상태", selected.matched_order?.payment_status || "-"],
                ]}
              />
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 p-5">
              <div className="mb-2 text-lg font-black">매칭 메모</div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap">
                {selected.match_note || "-"}
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-slate-200 p-5">
              <div className="mb-2 text-lg font-black">원본 데이터</div>
              <pre className="overflow-x-auto text-xs text-slate-700">
                {JSON.stringify(selected.raw_data || {}, null, 2)}
              </pre>
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
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function DetailCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-3xl border border-slate-200 p-5">
      <div className="mb-4 text-lg font-black">{title}</div>
      <div className="space-y-3">
        {rows.map(([k, v]) => (
          <div
            key={`${title}-${k}-${v}`}
            className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 text-sm"
          >
            <div className="text-slate-500">{k}</div>
            <div className="max-w-[70%] break-words text-right font-semibold">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
