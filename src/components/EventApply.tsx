"use client";

import { useState } from "react";

type ApplyResponse = {
  success: boolean;
  entry_code?: string;
  message?: string;
  error?: string;
};

export default function EventApply({
  eventId = 1,
}: {
  eventId?: number;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [crop, setCrop] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [entryCode, setEntryCode] = useState("");
  const [errorText, setErrorText] = useState("");

  const resetForm = () => {
    setName("");
    setPhone("");
    setRegion("");
    setCrop("");
    setEntryCode("");
    setErrorText("");
    setDone(false);
    setLoading(false);
  };

  const submit = async () => {
    if (loading) return;

    setErrorText("");

    const cleanName = name.trim();
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const cleanRegion = region.trim();
    const cleanCrop = crop.trim();

    if (!cleanName) {
      setErrorText("이름을 입력해 주세요.");
      return;
    }

    if (!cleanPhone) {
      setErrorText("전화번호를 입력해 주세요.");
      return;
    }

    if (cleanPhone.length < 10) {
      setErrorText("전화번호를 정확히 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/event-entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: eventId,
          name: cleanName,
          phone: cleanPhone,
          region: cleanRegion,
          crop: cleanCrop,
        }),
      });

      const data: ApplyResponse = await res.json();

      if (!res.ok || !data.success) {
        setErrorText(data.error || "응모 중 오류가 발생했습니다.");
        return;
      }

      if (!data.entry_code) {
        setErrorText("참가번호 생성에 실패했습니다.");
        return;
      }

      setEntryCode(data.entry_code);
      setDone(true);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="text-sm font-extrabold text-emerald-700">
          응모 완료
        </div>

        <div className="mt-3 text-2xl font-black text-slate-900">
          참가번호
        </div>

        <div className="mt-3 rounded-xl bg-slate-950 px-4 py-4 text-xl font-black tracking-wide text-yellow-300">
          {entryCode}
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-700">
          참가번호를 꼭 저장해 주세요. 라이브 추첨 시 이 번호로 당첨 여부를 확인합니다.
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(entryCode);
                alert("참가번호가 복사되었습니다.");
              } catch {
                alert("복사에 실패했습니다.");
              }
            }}
            className="rounded-xl bg-yellow-400 px-4 py-2 font-bold text-slate-900"
          >
            참가번호 복사
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-800"
          >
            새로 응모하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            이름
          </label>
          <input
            placeholder="예: 홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            전화번호
          </label>
          <input
            placeholder="예: 010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            지역(시/군)
          </label>
          <input
            placeholder="예:충남 홍성군"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-bold text-slate-800">
            재배작물
          </label>
          <input
            placeholder="예: 마늘, 고추, 딸기"
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {errorText ? (
        <div className="rounded-xl bg-red-100 px-4 py-3 text-sm font-bold text-red-700">
          {errorText}
        </div>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-lg font-black text-white shadow-lg disabled:opacity-60"
      >
        {loading ? "응모 처리 중..." : "이벤트 참여하기"}
      </button>
    </div>
  );
}