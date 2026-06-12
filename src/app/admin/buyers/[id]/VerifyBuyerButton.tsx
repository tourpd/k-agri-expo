"use client";

import { useState } from "react";

export default function VerifyBuyerButton({ buyerId }: { buyerId: string }) {
  const [loading, setLoading] = useState(false);

  async function verify(grade: string) {
    const verifiedBy = prompt("검증자 이름을 입력하세요. 예: 조세환, 이성준, 슈퍼농부", "조세환");
    if (!verifiedBy) return;

    const paymentScore = prompt("결제점수 0~100", grade === "A+" ? "95" : grade === "A" ? "85" : "70");
    const farmerRating = prompt("농민평점 0~5", grade === "A+" ? "4.8" : grade === "A" ? "4.5" : "0");

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/buyers/${buyerId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_grade: grade,
          verified_by: verifiedBy,
          payment_score: Number(paymentScore || 0),
          farmer_rating: Number(farmerRating || 0),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        alert(json.error || "검증 저장 실패");
        return;
      }

      alert("바이어 검증 저장 완료");
      location.reload();
    } catch {
      alert("검증 처리 중 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-2">
      {["A+", "A", "B", "C", "D"].map((g) => (
        <button
          key={g}
          disabled={loading}
          onClick={() => verify(g)}
          className="rounded bg-black px-3 py-2 text-xs font-black text-white disabled:opacity-50"
        >
          {g} 검증
        </button>
      ))}
    </div>
  );
}
