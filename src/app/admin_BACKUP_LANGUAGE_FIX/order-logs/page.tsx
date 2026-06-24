"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LogRow = {
  id: string;
  order_id: string;
  order_status: string | null;
  action_type: string | null;
  actor_type: string | null;
  actor_name: string | null;
  memo: string | null;
  created_at: string | null;

  farmer_name?: string | null;
  phone?: string | null;
  product_name?: string | null;
  tracking_company?: string | null;
  tracking_number?: string | null;
  current_order_status?: string | null;
  current_payment_status?: string | null;
};

function shortDate(v?: string | null) {
  if (!v) return "-";
  return String(v).replace("T", " ").slice(0, 16);
}

function actionLabel(v?: string | null) {
  if (v === "tracking_uploaded") return "송장등록";
  if (v === "delivery_completed") return "배송완료";
  if (v === "status_changed") return "상태변경";
  if (v === "sms_created") return "문자생성";
  return v || "-";
}

function formatPhone(v?: string | null) {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return v || "-";
}

function shortOrderId(v?: string | null) {
  const s = String(v || "");
  if (s.length <= 12) return s || "-";
  return `${s.slice(0, 8)}...`;
}

function trackingText(log: LogRow) {
  const company = log.tracking_company || "";
  const number = log.tracking_number || "";
  if (!company && !number) return "-";
  return `${company} ${number}`.trim();
}

function actionColor(v?: string | null) {
  if (v === "tracking_uploaded") return "bg-blue-100 text-blue-700";
  if (v === "delivery_completed") return "bg-slate-200 text-slate-900";
  if (v === "sms_created") return "bg-green-100 text-green-700";
  return "bg-purple-100 text-purple-700";
}

function productText(log: LogRow) {
  return log.product_name || "상품명 미연결";
}

export default function AdminOrderLogsPage() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadLogs() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/order-logs", {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data?.success) {
        alert(data?.error || "운영 로그를 불러오지 못했습니다.");
        return;
      }

      setLogs(data.logs || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black text-green-700">OMS ADMIN LOG CENTER</p>

            <h1 className="mt-2 text-3xl font-black">관리자 주문 운영 로그</h1>

            <p className="mt-2 text-base font-bold text-slate-600">
              전체 주문의 송장등록, 배송완료, 상태변경 이력을 확인합니다.
            </p>

            <div className="mt-3 inline-flex rounded-full bg-red-50 px-4 py-2 text-sm font-black text-red-700 ring-1 ring-red-200">
              업체 공개용 아님 · 내부 운영자 전용
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/product-orders"
              className="rounded-2xl bg-green-700 px-5 py-3 text-sm font-black text-white"
            >
              주문 운영센터
            </Link>

            <button
              type="button"
              onClick={loadLogs}
              className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white"
            >
              {loading ? "불러오는 중..." : "새로고침"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black">관리자 운영 이력</h2>

          <div className="font-bold text-slate-500">
            {loading ? "불러오는 중..." : `${logs.length}건`}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[1350px] border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-left">
                <th className="p-3 text-sm">시간</th>
                <th className="p-3 text-sm">농민</th>
                <th className="p-3 text-sm">전화</th>
                <th className="p-3 text-sm">상품</th>
                <th className="p-3 text-sm">액션</th>
                <th className="p-3 text-sm">상태</th>
                <th className="p-3 text-sm">송장</th>
                <th className="p-3 text-sm">처리자</th>
                <th className="p-3 text-sm">메모</th>
                <th className="p-3 text-sm">주문ID</th>
              </tr>
            </thead>

            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-10 text-center font-bold text-slate-500">
                    로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b last:border-b-0">
                    <td className="p-3 text-sm font-bold">{shortDate(log.created_at)}</td>

                    <td className="p-3 text-sm font-black text-slate-900">
                      {log.farmer_name || "-"}
                    </td>

                    <td className="p-3 text-sm font-bold">{formatPhone(log.phone)}</td>

                    <td className="p-3 text-sm font-black">{productText(log)}</td>

                    <td className="p-3 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 font-black ${actionColor(
                          log.action_type
                        )}`}
                      >
                        {actionLabel(log.action_type)}
                      </span>
                    </td>

                    <td className="p-3 text-sm font-black">{log.order_status || "-"}</td>

                    <td className="p-3 text-sm font-bold text-purple-700">
                      {trackingText(log)}
                    </td>

                    <td className="p-3 text-sm font-bold">{log.actor_name || "-"}</td>

                    <td className="p-3 text-sm font-bold text-slate-600">
                      {log.memo || "-"}
                    </td>

                    <td className="p-3 text-sm font-bold" title={log.order_id}>
                      <Link
                        href={`/admin/product-orders?keyword=${encodeURIComponent(
                          log.order_id
                        )}`}
                        className="text-blue-700 underline"
                      >
                        {shortOrderId(log.order_id)}
                      </Link>
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