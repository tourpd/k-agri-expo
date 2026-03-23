"use client";

import Link from "next/link";
import { useState } from "react";

type OrderResult = {
  id: number;
  company_name: string;
  applicant_name: string | null;
  phone: string;
  email: string | null;
  product_name: string | null;
  amount_krw: number | null;
  payment_status: string | null;
  order_status: string | null;
  vendor_id: string | null;
  booth_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type BoothResult = {
  booth_id: string;
  name: string;
  is_public: boolean | null;
  status: string | null;
};

function paymentStatusLabel(status?: string | null) {
  switch (status) {
    case "pending":
      return "입금 대기";
    case "paid":
      return "입금 확인 완료";
    case "cancelled":
      return "취소";
    default:
      return status || "-";
  }
}

function orderStatusLabel(status?: string | null) {
  switch (status) {
    case "requested":
      return "신청 접수";
    case "approved":
      return "승인 완료";
    case "completed":
      return "부스 오픈 완료";
    case "cancelled":
      return "취소";
    default:
      return status || "-";
  }
}

export default function VendorOrderStatusPage() {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [order, setOrder] = useState<OrderResult | null>(null);
  const [booth, setBooth] = useState<BoothResult | null>(null);

  const search = async () => {
    setLoading(true);
    setErrorText("");
    setOrder(null);
    setBooth(null);

    try {
      const params = new URLSearchParams({
        order_id: orderId.trim(),
        phone: phone.trim(),
      });

      const res = await fetch(`/api/vendor/order-status?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "조회에 실패했습니다.");
        return;
      }

      setOrder(data.order || null);
      setBooth(data.booth || null);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const canOpenBooth = !!booth?.booth_id && booth?.is_public;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl">
          <div className="text-sm font-black text-emerald-300">ORDER STATUS</div>
          <h1 className="mt-3 text-4xl font-black">업체 신청 상태 확인</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
            주문번호와 신청 시 입력한 연락처를 넣으면 현재 입금 확인 상태와 부스 진행 상태를 확인할 수 있습니다.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-bold">주문번호</label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="예: 12"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">연락처</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="예: 010-1234-5678"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={search}
              disabled={loading}
              className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-60"
            >
              {loading ? "조회 중..." : "상태 조회"}
            </button>

            <Link
              href="/vendor/apply"
              className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-black text-slate-900"
            >
              새로 신청하기
            </Link>
          </div>

          {errorText ? (
            <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700">
              {errorText}
            </div>
          ) : null}
        </section>

        {order ? (
          <>
            <section className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="text-sm font-black text-emerald-700">ORDER INFO</div>
              <h2 className="mt-2 text-2xl font-black">신청 내역</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-500">주문번호</div>
                  <div className="mt-1 text-xl font-black">{order.id}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-500">회사명</div>
                  <div className="mt-1 text-xl font-black">{order.company_name}</div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-500">신청 상품</div>
                  <div className="mt-1 text-xl font-black">
                    {order.product_name || "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-500">금액</div>
                  <div className="mt-1 text-2xl font-black text-emerald-700">
                    {(order.amount_krw || 0).toLocaleString()}원
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="text-sm font-black text-emerald-700">STATUS</div>
              <h2 className="mt-2 text-2xl font-black">현재 진행 상태</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="text-sm font-bold text-slate-500">결제 상태</div>
                  <div className="mt-2 text-2xl font-black">
                    {paymentStatusLabel(order.payment_status)}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    {order.payment_status === "pending"
                      ? "아직 입금 확인 전 상태입니다."
                      : order.payment_status === "paid"
                      ? "입금 확인이 완료되었습니다."
                      : "상태를 관리자에게 문의해 주세요."}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="text-sm font-bold text-slate-500">주문 상태</div>
                  <div className="mt-2 text-2xl font-black">
                    {orderStatusLabel(order.order_status)}
                  </div>
                  <div className="mt-2 text-sm leading-7 text-slate-600">
                    {order.order_status === "requested"
                      ? "신청이 접수되어 관리자가 검토 중입니다."
                      : order.order_status === "approved"
                      ? "승인 완료 상태이며 부스 생성 또는 연결이 진행 중입니다."
                      : order.order_status === "completed"
                      ? "부스 오픈이 완료되었습니다."
                      : "상태를 관리자에게 문의해 주세요."}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="text-sm font-black text-emerald-700">BOOTH</div>
              <h2 className="mt-2 text-2xl font-black">부스 진행 현황</h2>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <div className="space-y-2 text-base leading-8 text-slate-700">
                  <div>
                    <b>vendor_id:</b> {order.vendor_id || "아직 생성 전"}
                  </div>
                  <div>
                    <b>booth_id:</b> {order.booth_id || "아직 생성 전"}
                  </div>
                  <div>
                    <b>부스 상태:</b> {booth?.status || "아직 생성 전"}
                  </div>
                  <div>
                    <b>공개 여부:</b>{" "}
                    {booth ? (booth.is_public ? "공개" : "비공개") : "아직 생성 전"}
                  </div>
                </div>

                {canOpenBooth ? (
                  <div className="mt-5">
                    <Link
                      href={`/expo/booths/${booth.booth_id}`}
                      className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
                    >
                      내 부스 보기
                    </Link>
                  </div>
                ) : (
                  <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
                    아직 공개 가능한 부스가 생성되지 않았습니다. 입금 확인 또는 관리자 승인 후 반영됩니다.
                  </div>
                )}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}