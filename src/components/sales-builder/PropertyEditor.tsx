"use client";

import { BuilderCard, CardSize } from "@/lib/sales-builder/card-types";

type Props = {
  card?: BuilderCard;
  onChange: (patch: Partial<BuilderCard>) => void;
};

const sizeOptions: CardSize[] = ["1x1", "2x1", "1x2", "2x2", "3x1", "3x2"];

export default function PropertyEditor({ card, onChange }: Props) {
  if (!card) {
    return (
      <aside className="border-l bg-white p-6">
        <h2 className="text-3xl font-black">카드 편집</h2>
        <p className="mt-4 text-lg font-bold text-stone-500">
          왼쪽 캔버스에서 수정할 카드를 선택하세요.
        </p>
      </aside>
    );
  }

  return (
    <aside className="overflow-y-auto border-l bg-white p-6">
      <h2 className="text-3xl font-black">카드 편집</h2>

      <div className="mt-5 rounded-2xl bg-yellow-100 p-4 text-lg font-black">
        {card.type.toUpperCase()}
      </div>

      <div className="mt-6 grid gap-5">
        <Field label="제목">
          <input
            value={card.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="input"
          />
        </Field>

        <Field label="부제목">
          <input
            value={card.subtitle || ""}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            className="input"
          />
        </Field>

        <Field label="본문">
          <textarea
            value={card.content || ""}
            onChange={(e) => onChange({ content: e.target.value })}
            rows={6}
            className="textarea"
          />
        </Field>

        <Field label="카드 크기">
          <select
            value={card.size}
            onChange={(e) => onChange({ size: e.target.value as CardSize })}
            className="input"
          >
            {sizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </Field>

        <Field label="배지/라벨">
          <input
            value={card.badge || ""}
            onChange={(e) => onChange({ badge: e.target.value })}
            className="input"
            placeholder="예: 공동구매 / 오늘마감 / 추천"
          />
        </Field>

        <Field label="이미지 URL">
          <input
            value={card.imageUrl || ""}
            onChange={(e) => onChange({ imageUrl: e.target.value })}
            className="input"
            placeholder="/images/product.png"
          />
        </Field>

        <Field label="Gemini 이미지 프롬프트">
          <textarea
            value={card.imagePrompt || ""}
            onChange={(e) => onChange({ imagePrompt: e.target.value })}
            rows={7}
            className="textarea"
          />
        </Field>

        <Field label="배경색">
          <input
            value={card.backgroundColor || ""}
            onChange={(e) => onChange({ backgroundColor: e.target.value })}
            className="input"
            placeholder="#facc15"
          />
        </Field>

        <Field label="글자색">
          <input
            value={card.textColor || ""}
            onChange={(e) => onChange({ textColor: e.target.value })}
            className="input"
            placeholder="#111111"
          />
        </Field>

        <label className="flex items-center gap-3 rounded-2xl bg-stone-100 p-4">
          <input
            type="checkbox"
            checked={card.visible}
            onChange={(e) => onChange({ visible: e.target.checked })}
            className="h-5 w-5"
          />
          <span className="text-lg font-black">상세페이지에 노출</span>
        </label>

        <button
          onClick={() => navigator.clipboard.writeText(card.imagePrompt || "")}
          className="rounded-2xl bg-blue-700 px-5 py-4 text-lg font-black text-white"
        >
          이미지 프롬프트 복사
        </button>

        <button className="rounded-2xl bg-stone-900 px-5 py-4 text-lg font-black text-white">
          선택 카드 AI 재생성
        </button>

        <button className="rounded-2xl bg-green-700 px-5 py-4 text-lg font-black text-white">
          변경사항 저장
        </button>
      </div>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <p className="mb-2 text-lg font-black">{label}</p>
      {children}
    </label>
  );
}