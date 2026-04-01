"use client";

import { useState } from "react";

type Props = {
  boothId: string;
  vendorId?: string | null;
  hallId?: string | null;
  slotCode?: string | null;
};

export default function BoothLeadForm({
  boothId,
  vendorId,
  hallId,
  slotCode,
}: Props) {
  const [farmerName, setFarmerName] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [cropName, setCropName] = useState("");
  const [areaText, setAreaText] = useState("");
  const [issueType, setIssueType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/booth-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booth_id: boothId,
          vendor_id: vendorId,
          hall_id: hallId,
          slot_code: slotCode,
          farmer_name: farmerName,
          farmer_phone: farmerPhone,
          crop_name: cropName,
          area_text: areaText,
          issue_type: issueType,
          message,
          source_type: "booth",
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "상담 신청 실패");
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상담 신청 실패");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="text-lg font-bold text-emerald-700">상담 요청 완료</div>
        <div className="mt-2 text-sm text-slate-700">
          입력하신 연락처로 업체 또는 운영팀이 연락드립니다.
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="text-xl font-black">상담하기</div>

      <input
        value={farmerName}
        onChange={(e) => setFarmerName(e.target.value)}
        placeholder="이름"
        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
      />
      <input
        value={farmerPhone}
        onChange={(e) => setFarmerPhone(e.target.value)}
        placeholder="연락처"
        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
      />
      <input
        value={cropName}
        onChange={(e) => setCropName(e.target.value)}
        placeholder="작물명"
        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
      />
      <input
        value={areaText}
        onChange={(e) => setAreaText(e.target.value)}
        placeholder="재배 면적 (예: 2,000평)"
        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
      />
      <input
        value={issueType}
        onChange={(e) => setIssueType(e.target.value)}
        placeholder="문제 유형 (예: 총채벌레, 비대불량)"
        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="상세 문의 내용"
        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
        rows={4}
      />

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-50"
      >
        {loading ? "접수 중..." : "상담 요청 보내기"}
      </button>
    </form>
  );
}