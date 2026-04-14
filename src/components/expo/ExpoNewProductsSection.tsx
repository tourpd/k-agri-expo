import React from "react";

type ExpoNewProductItem = {
  id?: string;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  image_url?: string | null;
  link_url?: string | null;
  badge?: string | null;
  meta_1?: string | null;
  meta_2?: string | null;
  slot_type?: string | null;
  section_key?: string | null;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pickBadge(item: ExpoNewProductItem) {
  const badge = normalizeString(item.badge);
  if (badge) return badge;

  const slotType = normalizeString(item.slot_type);
  const sectionKey = normalizeString(item.section_key);

  if (slotType === "featured" || sectionKey === "featured") {
    return "이달의 신제품";
  }

  return "NEW";
}

function pickDescription(item: ExpoNewProductItem) {
  return (
    normalizeString(item.description) ||
    normalizeString(item.subtitle) ||
    "새롭게 등록된 업체와 제품을 확인해보세요."
  );
}

function pickHref(item: ExpoNewProductItem) {
  return normalizeString(item.link_url) || "#";
}

function CardInner({ item }: { item: ExpoNewProductItem }) {
  const badge = pickBadge(item);
  const title = normalizeString(item.title) || "신규 입점 업체";
  const desc = pickDescription(item);
  const meta1 = normalizeString(item.meta_1);
  const meta2 = normalizeString(item.meta_2);
  const imageUrl = normalizeString(item.image_url);

  return (
    <div className="expo-new-card h-full rounded-[28px] border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-[2px] hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            badge === "이달의 신제품"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-neutral-100 text-neutral-700"
          }`}
        >
          {badge}
        </span>
      </div>

      {imageUrl ? (
        <div className="mb-4 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
          <img
            src={imageUrl}
            alt={title}
            className="h-48 w-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-4 flex h-48 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 text-sm text-neutral-400">
          이미지 준비중
        </div>
      )}

      <div className="text-lg font-bold text-neutral-900">{title}</div>

      <p className="mt-3 min-h-[72px] text-sm leading-6 text-neutral-600">
        {desc}
      </p>

      {(meta1 || meta2) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {meta1 && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
              {meta1}
            </span>
          )}
          {meta2 && (
            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
              {meta2}
            </span>
          )}
        </div>
      )}

      <div className="mt-5">
        <span className="inline-flex items-center text-sm font-semibold text-neutral-900">
          자세히 보기
          <span className="ml-1">→</span>
        </span>
      </div>
    </div>
  );
}

export default function ExpoNewProductsSection({
  items,
}: {
  items?: ExpoNewProductItem[];
}) {
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (safeItems.length === 0) {
    return (
      <section className="expo-section" style={{ padding: "18px 20px 0" }}>
        <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="expo-section-head mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
                신규 입점 / 신제품
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                새롭게 입점한 업체와 주목할 신제품을 곧 만나보실 수 있습니다.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
            현재 노출할 신규 입점 또는 신제품 항목이 없습니다.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="expo-section" style={{ padding: "18px 20px 0" }}>
      <div className="rounded-[32px] border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="expo-section-head mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
              신규 입점 / 이달의 신제품
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              새롭게 입점한 업체와 지금 주목할 제품을 빠르게 확인해보세요.
            </p>
          </div>
        </div>

        <div className="expo-new-grid grid grid-cols-3 gap-4">
          {safeItems.map((item, index) => {
            const href = pickHref(item);
            const key = item.id || `${item.title || "item"}-${index}`;

            if (href && href !== "#") {
              return (
                <a
                  key={key}
                  href={href}
                  className="block h-full"
                >
                  <CardInner item={item} />
                </a>
              );
            }

            return (
              <div key={key} className="h-full">
                <CardInner item={item} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}