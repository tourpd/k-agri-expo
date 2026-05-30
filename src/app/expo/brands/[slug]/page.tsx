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
    Math.min(Number(brandRow.banner_height || 300), 460)
  );

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5">
          {brandRow.banner_url ? (
            <img
              src={brandRow.banner_url}
              alt={`${brandRow.brand_name} 배너`}
              className="w-full bg-white object-cover"
              style={{ height: bannerHeight }}
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-gradient-to-br from-green-800 to-lime-700 px-6 text-center text-3xl font-extrabold text-white">
              {brandRow.brand_name}
            </div>
          )}

          <div className="p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-stone-100 ring-1 ring-black/5">
                {brandRow.logo_url ? (
                  <img
                    src={brandRow.logo_url}
                    alt={`${brandRow.brand_name} 로고`}
                    className="h-full w-full object-contain p-3"
                  />
                ) : (
                  <span className="text-lg font-extrabold text-stone-500">
                    LOGO
                  </span>
                )}
              </div>

              <div className="flex-1">
                <p className="text-base font-extrabold text-green-700">
                  {hallName(brandRow.hall_key)} ·{" "}
                  {brandRow.main_category || "브랜드관"}
                </p>

                <h1 className="mt-2 text-4xl font-extrabold leading-tight text-stone-900">
                  {brandRow.brand_name}
                </h1>

                <p className="mt-3 text-xl font-bold leading-relaxed text-stone-700">
                  {brandRow.short_description || "브랜드 소개 준비중입니다."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1.6fr_0.4fr]">
              {brandRow.youtube_url ? (
                <a
                  href={brandRow.youtube_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block"
                >
                  <YoutubePreviewCard
                    url={brandRow.youtube_url}
                    title={`${brandRow.brand_name} 대표 영상`}
                  />
                </a>
              ) : (
                <div className="flex min-h-56 items-center justify-center rounded-3xl bg-stone-100 text-xl font-extrabold text-stone-400">
                  대표 영상 준비중
                </div>
              )}

              <div className="rounded-3xl bg-stone-50 p-4 ring-1 ring-black/5">
                <p className="text-base font-extrabold text-stone-900">
                  브랜드 링크
                </p>

                <div className="mt-3 grid gap-2">
                  {brandRow.homepage_url ? (
                    <SmallLink href={brandRow.homepage_url} label="홈페이지" />
                  ) : null}
                  {brandRow.instagram_url ? (
                    <SmallLink href={brandRow.instagram_url} label="인스타그램" />
                  ) : null}
                  {brandRow.facebook_url ? (
                    <SmallLink href={brandRow.facebook_url} label="페이스북" />
                  ) : null}
                  {brandRow.blog_url ? (
                    <SmallLink href={brandRow.blog_url} label="블로그" />
                  ) : null}
                  {brandRow.sns_url ? (
                    <SmallLink href={brandRow.sns_url} label="SNS" />
                  ) : null}

                  {!brandRow.homepage_url &&
                  !brandRow.instagram_url &&
                  !brandRow.facebook_url &&
                  !brandRow.blog_url &&
                  !brandRow.sns_url ? (
                    <div className="rounded-2xl bg-white px-4 py-4 text-center text-base font-extrabold text-stone-400">
                      링크 준비중
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <section
          id="products"
          className="mt-8 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5"
        >
          <h2 className="text-3xl font-extrabold text-stone-900">대표 제품</h2>
          <p className="mt-2 text-lg font-bold text-stone-600">
            제품 특징과 사용법을 확인한 뒤 주문할 수 있습니다.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {productRows.length === 0 ? (
              <EmptyBox text="아직 노출 중인 제품이 없습니다." />
            ) : (
              productRows.map((product) => (
                <Link
                  key={product.id}
                  href={`/expo/brand-products/${product.id}`}
                  className="rounded-3xl border border-stone-200 bg-stone-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-white">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.product_name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-lg font-extrabold text-stone-400">
                        제품 이미지
                      </span>
                    )}
                  </div>

                  {product.youtube_url ? (
                    <div className="mt-4">
                      <YoutubePreviewCard
                        url={product.youtube_url}
                        title={`${product.product_name} 영상`}
                        compact
                      />
                    </div>
                  ) : null}

                  <div className="mt-4 inline-flex rounded-full bg-green-100 px-3 py-1 text-sm font-extrabold text-green-800">
                    {product.category || "제품"}
                  </div>

                  <h3 className="mt-3 text-2xl font-extrabold text-stone-900">
                    {product.product_name}
                  </h3>

                  <p className="mt-2 text-lg font-bold leading-relaxed text-stone-600">
                    {product.short_description || "제품 설명 준비중"}
                  </p>

                  <div className="mt-5 rounded-2xl bg-green-700 py-4 text-center text-lg font-extrabold text-white">
                    자세히 보기
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-3xl font-extrabold text-stone-900">
            공동구매 · 샘플 · 라이브
          </h2>
          <p className="mt-2 text-lg font-bold text-stone-600">
            진행 중인 공동구매와 이벤트 내용을 자세히 확인하세요.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {eventRows.length === 0 ? (
              <EmptyBox text="현재 진행 중인 이벤트가 없습니다." />
            ) : (
              eventRows.map((event) => (
                <Link
                  key={event.id}
                  href={`/expo/brand-events/${event.id}`}
                  className="rounded-3xl border border-stone-200 bg-stone-50 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {event.image_url ? (
                    <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-2xl bg-white">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : null}

                  {event.youtube_url ? (
                    <div className="mb-4">
                      <YoutubePreviewCard
                        url={event.youtube_url}
                        title={`${event.title} 영상`}
                        compact
                      />
                    </div>
                  ) : null}

                  <div className="inline-flex rounded-full bg-yellow-200 px-3 py-1 text-sm font-extrabold text-stone-900">
                    {event.event_type}
                  </div>

                  <h3 className="mt-4 text-2xl font-extrabold text-stone-900">
                    {event.title}
                  </h3>

                  <p className="mt-2 text-lg font-bold leading-relaxed text-stone-600">
                    {event.description || "자세한 내용을 확인하세요."}
                  </p>

                  <div className="mt-5 rounded-2xl bg-yellow-300 py-4 text-center text-lg font-extrabold text-stone-900">
                    자세히 보기
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function SmallLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="rounded-2xl bg-white px-4 py-3 text-center text-base font-extrabold text-stone-900 ring-1 ring-black/10"
    >
      {label}
    </a>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="col-span-full rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-xl font-extrabold text-stone-500">
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
      <div className="rounded-2xl bg-red-600 px-5 py-5 text-center text-lg font-extrabold text-white">
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
          <div className="rounded-full bg-red-600 px-5 py-3 text-lg font-extrabold text-white shadow-lg">
            ▶
          </div>
        </div>
      </div>

      {!compact ? (
        <div className="bg-red-600 px-4 py-3 text-center text-base font-extrabold text-white">
          대표 영상 보기
        </div>
      ) : null}
    </div>
  );
}

function getYoutubeId(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";

  if (v.includes("youtu.be/")) {
    return v.split("youtu.be/")[1]?.split("?")[0] || "";
  }

  if (v.includes("watch?v=")) {
    return v.split("watch?v=")[1]?.split("&")[0] || "";
  }

  if (v.includes("youtube.com/embed/")) {
    return v.split("youtube.com/embed/")[1]?.split("?")[0] || "";
  }

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
      return "미래식량·곤충관";
    default:
      return "브랜드관";
  }
}