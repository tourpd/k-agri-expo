"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OrderRow = {
  id: number;
  company_name: string;
  applicant_name: string | null;
  phone: string | null;
  email: string | null;
  product_code: string | null;
  product_name: string | null;
  amount_krw: number | null;
  payment_method: string | null;
  payment_status: string | null;
  order_status: string | null;
  vendor_id: string | null;
  booth_id: string | null;
  note: string | null;
  created_at: string | null;
};

type PaymentFilter = "all" | "pending" | "paid" | "cancelled";
type OrderFilter = "all" | "requested" | "approved" | "completed" | "cancelled";

function paymentLabel(v?: string | null) {
  switch (v) {
    case "pending":
      return "입금대기";
    case "paid":
      return "입금완료";
    case "cancelled":
      return "취소";
    default:
      return v || "-";
  }
}

function orderLabel(v?: string | null) {
  switch (v) {
    case "requested":
      return "신청접수";
    case "approved":
      return "승인완료";
    case "completed":
      return "처리완료";
    case "cancelled":
      return "취소";
    default:
      return v || "-";
  }
}

function badgeClass(type: "gray" | "yellow" | "green" | "red" | "blue") {
  switch (type) {
    case "yellow":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "green":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "red":
      return "bg-red-100 text-red-800 border-red-200";
    case "blue":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function paymentBadge(v?: string | null) {
  if (v === "pending") return badgeClass("yellow");
  if (v === "paid") return badgeClass("green");
  if (v === "cancelled") return badgeClass("red");
  return badgeClass("gray");
}

function orderBadge(v?: string | null) {
  if (v === "requested") return badgeClass("yellow");
  if (v === "approved") return badgeClass("blue");
  if (v === "completed") return badgeClass("green");
  if (v === "cancelled") return badgeClass("red");
  return badgeClass("gray");
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [keyword, setKeyword] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (keyword.trim()) p.set("keyword", keyword.trim());
    return p.toString();
  }, [keyword]);

  const loadOrders = async () => {
    setLoading(true);
    setErrorText("");

    try {
      const res = await fetch(`/api/admin/orders?${queryString}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "주문 목록을 불러오지 못했습니다.");
        return;
      }

      setOrders(data.orders || []);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [queryString]);

  const filteredOrders = useMemo(() => {
    return orders.filter((row) => {
      const paymentOk =
        paymentFilter === "all" ? true : row.payment_status === paymentFilter;
      const orderOk =
        orderFilter === "all" ? true : row.order_status === orderFilter;
      return paymentOk && orderOk;
    });
  }, [orders, paymentFilter, orderFilter]);

  const stats = useMemo(() => {
    const totalCount = orders.length;
    const pendingCount = orders.filter((o) => o.payment_status === "pending").length;
    const paidCount = orders.filter((o) => o.payment_status === "paid").length;
    const approvedCount = orders.filter(
      (o) => o.order_status === "approved" || o.order_status === "completed"
    ).length;

    const totalAmount = orders.reduce((acc, o) => acc + (o.amount_krw || 0), 0);
    const paidAmount = orders
      .filter((o) => o.payment_status === "paid")
      .reduce((acc, o) => acc + (o.amount_krw || 0), 0);

    return {
      totalCount,
      pendingCount,
      paidCount,
      approvedCount,
      totalAmount,
      paidAmount,
    };
  }, [orders]);

  const saveMemoAndStatus = async () => {
    if (!selected) return;

    setSaving(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/orders/${selected.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          note: selected.note || "",
          payment_status: selected.payment_status || "pending",
          order_status: selected.order_status || "requested",
          append_status_log: true,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "메모 저장에 실패했습니다.");
        return;
      }

      setMessage(data.message || "저장되었습니다.");
      setSelected(data.order || selected);
      await loadOrders();
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const confirmPayment = async () => {
    if (!selected) return;

    const ok = window.confirm(
      "입금 확인 처리하시겠습니까?\n처리되면 vendor/booth가 자동 생성됩니다."
    );
    if (!ok) return;

    setSaving(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/payment-confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: selected.id,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "입금 확인 처리에 실패했습니다.");
        return;
      }

      setMessage(data.message || "입금 확인 완료");
      await loadOrders();

      setSelected((prev) =>
        prev
          ? {
              ...prev,
              payment_status: "paid",
              order_status: "approved",
              vendor_id: data.order?.vendor_id || prev.vendor_id,
              booth_id: data.order?.booth_id || prev.booth_id,
            }
          : prev
      );
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const logLines = useMemo(() => {
    if (!selected?.note) return [];
    return selected.note
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean)
      .reverse();
  }, [selected?.note]);

  return (
    <main className="space-y-6 text-slate-900">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-black text-emerald-700">ORDERS</div>
            <h1 className="mt-2 text-3xl font-black">주문/결제 관리</h1>
            <p className="mt-2 text-slate-600">
              입점 신청 주문을 확인하고, 입금 확인 시 자동으로 업체/부스를 생성합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
          >
            새로고침
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="총 주문" value={`${stats.totalCount}건`} tone="slate" />
          <StatCard label="입금 대기" value={`${stats.pendingCount}건`} tone="yellow" />
          <StatCard label="입금 완료" value={`${stats.paidCount}건`} tone="green" />
          <StatCard label="부스 생성" value={`${stats.approvedCount}건`} tone="blue" />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <AmountCard label="총 주문 금액" value={stats.totalAmount} />
          <AmountCard label="입금 완료 금액" value={stats.paidAmount} highlight />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-bold">검색</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="회사명, 담당자, 연락처, 이메일, 상품명"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">결제 상태</label>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="all">전체</option>
              <option value="pending">입금대기</option>
              <option value="paid">입금완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">주문 상태</label>
            <select
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value as OrderFilter)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="all">전체</option>
              <option value="requested">신청접수</option>
              <option value="approved">승인완료</option>
              <option value="completed">처리완료</option>
              <option value="cancelled">취소</option>
            </select>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl bg-emerald-100 px-4 py-3 font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorText ? (
          <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700">
            {errorText}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">주문 목록</h2>
            <div className="text-sm font-bold text-slate-500">
              {loading ? "불러오는 중..." : `표시 ${filteredOrders.length.toLocaleString()}건`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm">
                  <th className="px-3 py-3">회사명</th>
                  <th className="px-3 py-3">상품</th>
                  <th className="px-3 py-3">금액</th>
                  <th className="px-3 py-3">결제상태</th>
                  <th className="px-3 py-3">주문상태</th>
                  <th className="px-3 py-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-10 text-center text-slate-500"
                    >
                      주문이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-100 ${
                        selected?.id === row.id ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="px-3 py-3 align-top">
                        <div className="font-bold">{row.company_name}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          주문번호 #{row.id}
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        {row.product_name || row.product_code || "-"}
                      </td>
                      <td className="px-3 py-3 align-top font-bold">
                        {(row.amount_krw || 0).toLocaleString()}원
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${paymentBadge(
                            row.payment_status
                          )}`}
                        >
                          {paymentLabel(row.payment_status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${orderBadge(
                            row.order_status
                          )}`}
                        >
                          {orderLabel(row.order_status)}
                        </span>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => setSelected(row)}
                          className="rounded-xl bg-slate-950 px-3 py-2 text-sm font-bold text-white"
                        >
                          선택
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-black">주문 상세 / 입금 확인</h2>

          {!selected ? (
            <div className="rounded-xl bg-slate-50 p-4 text-slate-500">
              왼쪽에서 주문을 선택해 주세요.
            </div>
          ) : (
            <div className="grid gap-4">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-7">
                <div>
                  <b>주문번호:</b> {selected.id}
                </div>
                <div>
                  <b>회사명:</b> {selected.company_name}
                </div>
                <div>
                  <b>담당자:</b> {selected.applicant_name || "-"}
                </div>
                <div>
                  <b>연락처:</b> {selected.phone || "-"}
                </div>
                <div>
                  <b>이메일:</b> {selected.email || "-"}
                </div>
                <div>
                  <b>상품:</b> {selected.product_name || selected.product_code || "-"}
                </div>
                <div>
                  <b>금액:</b> {(selected.amount_krw || 0).toLocaleString()}원
                </div>
                <div>
                  <b>결제상태:</b> {paymentLabel(selected.payment_status)}
                </div>
                <div>
                  <b>주문상태:</b> {orderLabel(selected.order_status)}
                </div>
                <div>
                  <b>vendor_id:</b> {selected.vendor_id || "-"}
                </div>
                <div>
                  <b>booth_id:</b> {selected.booth_id || "-"}
                </div>
                <div>
                  <b>신청일:</b> {selected.created_at || "-"}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">관리 메모 / 상태 로그</label>
                <textarea
                  value={selected.note || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, note: e.target.value })
                  }
                  className="min-h-[140px] w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="입금 확인 내용, 연락 사항 등을 기록"
                />
              </div>

              {logLines.length > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-700">상태 로그</div>
                  <div className="mt-3 space-y-2 text-sm text-slate-600">
                    {logLines.map((line, idx) => (
                      <div
                        key={`${line}-${idx}`}
                        className="rounded-lg bg-white px-3 py-2 border border-slate-200"
                      >
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {selected.booth_id ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-sm font-bold text-emerald-700">
                    생성된 부스가 있습니다
                  </div>
                  <div className="mt-2 text-sm text-slate-700">
                    booth_id: {selected.booth_id}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      href={`/expo/booths/${selected.booth_id}`}
                      className="inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                    >
                      부스 보기
                    </Link>

                    <Link
                      href="/admin/booths"
                      className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900"
                    >
                      부스관리 바로가기
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-sm text-slate-600">
                    아직 연결된 부스가 없습니다.
                  </div>
                  <div className="mt-3">
                    <Link
                      href="/admin/booths"
                      className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900"
                    >
                      부스관리 바로가기
                    </Link>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveMemoAndStatus}
                  disabled={saving}
                  className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-60"
                >
                  {saving ? "저장 중..." : "메모 저장 + 로그기록"}
                </button>

                <button
                  type="button"
                  onClick={confirmPayment}
                  disabled={saving}
                  className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white disabled:opacity-60"
                >
                  {saving ? "처리 중..." : "입금확인 + 부스생성"}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "slate" | "yellow" | "green" | "blue";
}) {
  const map = {
    slate: "bg-slate-900 text-white",
    yellow: "bg-yellow-500 text-white",
    green: "bg-emerald-600 text-white",
    blue: "bg-blue-600 text-white",
  };

  return (
    <div className={`rounded-2xl p-5 ${map[tone]}`}>
      <div className="text-sm font-bold opacity-90">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

function AmountCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        highlight
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="text-sm font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">
        {value.toLocaleString()}원
      </div>
    </div>
  );
}