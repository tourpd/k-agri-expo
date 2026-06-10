"use client";

import Link from "next/link";
import { useState } from "react";

export const dynamic = "force-dynamic";

type ImageItem = {
  id: string;
  title: string;
  purpose: string;
  hook: string;
  prompt: string;
  status: "ready" | "editing" | "generated";
};

const initialImages: ImageItem[] = [
  {
    id: "IMAGE_01_HERO",
    title: "상단 히어로 이미지",
    purpose: "첫 화면에서 제품 신뢰와 문제 해결 기대감 형성",
    hook: "병 오고 나서 뛰지 마십시오.",
    prompt:
      "9:16 vertical, 8K ultra realistic, Korean rural field, real farmer holding agricultural product naturally, Mondrian style block composition, cinematic commercial photography, no text, no watermark",
    status: "ready",
  },
  {
    id: "IMAGE_02_PROBLEM",
    title: "문제 공감 이미지",
    purpose: "농민이 자기 밭 문제라고 느끼게 만들기",
    hook: "옆집은 멀쩡한디, 우리 밭만 왜 이래?",
    prompt:
      "sick crop leaves close-up, worried Korean farmer, rural field after rain, emotional agricultural commercial image, no text, no watermark",
    status: "ready",
  },
  {
    id: "IMAGE_03_COMPARE",
    title: "비포애프터 이미지",
    purpose: "관리 전후를 한눈에 보여 구매욕구 자극",
    hook: "비료값만 쓰고 못 먹으면 손해여.",
    prompt:
      "split screen before and after crop field, left weak crop, right healthy crop, Mondrian grid layout, realistic Korean agriculture, no text, no watermark",
    status: "ready",
  },
  {
    id: "IMAGE_04_PRODUCT",
    title: "제품 신뢰 이미지",
    purpose: "제품 라벨, 성분, 인증, 포장 신뢰감 표현",
    hook: "그려, 이거여.",
    prompt:
      "premium product bottle close-up, clean farm background, agricultural product photography, natural light, no text, no watermark",
    status: "ready",
  },
  {
    id: "IMAGE_05_USAGE",
    title: "사용 장면 이미지",
    purpose: "농민이 실제 사용법을 직관적으로 이해",
    hook: "어떻게 쓰는지 보여줘야 삽니다.",
    prompt:
      "real Korean farmer applying agricultural product in field, practical usage scene, cinematic natural light, no text, no watermark",
    status: "ready",
  },
  {
    id: "IMAGE_06_TABLE",
    title: "작물별 시비법 카드",
    purpose: "작물별 사용방법을 상세페이지 이미지 카드로 활용",
    hook: "고추는? 마늘은? 딸기는?",
    prompt:
      "Mondrian inspired clean infographic card layout for crop dosage guide, agricultural visual blocks, no readable text, no watermark",
    status: "ready",
  },
  {
    id: "IMAGE_07_CTA",
    title: "공동구매 CTA 이미지",
    purpose: "마지막 신청 전환 유도",
    hook: "오늘까지여~",
    prompt:
      "Korean village chief holding agricultural product, group buying deadline mood, funny rural sitcom atmosphere, 9:16 vertical, no text, no watermark",
    status: "ready",
  },
];

export default function ImagesPage({ params }: { params: { id: string } }) {
  const [items, setItems] = useState<ImageItem[]>(initialImages);
  const [selectedId, setSelectedId] = useState(items[0].id);

  const selected = items.find((item) => item.id === selectedId) || items[0];

  function updateItem(id: string, patch: Partial<ImageItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  function markGenerated(id: string) {
    updateItem(id, { status: "generated" });
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-stone-950">
      <div className="mx-auto max-w-[1800px]">
        <Link
          href={`/admin/sales-automation/${params.id}/workspace`}
          className="text-xl font-black text-green-700"
        >
          ← 편집 작업실
        </Link>

        <h1 className="mt-4 text-5xl font-black">Gemini 이미지 생성센터</h1>

        <p className="mt-3 text-xl font-bold text-black">
          광고 훅과 상세페이지 섹션을 이미지 장면으로 바꿔 농민 구매욕구와 업체 만족도를 높입니다.
        </p>

        <div className="mt-8 grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-3xl bg-white p-5 shadow-xl">
            <h2 className="text-3xl font-black">이미지 패키지</h2>

            <div className="mt-5 grid gap-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`rounded-2xl border-2 p-4 text-left ${
                    selectedId === item.id
                      ? "border-blue-700 bg-blue-50"
                      : "border-stone-200 bg-stone-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-black">{item.title}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-black ${
                        item.status === "generated"
                          ? "bg-white text-green-800"
                          : "bg-white text-yellow-800"
                      }`}
                    >
                      {item.status === "generated" ? "생성완료" : "대기"}
                    </span>
                  </div>
                  <p className="mt-2 text-base font-bold text-black">
                    {item.hook}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-lg font-black text-blue-700">{selected.id}</p>
                <h2 className="mt-2 text-4xl font-black">{selected.title}</h2>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(selected.prompt)}
                  className="rounded-2xl bg-stone-900 px-5 py-4 text-lg font-black text-black"
                >
                  프롬프트 복사
                </button>

                <button
                  onClick={() => markGenerated(selected.id)}
                  className="rounded-2xl bg-blue-700 px-5 py-4 text-lg font-black text-white"
                >
                  생성완료 표시
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              <EditField
                label="이미지 제목"
                value={selected.title}
                onChange={(v) => updateItem(selected.id, { title: v })}
              />

              <EditArea
                label="이미지 목적"
                value={selected.purpose}
                onChange={(v) => updateItem(selected.id, { purpose: v })}
              />

              <EditField
                label="활용 광고 훅"
                value={selected.hook}
                onChange={(v) => updateItem(selected.id, { hook: v })}
              />

              <EditArea
                label="Gemini 이미지 프롬프트"
                value={selected.prompt}
                onChange={(v) => updateItem(selected.id, { prompt: v })}
              />
            </div>

            <div className="mt-8 rounded-3xl border-4 border-black bg-stone-100 p-8">
              <p className="text-xl font-black">이미지 미리보기 자리</p>
              <div className="mt-5 flex min-h-[360px] items-center justify-center rounded-3xl bg-white p-8 text-center text-3xl font-black">
                {selected.title}
                <br />
                <span className="mt-3 block text-xl text-black">
                  Gemini 생성 이미지가 여기에 들어갈 예정
                </span>
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
        rows={7}
        className="w-full rounded-2xl border border-stone-300 p-4 text-lg font-bold leading-relaxed"
      />
    </label>
  );
}
