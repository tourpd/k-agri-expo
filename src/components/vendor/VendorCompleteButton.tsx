"use client";

import { useState } from "react";

type Props = {
  orderId: string;
};

export default function VendorCompleteButton({
  orderId,
}: Props) {
  const [working, setWorking] =
    useState(false);

  async function complete() {
    const ok = confirm(
      "배송완료 처리할까요?"
    );

    if (!ok) {
      return;
    }

    setWorking(true);

    try {
      const res = await fetch(
        "/api/vendor/orders/complete",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            order_id: orderId,
          }),
        }
      );

      const data = await res.json();

      if (!data.success) {
        alert(
          data.error ||
            "배송완료 실패"
        );
        return;
      }

      alert("배송완료 처리됨");

      window.location.reload();
    } catch (e: any) {
      alert(
        e?.message ||
          "오류 발생"
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <button
      type="button"
      onClick={complete}
      disabled={working}
      className="rounded-2xl bg-slate-900 px-4 py-3 font-black text-white disabled:opacity-60"
    >
      {working
        ? "처리중..."
        : "배송완료"}
    </button>
  );
}