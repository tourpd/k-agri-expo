"use client";

import Link from "next/link";

type Product = {
  id: string;
  product_name: string;
  category?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
};

type EventItem = {
  id: string;
  event_type?: string | null;
  title: string;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
};

type Props = {
  type: "product" | "event";
  items: Array<Product | EventItem>;
  onDelete: (id: string) => void;
  onExtractAI?: (id: string) => void;
};

export default function BrandItemList({
  type,
  items,
  onDelete,
  onExtractAI,
}: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
        <p className="text-xl font-extrabold text-stone-500">
          아직 등록된 항목이 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {items.map((item: any) => {
        const title =
          type === "product"
            ? item.product_name
            : item.title;

        const desc =
          type === "product"
            ? item.short_description
            : item.description;

        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5"
          >
            {item.image_url ? (
              <div className="bg-stone-50">
                <img
                  src={item.image_url}
                  alt={title}
                  className="h-60 w-full object-contain"
                />
              </div>
            ) : null}

            <div className="p-5">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-extrabold text-green-800">
                  {type === "product"
                    ? item.category || "제품"
                    : item.event_type || "이벤트"}
                </span>

                <span
                  className={`rounded-full px-3 py-1 text-sm font-extrabold ${
                    item.is_active
                      ? "bg-blue-100 text-blue-800"
                      : "bg-stone-200 text-stone-700"
                  }`}
                >
                  {item.is_active ? "노출중" : "숨김"}
                </span>
              </div>

              <h3 className="mt-4 text-2xl font-extrabold text-stone-900">
                {title}
              </h3>

              <p className="mt-2 text-lg font-bold leading-relaxed text-stone-600">
                {desc || "설명이 없습니다."}
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <Link
                  href={
                    type === "product"
                      ? `/expo/brand-products/${item.id}`
                      : `/expo/brand-events/${item.id}`
                  }
                  className="rounded-2xl bg-green-700 px-4 py-4 text-center text-lg font-extrabold text-white"
                >
                  상세페이지 보기
                </Link>

                {type === "product" && onExtractAI ? (
                  <button
                    type="button"
                    onClick={() => onExtractAI(item.id)}
                    className="rounded-2xl bg-yellow-300 px-4 py-4 text-lg font-extrabold text-stone-900"
                  >
                    AI 분석
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="rounded-2xl bg-red-600 px-4 py-4 text-lg font-extrabold text-white"
                >
                  숨김 처리
                </button>

                <button
                  type="button"
                  className="rounded-2xl bg-stone-900 px-4 py-4 text-lg font-extrabold text-white"
                >
                  수정 예정
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}