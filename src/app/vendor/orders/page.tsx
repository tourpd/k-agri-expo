"use client";

import { useEffect, useMemo, useState } from "react";

type Order = {
  id: string;
  brand_name?: string | null;
  product_name?: string | null;
  farmer_name?: string | null;
  phone?: string | null;
  address?: string | null;
  base_address?: string | null;
  detail_address?: string | null;
  postcode?: string | null;
  quantity?: number | string | null;
  unit_label?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  tracking_company?: string | null;
  tracking_number?: string | null;
  created_at?: string | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

function fullAddress(o: Order) {
  const postcode = safe(o.postcode);
  const base = safe(o.base_address);
  const detail = safe(o.detail_address);
  const legacy = safe(o.address);

  if (base || detail) {
    return `${postcode ? `[${postcode}] ` : ""}${base} ${detail}`.trim();
  }

  return legacy || "-";
}

function formatPhone(v?: string | null) {
  const d = String(v || "").replace(/\D/g, "");

  if (d.length === 11) {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }

  if (d.length === 10) {
    return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  }

  return v || "-";
}

function stageColor(v?: string | null) {
  if (v === "배송완료") return "bg-slate-200 text-slate-900";
  if (v === "배송중") return "bg-purple-100 text-purple-700";
  if (v === "출고준비") return "bg-blue-100 text-blue-700";
  if (v === "입금완료") return "bg-green-100 text-green-700";
  return "bg-amber-100 text-amber-700";
}

function canEditTracking(o: Order) {
  return o.order_status !== "배송완료";
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [vendorName, setVendorName] = useState("");
  const [loading, setLoading] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [keyword, setKeyword] = useState("");

  const [trackingCompany, setTrackingCompany] = useState<Record<string, string>>({});
  const [trackingNumber, setTrackingNumber] = useState<Record<string, string>>({});

  async function loadOrders() {
    setLoading(true);

    try {
      const res = await fetch("/api/vendor/orders", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!data?.success) {
        alert(data?.error || "업체 주문을 불러오지 못했습니다.");
        return;
      }

      setVendorName(data.vendor?.company_name || "업체");
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    if (!q) return orders;

    return orders.filter((o) =>
      [
        o.id,
        o.product_name,
        o.farmer_name,
        o.phone,
        o.address,
        o.base_address,
        o.detail_address,
        o.tracking_number,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [orders, keyword]);

  const counts = useMemo(() => {
    return {
      total: orders.length,
      ready: orders.filter((o) => o.order_status === "출고준비").length,
      shipped: orders.filter((o) => o.order_status === "배송중").length,
      done: orders.filter((o) => o.order_status === "배송완료").length,
    };
  }, [orders]);

  async function uploadTracking(order: Order) {
    const company = safe(trackingCompany[order.id]) || safe(order.tracking_company) || "CJ대한통운";
    const number = safe(trackingNumber[order.id]) || safe(order.tracking_number);

    if (!number) {
      alert("송장번호를 입력하세요.");
      return;
    }

    if (!confirm("송장을 등록하고 배송중으로 변경할까요?")) return;

    setWorkingId(order.id);

    try {
      const res = await fetch("/api/vendor/orders", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: order.id,
          action: "tracking_uploaded",
          tracking_company: company,
          tracking_number: number,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!data?.success) {
        alert(data?.error || "송장 등록 실패");
        return;
      }

      setTrackingNumber((prev) => ({
        ...prev,
        [order.id]: "",
      }));

      alert("송장이 등록되었습니다.");
      await loadOrders();
    } finally {
      setWorkingId("");
    }
  }

  async function completeDelivery(order: Order) {
    if (!safe(order.tracking_number)) {
      alert("송장번호 없는 주문은 배송완료 처리할 수 없습니다.");
      return;
    }

    if (!confirm("배송완료 처리할까요?")) return;

    setWorkingId(order.id);

    try {
      const res = await fetch("/api/vendor/orders", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: order.id,
          action: "delivery_completed",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!data?.success) {
        alert(data?.error || "배송완료 처리 실패");
        return;
      }

      alert("배송완료 처리되었습니다.");
      await loadOrders();
    } finally {
      setWorkingId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <section className="rounded-3xl bg-white p-8 shadow-sm">
        <p className="text-sm font-black text-green-700">K-AGRI VENDOR OMS</p>

        <h1 className="mt-2 text-4xl font-black">업체 주문관리</h1>

        <p className="mt-3 text-lg font-bold text-slate-600">
          {vendorName} 전용 주문 화면입니다. 내 브랜드 주문만 확인하고 송장을 등록합니다.
        </p>

        <div className="mt-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 ring-1 ring-blue-200">
          업체 전용 · 자기 주문만 표시
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <StatCard label="전체 주문" value={`${counts.total}건`} />
        <StatCard label="출고준비" value={`${counts.ready}건`} blue />
        <StatCard label="배송중" value={`${counts.shipped}건`} purple />
        <StatCard label="배송완료" value={`${counts.done}건`} />
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="농민명 / 전화번호 / 주소 / 상품명 / 송장번호 검색"
            className="h-14 flex-1 rounded-2xl border border-slate-300 px-5 text-lg font-bold text-slate-900 outline-none focus:border-green-700"
          />

          <button
            type="button"
            onClick={loadOrders}
            className="h-14 rounded-2xl bg-slate-900 px-6 font-black text-white"
          >
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>

        <div className="mt-4 font-black text-slate-600">
          현재 {filteredOrders.length}건
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-black">주문 목록</h2>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1500px] border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="p-4">상태</th>
                <th className="p-4">상품</th>
                <th className="p-4">농민</th>
                <th className="p-4">전화</th>
                <th className="p-4">주소</th>
                <th className="p-4">수량</th>
                <th className="p-4">송장</th>
                <th className="p-4">송장등록</th>
                <th className="p-4">처리</th>
                <th className="p-4">주문일</th>
              </tr>
            </thead>

            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center font-bold text-slate-500">
                    주문이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const isWorking = workingId === o.id;
                  const editable = canEditTracking(o);

                  return (
                    <tr key={o.id} className="border-b">
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 font-black ${stageColor(
                            o.order_status
                          )}`}
                        >
                          {o.order_status || "입금대기"}
                        </span>
                      </td>

                      <td className="p-4 font-black">{o.product_name || "-"}</td>
                      <td className="p-4 font-black">{o.farmer_name || "-"}</td>
                      <td className="p-4 font-bold">{formatPhone(o.phone)}</td>
                      <td className="p-4 font-bold">{fullAddress(o)}</td>

                      <td className="p-4 font-black">
                        {o.quantity || 0}
                        {o.unit_label || "개"}
                      </td>

                      <td className="p-4 font-bold text-purple-700">
                        {o.tracking_number
                          ? `${o.tracking_company || ""} ${o.tracking_number}`
                          : "-"}
                      </td>

                      <td className="p-4">
                        <div className="flex min-w-[320px] gap-2">
                          <input
                            value={
                              trackingCompany[o.id] ??
                              o.tracking_company ??
                              "CJ대한통운"
                            }
                            onChange={(e) =>
                              setTrackingCompany((prev) => ({
                                ...prev,
                                [o.id]: e.target.value,
                              }))
                            }
                            disabled={!editable || isWorking}
                            className="h-11 w-32 rounded-xl border border-slate-300 px-3 font-bold text-slate-900 disabled:bg-slate-100 disabled:text-slate-400"
                          />

                          <input
                            value={trackingNumber[o.id] ?? ""}
                            onChange={(e) =>
                              setTrackingNumber((prev) => ({
                                ...prev,
                                [o.id]: e.target.value,
                              }))
                            }
                            placeholder={o.tracking_number || "송장번호"}
                            disabled={!editable || isWorking}
                            className="h-11 flex-1 rounded-xl border border-slate-300 px-3 font-bold text-slate-900 placeholder-slate-400 disabled:bg-slate-100 disabled:text-slate-400"
                          />

                          <button
                            type="button"
                            onClick={() => uploadTracking(o)}
                            disabled={!editable || isWorking}
                            className="h-11 rounded-xl bg-purple-700 px-4 font-black text-white disabled:opacity-40"
                          >
                            {isWorking ? "처리중" : "등록"}
                          </button>
                        </div>
                      </td>

                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => completeDelivery(o)}
                          disabled={
                            isWorking ||
                            o.order_status === "배송완료" ||
                            !safe(o.tracking_number)
                          }
                          className="h-11 rounded-xl bg-slate-900 px-4 font-black text-white disabled:opacity-40"
                        >
                          배송완료
                        </button>
                      </td>

                      <td className="p-4 font-bold">{shortDate(o.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  blue = false,
  purple = false,
}: {
  label: string;
  value: string;
  blue?: boolean;
  purple?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-6 shadow-sm ${
        blue
          ? "bg-blue-700 text-white"
          : purple
            ? "bg-purple-700 text-white"
            : "bg-white text-slate-900"
      }`}
    >
      <p className="text-sm font-black opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}