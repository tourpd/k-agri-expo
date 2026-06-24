"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function PublishPage({
  params,
}: {
  params: { id: string };
}) {
  const [publishStatus, setPublishStatus] =
    useState("draft");

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5">
      <div className="mx-auto max-w-7xl">

        <Link
          href={`/admin/sales-automation/${params.id}/preview`}
          className="text-xl font-black text-green-700"
        >
          ← 미리보기
        </Link>

        <h1 className="mt-4 text-5xl font-black">
          AI 콘텐츠 발행센터
        </h1>

        <p className="mt-3 text-xl font-bold text-black">
          상세페이지 · 쇼츠 · 이미지 · 공동구매를
          최종 발행합니다.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <section className="rounded-3xl bg-white p-6 shadow-xl">

            <h2 className="text-3xl font-black">
              프로젝트 상태
            </h2>

            <div className="mt-5 grid gap-3">

              <StatusRow
                label="상세페이지"
                value="완성"
              />

              <StatusRow
                label="이미지 패키지"
                value="7장 생성"
              />

              <StatusRow
                label="쇼츠 대본"
                value="생성 완료"
              />

              <StatusRow
                label="광고 배너"
                value="생성 완료"
              />

              <StatusRow
                label="CRM 태그"
                value="생성 완료"
              />
            </div>

          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl">

            <h2 className="text-3xl font-black">
              공개 상태
            </h2>

            <div className="mt-5 flex gap-3">

              <button
                onClick={() =>
                  setPublishStatus("draft")
                }
                className={`rounded-2xl px-5 py-4 font-black ${
                  publishStatus === "draft"
                    ? "bg-yellow-500 text-black"
                    : "bg-stone-100"
                }`}
              >
                임시저장
              </button>

              <button
                onClick={() =>
                  setPublishStatus("public")
                }
                className={`rounded-2xl px-5 py-4 font-black ${
                  publishStatus === "public"
                    ? "bg-green-700 text-white"
                    : "bg-stone-100"
                }`}
              >
                공개
              </button>

              <button
                onClick={() =>
                  setPublishStatus("private")
                }
                className={`rounded-2xl px-5 py-4 font-black ${
                  publishStatus === "private"
                    ? "bg-red-700 text-black"
                    : "bg-stone-100"
                }`}
              >
                비공개
              </button>

            </div>

          </section>

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          <PublishCard
            title="Gemini 이미지 생성"
            desc="상세페이지 이미지 7장 생성"
            color="bg-blue-700"
          />

          <PublishCard
            title="Veo 영상 생성"
            desc="쇼츠 영상 자동 생성"
            color="bg-purple-700"
          />

          <PublishCard
            title="HTML 생성"
            desc="Next.js 상세페이지 생성"
            color="bg-green-700"
          />

          <PublishCard
            title="공동구매 등록"
            desc="공동구매 시스템 연결"
            color="bg-red-700"
          />

          <PublishCard
            title="쇼츠 등록"
            desc="유튜브 쇼츠 업로드 준비"
            color="bg-black"
          />

          <PublishCard
            title="CRM 저장"
            desc="고객 태그 자동 저장"
            color="bg-orange-600"
          />

        </div>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">

          <h2 className="text-3xl font-black">
            최종 실행
          </h2>

          <div className="mt-6 grid gap-4">

            <button className="rounded-3xl bg-green-700 py-6 text-3xl font-black text-white">
              상세페이지 공개
            </button>

            <button className="rounded-3xl bg-blue-700 py-6 text-3xl font-black text-white">
              이미지 생성 시작
            </button>

            <button className="rounded-3xl bg-purple-700 py-6 text-3xl font-black text-white">
              Veo 영상 생성 시작
            </button>

            <button className="rounded-3xl bg-black py-6 text-3xl font-black text-white">
              전체 자동 발행
            </button>

          </div>

        </section>

      </div>
    </main>
  );
}

function StatusRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-stone-100 p-4">
      <span className="text-lg font-black">
        {label}
      </span>
      <span className="text-lg font-black text-green-700">
        {value}
      </span>
    </div>
  );
}

function PublishCard({
  title,
  desc,
  color,
}: {
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className={`${color} rounded-3xl p-6 text-black`}>
      <h3 className="text-2xl font-black">
        {title}
      </h3>

      <p className="mt-3 text-lg font-bold">
        {desc}
      </p>
    </div>
  );
}
