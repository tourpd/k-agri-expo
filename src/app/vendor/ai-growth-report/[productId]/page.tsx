"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Report = {
  product_id: string;
  product_name?: string | null;
  total_score: number;
  grade: string;
  product_power_score: number;
  farmer_empathy_score: number;
  evidence_score: number;
  weak_points: string[];
  recommendations: string[];
  ai_summary: string;
};

export default function VendorAiGrowthReportPage() {
  const params = useParams();
  const productId = String(params.productId || "");

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);

  async function loadReport() {
    if (!productId) return;

    setLoading(true);

    try {
      const res = await fetch("/api/vendor/ai-growth-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "AI 성장보고서를 만들 수 없습니다.");
        location.href = "/vendor/ai-growth-interview";
        return;
      }

      setReport(json.report);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f8f3] p-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 text-2xl font-black text-stone-900 shadow-sm ring-1 ring-black/5">
          AI 성장보고서를 생성하는 중...
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="min-h-screen bg-[#f6f8f3] p-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 text-2xl font-black text-stone-900 shadow-sm ring-1 ring-black/5">
          보고서를 찾을 수 없습니다.
        </div>
      </main>
    );
  }

  const nextScore = Math.min(
    100,
    report.total_score +
      (report.evidence_score < 60 ? 12 : 4) +
      (report.weak_points.length > 0 ? 8 : 3)
  );

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/vendor/ai-growth-interview"
            className="inline-flex rounded-2xl bg-white px-4 py-3 text-base font-black text-stone-900 ring-1 ring-black/10"
          >
            ← AI 제품 성장진단으로 돌아가기
          </Link>

          <Link
            href="/vendor/products"
            className="inline-flex rounded-2xl bg-stone-900 px-4 py-3 text-base font-black text-white"
          >
            내 제품 관리
          </Link>
        </div>

        <section className="mt-4 rounded-[32px] bg-stone-950 p-6 text-white shadow-sm">
          <p className="text-sm font-black text-yellow-300">
            K-Agri Expo AI 제품 성장센터
          </p>

          <h1 className="mt-2 text-3xl font-black">
            {report.product_name || "제품"} 성장보고서
          </h1>

          <p className="mt-3 text-lg font-bold leading-relaxed text-stone-200">
            이 보고서는 제품 설명서가 아닙니다. 업체가 올린 자료를 바탕으로
            농민이 믿고 구매할 수 있는 근거가 충분한지 판단하는 성장 진단서입니다.
          </p>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-4">
          <ScoreCard
            title="종합 성장점수"
            value={`${report.total_score}점`}
            desc={`${report.grade}등급`}
            highlight
          />

          <ScoreCard
            title="제품력"
            value={`${report.product_power_score}점`}
            desc="제품 자체 경쟁력"
          />

          <ScoreCard
            title="농민 공감도"
            value={`${report.farmer_empathy_score}점`}
            desc="농민이 이해하고 공감할 가능성"
          />

          <ScoreCard
            title="증거력"
            value={`${report.evidence_score}점`}
            desc="자료·후기·전후사진·영상 보유 수준"
          />
        </section>

        <section className="mt-5 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-2xl font-black text-stone-950">
                AI 종합 의견
              </h2>

              <p className="mt-4 whitespace-pre-line text-lg font-bold leading-relaxed text-stone-700">
                {report.ai_summary}
              </p>
            </div>

            <div className="rounded-3xl bg-green-50 p-5 ring-1 ring-green-200">
              <p className="text-sm font-black text-green-700">
                성장 가능성 시뮬레이션
              </p>

              <h3 className="mt-2 text-3xl font-black text-stone-950">
                {report.total_score}점 → {nextScore}점
              </h3>

              <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
                부족한 증거자료를 보완하고, 실증농가 후기나 사용영상이 추가되면
                제품 신뢰도와 농민 구매 가능성이 크게 올라갈 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[32px] bg-yellow-50 p-6 shadow-sm ring-1 ring-yellow-200">
            <h2 className="text-2xl font-black text-stone-950">
              현재 가장 부족한 부분
            </h2>

            <div className="mt-4 grid gap-3">
              {report.weak_points.length === 0 ? (
                <div className="rounded-2xl bg-white px-4 py-4 text-lg font-black text-green-700 ring-1 ring-black/10">
                  핵심 자료가 비교적 잘 갖춰져 있습니다.
                </div>
              ) : (
                report.weak_points.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-white px-4 py-4 text-lg font-black text-red-700 ring-1 ring-black/10"
                  >
                    {item}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-black text-stone-950">
              점수를 올리는 자료
            </h2>

            <div className="mt-4 grid gap-3">
              <GrowthItem title="제품 카탈로그·라벨" score="+5점" />
              <GrowthItem title="유기농 공시·등록자료" score="+5점" />
              <GrowthItem title="시험성적서·실험결과" score="+10점" />
              <GrowthItem title="전후사진·사용후기" score="+10점" />
              <GrowthItem title="제품 홍보영상·유튜브 링크" score="+5점" />
              <GrowthItem title="농가 사용영상·인터뷰" score="+15점" />
              <GrowthItem title="홍산마늘 이성준 회장 검증" score="+25점" />
              <GrowthItem title="슈퍼농부 이승민 검증" score="+30점" />
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-2xl font-black text-stone-950">
            AI 추천 액션
          </h2>

          <p className="mt-2 text-base font-bold leading-7 text-stone-600">
            아래 항목은 이 제품이 농민에게 더 신뢰받고, 판매 가능성을 높이기 위해
            우선 실행해야 할 일입니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {report.recommendations.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5"
              >
                <p className="text-sm font-black text-green-700">
                  추천 {index + 1}
                </p>
                <p className="mt-2 text-xl font-black leading-relaxed text-stone-950">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[32px] bg-green-800 p-6 text-white shadow-sm">
          <p className="text-sm font-black text-yellow-300">
            다음 단계 제안
          </p>

          <h2 className="mt-2 text-3xl font-black">
            제품은 좋습니다. 이제 농민이 믿을 증거가 필요합니다.
          </h2>

          <p className="mt-3 text-lg font-bold leading-relaxed text-green-50">
            샘플 제공, 실증농가 후기, 전후사진, 농가 인터뷰, 한국농수산TV 콘텐츠까지
            연결하면 단순 제품 소개가 아니라 매출 성장 프로젝트로 확장할 수 있습니다.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <ActionBox
              title="샘플 제공"
              desc="필요 농가에게 제품을 먼저 경험시킵니다."
            />

            <ActionBox
              title="실증농가 후기"
              desc="사용 결과와 전후사진을 모아 신뢰를 만듭니다."
            />

            <ActionBox
              title="한국농수산TV 상담"
              desc="영상·공동구매·브랜드 성장으로 연결합니다."
            />
          </div>

          <div className="mt-6 rounded-3xl bg-white p-5 text-stone-950">
            <p className="text-xl font-black">
              업체가 스스로 고민해야 할 핵심 질문
            </p>

            <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
              우리 제품이 좋은 것은 알겠는데, 농민이 믿을 증거가 충분한가?
              <br />
              이 질문에 답할 수 있어야 매출 성장으로 연결됩니다.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function ScoreCard({
  title,
  value,
  desc,
  highlight = false,
}: {
  title: string;
  value: string;
  desc: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-5 shadow-sm ring-1 ${
        highlight
          ? "bg-green-700 text-white ring-green-700"
          : "bg-white text-stone-950 ring-black/5"
      }`}
    >
      <p
        className={`text-sm font-black ${
          highlight ? "text-green-100" : "text-stone-500"
        }`}
      >
        {title}
      </p>

      <p className="mt-3 text-4xl font-black">{value}</p>

      <p
        className={`mt-2 text-base font-bold ${
          highlight ? "text-green-100" : "text-stone-500"
        }`}
      >
        {desc}
      </p>
    </div>
  );
}

function GrowthItem({ title, score }: { title: string; score: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-4 ring-1 ring-black/5">
      <p className="text-base font-black text-stone-900">{title}</p>
      <p className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-sm font-black text-green-700">
        {score}
      </p>
    </div>
  );
}

function ActionBox({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/20">
      <p className="text-xl font-black text-white">{title}</p>
      <p className="mt-2 text-base font-bold leading-7 text-green-50">
        {desc}
      </p>
    </div>
  );
}