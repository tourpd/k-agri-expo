"use client";

import { useState } from "react";

function onlyDigits(v: string) {
  return v.replace(/\D/g, "");
}

function formatPhone(v: string) {
  const d = onlyDigits(v);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

export default function LiveEventPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [crop, setCrop] = useState("");
  const [farmSize, setFarmSize] = useState("");

  const [code, setCode] = useState("");

  const [joined, setJoined] = useState(false);
  const [codeDone, setCodeDone] = useState(false);

  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function joinLive() {
    setLoading(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/live/join", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          region,
          crop,
          farm_size: farmSize,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "참여 등록 실패");
      }

      setJoined(true);
      setNotice("라이브 참여 등록이 완료되었습니다. 방송 중 공개되는 암호를 입력해주세요.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "참여 등록 실패");
    } finally {
      setLoading(false);
    }
  }

  async function submitCode() {
    setLoading(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/live/code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "암호 입력 실패");
      }

      if (!json.correct) {
        setError("암호가 맞지 않습니다. 방송에서 안내된 암호를 정확히 입력해주세요.");
        return;
      }

      setCodeDone(true);
      setNotice("암호 확인 완료! 최종 추첨 대상에 포함되었습니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "암호 입력 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-6">
      <div className="mx-auto max-w-xl">
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="text-sm font-black text-green-700">
            K-Agri 월간 라이브쇼
          </div>

          <h1 className="mt-2 text-3xl font-black leading-tight">
            라이브 경품 추첨 참여
          </h1>

          <p className="mt-3 text-base font-bold leading-7 text-neutral-600">
            농업경영체 등록 농민만 참여 가능합니다. 방송 중 공개되는 암호를
            입력한 농민 중에서 최종 추첨합니다.
          </p>

          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-black leading-7 text-red-700">
            📞 당첨 즉시 전화드립니다.
            <br />
            10번 벨 안에 받지 않으면 탈락 후 재추첨됩니다.
          </div>
        </section>

        {(notice || error) && (
          <section className="mt-4">
            {notice && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 font-black text-green-700">
                {notice}
              </div>
            )}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-black text-red-700">
                {error}
              </div>
            )}
          </section>
        )}

        <section className="mt-4 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">1단계. 참여 등록</h2>

          <div className="mt-4 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름"
              className="w-full rounded-xl border px-4 py-4 text-lg font-bold"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="휴대폰 번호"
              inputMode="tel"
              className="w-full rounded-xl border px-4 py-4 text-lg font-bold"
            />

            <input
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="지역 예: 충남 홍성"
              className="w-full rounded-xl border px-4 py-4 text-lg font-bold"
            />

            <input
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              placeholder="주요 작물 예: 마늘, 고추, 벼"
              className="w-full rounded-xl border px-4 py-4 text-lg font-bold"
            />

            <input
              value={farmSize}
              onChange={(e) => setFarmSize(e.target.value)}
              placeholder="재배 규모 예: 3,000평"
              className="w-full rounded-xl border px-4 py-4 text-lg font-bold"
            />

            <button
              type="button"
              onClick={joinLive}
              disabled={loading || joined}
              className="w-full rounded-2xl bg-black px-5 py-5 text-xl font-black text-white disabled:opacity-50"
            >
              {joined ? "참여 등록 완료" : loading ? "처리 중..." : "라이브 참여 등록"}
            </button>
          </div>
        </section>

        <section className="mt-4 rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">2단계. 방송 암호 입력</h2>

          <p className="mt-2 text-sm font-bold leading-6 text-neutral-600">
            방송 중 진행자가 공개하는 암호를 입력해야 최종 추첨 대상이 됩니다.
          </p>

          <div className="mt-4 space-y-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="오늘의 암호 입력"
              className="w-full rounded-xl border px-4 py-4 text-lg font-bold"
            />

            <button
              type="button"
              onClick={submitCode}
              disabled={loading || codeDone}
              className="w-full rounded-2xl bg-green-700 px-5 py-5 text-xl font-black text-white disabled:opacity-50"
            >
              {codeDone ? "암호 확인 완료" : loading ? "확인 중..." : "암호 제출"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}