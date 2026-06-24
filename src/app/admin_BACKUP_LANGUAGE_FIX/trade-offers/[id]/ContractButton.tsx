"use client";

import { useState } from "react";

export default function ContractButton({ offerId }: { offerId: string }) {
  const [loading, setLoading] = useState(false);

  async function contract() {
    if (!confirm("이 거래제안을 계약완료로 전환하고 정산 데이터를 생성할까요?")) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/trade-offers/${offerId}/contract`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert(json.error || "계약전환 실패");
        return;
      }

      alert("계약체결 및 정산 생성 완료");
      window.location.href = "/admin/settlements";
    } catch (e) {
      alert("계약전환 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={contract}
      disabled={loading}
      className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white disabled:opacity-60"
    >
      {loading ? "처리중" : "계약전환"}
    </button>
  );
}
