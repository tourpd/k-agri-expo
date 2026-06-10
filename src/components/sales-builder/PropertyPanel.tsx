"use client";

import { BuilderCard, CardSize, CardType } from "@/lib/sales-builder/card-types";

type Props = {
  selectedCard: BuilderCard | null;
  onUpdate: (card: BuilderCard) => void;
};

const cardTypes: CardType[] = [
  "hero",
  "problem",
  "solution",
  "before",
  "after",
  "compare",
  "usage",
  "dosage",
  "warning",
  "ingredient",
  "proof",
  "review",
  "faq",
  "video",
  "banner",
  "price",
  "event",
  "coupon",
  "cta",
];

const cardSizes: CardSize[] = ["1x1", "2x1", "1x2", "2x2", "3x1", "3x2"];

export default function PropertyPanel({ selectedCard, onUpdate }: Props) {
  if (!selectedCard) {
    return (
      <aside className="border-l bg-white p-5">
        <h2 className="text-2xl font-black">속성 패널</h2>
        <p className="mt-4 text-lg font-bold text-stone-500">
          캔버스에서 카드를 선택하면 문구, 이미지 프롬프트, 크기, 색상 등을
          수정할 수 있습니다.
        </p>
      </aside>
    );
  }

  function patch(update: Partial<BuilderCard>) {
    onUpdate({
      ...selectedCard!,
      ...update,
    });
  }

  return (
    <aside className="overflow-y-auto border-l bg-white p-5">
      <h2 className="text-2xl font-black">속성 패널</h2>

      <p className="mt-2 rounded-2xl bg-green-50 p-3 text-sm font-black text-green-800">
        선택됨: {selectedCard.type.toUpperCase()}
      </p>

      <div className="mt-5 grid gap-5">
        <label className="block">
          <p className="mb-2 text-lg font-black">카드 타입</p>
          <select
            value={selectedCard.type}
            onChange={(e) => patch({ type: e.target.value as CardType })}
            className="w-full rounded-2xl border border-stone-300 p-4 text-lg font-bold"
          >
            {cardTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <p className="mb-2 text-lg font-black">카드 크기</p>
          <select
            value={selectedCard.size}
            onChange={(e) => patch({ size: e.target.value as CardSize })}
            className="w-full rounded-2xl border border-stone-300 p-4 text-lg font-bold"
          >
            {cardSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <EditField
          label="제목"
          value={selectedCard.title}
          onChange={(v) => patch({ title: v })}
        />

        <EditField
          label="부제목"
          value={selectedCard.subtitle || ""}
          onChange={(v) => patch({ subtitle: v })}
        />

        <EditArea
          label="본문"
          value={selectedCard.content || ""}
          onChange={(v) => patch({ content: v })}
        />

        <EditField
          label="배지"
          value={selectedCard.badge || ""}
          onChange={(v) => patch({ badge: v })}
        />

        <EditField
          label="이미지 URL"
          value={selectedCard.imageUrl || ""}
          onChange={(v) => patch({ imageUrl: v })}
        />

        <EditArea
          label="Gemini 이미지 프롬프트"
          value={selectedCard.imagePrompt || ""}
          onChange={(v) => patch({ imagePrompt: v })}
        />

        <EditField
          label="배경색"
          value={selectedCard.backgroundColor || ""}
          onChange={(v) => patch({ backgroundColor: v })}
        />

        <EditField
          label="글자색"
          value={selectedCard.textColor || ""}
          onChange={(v) => patch({ textColor: v })}
        />

        <label className="flex items-center gap-3 rounded-2xl bg-stone-100 p-4">
          <input
            type="checkbox"
            checked={selectedCard.visible}
            onChange={(e) => patch({ visible: e.target.checked })}
            className="h-5 w-5"
          />
          <span className="text-lg font-black">상세페이지에 노출</span>
        </label>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(selectedCard.imagePrompt || "")
            }
            className="rounded-2xl bg-blue-700 px-5 py-4 text-lg font-black text-white"
          >
            이미지 프롬프트 복사
          </button>

          <button
            type="button"
            className="rounded-2xl bg-stone-900 px-5 py-4 text-lg font-black text-white"
          >
            이 카드 AI 재생성
          </button>

          <button
            type="button"
            className="rounded-2xl bg-green-700 px-5 py-4 text-lg font-black text-white"
          >
            카드 저장
          </button>
        </div>
      </div>
    </aside>
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
      <p className="mb-2 text-lg font-black">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-stone-300 p-4 text-lg font-bold"
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
      <p className="mb-2 text-lg font-black">{label}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        className="w-full rounded-2xl border border-stone-300 p-4 text-base font-bold leading-relaxed"
      />
    </label>
  );
}