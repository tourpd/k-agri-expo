/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Brand = {
  id?: string;
  hall_key?: string;
  brand_slug?: string | null;
  brand_name?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  short_description?: string | null;
  main_category?: string | null;
  is_active?: boolean | null;
};

type Product = {
  id: string;
  product_name?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  future_business_type?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type EventItem = {
  id: string;
  event_type?: string | null;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const DEFAULT_BRAND_SLUG = "dof-eagle-five";

function sortLatest<T extends { created_at?: string | null; updated_at?: string | null }>(
  items: T[]
) {
  return [...items].sort((a, b) => {
    const bt = new Date(b.created_at || b.updated_at || 0).getTime();
    const at = new Date(a.created_at || a.updated_at || 0).getTime();
    return bt - at;
  });
}

export default function BrandHallEditorClient() {
  const [brand, setBrand] = useState<Brand>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const brandSlug = brand.brand_slug || DEFAULT_BRAND_SLUG;

  const isFutureInsectHall = useMemo(() => {
    const hall = String(brand.hall_key || "").trim();
    const category = String(brand.main_category || "").trim();

    return (
      hall === "future_insect" ||
      hall === "future_food_insect" ||
      category === "future_insect" ||
      category === "future_food_insect" ||
      category.includes("미래식량") ||
      category.includes("곤충")
    );
  }, [brand.hall_key, brand.main_category]);

  const activeProducts = useMemo(
    () => products.filter((p) => p.is_active !== false).length,
    [products]
  );

  const activeEvents = useMemo(
    () => events.filter((e) => e.is_active !== false).length,
    [events]
  );

  const futureProducts = useMemo(
    () => products.filter((p) => Boolean(p.future_business_type)).length,
    [products]
  );

  async function loadData() {
    setLoading(true);

    try {
      const res = await fetch(`/api/vendor/brand-hall?brand_slug=${brandSlug}`, {
        cache: "no-store",
      });

      const json = await res.json();

      setBrand(json.brand || {});
      setProducts(sortLatest<Product>(json.products || []));
      setEvents(sortLatest<EventItem>(json.events || []));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f8f3] p-6">
        <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8 text-2xl font-black">
          브랜드관 정보를 불러오는 중...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f3] pb-20">
      <section className="mx-auto max-w-5xl px-4 py-5">
        <div className="rounded-[32px] bg-gradient-to-br from-green-800 to-lime-700 p-6 text-white">
          <p className="text-sm font-black text-lime-200">
            K-Agri Expo 업체 운영센터
          </p>

          <h1 className="mt-2 text-3xl font-black">
            {brand.brand_name || "브랜드관 관리"}
          </h1>

          <p className="mt-3 text-lg font-bold text-green-50">
            필요한 작업만 선택하세요.
          </p>
        </div>

        <section
          className={`mt-5 grid gap-3 ${
            isFutureInsectHall ? "md:grid-cols-4" : "md:grid-cols-3"
          }`}
        >
          <StatCard
            title="브랜드 상태"
            value={brand.is_active === false ? "숨김" : "운영중"}
          />
          <StatCard title="제품" value={`${activeProducts}개`} />
          {isFutureInsectHall ? (
            <StatCard title="미래식량 사업" value={`${futureProducts}개`} />
          ) : null}
          <StatCard title="이벤트" value={`${activeEvents}개`} />
        </section>

        <section className="mt-6 rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="text-2xl font-black text-stone-900">
            무엇을 하시겠습니까?
          </h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ActionCard
              title="브랜드 정보 수정"
              desc="로고, 배너, 브랜드 소개를 수정합니다."
              href="/vendor/brand-hall/profile"
              tone="white"
            />

            <ActionCard
              title="제품 새로 등록"
              desc="농자재, 영양제, 자재 제품을 등록합니다."
              href="/vendor/products/new"
              tone="green"
            />

            <ActionCard
              title="내 제품 관리"
              desc="등록한 제품을 보고 수정하거나 숨김 처리합니다."
              href="/vendor/products"
              tone="white"
            />

            <ActionCard
              title="공동구매·샘플 등록"
              desc="공동구매, 샘플, 특가 이벤트를 등록합니다."
              href="/vendor/events/new"
              tone="yellow"
            />

            {isFutureInsectHall ? (
              <ActionCard
                title="미래식량·곤충 사업 등록"
                desc="컨테이너 사육농장, 교육, 전량수매, 치유농업 사업을 등록합니다."
                href="/vendor/future-business/new"
                tone="amber"
              />
            ) : null}

            <ActionCard
              title="농민 화면 미리보기"
              desc="실제 농민에게 보이는 브랜드관을 확인합니다."
              href={`/expo/brands/${brandSlug}`}
              tone="black"
            />
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-stone-900">
                최근 등록 제품
              </h2>

              <Link
                href="/vendor/products"
                className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-black text-stone-700"
              >
                전체보기
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {products.length === 0 ? (
                <EmptyBox text="아직 등록한 제품이 없습니다." />
              ) : (
                products.slice(0, 4).map((item) => (
                  <MiniItem
                    key={item.id}
                    title={item.product_name || "제품명 없음"}
                    desc={item.short_description || "설명 없음"}
                    imageUrl={item.image_url}
                    href={`/expo/brand-products/${item.id}`}
                  />
                ))
              )}
            </div>
          </div>

          <div className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-stone-900">
                진행 이벤트
              </h2>

              <Link
                href="/vendor/events"
                className="rounded-xl bg-stone-100 px-3 py-2 text-sm font-black text-stone-700"
              >
                전체보기
              </Link>
            </div>

            <div className="mt-4 grid gap-3">
              {events.length === 0 ? (
                <EmptyBox text="아직 등록한 이벤트가 없습니다." />
              ) : (
                events.slice(0, 4).map((item) => (
                  <MiniItem
                    key={item.id}
                    title={item.title || "이벤트 제목 없음"}
                    desc={item.description || item.event_type || "설명 없음"}
                    imageUrl={item.image_url}
                    href={`/expo/brand-events/${item.id}`}
                  />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] bg-green-50 p-5 ring-1 ring-green-200">
          <h2 className="text-xl font-black text-green-900">업체 사용 순서</h2>

          <div className="mt-3 grid gap-2 text-lg font-bold text-green-950">
            <p>1. 브랜드 정보 수정</p>
            <p>2. 제품 등록</p>
            <p>3. 공동구매·샘플 이벤트 등록</p>
            <p>4. 농민 화면 미리보기</p>
          </div>
        </section>
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm font-black text-stone-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-stone-950">{value}</p>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  href,
  tone,
}: {
  title: string;
  desc: string;
  href: string;
  tone: "white" | "green" | "yellow" | "amber" | "black";
}) {
  const cls =
    tone === "green"
      ? "bg-green-700 text-white"
      : tone === "yellow"
        ? "bg-yellow-300 text-stone-950"
        : tone === "amber"
          ? "bg-amber-600 text-white"
          : tone === "black"
            ? "bg-stone-950 text-white"
            : "bg-white text-stone-950 ring-1 ring-black/10";

  return (
    <Link href={href} className={`rounded-3xl p-5 shadow-sm ${cls}`}>
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="mt-2 text-base font-bold opacity-90">{desc}</p>
    </Link>
  );
}

function MiniItem({
  title,
  desc,
  imageUrl,
  href,
}: {
  title: string;
  desc: string;
  imageUrl?: string | null;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex gap-4 rounded-2xl bg-stone-50 p-3 ring-1 ring-black/5"
    >
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="h-full w-full rounded-2xl object-contain"
          />
        ) : (
          <span className="text-xs font-black text-stone-400">이미지</span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-lg font-black text-stone-950">{title}</p>
        <p className="mt-1 line-clamp-2 text-sm font-bold text-stone-600">
          {desc}
        </p>
      </div>
    </Link>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center text-lg font-black text-stone-500">
      {text}
    </div>
  );
}