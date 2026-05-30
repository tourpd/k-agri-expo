// src/app/expo/brand-products/[id]/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getYoutubeId(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";
  if (v.includes("youtu.be/")) return v.split("youtu.be/")[1]?.split("?")[0] || "";
  if (v.includes("watch?v=")) return v.split("watch?v=")[1]?.split("&")[0] || "";
  if (v.includes("youtube.com/embed/")) return v.split("youtube.com/embed/")[1]?.split("?")[0] || "";
  return "";
}

function toYoutubeList(product: any) {
  const list = Array.isArray(product.youtube_urls) ? product.youtube_urls : [];
  const single = product.youtube_url ? [product.youtube_url] : [];
  return Array.from(new Set([...single, ...list].filter(Boolean)));
}

function safeText(v: unknown, fallback: string) {
  const s = String(v || "").trim();
  return s || fallback;
}

function money(v: unknown) {
  const n = Number(v || 0);
  if (!n) return "상담 후 안내";
  return `${n.toLocaleString("ko-KR")}원`;
}

function isPdf(url?: string | null) {
  return String(url || "").toLowerCase().includes(".pdf");
}

function hasText(v: unknown) {
  return String(v || "").trim().length > 0;
}

export default async function BrandProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: product } = await supabase
    .from("expo_brand_products")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) notFound();

  const { data: brand } = await supabase
    .from("expo_brands")
    .select("*")
    .eq("id", product.brand_id)
    .maybeSingle();

  const youtubeUrls = toYoutubeList(product);

  const baseArea = Number(product.base_area_pyeong || 0);
  const rounds = Number(product.recommended_rounds || 0);

  const canUseAiConsult =
    hasText(product.detail_description || product.short_description) &&
    hasText(product.how_to_use) &&
    hasText(product.dosage_guide) &&
    baseArea > 0 &&
    rounds > 0;

  const orderHref = `/expo/brand-order?brand_id=${encodeURIComponent(
    product.brand_id
  )}&product_id=${encodeURIComponent(product.id)}`;

  const aiConsultHref = `/ai-consult?brand_id=${encodeURIComponent(
    product.brand_id
  )}&product_id=${encodeURIComponent(product.id)}`;

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-6xl">
        <Link
          href={brand?.brand_slug ? `/expo/brands/${brand.brand_slug}` : "/expo/brands"}
          className="mb-4 inline-flex rounded-2xl bg-white px-4 py-3 text-base font-extrabold text-stone-800 ring-1 ring-black/10"
        >
          ← 브랜드관으로 돌아가기
        </Link>

        <div className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5">
          <div className="bg-green-800 p-6 text-white">
            <p className="text-base font-extrabold text-yellow-200">
              {brand?.brand_name || "K-Agri Expo"}
            </p>

            <h1 className="mt-2 text-4xl font-extrabold">
              {product.product_name}
            </h1>

            <p className="mt-3 text-xl font-bold text-green-50">
              {product.short_description || "제품 상세 정보"}
            </p>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5">
              <div className="flex h-96 items-center justify-center rounded-2xl bg-white">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xl font-extrabold text-stone-400">
                    제품 이미지
                  </span>
                )}
              </div>

              <div className="mt-5 inline-flex rounded-full bg-green-100 px-4 py-2 text-base font-extrabold text-green-800">
                {product.category || "제품"}
              </div>

              <div className="mt-5 rounded-3xl bg-yellow-50 p-5 ring-1 ring-yellow-200">
                <p className="text-lg font-extrabold text-stone-900">
                  제품가: {money(product.price_krw)}
                </p>
                <p className="mt-2 text-lg font-extrabold text-stone-900">
                  택배비: {money(product.shipping_fee_krw)}
                </p>

                {product.unit_label ? (
                  <p className="mt-2 text-base font-bold text-stone-700">
                    단위: {product.unit_label}
                  </p>
                ) : null}

                {baseArea > 0 || rounds > 0 ? (
                  <div className="mt-4 rounded-2xl bg-white p-4 text-base font-extrabold text-stone-800 ring-1 ring-yellow-200">
                    {baseArea > 0 ? (
                      <p>1개 기준 사용 평수: {baseArea.toLocaleString("ko-KR")}평</p>
                    ) : null}
                    {rounds > 0 ? <p className="mt-1">권장 살포 횟수: {rounds}회</p> : null}
                    {product.spray_interval ? (
                      <p className="mt-1">살포 간격: {product.spray_interval}</p>
                    ) : null}
                    {product.use_period ? (
                      <p className="mt-1">사용 가능 시기: {product.use_period}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3">
                {product.catalog_url ? (
                  <ResourceCard
                    url={product.catalog_url}
                    title="카탈로그/상세자료 보기"
                  />
                ) : null}

                {product.manual_url ? (
                  <ResourceCard
                    url={product.manual_url}
                    title="사용설명서/이미지자료 보기"
                  />
                ) : null}

                {canUseAiConsult ? (
                  <Link
                    href={aiConsultHref}
                    className="rounded-2xl bg-yellow-300 px-5 py-5 text-center text-xl font-extrabold text-stone-900"
                  >
                    작물별 사용 상담
                  </Link>
                ) : (
                  <div className="rounded-2xl bg-stone-200 px-5 py-5 text-center text-xl font-extrabold text-stone-500">
                    상담 준비중
                  </div>
                )}

                <Link
                  href={orderHref}
                  className="rounded-2xl bg-green-700 px-5 py-5 text-center text-xl font-extrabold text-white"
                >
                  주문하기
                </Link>
              </div>
            </section>

            <section className="grid gap-5">
              <InfoBox title="제품 특징">
                {safeText(
                  product.detail_description || product.short_description,
                  "제품 상세 설명을 준비 중입니다."
                )}
              </InfoBox>

              <div className="grid gap-5 md:grid-cols-2">
                <InfoBox title="추천 작물">
                  {safeText(product.target_crops, "추천 작물 정보 준비중")}
                </InfoBox>

                <InfoBox title="사용 시기">
                  {safeText(product.use_season || product.use_period, "사용 시기 정보 준비중")}
                </InfoBox>
              </div>

              <InfoBox title="사용 방법">
                {safeText(product.how_to_use, "사용 방법 정보 준비중")}
              </InfoBox>

              <InfoBox title="희석배수 · 평수별 사용량">
                {safeText(product.dosage_guide, "사용량 정보 준비중")}
              </InfoBox>

              <InfoBox title="주의사항">
                {safeText(product.cautions, "주의사항 정보 준비중")}
              </InfoBox>
            </section>
          </div>
        </div>

        {youtubeUrls.length > 0 ? (
          <section className="mt-8 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-3xl font-extrabold text-stone-900">
              제품 영상
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {youtubeUrls.map((url) => (
                <YoutubeCard key={String(url)} url={String(url)} />
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function ResourceCard({ url, title }: { url: string; title: string }) {
  if (isPdf(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="rounded-2xl bg-white px-5 py-4 text-center text-lg font-extrabold text-stone-900 ring-1 ring-black/10"
      >
        {title}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-2xl bg-white ring-1 ring-black/10"
    >
      <img src={url} alt={title} className="max-h-80 w-full object-contain p-3" />
      <div className="bg-stone-100 px-5 py-4 text-center text-lg font-extrabold text-stone-900">
        {title}
      </div>
    </a>
  );
}

function YoutubeCard({ url }: { url: string }) {
  const vid = getYoutubeId(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-3xl bg-black"
    >
      {vid ? (
        <div className="relative aspect-video">
          <img
            src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`}
            alt="제품 영상"
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-red-600 px-6 py-4 text-xl font-extrabold text-white">
              ▶
            </div>
          </div>
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center text-xl font-extrabold text-white">
          영상 보기
        </div>
      )}
    </a>
  );
}

function InfoBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="text-2xl font-extrabold text-stone-900">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-lg font-bold leading-relaxed text-stone-700">
        {children}
      </p>
    </div>
  );
}