"use client";

import { BuilderCard } from "@/lib/sales-builder/card-types";

type Props = {
  cards: BuilderCard[];
  selectedCard: BuilderCard | null;
  onSelect: (card: BuilderCard) => void;
};

export default function CanvasEditor({
  cards,
  selectedCard,
  onSelect,
}: Props) {
  const visibleCards = cards
    .filter((card) => card.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="overflow-y-auto bg-[#f4f7f2] p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black">몬드리안 상세페이지 캔버스</h2>
            <p className="mt-2 text-lg font-bold text-stone-600">
              제품 정보를 블록으로 나누어 한눈에 보이게 배치합니다.
            </p>
          </div>

          <button className="rounded-2xl bg-green-700 px-5 py-4 text-lg font-black text-white">
            HTML 내보내기
          </button>
        </div>

        <div className="rounded-3xl border-4 border-black bg-white shadow-2xl">
          <div className="grid grid-cols-6 auto-rows-[170px] gap-0">
            {visibleCards.map((card, index) => (
              <button
                key={card.id}
                onClick={() => onSelect(card)}
                className={`border-4 border-black p-5 text-left transition hover:brightness-95 ${getCardSpan(
                  card.size
                )} ${getCardColor(card.type, index)} ${
                  selectedCard?.id === card.id
                    ? "ring-8 ring-green-500 ring-inset"
                    : ""
                }`}
              >
                <p className="text-sm font-black opacity-70">
                  {card.type.toUpperCase()}
                </p>

                <h3 className="mt-2 text-3xl font-black leading-tight">
                  {card.title}
                </h3>

                {card.subtitle ? (
                  <p className="mt-2 text-lg font-black">{card.subtitle}</p>
                ) : null}

                {card.content ? (
                  <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-lg font-bold leading-relaxed">
                    {card.content}
                  </p>
                ) : null}

                {card.badge ? (
                  <span className="mt-4 inline-flex rounded-full bg-black px-4 py-2 text-sm font-black text-white">
                    {card.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
          <h3 className="text-2xl font-black">캔버스 원칙</h3>
          <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
            몬드리안 스타일은 단순 색상 장식이 아니라 정보를 블록으로 쪼개
            농민이 빠르게 이해하게 만드는 구조입니다. 제품사진, 문제, 비교,
            사용방법, 주의사항, 시비법, 후기, 신청 버튼을 카드처럼 배치합니다.
          </p>
        </div>
      </div>
    </section>
  );
}

function getCardSpan(size: BuilderCard["size"]) {
  switch (size) {
    case "1x1":
      return "col-span-2 row-span-1";
    case "2x1":
      return "col-span-3 row-span-1";
    case "1x2":
      return "col-span-2 row-span-2";
    case "2x2":
      return "col-span-3 row-span-2";
    case "3x1":
      return "col-span-6 row-span-1";
    case "3x2":
      return "col-span-6 row-span-2";
    default:
      return "col-span-2 row-span-1";
  }
}

function getCardColor(type: BuilderCard["type"], index: number) {
  if (type === "hero") return "bg-yellow-300 text-black";
  if (type === "problem") return "bg-red-600 text-white";
  if (type === "compare") return "bg-blue-700 text-white";
  if (type === "before") return "bg-stone-100 text-black";
  if (type === "after") return "bg-green-600 text-white";
  if (type === "warning") return "bg-orange-400 text-black";
  if (type === "cta") return "bg-black text-white";
  if (type === "price") return "bg-red-600 text-white";

  const colors = [
    "bg-white text-black",
    "bg-stone-100 text-black",
    "bg-yellow-100 text-black",
    "bg-blue-50 text-black",
  ];

  return colors[index % colors.length];
}