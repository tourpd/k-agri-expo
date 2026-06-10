/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ slug: string }>;
};

type Brand = {
  id: string;
  hall_key: string | null;
  brand_slug: string | null;
  brand_name: string;
  logo_url: string | null;
  banner_url: string | null;
  banner_height?: number | null;
  short_description: string | null;
  main_category: string | null;
  youtube_url: string | null;
  homepage_url: string | null;
  instagram_url?: string | null;
  facebook_url?: string | null;
  blog_url?: string | null;
  sns_url?: string | null;
  is_active: boolean | null;
};

type Product = {
  id: string;
  product_name: string;
  category: string | null;
  short_description: string | null;
  image_url: string | null;
  youtube_url?: string | null;
  youtube_urls?: string[] | null;
  price_krw?: number | null;
  unit_label?: string | null;
  is_active: boolean | null;
  sort_order: number | null;
};

type EventItem = {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  image_url?: string | null;
  youtube_url?: string | null;
  is_active: boolean | null;
  sort_order: number | null;
};

function money(v: unknown) {
  const n = Number(v || 0);
  if (!n) return "상담 후 안내";
  return `${n.toLocaleString("ko-KR")}원`;
}

function shortText(v: unknown, fallback = "자세한 내용을 확인하세요.") {
  const s = String(v || "").trim();
  return s || fallback;
}

export default async function ExpoBrandDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: brand } = await supabase
    .from("expo_brands")
    .select("*")
    .eq("brand_slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!brand) notFound();

  const [{ data: products }, { data: events }] = await Promise.all([
    supabase
      .from("expo_brand_products")
      .select("*")
      .eq("brand_id", brand.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("expo_brand_events")
      .select("*")
      .eq("brand_id", brand.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const brandRow = brand as Brand;
  const productRows = (products ?? []) as Product[];
  const eventRows = (events ?? []) as EventItem[];

  const bannerHeight = Math.max(

  180,

  Math.min(Number(brandRow.banner_height || 280), 380)

);

const isHealthGroupBuy =

  brandRow.brand_slug === "kafs-health-groupbuy";

return (

  <main className="min-h-screen bg-[#f6f8f3] px-4 pb-10 pt-10">

    <section className="mx-auto max-w-6xl">

      <section className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5">

        {isHealthGroupBuy ? (

          <img

            src="/images/msm-banner.png"

            alt="한국농수산TV 건강공동구매관"

            className="block w-full bg-white"

          />

        ) : brandRow.banner_url ? (

          <img

            src={brandRow.banner_url}

            alt={`${brandRow.brand_name} 배너`}

            className="block w-full bg-white object-cover"

            style={{ height: bannerHeight }}

          />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-green-800 px-6 text-center text-3xl font-black text-white">
              {brandRow.brand_name}
            </div>
          )}

          <div className="p-5 md:p-6">
            <div className="flex gap-4 md:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-stone-100 ring-1 ring-black/5">
                {brandRow.logo_url ? (
                  <img
                    src={brandRow.logo_url}
                    alt={`${brandRow.brand_name} 로고`}
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <span className="text-sm font-black text-stone-500">LOGO</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-green-700">
                  {hallName(brandRow.hall_key)} ·{" "}
                  {brandRow.main_category || "브랜드관"}
                </p>

                <h1 className="mt-2 text-3xl font-black leading-tight text-stone-950 md:text-4xl">
                  {brandRow.brand_name}
                </h1>

                <p className="mt-2 text-lg font-bold leading-relaxed text-stone-700">
                  {brandRow.short_description || "브랜드 소개 준비중입니다."}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
              {brandRow.youtube_url ? (
                <a href={brandRow.youtube_url} target="_blank" rel="noreferrer">
                  <YoutubePreviewCard
                    url={brandRow.youtube_url}
                    title={`${brandRow.brand_name} 대표 영상`}
                  />
                </a>
              ) : (
                <div className="flex min-h-52 items-center justify-center rounded-3xl bg-stone-100 text-lg font-black text-stone-400">
                  대표 영상 준비중
                </div>
              )}

              <BrandLinks brand={brandRow} />
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-black/5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black text-stone-950">대표 제품</h2>
              <p className="mt-2 text-lg font-bold text-stone-600">
                제품 특징과 사용법을 확인한 뒤 주문할 수 있습니다.
              </p>
            </div>

            <div className="rounded-full bg-green-50 px-4 py-2 text-base font-black text-green-800 ring-1 ring-green-100">
              총 {productRows.length}개
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {productRows.length === 0 ? (
              <EmptyBox text="아직 노출 중인 제품이 없습니다." />
            ) : (
              productRows.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-black/5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-black text-stone-950">
                공동구매 · 샘플 · 라이브
              </h2>
              <p className="mt-2 text-lg font-bold text-stone-600">
                진행 중인 이벤트와 특가 내용을 확인하세요.
              </p>
            </div>

            <div className="rounded-full bg-yellow-50 px-4 py-2 text-base font-black text-stone-900 ring-1 ring-yellow-100">
              총 {eventRows.length}개
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {eventRows.length === 0 ? (
              <EmptyBox text="현재 진행 중인 이벤트가 없습니다." />
            ) : (
              eventRows.map((event) => (
                <EventCard key={event.id} event={event} />
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function ProductCard({ product }: { product: Product }) {
  const orderHref = `/expo/brand-order?product_id=${encodeURIComponent(
    product.id
  )}`;

  return (
    <article className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <Link href={`/expo/brand-products/${product.id}`} className="block">
        <div className="flex h-56 items-center justify-center bg-stone-50 p-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.product_name}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-lg font-black text-stone-400">제품 이미지</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="inline-flex w-fit rounded-full bg-green-100 px-3 py-1 text-sm font-black text-green-800">
          {product.category || "제품"}
        </div>

        <h3 className="mt-3 line-clamp-2 min-h-[64px] text-2xl font-black leading-tight text-stone-950">
          {product.product_name}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[56px] text-base font-bold leading-7 text-stone-600">
          {shortText(product.short_description, "제품 설명 준비중")}
        </p>

        <div className="mt-4 rounded-2xl bg-stone-50 p-4 ring-1 ring-black/5">
          <p className="text-xl font-black text-stone-950">
            {money(product.price_krw)}
          </p>
          <p className="mt-1 text-sm font-bold text-stone-500">
            {product.unit_label ? `단위: ${product.unit_label}` : "판매 단위 상담"}
          </p>
        </div>

        <div className="mt-auto grid gap-2 pt-4">
          <Link
            href={`/expo/brand-products/${product.id}`}
            className="rounded-2xl bg-green-700 px-4 py-4 text-center text-lg font-black text-white"
          >
            자세히 보기
          </Link>

          <Link
            href={orderHref}
            className="rounded-2xl bg-yellow-300 px-4 py-4 text-center text-lg font-black text-stone-950"
          >
            주문 · 상담하기
          </Link>
        </div>
      </div>
    </article>
  );
}

function EventCard({ event }: { event: EventItem }) {
  return (
    <article className="flex h-full min-h-[440px] flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
      <Link href={`/expo/brand-events/${event.id}`} className="block">
        <div className="flex h-52 items-center justify-center bg-stone-50 p-4">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="h-full w-full object-contain"
            />
          ) : event.youtube_url ? (
            <YoutubePreviewCard url={event.youtube_url} title={event.title} compact />
          ) : (
            <span className="text-lg font-black text-stone-400">이벤트 이미지</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="inline-flex w-fit rounded-full bg-yellow-200 px-3 py-1 text-sm font-black text-stone-950">
          {event.event_type}
        </div>

        <h3 className="mt-3 line-clamp-2 min-h-[64px] text-2xl font-black leading-tight text-stone-950">
          {event.title}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[56px] text-base font-bold leading-7 text-stone-600">
          {shortText(event.description)}
        </p>

        <Link
          href={`/expo/brand-events/${event.id}`}
          className="mt-auto rounded-2xl bg-yellow-300 px-4 py-4 text-center text-lg font-black text-stone-950"
        >
          이벤트 보기
        </Link>
      </div>
    </article>
  );
}

function BrandLinks({ brand }: { brand: Brand }) {
  const links = [
    { href: brand.homepage_url, label: "홈페이지" },
    { href: brand.instagram_url, label: "인스타그램" },
    { href: brand.facebook_url, label: "페이스북" },
    { href: brand.blog_url, label: "블로그" },
    { href: brand.sns_url, label: "SNS" },
  ].filter((item): item is { href: string; label: string } => Boolean(item.href));

  return (
    <div className="rounded-3xl bg-stone-50 p-4 ring-1 ring-black/5">
      <p className="text-base font-black text-stone-950">브랜드 링크</p>

      <div className="mt-3 grid gap-2">
        {links.length > 0 ? (
          links.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl bg-white px-4 py-3 text-center text-base font-black text-stone-900 ring-1 ring-black/10"
            >
              {item.label}
            </a>
          ))
        ) : (
          <div className="rounded-2xl bg-white px-4 py-4 text-center text-base font-black text-stone-400">
            링크 준비중
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="col-span-full rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-xl font-black text-stone-500">
      {text}
    </div>
  );
}

function YoutubePreviewCard({
  url,
  title,
  compact = false,
}: {
  url: string;
  title: string;
  compact?: boolean;
}) {
  const id = getYoutubeId(url);

  if (!id) {
    return (
      <div className="rounded-2xl bg-red-600 px-5 py-5 text-center text-lg font-black text-white">
        영상 보기
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-black shadow-sm">
      <div className="relative bg-black" style={{ aspectRatio: "16 / 9" }}>
        <img
          src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
          alt={title}
          className="h-full w-full object-cover opacity-90"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full bg-red-600 px-5 py-3 text-lg font-black text-white shadow-lg">
            ▶
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="bg-red-600 px-4 py-3 text-center text-base font-black text-white">
          대표 영상 보기
        </div>
      ) : null}
    </div>
  );
}

function getYoutubeId(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";
  if (v.includes("youtu.be/")) return v.split("youtu.be/")[1]?.split("?")[0] || "";
  if (v.includes("watch?v=")) return v.split("watch?v=")[1]?.split("&")[0] || "";
  if (v.includes("youtube.com/embed/")) return v.split("youtube.com/embed/")[1]?.split("?")[0] || "";
  return "";
}

function hallName(key?: string | null) {
  switch (key) {
    case "crop-nutrition":
      return "작물영양관";
    case "pest-solution":
      return "병해충솔루션관";
    case "agri-machinery":
    case "machinery":
      return "농기계·장비관";
    case "seed-nursery":
    case "seedling":
      return "종자·육묘관";
    case "smart-ai":
      return "스마트농업·AI관";
    case "future-food":
    case "future_food_insect":
    case "future_insect":
      return "미래식량·곤충관";
    default:
      return "브랜드관";
  }
}