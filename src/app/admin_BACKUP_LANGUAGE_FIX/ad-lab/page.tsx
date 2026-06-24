"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdLabPage() {
  const [started, setStarted] = useState(false);

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex gap-3">
          <Link href="/admin" className="rounded-2xl bg-black px-6 py-4 text-xl font-black text-white">
            ← 관리자
          </Link>
          <Link href="/admin/video-factory" className="rounded-2xl bg-stone-700 px-6 py-4 text-xl font-black text-white">
            기존 영상공장
          </Link>
        </div>

        <section className="rounded-3xl bg-black p-8 text-white shadow-xl">
          <p className="text-xl font-black text-green-300">K-Agri AI Growth HQ</p>
          <h1 className="mt-3 text-5xl font-black">🚜 K-Agri AI 성장본부</h1>
          <p className="mt-5 text-2xl font-bold">
            업체가 제품사진과 PDF만 올리면 회사·사람·콘텐츠·제품·광고·매출·브랜드를 분석합니다.
          </p>
          <p className="mt-6 rounded-2xl bg-green-700 p-5 text-3xl font-black">
            회사 → 사람 → 콘텐츠 → 제품 → 광고 → 매출 → 브랜드
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-4xl font-black">📦 업체/제품 자료 입력</h2>
          <p className="mt-2 text-xl font-bold text-stone-600">
            어떤 업체든 이 화면에서 시작합니다. 복잡한 입력보다 자료 업로드가 우선입니다.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <input className="rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder="업체명" defaultValue="도프" />
            <input className="rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder="제품명" defaultValue="블로킹칼" />
            <input className="rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder="유튜브 채널 URL" defaultValue="https://www.youtube.com/@dofltd" />
            <input className="rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder="홈페이지 URL" defaultValue="http://dofagro.com/dof/main/main.html" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="rounded-3xl border-4 border-dashed border-black bg-stone-50 p-6">
              <p className="text-2xl font-black">📷 제품사진 업로드</p>
              <input type="file" accept="image/*" className="mt-4 block w-full text-lg font-bold" />
            </label>
            <label className="rounded-3xl border-4 border-dashed border-black bg-stone-50 p-6">
              <p className="text-2xl font-black">📄 PDF / 카탈로그 업로드</p>
              <input type="file" accept=".pdf" className="mt-4 block w-full text-lg font-bold" />
            </label>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="mt-6 w-full rounded-2xl bg-green-700 px-8 py-5 text-2xl font-black text-white"
          >
            🚀 AI 성장진단 시작
          </button>
        </section>

        {started && (
          <section className="mt-8 rounded-3xl border-4 border-green-700 bg-white p-6 shadow-xl">
            <h2 className="text-5xl font-black">✅ AI 성장진단 결과</h2>
            <p className="mt-3 text-2xl font-bold text-stone-700">
              1차 데모 결과입니다. 실제 AI 분석 API는 다음 단계에서 연결합니다.
            </p>

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <Result title="기업 진단점수" value="62점" desc="전문성은 높지만 농민 공감형 콘텐츠가 부족합니다." />
              <Result title="성장 가능성" value="88점" desc="전문가·제품·영상 자산을 활용하면 성장 여지가 큽니다." />
              <Result title="놓친 매출기회" value="12개" desc="쇼츠·상세페이지·공동구매·전문가 클립 전환 가능." />
              <Result title="추천 전략" value="실증형 + 긴급뉴스형" desc="성분 설명보다 농민 손실 회피 메시지가 우선입니다." />
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <Box
                title="🧠 AI 5인 전략회의 요약"
                lines={[
                  "광고전략가 AI: 제품 설명보다 농민의 손실 회피 심리를 자극해야 합니다.",
                  "광고감독 AI: 첫 광고는 8초 긴급뉴스형이 좋습니다.",
                  "광고비평가 AI: 현재 메시지는 전문적이지만 첫 3초 충격이 약합니다.",
                  "농민 AI: 가격, 사용시기, 실제 사례가 바로 보여야 합니다.",
                  "한국농수산TV PD AI: 안철현 박사 클립은 쇼츠 자산화 가치가 큽니다.",
                ]}
              />

              <Box
                title="🚀 1차 실행 제안"
                lines={[
                  "1개월: 8초 쇼츠 30개와 긴급광고로 인지도 확보",
                  "3개월: 전문가 설명·실험비교·농민 질문형 콘텐츠 제작",
                  "6개월: 사용 농가 사례와 전후 비교 확보",
                  "1년: 제품명을 특정 문제의 대표 솔루션으로 포지셔닝",
                ]}
              />
            </div>

            <div className="mt-8 grid gap-3 md:grid-cols-3">
              {[
                "🎬 광고 1차 최종안 만들기",
                "📈 6개월 성장전략 만들기",
                "🎞 기존 영상 쇼츠로 재가공하기",
                "🥊 경쟁사 해부하기",
                "💰 공동구매 전환 전략",
                "🧠 내가 놓친 것 찾기",
              ].map((v) => (
                <button key={v} className="rounded-2xl bg-black px-5 py-4 text-left text-xl font-black text-white">
                  {v}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Result({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-green-50 p-5">
      <p className="text-xl font-black text-stone-700">{title}</p>
      <p className="mt-2 text-4xl font-black text-green-700">{value}</p>
      <p className="mt-3 text-lg font-bold">{desc}</p>
    </div>
  );
}

function Box({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-3xl bg-stone-100 p-6">
      <h3 className="text-3xl font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {lines.map((line) => (
          <p key={line} className="text-xl font-bold leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
