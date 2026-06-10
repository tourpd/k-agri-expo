/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Brand = {
  id: string;
  brand_slug?: string | null;
  brand_name?: string | null;
};

type BrandProduct = {
  id: string;
  brand_id: string;
  product_name?: string | null;
  category?: string | null;
  short_description?: string | null;
  detail_description?: string | null;
  image_url?: string | null;
  youtube_url?: string | null;
  youtube_urls?: string[] | null;
  catalog_url?: string | null;
  manual_url?: string | null;
  price_krw?: number | null;
  shipping_fee_krw?: number | null;
  unit_label?: string | null;
  target_crops?: string | null;
  use_season?: string | null;
  use_period?: string | null;
  how_to_use?: string | null;
  dosage_guide?: string | null;
  cautions?: string | null;
  future_business_type?: string | null;
  container_farm_spec?: string | null;
  education_program?: string | null;
  buyback_terms?: string | null;
  healing_program?: string | null;
  functional_food_info?: string | null;
  patent_info?: string | null;
  target_customer?: string | null;
};

function text(v: unknown, fallback = "-") {
  const s = String(v || "").trim();
  return s || fallback;
}

function money(v: unknown) {
  const n = Number(v || 0);
  if (!n) return "가격 문의";
  return `${n.toLocaleString("ko-KR")}원`;
}

function getYoutubeId(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";
  if (v.includes("youtu.be/")) return v.split("youtu.be/")[1]?.split("?")[0] || "";
  if (v.includes("watch?v=")) return v.split("watch?v=")[1]?.split("&")[0] || "";
  if (v.includes("youtube.com/embed/")) return v.split("youtube.com/embed/")[1]?.split("?")[0] || "";
  return "";
}

function toYoutubeList(product: BrandProduct) {
  const list = Array.isArray(product.youtube_urls) ? product.youtube_urls : [];
  const single = product.youtube_url ? [product.youtube_url] : [];
  return Array.from(new Set([...single, ...list].filter(Boolean)));
}

function isPdf(url?: string | null) {
  return String(url || "").toLowerCase().includes(".pdf");
}

function isHealthJointProduct(product: BrandProduct) {
  return String(product.product_name || "").includes("MSM 프리미엄 로얄 관절 부스터");
}

function isFutureFoodProduct(product: BrandProduct) {
  return Boolean(
    product.future_business_type ||
      product.container_farm_spec ||
      product.education_program ||
      product.buyback_terms ||
      product.healing_program ||
      product.functional_food_info ||
      product.patent_info ||
      String(product.category || "").includes("곤충") ||
      String(product.category || "").includes("미래식량")
  );
}

function futureBusinessLabel(v?: string | null) {
  switch (v) {
    case "smart_insect_farm":
      return "컨테이너형 스마트 곤충 사육농장";
    case "insect_farming_education":
      return "곤충 사육 프로그램 교육";
    case "buyback_contract":
      return "갈색거저리 전량수매 계약";
    case "healing_agriculture":
      return "치유농업 연계 곤충사육";
    case "functional_health_food":
      return "곤충소재 건강기능식품";
    default:
      return "미래식량·곤충 사업";
  }
}

export default async function BrandProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("expo_brand_products")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) notFound();

  const product = data as BrandProduct;

  const { data: brandData } = await supabase
    .from("expo_brands")
    .select("*")
    .eq("id", product.brand_id)
    .maybeSingle();

  const brand = brandData as Brand | null;
  const isFuture = isFutureFoodProduct(product);
  const isHealthJoint = isHealthJointProduct(product);
  const youtubeUrls = toYoutubeList(product);

  const orderHref = `/expo/brand-order?brand_id=${encodeURIComponent(
    product.brand_id
  )}&product_id=${encodeURIComponent(product.id)}`;

  const brandHref = brand?.brand_slug
    ? `/expo/brands/${brand.brand_slug}`
    : "/expo/brands";

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-5xl">
        <Link
          href={brandHref}
          className="inline-flex rounded-2xl bg-white px-4 py-3 text-base font-black text-stone-900 ring-1 ring-black/10"
        >
          ← 브랜드관으로 돌아가기
        </Link>

        {isHealthJoint ? (
          <HealthJointLanding product={product} orderHref={orderHref} brandHref={brandHref} />
        ) : (
          <>
            <section className="mt-4 overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5">
              <div className={`${isFuture ? "bg-amber-800" : "bg-green-800"} p-6 text-white`}>
                <p className="text-base font-black text-yellow-200">
                  {brand?.brand_name || "K-Agri Expo"}
                </p>

                <h1 className="mt-2 text-4xl font-black leading-tight">
                  {text(product.product_name, "제품명")}
                </h1>

                <p className="mt-3 text-xl font-bold leading-relaxed text-white/95">
                  {text(
                    product.short_description,
                    isFuture ? "미래식량·곤충 사업 정보" : "농민을 위한 제품 상세 정보"
                  )}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/15 px-4 py-2 text-base font-black">
                    {text(product.category, isFuture ? "미래식량·곤충관" : "농자재")}
                  </span>

                  {isFuture ? (
                    <span className="rounded-full bg-yellow-300 px-4 py-2 text-base font-black text-stone-950">
                      {futureBusinessLabel(product.future_business_type)}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-6 p-5 lg:grid-cols-[0.9fr_1.1fr]">
                <aside className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5">
                  <div className="flex h-96 items-center justify-center rounded-2xl bg-white">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={text(product.product_name, "제품 이미지")}
                        className="h-full w-full object-contain p-4"
                      />
                    ) : (
                      <span className="text-xl font-black text-stone-400">
                        제품 이미지
                      </span>
                    )}
                  </div>

                  <div className="mt-5 rounded-3xl bg-yellow-50 p-5 ring-1 ring-yellow-200">
                    <p className="text-base font-black text-stone-500">
                      {isFuture ? "상담 금액" : "제품 가격"}
                    </p>

                    <p className="mt-1 text-3xl font-black text-stone-950">
                      {money(product.price_krw)}
                    </p>

                    <div className="mt-4 grid gap-2 text-lg font-bold text-stone-800">
                      <p>판매 단위: {text(product.unit_label, "상담 후 안내")}</p>
                      <p>배송/기타비: {money(product.shipping_fee_krw)}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <Link
                      href={orderHref}
                      className="rounded-2xl bg-green-700 px-5 py-5 text-center text-xl font-black text-white"
                    >
                      {isFuture ? "사업 문의하기" : "주문 · 상담하기"}
                    </Link>

                    {product.catalog_url ? (
                      <ResourceCard url={product.catalog_url} title="카탈로그 보기" />
                    ) : null}

                    {product.manual_url ? (
                      <ResourceCard url={product.manual_url} title="사용설명서 보기" />
                    ) : null}
                  </div>
                </aside>

                {isFuture ? (
                  <FutureFoodSection product={product} />
                ) : (
                  <AgriProductSection product={product} />
                )}
              </div>
            </section>

            {youtubeUrls.length > 0 ? (
              <section className="mt-6 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
                <h2 className="text-3xl font-black text-stone-950">제품 영상</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {youtubeUrls.map((url) => (
                    <YoutubeCard key={String(url)} url={String(url)} />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        <section className="sticky bottom-0 z-20 mt-6 rounded-t-3xl bg-white/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2">
            <Link
              href={orderHref}
              className="rounded-2xl bg-green-700 px-5 py-5 text-center text-xl font-black text-white"
            >
              {isFuture ? "지금 문의하기" : isHealthJoint ? "49,900원 공동구매 신청하기" : "지금 주문 · 상담하기"}
            </Link>

            <Link
              href={brandHref}
              className="rounded-2xl bg-stone-900 px-5 py-5 text-center text-xl font-black text-white"
            >
              다른 제품 더 보기
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}

function HealthJointLanding({
  product,
  orderHref,
  brandHref,
}: {
  product: BrandProduct;
  orderHref: string;
  brandHref: string;
}) {
  const reviews = [
    {
      name: "충남 부여 고추농가",
      text: "쪼그려 앉는 일이 많아서 무릎이 늘 신경 쓰였는데, 농민 공동구매라 믿고 신청했습니다.",
    },
    {
      name: "경북 구미 시설농가",
      text: "하루 2정이라 챙겨 먹기 편합니다. 부부가 같이 먹으려고 3병 신청했습니다.",
    },
    {
      name: "전남 나주 양파농가",
      text: "농사는 계속해야 하니까 관절 관리는 미리 해야겠다는 생각이 들었습니다.",
    },
    {
      name: "강원 원주 밭작물 농가",
      text: "한국농수산TV에서 공동구매한다니 믿고 주문합니다. 부모님 드리려고 추가 신청했습니다.",
    },
  ];

  return (
    <section className="mt-4">
      <section className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5">
        <img
          src="/images/msm-banner.png"
          alt="MSM 프리미엄 로얄 관절 부스터"
          className="block w-full bg-white"
        />

        <div className="grid gap-6 p-5 lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5">
            <div className="flex h-96 items-center justify-center rounded-3xl bg-white">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={text(product.product_name, "MSM 제품 이미지")}
                  className="h-full w-full object-contain p-4"
                />
              ) : (
                <img
                  src="/images/msm-banner.png"
                  alt="MSM 제품"
                  className="h-full w-full object-contain p-4"
                />
              )}
            </div>

            <div className="mt-5 rounded-3xl bg-red-50 p-6 ring-1 ring-red-200">
              <p className="text-lg font-black text-stone-500 line-through">
                정가 75,000원
              </p>

              <p className="mt-1 text-5xl font-black text-red-600">
                49,900원
              </p>

              <p className="mt-3 text-xl font-black text-stone-900">
                1병 · 800mg × 60정
              </p>

              <p className="mt-1 text-xl font-black text-green-800">
                전국 무료배송
              </p>

              <p className="mt-2 text-lg font-bold text-red-700">
                현재 73명 참여 · 100명 달성 시 추가 혜택
              </p>
            </div>

            <Link
              href={orderHref}
              className="mt-5 block rounded-3xl bg-green-700 px-5 py-6 text-center text-2xl font-black text-white"
            >
              공동구매 신청하기
            </Link>

            <Link
              href={brandHref}
              className="mt-3 block rounded-3xl bg-stone-900 px-5 py-5 text-center text-xl font-black text-white"
            >
              건강공동구매관 보기
            </Link>
          </aside>

          <section className="grid gap-4">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
              <p className="text-base font-black text-green-700">
                한국농수산TV 농민 건강 공동구매
              </p>
              <h1 className="mt-2 text-4xl font-black leading-tight text-stone-950">
                농사는 계속해야 하는데
                <br />
                관절은 예전 같지 않습니다.
              </h1>
              <p className="mt-4 text-xl font-bold leading-relaxed text-stone-700">
                하우스 작업, 밭일, 운반 작업, 쪼그려 앉는 작업이 많은 농민을 위한
                관절·연골 건강 공동구매입니다.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <BenefitCard icon="🦵" title="관절·연골 건강" desc="MSM 기능성 원료 함유" />
              <BenefitCard icon="🌿" title="부원료까지 고려" desc="농민 건강관리용 구성" />
              <BenefitCard icon="🚚" title="전국 무료배송" desc="입금 확인 후 순차 발송" />
              <BenefitCard icon="🤝" title="공동구매 특가" desc="정가 75,000원 → 49,900원" />
            </div>

            <div className="rounded-3xl bg-yellow-50 p-6 ring-1 ring-yellow-200">
              <h2 className="text-2xl font-black text-stone-950">
                이런 분께 필요합니다
              </h2>

              <div className="mt-4 grid gap-3">
                {[
                  "무릎이 자주 아프신 분",
                  "허리가 불편하신 분",
                  "쪼그려 앉아 농사일을 많이 하시는 분",
                  "계단 오르기가 힘드신 분",
                  "관절과 연골 건강이 걱정되는 분",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-white px-4 py-3 text-lg font-black text-stone-900 ring-1 ring-black/5"
                  >
                    ✓ {item}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="mt-6 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p className="text-base font-black text-green-700">POINT 01</p>
        <h2 className="mt-2 text-3xl font-black leading-tight text-stone-950">
          관절 및 연골 건강에 도움을 줄 수 있는 MSM
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <PointCard title="MSM 1,584mg/day" desc="1일 섭취량 기준 기능성 원료 함유" />
          <PointCard title="800mg × 60정" desc="하루 1회, 1회 2정 섭취" />
          <PointCard title="약 30일분" desc="농번기에도 간편하게 섭취" />
        </div>

        <div className="mt-6 rounded-3xl bg-stone-50 p-6">
          <h3 className="text-2xl font-black text-stone-950">MSM이란?</h3>
          <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
            MSM은 식이유황으로 알려진 기능성 원료입니다. 본 제품은 관절 및 연골 건강에
            도움을 줄 수 있는 MSM을 1일 섭취량 기준으로 함유한 건강기능식품입니다.
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-[32px] bg-[#fff7e6] p-6 shadow-sm ring-1 ring-yellow-100">
        <p className="text-base font-black text-green-700">POINT 02</p>
        <h2 className="mt-2 text-3xl font-black leading-tight text-stone-950">
          농민에게 필요한 이유
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <ReasonCard
            title="쪼그려 앉는 작업"
            desc="고추, 마늘, 양파, 딸기 등 많은 작물은 무릎과 허리에 부담이 갑니다."
          />
          <ReasonCard
            title="반복되는 운반 작업"
            desc="상자, 비료, 농자재를 옮기는 일이 많아 관절 관리가 중요합니다."
          />
          <ReasonCard
            title="농사는 멈추기 어렵습니다"
            desc="몸이 불편해도 농번기에는 쉬기 어렵기 때문에 평소 관리가 필요합니다."
          />
          <ReasonCard
            title="부부가 함께 챙기는 건강"
            desc="부모님, 배우자와 함께 드시기 위해 3병 이상 신청하는 농가가 많습니다."
          />
        </div>
      </section>

      <section className="mt-6 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-base font-black text-green-700">REVIEW</p>
            <h2 className="mt-2 text-3xl font-black text-stone-950">
              농민 후기
            </h2>
            <p className="mt-2 text-lg font-bold text-stone-600">
              실제 운영 시 관리자 페이지에서 후기를 계속 추가해 노출할 수 있도록 확장합니다.
            </p>
          </div>

          <div className="rounded-full bg-green-50 px-4 py-2 text-base font-black text-green-800">
            후기 {reviews.length}개
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5"
            >
              <div className="text-2xl text-yellow-500">★★★★★</div>
              <p className="mt-3 text-lg font-black leading-relaxed text-stone-900">
                “{review.text}”
              </p>
              <p className="mt-4 text-base font-black text-green-700">
                {review.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[32px] bg-yellow-50 p-6 shadow-sm ring-1 ring-yellow-200">
        <h2 className="text-3xl font-black text-stone-950">입금 안내</h2>

        <p className="mt-4 text-4xl font-black leading-tight text-red-600">
          기업은행 486-072683-04-011
        </p>

        <p className="mt-3 text-2xl font-black text-stone-950">
          예금주: 한국농수산TV
        </p>

        <p className="mt-4 text-lg font-bold leading-relaxed text-stone-700">
          입금 확인 후 순차 발송됩니다. 입금자명이 다를 경우 주문 요청사항에 남겨주세요.
        </p>

        <Link
          href={orderHref}
          className="mt-6 block rounded-3xl bg-green-700 px-5 py-6 text-center text-2xl font-black text-white"
        >
          49,900원 공동구매 신청하기
        </Link>
      </section>
    </section>
  );
}

function AgriProductSection({ product }: { product: BrandProduct }) {
  return (
    <section className="grid gap-4">
      <InfoBox title="이 제품은 이런 농가에 필요합니다">
        {text(
          product.short_description || product.detail_description,
          "작물 생육, 병해충 관리, 품질 향상이 필요한 농가에 적합합니다."
        )}
      </InfoBox>

      <div className="grid gap-4 md:grid-cols-2">
        <InfoBox title="추천 작물">
          {text(product.target_crops, "추천 작물 정보 준비중")}
        </InfoBox>

        <InfoBox title="사용 시기">
          {text(product.use_season || product.use_period, "사용 시기 정보 준비중")}
        </InfoBox>
      </div>

      <InfoBox title="제품 특징">
        {text(product.detail_description || product.short_description, "제품 상세 설명 준비중")}
      </InfoBox>

      <InfoBox title="사용 방법">
        {text(product.how_to_use, "사용 방법 정보 준비중")}
      </InfoBox>

      <InfoBox title="사용량 · 희석배수">
        {text(product.dosage_guide, "사용량 정보 준비중")}
      </InfoBox>

      <InfoBox title="주의사항">
        {text(product.cautions, "주의사항 정보 준비중")}
      </InfoBox>
    </section>
  );
}

function FutureFoodSection({ product }: { product: BrandProduct }) {
  return (
    <section className="grid gap-4">
      <InfoBox title="사업 개요">
        {text(product.detail_description || product.short_description, "사업 설명 준비중")}
      </InfoBox>

      <InfoBox title="컨테이너형 스마트 사육농장">
        {text(product.container_farm_spec, "정보 준비중")}
      </InfoBox>

      <InfoBox title="사육 교육">
        {text(product.education_program, "정보 준비중")}
      </InfoBox>

      <InfoBox title="전량수매 조건">
        {text(product.buyback_terms, "정보 준비중")}
      </InfoBox>

      <InfoBox title="치유농업 프로그램">
        {text(product.healing_program, "정보 준비중")}
      </InfoBox>

      <InfoBox title="건강기능식품·특허 자료">
        {text(product.functional_food_info || product.patent_info, "정보 준비중")}
      </InfoBox>

      <InfoBox title="대상 고객">
        {text(product.target_customer, "곤충 사육 희망농가, 치유농장, 귀농·귀촌 농가")}
      </InfoBox>
    </section>
  );
}

function BenefitCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 text-xl font-black text-stone-950">{title}</h3>
      <p className="mt-2 text-base font-bold leading-relaxed text-stone-600">
        {desc}
      </p>
    </div>
  );
}

function PointCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-black/10">
      <div className="mb-4 h-2 w-16 rounded-full bg-red-500" />
      <h3 className="text-2xl font-black text-stone-950">{title}</h3>
      <p className="mt-2 text-lg font-bold leading-relaxed text-stone-700">
        {desc}
      </p>
    </div>
  );
}

function ReasonCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-yellow-100">
      <h3 className="text-2xl font-black text-stone-950">{title}</h3>
      <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
        {desc}
      </p>
    </div>
  );
}

function ResourceCard({ url, title }: { url: string; title: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-2xl bg-white text-center text-lg font-black text-stone-950 ring-1 ring-black/10"
    >
      {isPdf(url) ? (
        <div className="px-5 py-5">{title}</div>
      ) : (
        <>
          <img src={url} alt={title} className="max-h-80 w-full object-contain p-3" />
          <div className="bg-stone-100 px-5 py-4">{title}</div>
        </>
      )}
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
            <div className="rounded-full bg-red-600 px-6 py-4 text-xl font-black text-white">
              ▶
            </div>
          </div>
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center text-xl font-black text-white">
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
      <h2 className="text-2xl font-black text-stone-950">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-lg font-bold leading-relaxed text-stone-700">
        {children}
      </p>
    </div>
  );
}