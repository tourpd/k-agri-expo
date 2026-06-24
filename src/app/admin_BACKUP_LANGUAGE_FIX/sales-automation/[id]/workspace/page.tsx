"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export const dynamic = "force-dynamic";

type SectionType =
  | "hero"
  | "problem"
  | "compare"
  | "product"
  | "usage"
  | "warning"
  | "crop_dose"
  | "before_after"
  | "review"
  | "cta";

type WorkspaceSection = {
  id: string;
  type: SectionType;
  title: string;
  headline: string;
  body: string;
  imagePrompt: string;
  memo: string;
  isVisible: boolean;
};

const initialSections: WorkspaceSection[] = [
  {
    id: "hero",
    type: "hero",
    title: "상단 히어로",
    headline: "병 오고 나서 뛰지 마십시오.",
    body: "오기 전에 준비하는 고객이 결국 웃습니다.",
    imagePrompt:
      "9:16 vertical, 8K ultra realistic, Korean rural pepper field, real farmer holding product naturally, cinematic commercial photography, Mondrian inspired bold block layout, no text, no watermark",
    memo: "제품 첫인상. 가장 강한 한 문장 필요.",
    isVisible: true,
  },
  {
    id: "problem",
    type: "problem",
    title: "문제 공감",
    headline: "비 오고 나면 꼭 시작되더라...",
    body: "잎에 얼룩이 보이기 시작하면 고객 마음도 같이 무너집니다.",
    imagePrompt:
      "9:16 vertical, sick crop leaves close-up, worried Korean farmer, cloudy sky after rain, emotional commercial photography, no text, no watermark",
    memo: "고객이 '이거 우리 밭 얘기네' 느끼게.",
    isVisible: true,
  },
  {
    id: "compare",
    type: "compare",
    title: "비교 블록",
    headline: "옆집은 멀쩡한디, 우리 밭만 왜 이래?",
    body: "관리 전과 관리 후를 한눈에 비교하는 블록입니다.",
    imagePrompt:
      "split screen comparison, left unhealthy crop field, right well managed healthy crop field, Korean rural farm, Mondrian grid style, no text, no watermark",
    memo: "비포/애프터 또는 관리 전후 비교표.",
    isVisible: true,
  },
  {
    id: "product",
    type: "product",
    title: "제품 신뢰",
    headline: "제품은 마지막에 보여줘야 힘이 납니다.",
    body: "라벨, 인증, 성분, 특징을 카드형 이미지로 분리합니다.",
    imagePrompt:
      "product bottle close-up, clean agricultural product photography, natural farm background, premium detail page product card, no text, no watermark",
    memo: "제품 단독컷, 라벨컷, 인증컷.",
    isVisible: true,
  },
  {
    id: "usage",
    type: "usage",
    title: "사용 장면",
    headline: "어떻게 쓰는지 보여줘야 삽니다.",
    body: "고객이 실제로 사용하는 장면을 만들어 신뢰를 줍니다.",
    imagePrompt:
      "real Korean farmer using agricultural product in crop field, practical usage scene, cinematic natural light, no text, no watermark",
    memo: "분무, 관주, 엽면시비 등.",
    isVisible: true,
  },
  {
    id: "crop_dose",
    type: "crop_dose",
    title: "작물별 시비법",
    headline: "고추는? 마늘은? 딸기는?",
    body: "작물별 사용량과 사용시기를 표로 정리합니다.",
    imagePrompt:
      "Mondrian inspired infographic card layout for crop dosage guide, Korean agriculture, clean blocks, no text, no watermark",
    memo: "PDF에서 작물별 사용법 추출.",
    isVisible: true,
  },
  {
    id: "warning",
    type: "warning",
    title: "주의사항",
    headline: "잘 쓰는 것도 중요하지만, 잘못 쓰지 않는 게 더 중요합니다.",
    body: "혼용, 희석, 사용시기, 보관 주의사항을 별도 카드로 만듭니다.",
    imagePrompt:
      "Korean farmer carefully reading agricultural product label, safety and caution mood, clean detail page image, no text, no watermark",
    memo: "주의사항은 업체 신뢰 포인트.",
    isVisible: true,
  },
  {
    id: "cta",
    type: "cta",
    title: "공동구매 CTA",
    headline: "오늘까지여~",
    body: "뭐가? 내일부터 오른다니께. 뭐가 오른다는겨? 이거. 그럼 나도 끼워줘유.",
    imagePrompt:
      "Korean village chief holding agricultural product, group buying deadline board, funny rural sitcom mood, 9:16 vertical, no text, no watermark",
    memo: "광고 훅을 이미지로 전환.",
    isVisible: true,
  },
];

export default function SalesAutomationWorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const [sections, setSections] = useState<WorkspaceSection[]>(initialSections);
  const [selectedId, setSelectedId] = useState(sections[0]?.id || "");
  const [clientRequest, setClientRequest] = useState(
    "좀 더 고급스럽게 / 고객 말투로 / 가격표 크게 / 비포애프터를 앞쪽으로"
  );

  const selected = useMemo(
    () => sections.find((item) => item.id === selectedId) || sections[0],
    [sections, selectedId]
  );

  function updateSection(id: string, patch: Partial<WorkspaceSection>) {
    setSections((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function moveSection(id: string, direction: "up" | "down") {
    setSections((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) return prev;

      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;

      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
  }

  function removeSection(id: string) {
    setSections((prev) => prev.filter((item) => item.id !== id));
    setSelectedId(sections[0]?.id || "");
  }

  function addSection() {
    const id = `section_${Date.now()}`;

    const next: WorkspaceSection = {
      id,
      type: "review",
      title: "새 섹션",
      headline: "새 문구를 입력하세요",
      body: "업체가 원하는 설명을 입력하세요.",
      imagePrompt:
        "9:16 vertical, Korean agriculture commercial image, realistic farmer, cinematic, no text, no watermark",
      memo: "새로 추가한 섹션입니다.",
      isVisible: true,
    };

    setSections((prev) => [...prev, next]);
    setSelectedId(id);
  }

  const visibleSections = sections.filter((item) => item.isVisible);

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-stone-950">
      <div className="mx-auto max-w-[1800px]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Link
              href="/admin/sales-automation"
              className="text-xl font-black text-green-700"
            >
              ← AI 판매자동화센터
            </Link>

            <h1 className="mt-4 text-5xl font-black">
              AI 상세페이지 편집 작업실
            </h1>

            <p className="mt-3 text-xl font-bold text-black">
              작업 ID: {params.id} / 이미지·문구·표·광고훅을 업체가 원하는 방향으로
              이동·수정·삭제·재구성합니다.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href={`/admin/sales-automation/${params.id}/preview`}
              className="rounded-2xl bg-stone-900 px-6 py-4 text-center text-xl font-black text-black"
            >
              미리보기
            </Link>
            <Link
              href={`/admin/sales-automation/${params.id}/images`}
              className="rounded-2xl bg-blue-700 px-6 py-4 text-center text-xl font-black text-white"
            >
              이미지 생성
            </Link>
            <Link
              href={`/admin/sales-automation/${params.id}/publish`}
              className="rounded-2xl bg-green-700 px-6 py-4 text-center text-xl font-black text-white"
            >
              저장/공개
            </Link>
          </div>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-3xl font-black">업체 수정 요청</h2>
          <textarea
            value={clientRequest}
            onChange={(e) => setClientRequest(e.target.value)}
            rows={4}
            className="mt-4 w-full rounded-3xl border border-stone-300 bg-yellow-50 p-5 text-xl font-bold"
            placeholder="예: 더 고급스럽게 / 고객 말투로 / 제품을 더 크게 / 비포애프터 먼저 / 무서운 느낌 줄이기"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <ActionButton label="요청 반영 재생성" />
            <ActionButton label="선택 섹션만 재생성" />
            <ActionButton label="Gemini 프롬프트 재작성" />
            <ActionButton label="표 다시 만들기" />
            <ActionButton label="CTA 강하게" />
          </div>
        </section>

        <div className="mt-8 grid gap-6 xl:grid-cols-[420px_1fr_520px]">
          <section className="rounded-3xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black">섹션 순서</h2>
              <button
                onClick={addSection}
                className="rounded-2xl bg-green-700 px-4 py-3 text-lg font-black text-white"
              >
                + 추가
              </button>
            </div>

            <div className="mt-5 grid gap-3">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setSelectedId(section.id)}
                  className={`rounded-2xl border-2 p-4 text-left ${
                    selectedId === section.id
                      ? "border-green-700 bg-green-50"
                      : "border-stone-200 bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-black">
                      {index + 1}. {section.title}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-black ${
                        section.isVisible
                          ? "bg-white text-green-800"
                          : "bg-stone-200 text-black"
                      }`}
                    >
                      {section.isVisible ? "노출" : "숨김"}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-base font-bold text-black">
                    {section.headline}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-3xl font-black">섹션 편집</h2>

                  <div className="flex flex-wrap gap-2">
                    <SmallButton label="위로" onClick={() => moveSection(selected.id, "up")} />
                    <SmallButton label="아래로" onClick={() => moveSection(selected.id, "down")} />
                    <SmallButton
                      label={selected.isVisible ? "숨김" : "노출"}
                      onClick={() =>
                        updateSection(selected.id, {
                          isVisible: !selected.isVisible,
                        })
                      }
                    />
                    <SmallButton label="삭제" onClick={() => removeSection(selected.id)} />
                  </div>
                </div>

                <div className="mt-6 grid gap-5">
                  <EditField
                    label="섹션 제목"
                    value={selected.title}
                    onChange={(v) => updateSection(selected.id, { title: v })}
                  />

                  <EditField
                    label="대표 문구"
                    value={selected.headline}
                    onChange={(v) => updateSection(selected.id, { headline: v })}
                  />

                  <EditArea
                    label="본문/표 내용"
                    value={selected.body}
                    onChange={(v) => updateSection(selected.id, { body: v })}
                  />

                  <EditArea
                    label="Gemini 이미지 프롬프트"
                    value={selected.imagePrompt}
                    onChange={(v) =>
                      updateSection(selected.id, { imagePrompt: v })
                    }
                  />

                  <EditArea
                    label="업체/관리자 메모"
                    value={selected.memo}
                    onChange={(v) => updateSection(selected.id, { memo: v })}
                  />
                </div>
              </>
            ) : null}
          </section>

          <section className="rounded-3xl bg-white p-5 shadow-xl">
            <h2 className="text-3xl font-black">실시간 미리보기</h2>

            <div className="mt-5 overflow-hidden rounded-3xl border-4 border-black bg-white">
              <div className="grid grid-cols-2">
                <div className="bg-yellow-300 p-5">
                  <p className="text-lg font-black">MONDRIAN DETAIL</p>
                  <h3 className="mt-3 text-3xl font-black leading-tight">
                    {visibleSections[0]?.headline || "대표 문구"}
                  </h3>
                </div>
                <div className="grid grid-rows-2">
                  <div className="bg-red-600 p-5 text-xl font-black text-white">
                    문제 공감
                  </div>
                  <div className="bg-blue-700 p-5 text-xl font-black text-white">
                    이미지 블록
                  </div>
                </div>
              </div>

              <div className="grid gap-0">
                {visibleSections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`border-t-4 border-black p-5 ${
                      index % 3 === 0
                        ? "bg-white"
                        : index % 3 === 1
                          ? "bg-yellow-50"
                          : "bg-stone-50"
                    }`}
                  >
                    <p className="text-sm font-black text-black">
                      {section.title}
                    </p>
                    <h4 className="mt-2 text-2xl font-black">
                      {section.headline}
                    </h4>
                    <p className="mt-3 whitespace-pre-wrap text-lg font-bold leading-relaxed text-black">
                      {section.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function EditField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <p className="mb-2 text-xl font-black">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-stone-300 p-4 text-xl font-bold"
      />
    </label>
  );
}

function EditArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <p className="mb-2 text-xl font-black">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full rounded-2xl border border-stone-300 p-4 text-lg font-bold leading-relaxed"
      />
    </label>
  );
}

function ActionButton({ label }: { label: string }) {
  return (
    <button className="rounded-2xl bg-stone-900 px-5 py-4 text-lg font-black text-black">
      {label}
    </button>
  );
}

function SmallButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-stone-900 px-4 py-3 text-base font-black text-black"
    >
      {label}
    </button>
  );
}
