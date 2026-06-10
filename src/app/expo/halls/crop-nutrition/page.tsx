import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type HallSection = {
  id: string;
  section_type: string;
  title: string;
  subtitle: string | null;
  crop: string | null;
  link_url: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

type Brand = {
  id: string;
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

export default async function CropNutritionHallPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: sections }, { data: brands }] = await Promise.all([
    supabase
      .from("expo_hall_sections")
      .select("*")
      .eq("hall_key", "crop-nutrition")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),

    supabase
      .from("expo_brands")
      .select("*")
      .eq("hall_key", "crop-nutrition")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("sort_order", { ascending: true }),
  ]);

  const issues = ((sections ?? []) as HallSection[]).filter(
    (item) => item.section_type === "issue"
  );

  const events = ((sections ?? []) as HallSection[]).filter(
    (item) => item.section_type === "event"
  );

  const featuredBrands = (brands ?? []) as Brand[];

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-gradient-to-br from-green-800 to-lime-700 p-6 text-white shadow-sm">
          <p className="mb-2 text-sm font-bold text-lime-100">K-Agri Expo</p>
          <h1 className="text-3xl font-extrabold leading-tight">
            작물영양관
          </h1>
          <p className="mt-3 text-lg font-medium leading-relaxed text-lime-50">
            지금 농민에게 필요한 영양관리, 브랜드관에서 바로 확인하세요.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/expo/brands"
              className="rounded-2xl bg-white px-4 py-4 text-center text-lg font-extrabold text-green-800"
            >
              브랜드 전체보기
            </Link>
            <Link
              href="/expo/consult"
              className="rounded-2xl bg-yellow-300 px-4 py-4 text-center text-lg font-extrabold text-stone-900"
            >
              농사 상담하기
            </Link>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-2xl font-extrabold text-stone-900">
            지금 많이 찾는 작물 이슈
          </h2>
          <p className="mt-1 text-base font-medium text-stone-600">
            작물을 누르면 관련 브랜드관과 솔루션으로 이동합니다.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {issues.length === 0 ? (
              <EmptyBox text="현재 노출 중인 작물 이슈가 없습니다." />
            ) : (
              issues.map((item) => (
                <Link
                  key={item.id}
                  href={item.link_url || "/expo/halls/crop-nutrition"}
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="text-2xl font-extrabold text-green-800">
                    {item.crop || item.title}
                  </div>
                  <div className="mt-2 text-base font-bold text-stone-600">
                    {item.subtitle || item.title}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-stone-900">
                추천 브랜드관
              </h2>
              <p className="mt-1 text-base font-medium text-stone-600">
                업체가 직접 운영하는 브랜드 전시장입니다.
              </p>
            </div>
            <Link
              href="/expo/brands"
              className="shrink-0 rounded-full bg-stone-900 px-4 py-3 text-sm font-extrabold text-white"
            >
              전체보기
            </Link>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {featuredBrands.length === 0 ? (
              <EmptyBox text="현재 추천 브랜드가 없습니다." />
            ) : (
              featuredBrands.map((brand) => (
                <Link
                  key={brand.id}
                  href={`/expo/brands/${brand.brand_slug || brand.id}`}
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <div className="mb-4 inline-flex rounded-full bg-lime-100 px-3 py-1 text-sm font-extrabold text-green-800">
                    {brand.main_category || "추천 브랜드관"}
                  </div>

                  <div className="flex h-24 items-center justify-center overflow-hidden rounded-2xl bg-stone-100 p-4 text-center text-xl font-extrabold text-stone-700">
                    {brand.logo_url ? (
                      <img
                        src={brand.logo_url}
                        alt={`${brand.brand_name} 로고`}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      brand.brand_name
                    )}
                  </div>

                  <h3 className="mt-4 text-xl font-extrabold text-stone-900">
                    {brand.brand_name}
                  </h3>
                  <p className="mt-2 text-base font-medium leading-relaxed text-stone-600">
                    {brand.short_description || "브랜드 소개 준비중"}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {(brand.main_crops || "전작물")
                      .split(",")
                      .map((crop) => crop.trim())
                      .filter(Boolean)
                      .map((crop) => (
                        <span
                          key={crop}
                          className="rounded-full bg-stone-100 px-3 py-2 text-sm font-bold text-stone-700"
                        >
                          {crop}
                        </span>
                      ))}
                  </div>

                  <div className="mt-5 rounded-2xl bg-green-700 py-4 text-center text-lg font-extrabold text-white">
                    브랜드관 입장
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-extrabold text-stone-900">
            공동구매 · 샘플 · 라이브
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {events.length === 0 ? (
              <EmptyBox text="현재 진행 중인 이벤트가 없습니다." />
            ) : (
              events.map((event) => (
                <Link
                  key={event.id}
                  href={event.link_url || "/expo"}
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                >
                  <h3 className="text-xl font-extrabold text-stone-900">
                    {event.title}
                  </h3>
                  <p className="mt-2 text-base font-medium leading-relaxed text-stone-600">
                    {event.subtitle || "자세한 내용을 확인하세요."}
                  </p>
                  <div className="mt-5 rounded-2xl bg-yellow-300 py-4 text-center text-lg font-extrabold text-stone-900">
                    확인하기
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="text-2xl font-extrabold text-stone-900">
            작물영양관 운영 원칙
          </h2>
          <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
            농민 상담·문의·주문 데이터는 업체에 바로 넘기지 않고,
            K-Agri Expo가 중간 허브로 관리합니다.
          </p>
        </section>
      </section>
    </main>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="col-span-full rounded-3xl border border-dashed border-stone-300 bg-white p-6 text-center text-lg font-extrabold text-stone-500">
      {text}
    </div>
  );
}