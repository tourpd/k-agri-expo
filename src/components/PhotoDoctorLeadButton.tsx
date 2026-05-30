"use client";

import { useState } from "react";

type Props = {
  boothId: string;
  vendorId?: string | null;
  boothPhone?: string | null; // 🔥 추가 (중요)

  cropName?: string | null;
  issueType?: string | null;
  diagnosisId?: string | null;
};

export default function PhotoDoctorLeadButton({
  boothId,
  vendorId,
  boothPhone, // 🔥 핵심
  cropName,
  issueType,
  diagnosisId,
}: Props) {
  const [farmerName, setFarmerName] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");

    if (!farmerName.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (!farmerPhone.trim()) {
      setError("연락처를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // ✅ 1. 리드 저장
      const res = await fetch("/api/booth-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booth_id: boothId,
          vendor_id: vendorId || null,

          farmer_name: farmerName.trim(),
          farmer_phone: farmerPhone.trim(),
          crop_name: cropName || "",
          issue_type: issueType || "",

          message: `포토닥터 상담 요청 / ${issueType || ""}`,

          source_type: "photodoctor",
          source_ref_id: diagnosisId || null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "상담 요청 실패");
      }

      // 🔥 2. 즉시 전화 연결
      if (boothPhone) {
        window.location.href = `tel:${boothPhone}`;
      } else {
        alert("상담 요청이 접수되었습니다. 곧 연락드립니다.");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white border border-slate-200 p-5 space-y-4">

      {/* 🔥 긴급성 카피 */}
      <div>
        <div className="text-lg font-black text-red-600">
          지금 방제 타이밍입니다 ⚠️
        </div>
        <div className="text-sm text-slate-600 mt-1">
          놓치면 피해가 커질 수 있습니다. 바로 상담 받으세요.
        </div>
      </div>

      {/* 🔥 최소 입력 */}
      <input
        value={farmerName}
        onChange={(e) => setFarmerName(e.target.value)}
        placeholder="이름"
        className="w-full rounded-xl border px-4 py-3"
      />

      <input
        value={farmerPhone}
        onChange={(e) => setFarmerPhone(e.target.value)}
        placeholder="연락처"
        className="w-full rounded-xl border px-4 py-3"
      />

      {/* 🔥 자동 정보 */}
      <div className="text-xs text-slate-500">
        작물: {cropName || "-"} / 증상: {issueType || "-"}
      </div>

      {error && (
        <div className="text-red-600 text-sm font-bold">
          {error}
        </div>
      )}

      {/* 🔥 CTA (핵심) */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full h-14 bg-red-600 text-white rounded-xl text-lg font-black disabled:opacity-50"
      >
        {loading ? "연결 중..." : "📞 지금 바로 전화 상담"}
      </button>

    </div>
  );
}