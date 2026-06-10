"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

type PreviewSection = {
  id: string;
  title: string;
  headline: string;
  body: string;
  imageLabel: string;
  color: "yellow" | "red" | "blue" | "white" | "black";
};

const previewSections: PreviewSection[] = [
  {
    id: "hero",
    title: "SECTION 01 HERO",
    headline: "병 오고 나서 뛰지 마십시오.",
    body: "오기 전에 준비하는 농민이 결국 웃습니다.",
    imageLabel: "HERO IMAGE",
    color: "yellow",
  },
  {
    id: "problem",
    title: "SECTION 02 문제 공감",
    headline: "비 오고 나면 꼭 시작되더라...",
    body: "잎에 얼룩이 보이기 시작하면 농민 마음도 같이 무너집니다.",
    imageLabel: "PROBLEM IMAGE",
    color: "white",
  },
  {
    id: "compare",
    title: "SECTION 03 비교",
    headline: "옆집은 멀쩡한디, 우리 밭만 왜 이래?",
    body: "관리 전과 관리 후를 한눈에 비교합니다.",
    imageLabel: "BEFORE / AFTER",
    color: "blue",
  },
  {
    id: "product",
    title: "SECTION 04 제품 신뢰",
    headline: "제품은 마지막에 보여줘야 힘이 납니다.",
    body: "라벨, 인증, 성분, 특징을 카드형 이미지로 분리합니다.",
    imageLabel: "PRODUCT TRUST",
    color: "red",
  },
  {
    id: "usage",
    title: "SECTION 05 사용 장면",
    headline: "어떻게 쓰는지 보여줘야 삽니다.",
    body: "농민이 실제로 사용하는 장면을 보여줍니다.",
    imageLabel: "USAGE IMAGE",
    color: "white",
  },
  {
    id: "cta",
    title: "SECTION 06 공동구매 CTA",
    headline: "오늘까지여~",
    body: "뭐가? 내일부터 오른다니께. 뭐가 오른다는겨? 이거. 그럼 나도 끼워줘유.",
    imageLabel: "CTA IMAGE",
    color: "black",
  },
];

export default function SalesAutomationPreviewPage({
  params,
}: {
  params: { id: string };
}) {
  const [viewMode, setViewMode] = useState<"mobile" | "pc">("mobile");

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-stone-950">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Link
              href={`/admin/sales-automation/${params.id}/workspace`}
              className="text-xl font-black text-green-700"
            >
              ← 편집 작업실
            </Link>

            <h1 className="mt-4 text-5xl font-black">
              상세페이지 미리보기
            </h1>

            <p className="mt-3 text-xl font-bold text-black">
              업체가 보는 최종 상세페이지 느낌을 확인합니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setViewMode("mobile")}
              className={`rounded-2xl px-6 py-4 text-xl font-black ${
                viewMode === "mobile"
                  ? "bg-green-700 text-white"
                  : "bg-white text-stone-900"
              }`}
            >
              모바일 보기
            </button>

            <button
              onClick={() => setViewMode("pc")}
              className={`rounded-2xl px-6 py-4 text-xl font-black ${
                viewMode === "pc"
                  ? "bg-green-700 text-white"
                  : "bg-white text-stone-900"
              }`}
            >
              PC 보기
            </button>

            <Link
              href={`/admin/sales-automation/${params.id}/publish`}
              className="rounded-2xl bg-stone-900 px-6 py-4 text-xl font-black text-black"
            >
              저장/공개
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <div
            className={`mx-auto overflow-hidden rounded-3xl border-4 border-black bg-white shadow-2xl ${
              viewMode === "mobile" ? "max-w-[460px]" : "max-w-6xl"
            }`}
          >
            <div className="grid grid-cols-2 border-b-4 border-black">
              <div className="bg-yellow-300 p-6">
                <p className="text-base font-black">K-Agri Expo</p>
                <h2 className="mt-3 text-4xl font-black leading-tight">
                  농민이 보고 바로 이해하는 상세페이지
                </h2>
              </div>

              <div className="grid grid-rows-3">
                <div className="bg-red-600 p-5 text-xl font-black text-white">
                  문제
                </div>
                <div className="bg-blue-700 p-5 text-xl font-black text-white">
                  해결
                </div>
                <div className="bg-black p-5 text-xl font-black text-white">
                  신청
                </div>
              </div>
            </div>

            {previewSections.map((section, index) => (
              <PreviewBlock
                key={section.id}
                index={index}
                section={section}
                viewMode={viewMode}
              />
            ))}

            <div className="border-t-4 border-black bg-green-700 p-8 text-center text-white">
              <p className="text-2xl font-black">공동구매 마감 임박</p>
              <h3 className="mt-3 text-5xl font-black">지금 신청하기</h3>
              <p className="mt-4 text-xl font-bold">
                농민이 망설이지 않게, 신청 버튼은 크게 보여줍니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PreviewBlock({
  section,
  index,
  viewMode,
}: {
  section: PreviewSection;
  index: number;
  viewMode: "mobile" | "pc";
}) {
  const bg = {
    yellow: "bg-yellow-300 text-black",
    red: "bg-red-600 text-white",
    blue: "bg-blue-700 text-white",
    white: "bg-white text-black",
    black: "bg-black text-white",
  }[section.color];

  const reverse = index % 2 === 1;

  if (viewMode === "mobile") {
    return (
      <div className="border-t-4 border-black">
        <div className={`p-6 ${bg}`}>
          <p className="text-sm font-black opacity-80">{section.title}</p>
          <h3 className="mt-3 text-3xl font-black leading-tight">
            {section.headline}
          </h3>
          <p className="mt-4 text-lg font-bold leading-relaxed">
            {section.body}
          </p>
        </div>

        <div className="flex min-h-[220px] items-center justify-center bg-stone-100 p-6">
          <div className="rounded-3xl border-4 border-black bg-white p-8 text-center text-2xl font-black">
            {section.imageLabel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 border-t-4 border-black">
      {!reverse ? (
        <>
          <TextSide section={section} bg={bg} />
          <ImageSide label={section.imageLabel} />
        </>
      ) : (
        <>
          <ImageSide label={section.imageLabel} />
          <TextSide section={section} bg={bg} />
        </>
      )}
    </div>
  );
}

function TextSide({
  section,
  bg,
}: {
  section: PreviewSection;
  bg: string;
}) {
  return (
    <div className={`p-8 ${bg}`}>
      <p className="text-base font-black opacity-80">{section.title}</p>
      <h3 className="mt-4 text-4xl font-black leading-tight">
        {section.headline}
      </h3>
      <p className="mt-5 text-xl font-bold leading-relaxed">
        {section.body}
      </p>
    </div>
  );
}

function ImageSide({ label }: { label: string }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center bg-stone-100 p-8">
      <div className="rounded-3xl border-4 border-black bg-white p-10 text-center text-3xl font-black">
        {label}
      </div>
    </div>
  );
}
