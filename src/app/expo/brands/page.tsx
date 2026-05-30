import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Brand = {
  id: string;
  hall_key: string | null;
  brand_slug: string | null;
  brand_name: string;
  short_description: string | null;
  main_crops: string | null;
  main_category: string | null;
  logo_url: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
};

const hallFilters = [
  { label: "전체", value: "all" },
  { label: "작물영양관", value: "crop-nutrition" },
  { label: "병해충솔루션관", value: "pest-solution" },
  { label: "농기계·장비관", value: "machinery" },
  { label: "종자·육묘관", value: "seedling" },
  { label: "스마트농업·AI관", value: "smart-ai" },
  { label: "미래식량·곤충관", value: "future-food" },
];

type PageProps = {
  searchParams?: Promise<{
    hall?: string;
  }>;
};

export default async function ExpoBrandsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hall = params?.hall || "all";

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("expo_brands")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  if (hall !== "all") {
    query = query.eq("hall_key", hall);
  }

  const { data } = await query;

  const brands = (data ?? []) as Brand[];
  const featuredBrands = brands.filter((brand) => brand.is_featured);

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-extrabold text-green-700">K-Agri Expo</p>
          <h1 className="mt-2 text-3xl font-extrabold text-stone-900">
            브랜드 전체보기
          </h1>
          <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
            농민이 작물과 문제에 맞는 브랜드관을 쉽게 찾을 수 있는
            K-Agri Expo 브랜드 전시장입니다.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Link
              href="/expo/halls/crop-nutrition"
              className="rounded-2xl bg-green-700 px-5 py-4 text-center text-lg font-extrabold text-white"
            >
              작물영양관으로 이동
            </Link>
            <Link
              href="/expo/consult"
              className="rounded-2xl bg-yellow-300 px-5 py-4 text-center text-lg font-extrabold text-stone-900"
            >
              농사 상담하기
            </Link>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-2xl font-extrabold text-stone-900">
            관별 브랜드 찾기
          </h2>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {hallFilters.map((filter) => (
              <Link
                key={filter.value}
                href={`/expo/brands?hall=${filter.value}`}
                className={`shrink-0 rounded-full px-5 py-3 text-base font-extrabold shadow-sm ring-1 ring-black/5 ${
                  hall === filter.value
                    ? "bg-green-700 text-white"
                    : "bg-white text-stone-800"
                }`}
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </section>

        {featuredBrands.length > 0 && (
          <section className="mt-8">
            <h2 className="text-2xl font-extrabold text-stone-900">
              이번달 추천 브랜드관
            </h2>
            <p className="mt-1 text-base font-bold text-stone-600">
              운영자가 농사 시기와 현장 이슈에 맞춰 추천하는 브랜드입니다.
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {featuredBrands.map((brand) => (
                <BrandCard key={brand.id} brand={brand} featured />
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-2xl font-extrabold text-stone-900">
            전체 브랜드관
          </h2>
          <p className="mt-1 text-base font-bold text-stone-600">
            브랜드를 누르면 업체 전용 브랜드관으로 이동합니다.
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {brands.length === 0 ? (
              <div className="col-span-full rounded-3xl bg-white p-6 text-center text-lg font-extrabold text-stone-500 shadow-sm ring-1 ring-black/5">
                현재 노출 중인 브랜드가 없습니다.
              </div>
            ) : (
              brands.map((brand) => (
                <BrandCard key={`${brand.id}-all`} brand={brand} />
              ))
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-stone-900 p-5 text-white">
          <h2 className="text-2xl font-extrabold">
            브랜드 입점을 원하시나요?
          </h2>
          <p className="mt-3 text-lg font-bold leading-relaxed text-stone-100">
            K-Agri Expo는 단순 상품 등록이 아니라 브랜드관, 공동구매,
            샘플 이벤트, 라이브 상담까지 운영할 수 있는 농업 전시장입니다.
          </p>
          <Link
            href="/vendor/apply"
            className="mt-5 block rounded-2xl bg-yellow-300 px-5 py-4 text-center text-lg font-extrabold text-stone-900"
          >
            업체 입점 신청하기
          </Link>
        </section>
      </section>
    </main>
  );
}

function BrandCard({
  brand,
  featured = false,
}: {
  brand: Brand;
  featured?: boolean;
}) {
  const crops = (brand.main_crops || "전작물")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  return (
    <Link
      href={`/expo/brands/${brand.brand_slug || brand.id}`}
      className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 ${
        featured ? "ring-2 ring-green-600" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-lime-100 px-3 py-1 text-sm font-extrabold text-green-800">
          {featured ? "이번달 추천" : brand.main_category || "브랜드관"}
        </span>
        <span className="text-sm font-extrabold text-stone-500">
          {hallName(brand.hall_key)}
        </span>
      </div>

      <div className="mt-4 flex h-24 items-center justify-center rounded-2xl bg-stone-100 px-4 text-center text-xl font-extrabold text-stone-800">
        {brand.logo_url ? "브랜드 로고" : brand.brand_name}
      </div>

      <h3 className="mt-4 text-xl font-extrabold text-stone-900">
        {brand.brand_name}
      </h3>

      <p className="mt-2 text-base font-bold leading-relaxed text-stone-600">
        {brand.short_description || "브랜드 소개 준비중"}
      </p>

      <div className="mt-4">
        <p className="text-sm font-extrabold text-stone-500">주요 작물</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {crops.map((crop) => (
            <span
              key={crop}
              className="rounded-full bg-green-50 px-3 py-2 text-sm font-extrabold text-green-800"
            >
              {crop}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-green-700 py-4 text-center text-lg font-extrabold text-white">
        브랜드관 입장
      </div>
    </Link>
  );
}

function hallName(key?: string | null) {
  switch (key) {
    case "crop-nutrition":
      return "작물영양관";
    case "pest-solution":
      return "병해충솔루션관";
    case "machinery":
      return "농기계·장비관";
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