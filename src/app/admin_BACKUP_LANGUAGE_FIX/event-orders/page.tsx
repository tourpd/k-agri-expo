"use client";

import { useEffect, useMemo, useState } from "react";

type EventInfo = {
  event_id: string;
  title: string;
  product_name: string;
  vendor_id: string | null;
  normal_price_krw: number | null;
  expo_price_krw: number | null;
  total_quantity: number | null;
  sold_quantity: number | null;
  reserved_quantity: number | null;
  is_active: boolean | null;
  is_closed_early: boolean | null;
  end_at: string | null;
} | null;

type OrderItem = {
  order_id: string;
  event_id: string;
  vendor_id: string | null;
  farmer_session_id: string | null;
  farmer_name: string;
  farmer_phone: string;
  crop_name: string | null;
  quantity: number;
  unit_price_krw: number;
  total_amount_krw: number;
  order_status: string;
  payment_status: string;
  shipping_status: string;
  receiver_name: string | null;
  receiver_phone: string | null;
  zipcode: string | null;
  address1: string | null;
  address2: string | null;
  is_agri_manager: boolean | null;
  agri_manager_no: string | null;
  depositor_name: string | null;
  note: string | null;
  created_at: string | null;
  updated_at: string | null;
  event: EventInfo;
};

type ResponseShape = {
  summary: {
    total_count: number;
    pending_payment_count: number;
    paid_count: number;
    preparing_count: number;
    shipped_count: number;
    total_amount_krw: number;
  };
  items: OrderItem[];
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

function statusClass(value?: string) {
  if (value === "paid" || value === "confirmed" || value === "shipped") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (value === "preparing") {
    return "bg-blue-100 text-blue-700";
  }
  if (value === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }
  return "bg-amber-100 text-amber-700";
}

export default function AdminEventOrdersPage() {
  const [data, setData] = useState<ResponseShape | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [paymentStatus, setPaymentStatus] = useState("all");
  const [shippingStatus, setShippingStatus] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<OrderItem | null>(null);
  const [busyOrderId, setBusyOrderId] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (orderStatus !== "all") params.set("order_status", orderStatus);
    if (paymentStatus !== "all") params.set("payment_status", paymentStatus);
    if (shippingStatus !== "all") params.set("shipping_status", shippingStatus);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [orderStatus, paymentStatus, shippingStatus, q]);

  async function loadItems() {
    setLoading(true);
    setMessage("");

    try {
      const url = queryString
        ? `/api/admin/event-orders?${queryString}`
        : "/api/admin/event-orders";

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "주문 목록을 불러오지 못했습니다.");
      }

      setData({
        summary: json.summary,
        items: json.items || [],
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "주문 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [queryString]);

  async function updateOrder(orderId: string, action: string) {
    try {
      setBusyOrderId(orderId);
      setMessage("");

      const res = await fetch("/api/admin/event-orders/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          action,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "상태 변경에 실패했습니다.");
      }

      await loadItems();
      if (selected?.order_id === orderId) {
        setSelected(null);
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "상태 변경에 실패했습니다."
      );
    } finally {
      setBusyOrderId("");
    }
  }

  const summary = data?.summary || {
    total_count: 0,
    pending_payment_count: 0,
    paid_count: 0,
    preparing_count: 0,
    shipped_count: 0,
    total_amount_krw: 0,
  };

  const items = data?.items || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-black text-emerald-700">ADMIN EVENT ORDERS</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            공동이벤트 주문관리
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            주문, 입금, 출고 상태를 한 화면에서 관리합니다.
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

      <section className="mt-6 grid gap-4 md:grid-cols-6">
        <SummaryBox title="전체 주문" value={String(summary.total_count)} />
        <SummaryBox title="입금대기" value={String(summary.pending_payment_count)} />
        <SummaryBox title="입금완료" value={String(summary.paid_count)} />
        <SummaryBox title="출고준비" value={String(summary.preparing_count)} />
        <SummaryBox title="출고완료" value={String(summary.shipped_count)} />
        <SummaryBox title="총 주문액" value={fmtKrw(summary.total_amount_krw)} />
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <div className="mb-2 text-sm font-black text-slate-800">주문 상태</div>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="all">전체</option>
              <option value="pending">pending</option>
              <option value="confirmed">confirmed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-black text-slate-800">입금 상태</div>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="all">전체</option>
              <option value="pending">pending</option>
              <option value="paid">paid</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-black text-slate-800">출고 상태</div>
            <select
              value={shippingStatus}
              onChange={(e) => setShippingStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            >
              <option value="all">전체</option>
              <option value="pending">pending</option>
              <option value="preparing">preparing</option>
              <option value="shipped">shipped</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-black text-slate-800">검색</div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="주문자 / 연락처 / 입금자명 / 주소"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3"
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
                <th className="px-4 py-3 text-left font-black text-slate-800">이벤트</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">주문자</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">수량</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">주문금액</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">입금</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">출고</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">주문일</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">관리</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    불러오는 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    주문이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.order_id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-black text-slate-900">
                        {item.event?.title || item.event?.product_name || "-"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.event?.product_name || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{item.farmer_name}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.farmer_phone}</div>
                    </td>

                    <td className="px-4 py-3 text-slate-700">{item.quantity}</td>

                    <td className="px-4 py-3 font-black text-slate-900">
                      {fmtKrw(item.total_amount_krw)}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${statusClass(item.payment_status)}`}>
                        {item.payment_status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${statusClass(item.shipping_status)}`}>
                        {item.shipping_status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-500">{fmtDateTime(item.created_at)}</td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {item.payment_status !== "paid" && item.order_status !== "cancelled" ? (
                          <button
                            type="button"
                            onClick={() => updateOrder(item.order_id, "mark_paid")}
                            disabled={busyOrderId === item.order_id}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white"
                          >
                            {busyOrderId === item.order_id ? "처리 중..." : "입금 확인"}
                          </button>
                        ) : null}

                        {item.payment_status === "paid" && item.shipping_status === "pending" ? (
                          <button
                            type="button"
                            onClick={() => updateOrder(item.order_id, "mark_preparing")}
                            disabled={busyOrderId === item.order_id}
                            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white"
                          >
                            {busyOrderId === item.order_id ? "처리 중..." : "출고 준비"}
                          </button>
                        ) : null}

                        {item.payment_status === "paid" && item.shipping_status === "preparing" ? (
                          <button
                            type="button"
                            onClick={() => updateOrder(item.order_id, "mark_shipped")}
                            disabled={busyOrderId === item.order_id}
                            className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
                          >
                            {busyOrderId === item.order_id ? "처리 중..." : "출고 완료"}
                          </button>
                        ) : null}

                        {item.order_status !== "cancelled" && item.payment_status !== "paid" ? (
                          <button
                            type="button"
                            onClick={() => updateOrder(item.order_id, "cancel_order")}
                            disabled={busyOrderId === item.order_id}
                            className="rounded-xl border border-rose-300 px-3 py-2 text-xs font-black text-rose-700"
                          >
                            주문 취소
                          </button>
                        ) : null}

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
                <h2 className="text-2xl font-black text-slate-900">주문 상세</h2>
                <div className="mt-2 text-sm text-slate-600">{selected.order_id}</div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-black text-slate-800"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <DetailCard
                title="이벤트 정보"
                rows={[
                  ["이벤트", selected.event?.title || "-"],
                  ["상품", selected.event?.product_name || "-"],
                  ["행사가", fmtKrw(selected.event?.expo_price_krw)],
                  ["총 수량", String(selected.event?.total_quantity || 0)],
                  ["예약 수량", String(selected.event?.reserved_quantity || 0)],
                ]}
              />

              <DetailCard
                title="주문 정보"
                rows={[
                  ["주문자", selected.farmer_name || "-"],
                  ["주문자 연락처", selected.farmer_phone || "-"],
                  ["작물", selected.crop_name || "-"],
                  ["수량", String(selected.quantity || 0)],
                  ["총 금액", fmtKrw(selected.total_amount_krw)],
                ]}
              />

              <DetailCard
                title="배송 정보"
                rows={[
                  ["받는 분", selected.receiver_name || "-"],
                  ["받는 분 연락처", selected.receiver_phone || "-"],
                  ["우편번호", selected.zipcode || "-"],
                  ["주소", `${selected.address1 || ""} ${selected.address2 || ""}`.trim() || "-"],
                  ["요청사항", selected.note || "-"],
                ]}
              />

              <DetailCard
                title="결제/출고 정보"
                rows={[
                  ["주문 상태", selected.order_status || "-"],
                  ["입금 상태", selected.payment_status || "-"],
                  ["출고 상태", selected.shipping_status || "-"],
                  ["입금자명", selected.depositor_name || "-"],
                  ["농업경영체", selected.is_agri_manager ? "예" : "아니오"],
                ]}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {selected.payment_status !== "paid" && selected.order_status !== "cancelled" ? (
                <button
                  type="button"
                  onClick={() => updateOrder(selected.order_id, "mark_paid")}
                  disabled={busyOrderId === selected.order_id}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white"
                >
                  {busyOrderId === selected.order_id ? "처리 중..." : "입금 확인"}
                </button>
              ) : null}

              {selected.payment_status === "paid" && selected.shipping_status === "pending" ? (
                <button
                  type="button"
                  onClick={() => updateOrder(selected.order_id, "mark_preparing")}
                  disabled={busyOrderId === selected.order_id}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white"
                >
                  {busyOrderId === selected.order_id ? "처리 중..." : "출고 준비"}
                </button>
              ) : null}

              {selected.payment_status === "paid" && selected.shipping_status === "preparing" ? (
                <button
                  type="button"
                  onClick={() => updateOrder(selected.order_id, "mark_shipped")}
                  disabled={busyOrderId === selected.order_id}
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white"
                >
                  {busyOrderId === selected.order_id ? "처리 중..." : "출고 완료"}
                </button>
              ) : null}

              {selected.order_status !== "cancelled" && selected.payment_status !== "paid" ? (
                <button
                  type="button"
                  onClick={() => updateOrder(selected.order_id, "cancel_order")}
                  disabled={busyOrderId === selected.order_id}
                  className="rounded-2xl border border-rose-300 px-5 py-3 text-sm font-black text-rose-700"
                >
                  주문 취소
                </button>
              ) : null}

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

function DetailCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-3xl border border-slate-200 p-5">
      <div className="mb-4 text-lg font-black text-slate-900">{title}</div>
      <div className="space-y-3">
        {rows.map(([k, v]) => (
          <div
            key={`${title}-${k}-${v}`}
            className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 text-sm"
          >
            <div className="text-slate-500">{k}</div>
            <div className="max-w-[70%] break-words text-right font-semibold text-slate-900">
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}