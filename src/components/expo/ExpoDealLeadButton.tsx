"use client";

import { useState } from "react";

type ExpoDealLeadButtonProps = {
  dealId: string;
  boothId?: string | null;
  label?: string;
  className?: string;
  defaultMessage?: string;
};

export default function ExpoDealLeadButton({
  dealId,
  boothId = null,
  label = "특가 상담 요청",
  className = "",
  defaultMessage = "엑스포 특가 상품에 대해 상담을 요청합니다.",
}: ExpoDealLeadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!dealId) {
      alert("dealId가 없습니다.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/lead/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booth_id: boothId || null,
          deal_id: dealId,
          message: defaultMessage,
          source_type: "expo_deal",
        }),
      });

      const json = await res.json();

      if (!json?.ok) {
        alert(json?.error || "특가 문의 접수에 실패했습니다.");
        return;
      }

      alert("특가 상담 요청이 접수되었습니다.");
    } catch {
      alert("특가 상담 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={
        className ||
        "rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
      }
    >
      {loading ? "접수 중..." : label}
    </button>
  );
}