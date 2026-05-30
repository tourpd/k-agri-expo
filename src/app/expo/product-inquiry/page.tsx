"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function safe(v: string | null) {
  return v ? v.trim() : "";
}

function formatPhoneInput(value: string) {
  const d = value.replace(/\D/g, "");

  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

function ProductInquiryInner() {
  const searchParams = useSearchParams();

  const product = safe(searchParams.get("product"));
  const crop = safe(searchParams.get("crop"));
  const issue = safe(searchParams.get("issue"));
  const diagnosisId = safe(searchParams.get("diagnosis_id"));
  const province = safe(searchParams.get("province"));
  const city = safe(searchParams.get("city"));

  const [farmerName, setFarmerName] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");
  const [areaText, setAreaText] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const regionText = useMemo(() => {
    const text = `${province} ${city}`.trim();
    return text || "-";
  }, [province, city]);

  async function handleSubmit() {
    setError("");
    setDone(false);

    const nameValue = farmerName.trim();
    const phoneValue = farmerPhone.trim();

    if (!nameValue) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (phoneValue.replace(/\D/g, "").length < 10) {
      setError("전화번호를 정확히 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/expo/product-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: nameValue,
          phone: phoneValue,
          product,
          crop,
          issue,
          diagnosis_id: diagnosisId,
          area_text: areaText.trim(),
          message: message.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "상담·구매 신청 저장에 실패했습니다.");
      }

      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "상담·구매 신청 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center text-4xl font-black text-gray-900">
          🌿 제품 상담·구매 신청
        </h1>

        <p className="mt-4 text-center text-lg font-bold text-gray-600">
          포토닥터 진단 결과를 기준으로 제품 상담을 신청합니다.
        </p>

        <section className="mt-10 rounded-3xl border border-black bg-white p-6 shadow-sm md:p-8">
          <div className="rounded-2xl border border-green-300 bg-green-50 p-6">
            <div className="mb-4 text-lg font-black text-green-800">
              포토닥터 연결 정보
            </div>

            <div className="space-y-3 text-lg font-black text-gray-900">
              <div>제품: {product || "-"}</div>
              <div>작물: {crop || "-"}</div>
              <div>진단/증상: {issue || "-"}</div>
              <div>지역: {regionText}</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={farmerName}
              onChange={(e) => {
                setFarmerName(e.target.value);
                setError("");
              }}
              placeholder="이름"
              className="w-full rounded-2xl border border-black px-5 py-4 text-lg font-bold outline-none focus:border-green-600"
            />

            <input
              value={farmerPhone}
              onChange={(e) => {
                setFarmerPhone(formatPhoneInput(e.target.value));
                setError("");
              }}
              placeholder="전화번호 예: 010-8888-3737"
              inputMode="numeric"
              className="w-full rounded-2xl border border-black px-5 py-4 text-lg font-bold outline-none focus:border-green-600"
            />

            <input
              value={areaText}
              onChange={(e) => setAreaText(e.target.value)}
              placeholder="재배 면적 예: 500평"
              className="w-full rounded-2xl border border-black px-5 py-4 text-lg font-bold outline-none focus:border-green-600"
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="추가 문의 내용"
              rows={5}
              className="w-full rounded-2xl border border-black px-5 py-4 text-lg font-bold outline-none focus:border-green-600"
            />

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-lg font-black text-red-600">
                {error}
              </div>
            )}

            {done && (
              <div className="rounded-2xl border border-green-300 bg-green-50 p-5 text-center">
                <div className="text-2xl font-black text-green-700">
                  ✅ 상담·구매 신청이 접수되었습니다
                </div>
                <p className="mt-2 font-bold text-gray-700">
                  담당자가 확인 후 연락드립니다.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || done}
              className="w-full rounded-2xl bg-green-600 py-5 text-xl font-black text-white disabled:opacity-60"
            >
              {loading
                ? "접수 중..."
                : done
                ? "접수 완료"
                : "상담·구매 신청하기"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ProductInquiryPage() {
  return (
    <Suspense fallback={<div className="p-10 font-bold">불러오는 중...</div>}>
      <ProductInquiryInner />
    </Suspense>
  );
}