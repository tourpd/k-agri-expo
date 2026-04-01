"use client";

import { useState } from "react";
import PhotoDoctorRecommendedBooths from "@/components/PhotoDoctorRecommendedBooths";

export default function AIConsultPage() {
  const [crop, setCrop] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setError("");

    if (!file) {
      setError("사진을 선택해주세요.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("crop", crop);
      formData.append("province", province);
      formData.append("city", city);

      const res = await fetch("/api/vision", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "진단 실패");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류 발생");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-6">
        🌱 포토닥터 진단
      </h1>

      <div className="space-y-4">
        <input
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          placeholder="작물 (예: 고추)"
          className="w-full border rounded-xl px-4 py-3"
        />

        <input
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          placeholder="도 (예: 충남)"
          className="w-full border rounded-xl px-4 py-3"
        />

        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="시/군 (예: 홍성)"
          className="w-full border rounded-xl px-4 py-3"
        />

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold"
        >
          {loading ? "진단 중..." : "진단 시작"}
        </button>
      </div>

      {error && (
        <div className="mt-6 text-red-600 font-bold">{error}</div>
      )}

      {/* 🔥 결과 영역 */}
      {result && (
        <div className="mt-10 space-y-6">

          {/* 기존 결과 */}
          <div className="rounded-2xl border p-5 bg-white">
            <h2 className="text-xl font-bold mb-3">진단 결과</h2>

            <div className="text-sm text-gray-700 whitespace-pre-wrap">
              {result?.final_judgement ||
               result?.diagnosis ||
               "진단 결과 없음"}
            </div>
          </div>

          {/* 🔥 핵심: 부스 추천 */}
          <PhotoDoctorRecommendedBooths
            cropName={
              result?.crop ||
              result?.crop_name ||
              crop ||
              ""
            }
            issueType={
              result?.final_judgement ||
              result?.diagnosis ||
              result?.possible_causes?.[0]?.name ||
              ""
            }
            diagnosisId={
              result?.diagnosis_id ||
              result?.id ||
              ""
            }
          />

        </div>
      )}
    </main>
  );
}