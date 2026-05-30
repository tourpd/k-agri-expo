"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

function OrderPageInner() {
  const searchParams = useSearchParams();

  const product = searchParams.get("product") || "";
  const source = searchParams.get("source") || "";
  const video = searchParams.get("video") || "";

  return (
    <main className="min-h-screen bg-neutral-50 p-5">
      <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-black">주문하기</h1>

        <div className="mt-5 space-y-3 text-lg font-bold">
          <div>제품: {product || "-"}</div>
          <div>유입: {source || "-"}</div>
          <div>영상: {video || "-"}</div>
        </div>

        <div className="mt-6 rounded-2xl bg-green-50 p-5 font-bold text-green-800">
          이 페이지는 유튜브/외부 링크 주문 연결용입니다.
        </div>
      </div>
    </main>
  );
}

export default function OrderPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-50 p-5">
          <div className="mx-auto max-w-3xl rounded-3xl border bg-white p-6 font-black">
            주문 페이지를 불러오는 중입니다...
          </div>
        </main>
      }
    >
      <OrderPageInner />
    </Suspense>
  );
}