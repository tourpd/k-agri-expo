"use client";

import { useState } from "react";

type AlertItem = {
  crop: string;
  pest: string;
  risk: string;
  level: "경보" | "주의보" | "예보";
  reason: string;
  product: string;
  adCopy: string;
};

type AnalyzeResult = {
  summary: string;
  danger_crops: string[];
  danger_pests: string[];
  recommended_products: string[];
  items: AlertItem[];
};

export const dynamic = "force-dynamic";

export default function PestAlertsAdminPage() {
  const [title, setTitle] = useState("");
  const [period, setPeriod] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setError("");
    setResult(null);

    if (!title.trim()) return alert("자료 제목을 입력해주세요.");
    if (!period.trim()) return alert("대상 기간을 입력해주세요.");
    if (!file) return alert("PDF 파일을 선택해주세요.");

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("period", period);
      formData.append("file", file);

      const res = await fetch("/api/admin/pest-alerts/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.ok) throw new Error(data.error || "AI 분석 실패");

      setResult(data.result);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-stone-950">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-3xl bg-gradient-to-r from-red-900 via-red-700 to-orange-500 p-8 text-white shadow-2xl">
          <p className="text-lg font-black text-red-100">K-Agri Expo</p>
          <h1 className="mt-3 text-5xl font-black leading-tight">
            병해충 AI 광고센터
          </h1>
          <p className="mt-4 text-2xl font-black leading-relaxed">
            병해충 발생정보 PDF를 올리면 AI가 위험 작물, 병해충, 추천 제품, 광고 문구를 추출합니다.
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <p className="text-lg font-black text-red-700">STEP 01</p>
          <h2 className="mt-2 text-4xl font-black">PDF 등록</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <Field label="자료 제목">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="예: 2026 농작물 병해충 발생정보 제6호"
              />
            </Field>

            <Field label="대상 기간">
              <input
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className={inputClass}
                placeholder="예: 2026.6.1 ~ 6.15"
              />
            </Field>
          </div>

          <div className="mt-6 rounded-3xl border-2 border-dashed border-red-300 bg-red-50 p-8 text-center">
            <p className="text-3xl font-black text-stone-950">
              병해충 발생정보 PDF 업로드
            </p>
            <p className="mt-3 text-xl font-bold text-stone-700">
              농촌진흥청 PDF를 그대로 올리면 됩니다.
            </p>

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setFile(selected);
                setFileName(selected?.name || "");
              }}
              className="mt-6 w-full rounded-2xl bg-white p-5 text-xl font-bold text-stone-900 ring-1 ring-black/10"
            />

            {fileName ? (
              <p className="mt-4 text-xl font-black text-red-700">
                선택된 파일: {fileName}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="mt-8 w-full rounded-3xl bg-red-700 py-6 text-3xl font-black text-white shadow-lg disabled:bg-stone-400"
          >
            {loading ? "AI 분석중..." : "병해충 정보 AI 분석하기"}
          </button>

          {error ? (
            <div className="mt-5 rounded-2xl bg-red-50 p-5 text-xl font-black text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <p className="text-lg font-black text-green-700">STEP 02</p>
          <h2 className="mt-2 text-4xl font-black">AI 분석 결과</h2>

          {result ? (
            <>
              <div className="mt-6 grid gap-5 md:grid-cols-3">
                <ResultCard
                  title="위험 작물"
                  value={result.danger_crops.join(" · ") || "-"}
                  desc="PDF에서 작물별 위험 정보를 추출했습니다."
                />

                <ResultCard
                  title="위험 병해충"
                  value={result.danger_pests.join(" · ") || "-"}
                  desc="경보·주의보·예보를 자동 분류했습니다."
                />

                <ResultCard
                  title="추천 제품"
                  value={result.recommended_products.join(" · ") || "-"}
                  desc="광고와 공동구매에 연결할 제품 후보입니다."
                />
              </div>

              <div className="mt-6 rounded-3xl bg-yellow-50 p-6 ring-1 ring-yellow-200">
                <p className="text-2xl font-black text-stone-950">AI 요약</p>
                <p className="mt-3 text-xl font-bold leading-relaxed text-stone-800">
                  {result.summary}
                </p>
              </div>

              <div className="mt-8 overflow-x-auto rounded-3xl bg-white ring-1 ring-black/10">
                <table className="min-w-[1100px] w-full border-collapse">
                  <thead className="bg-stone-900 text-white">
                    <tr>
                      <th className="p-4 text-left text-lg">작물</th>
                      <th className="p-4 text-left text-lg">병해충</th>
                      <th className="p-4 text-left text-lg">단계</th>
                      <th className="p-4 text-left text-lg">위험도</th>
                      <th className="p-4 text-left text-lg">추천 제품</th>
                      <th className="p-4 text-left text-lg">광고 문구</th>
                      <th className="p-4 text-left text-lg">실행</th>
                    </tr>
                  </thead>

                  <tbody>
                    {result.items.map((item, index) => (
                      <tr key={`${item.crop}-${item.pest}-${index}`} className="border-b">
                        <td className="p-4 text-lg font-black">{item.crop}</td>
                        <td className="p-4 text-lg font-black text-red-700">{item.pest}</td>
                        <td className="p-4 text-lg font-black">{item.level}</td>
                        <td className="p-4 text-lg font-black">{item.risk}</td>
                        <td className="p-4 text-lg font-black text-green-700">{item.product}</td>
                        <td className="p-4 text-base font-bold">{item.adCopy}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button className="rounded-xl bg-red-700 px-4 py-3 text-base font-black text-white">
                              광고
                            </button>
                            <button className="rounded-xl bg-black px-4 py-3 text-base font-black text-white">
                              쇼츠
                            </button>
                            <button className="rounded-xl bg-green-700 px-4 py-3 text-base font-black text-white">
                              문자
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-3xl bg-stone-50 p-8 text-center ring-1 ring-black/5">
              <p className="text-2xl font-black text-stone-700">
                PDF를 등록하고 AI 분석 버튼을 누르면 결과가 표시됩니다.
              </p>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-3xl bg-yellow-50 p-8 shadow-xl ring-1 ring-yellow-200">
          <h2 className="text-4xl font-black text-stone-950">
            이 센터가 하는 일
          </h2>

          <div className="mt-6 grid gap-3 text-xl font-black text-stone-800">
            <p>✓ 매월 병해충 PDF 업로드</p>
            <p>✓ AI가 작물·병해충·지역·위험도 자동 추출</p>
            <p>✓ 포토닥터 최근 진단 데이터와 연결</p>
            <p>✓ 관련 제품 공동구매 광고 자동 생성</p>
            <p>✓ 8초 광고영상 스토리보드 자동 생성</p>
            <p>✓ 문자 발송용 긴급특보 문구 자동 생성</p>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-950 outline-none placeholder:text-stone-400 focus:border-red-700";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-xl font-black text-stone-900">
        {label}
      </span>
      {children}
    </label>
  );
}

function ResultCard({
  title,
  value,
  desc,
}: {
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl bg-stone-50 p-6 ring-1 ring-black/5">
      <p className="text-xl font-black text-stone-600">{title}</p>
      <p className="mt-3 text-3xl font-black text-red-700">{value}</p>
      <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
        {desc}
      </p>
    </div>
  );
}