"use client";

import { BuilderCard } from "@/lib/sales-builder/card-types";
import MondrianLayout from "./MondrianLayout";

type Props = {
  cards: BuilderCard[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
};

export default function SalesCanvas({
  cards,
  selectedId,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}: Props) {
  const selectedCard = cards.find((card) => card.id === selectedId);

  return (
    <section className="overflow-y-auto bg-[#f4f7f2] p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-3xl font-black">몬드리안 상세페이지 캔버스</h2>
            <p className="mt-2 text-lg font-bold text-stone-600">
              카드 순서와 크기를 바꾸며 상세페이지를 조립합니다.
            </p>
          </div>

          {selectedCard ? (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onMoveUp(selectedCard.id)}
                className="rounded-xl bg-stone-900 px-4 py-3 text-base font-black text-white"
              >
                위로
              </button>
              <button
                onClick={() => onMoveDown(selectedCard.id)}
                className="rounded-xl bg-stone-900 px-4 py-3 text-base font-black text-white"
              >
                아래로
              </button>
              <button
                onClick={() => onDuplicate(selectedCard.id)}
                className="rounded-xl bg-blue-700 px-4 py-3 text-base font-black text-white"
              >
                복제
              </button>
              <button
                onClick={() => onDelete(selectedCard.id)}
                className="rounded-xl bg-red-700 px-4 py-3 text-base font-black text-white"
              >
                삭제
              </button>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-3xl border-4 border-black bg-white shadow-2xl">
          <MondrianLayout
            cards={cards}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </div>

        <div className="mt-6 rounded-3xl bg-white p-6 shadow-xl">
          <h3 className="text-2xl font-black">편집 원칙</h3>
          <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
            상세페이지는 길게 읽히는 설명서가 아니라, 농민이 한눈에 이해하는
            판매용 카드판이어야 합니다. 문제, 해결, 사용법, 주의사항, 가격,
            신청 버튼을 블록으로 나눠 배치합니다.
          </p>
        </div>
      </div>
    </section>
  );
}