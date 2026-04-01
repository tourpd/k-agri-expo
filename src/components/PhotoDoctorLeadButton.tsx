"use client";

import { useState } from "react";

type Props = {
  boothId: string;
  vendorId?: string | null;
  hallId?: string | null;
  slotCode?: string | null;

  cropName?: string | null;
  issueType?: string | null;
  diagnosisId?: string | null;

  defaultFarmerName?: string;
  defaultFarmerPhone?: string;
};

export default function PhotoDoctorLeadButton({
  boothId,
  vendorId,
  hallId,
  slotCode,
  cropName,
  issueType,
  diagnosisId,
  defaultFarmerName = "",
  defaultFarmerPhone = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [farmerName, setFarmerName] = useState(defaultFarmerName);
  const [farmerPhone, setFarmerPhone] = useState(defaultFarmerPhone);
  const [areaText, setAreaText] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      const res = await fetch("/api/booth-leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booth_id: boothId,
          vendor_id: vendorId || null,
          hall_id: hallId || null,
          slot_code: slotCode || null,

          farmer_name: farmerName.trim(),
          farmer_phone: farmerPhone.trim(),
          crop_name: (cropName || "").trim(),
          area_text: areaText.trim(),
          issue_type: (issueType || "").trim(),
          message:
            message.trim() ||
            `포토닥터 진단 후 상담 요청${issueType ? ` / 추정 이슈: ${issueType}` : ""}`,

          source_type: "photodoctor",
          source_ref_id: diagnosisId || null,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "상담 요청에 실패했습니다.");
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "상담 요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="text-base font-black text-emerald-700">상담 요청 완료</div>
        <div className="mt-1 text-sm leading-6 text-slate-700">
          포토닥터 진단 결과와 함께 상담 요청이 접수되었습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      {!open ? (
        <>
          <div className="text-lg font-black text-slate-900">
            진단 결과가 걱정되시나요?
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-600">
            추천 부스에 바로 상담을 요청할 수 있습니다.
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-4 w-full rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
          >
            전문가 상담 요청
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="text-lg font-black text-slate-900">상담 요청하기</div>

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
            value={cropName || ""}
            disabled
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600"
          />

          <input
            value={issueType || ""}
            disabled
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600"
          />

          <input
            value={areaText}
            onChange={(e) => setAreaText(e.target.value)}
            placeholder="재배 면적 (예: 1,500평)"
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="추가 문의 내용"
            rows={4}
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
          />

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-2xl border border-slate-300 px-4 py-3 font-bold text-slate-700"
            >
              닫기
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white disabled:opacity-50"
            >
              {loading ? "접수 중..." : "상담 요청 보내기"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}