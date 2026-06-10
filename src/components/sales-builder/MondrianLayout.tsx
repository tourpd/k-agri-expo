"use client";

import { BuilderCard } from "@/lib/sales-builder/card-types";

type Props = {
  cards: BuilderCard[];
  selectedId?: string;
  onSelect?: (id: string) => void;
};

export default function MondrianLayout({
  cards,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div
      className="
        grid
        auto-rows-[180px]
        grid-cols-6
        gap-3
        bg-stone-100
        p-4
      "
    >
      {cards
        .filter((card) => card.visible !== false)
        .map((card) => (
          <CardView
            key={card.id}
            card={card}
            selected={selectedId === card.id}
            onClick={() => onSelect?.(card.id)}
          />
        ))}
    </div>
  );
}

function CardView({
  card,
  selected,
  onClick,
}: {
  card: BuilderCard;
  selected?: boolean;
  onClick?: () => void;
}) {
  const sizeClass = getSizeClass(card.size);

  return (
    <div
      onClick={onClick}
      className={`
        ${sizeClass}
        cursor-pointer
        overflow-hidden
        border-4
        transition
        hover:scale-[1.02]
        ${selected ? "border-red-600" : "border-black"}
      `}
      style={{
        background:
          card.backgroundColor ||
          pickMondrianColor(card.type),
        color: card.textColor || "#111",
      }}
    >
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full flex-col justify-between p-5">
          {card.badge && (
            <div className="text-sm font-black uppercase">
              {card.badge}
            </div>
          )}

          <div>
            <h3 className="text-3xl font-black leading-tight">
              {card.title}
            </h3>

            {card.subtitle && (
              <p className="mt-2 text-lg font-bold">
                {card.subtitle}
              </p>
            )}
          </div>

          {card.content && (
            <p className="text-sm font-medium line-clamp-4">
              {card.content}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function getSizeClass(size?: string) {
  switch (size) {
    case "1x1":
      return "col-span-1 row-span-1";

    case "2x1":
      return "col-span-2 row-span-1";

    case "3x1":
      return "col-span-3 row-span-1";

    case "1x2":
      return "col-span-1 row-span-2";

    case "2x2":
      return "col-span-2 row-span-2";

    case "3x2":
      return "col-span-3 row-span-2";

    default:
      return "col-span-2 row-span-1";
  }
}

function pickMondrianColor(type: string) {
  switch (type) {
    case "hero":
      return "#facc15";

    case "problem":
      return "#dc2626";

    case "solution":
      return "#2563eb";

    case "before":
      return "#e5e7eb";

    case "after":
      return "#22c55e";

    case "cta":
      return "#000000";

    case "price":
      return "#fde047";

    case "review":
      return "#f3f4f6";

    default:
      return "#ffffff";
  }
}