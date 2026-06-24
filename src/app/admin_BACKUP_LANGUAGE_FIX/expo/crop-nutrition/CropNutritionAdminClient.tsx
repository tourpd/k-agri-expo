"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HallSection = {
  id?: string;
  hall_key?: string;
  section_type: string;
  title: string;
  subtitle?: string | null;
  crop?: string | null;
  link_url?: string | null;
  sort_order?: number | null;
  is_active?: boolean | null;
};

type Brand = {
  id?: string;
  hall_key?: string;
  brand_slug?: string | null;
  brand_name: string;
  short_description?: string | null;
  main_crops?: string | null;
  main_category?: string | null;
  is_featured?: boolean | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

export default function CropNutritionAdminClient() {
  const [sections, setSections] = useState<HallSection[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);

    const [sectionRes, brandRes] = await Promise.all([
      fetch("/api/admin/expo/hall-sections", { cache: "no-store" }),
      fetch("/api/admin/expo/brands", { cache: "no-store" }),
    ]);

    const sectionJson = await sectionRes.json();
    const brandJson = await brandRes.json();

    setSections(sectionJson.items ?? []);
    setBrands(brandJson.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveSection(item: HallSection) {
    setSaving(true);

    const res = await fetch("/api/admin/expo/hall-sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    const json = await res.json();
    setSaving(false);

    if (!json.ok) {
      alert(json.error || "저장 실패");
      return;
    }

    await loadData();
  }

  async function saveBrand(item: Brand) {
    setSaving(true);

    const res = await fetch("/api/admin/expo/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    const json = await res.json();
    setSaving(false);

    if (!json.ok) {
      alert(json.error || "저장 실패");
      return;
    }

    await loadData();
  }

  const issues = sections.filter((item) => item.section_type === "issue");
  const events = sections.filter((item) => item.section_type === "event");

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f6f8f3] px-4 py-10">
        <div className="mx-auto max-w-6xl text-2xl font-extrabold">
          작물영양관 CMS 불러오는 중...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-stone-900 p-5 text-white">
          <p className="text-sm font-extrabold text-lime-200">
            K-Agri Expo 관리자
          </p>
          <h1 className="mt-2 text-3xl font-extrabold">
            작물영양관 관리 CMS
          </h1>
          <p className="mt-3 text-lg font-bold leading-relaxed text-stone-100">
            월별 이슈, 추천 브랜드, 공동구매·샘플·라이브 노출을 관리합니다.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link
              href="/expo/halls/crop-nutrition"
              className="rounded-2xl bg-white px-5 py-4 text-center text-lg font-extrabold text-stone-900"
            >
              작물영양관 보기
            </Link>
            <Link
              href="/expo/brands"
              className="rounded-2xl bg-lime-300 px-5 py-4 text-center text-lg font-extrabold text-stone-900"
            >
              브랜드 전체보기
            </Link>
            <button
              type="button"
              onClick={loadData}
              className="rounded-2xl bg-stone-700 px-5 py-4 text-center text-lg font-extrabold text-white"
            >
              새로고침
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard title="노출 이슈" value={`${issues.filter((i) => i.is_active).length}개`} />
          <StatCard title="추천 브랜드" value={`${brands.filter((b) => b.is_featured).length}개`} />
          <StatCard title="저장 상태" value={saving ? "저장중" : "대기"} />
        </section>

        <CmsSection
          title="월별·작물별 이슈 관리"
          desc="작물영양관 메인에 노출되는 이슈 버튼입니다."
          items={issues}
          onSave={saveSection}
        />

        <CmsSection
          title="공동구매 · 샘플 · 라이브 관리"
          desc="작물영양관 하단 이벤트 카드입니다."
          items={events}
          onSave={saveSection}
        />

        <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <h2 className="text-2xl font-extrabold text-stone-900">
            추천 브랜드 관리
          </h2>
          <p className="mt-1 text-base font-bold text-stone-600">
            추천 여부를 바꾸면 브랜드 전체보기와 관 메인에 반영됩니다.
          </p>

          <div className="mt-5 grid gap-3">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-lime-100 px-3 py-1 text-sm font-extrabold text-green-800">
                        {brand.main_category || "브랜드"}
                      </span>
                      <span className="rounded-full bg-stone-200 px-3 py-1 text-sm font-extrabold text-stone-700">
                        {brand.is_featured ? "추천 노출" : "일반"}
                      </span>
                    </div>

                    <h3 className="mt-3 text-xl font-extrabold text-stone-900">
                      {brand.brand_name}
                    </h3>
                    <p className="mt-1 text-base font-bold text-stone-600">
                      {brand.short_description}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        saveBrand({
                          ...brand,
                          is_featured: !brand.is_featured,
                        })
                      }
                      className="rounded-2xl bg-stone-900 px-4 py-3 text-base font-extrabold text-white"
                    >
                      {brand.is_featured ? "추천 해제" : "추천"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        saveBrand({
                          ...brand,
                          is_active: !brand.is_active,
                        })
                      }
                      className="rounded-2xl bg-white px-4 py-3 text-base font-extrabold text-stone-800 ring-1 ring-black/10"
                    >
                      {brand.is_active ? "숨기기" : "노출"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function CmsSection({
  title,
  desc,
  items,
  onSave,
}: {
  title: string;
  desc: string;
  items: HallSection[];
  onSave: (item: HallSection) => void;
}) {
  return (
    <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="text-2xl font-extrabold text-stone-900">{title}</h2>
      <p className="mt-1 text-base font-bold text-stone-600">{desc}</p>

      <div className="mt-5 grid gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-extrabold text-green-800">
                    {item.crop || item.section_type}
                  </span>
                  <span className="rounded-full bg-stone-200 px-3 py-1 text-sm font-extrabold text-stone-700">
                    {item.is_active ? "노출중" : "숨김"}
                  </span>
                </div>

                <h3 className="mt-3 text-xl font-extrabold text-stone-900">
                  {item.title}
                </h3>
                <p className="mt-1 text-base font-bold text-stone-600">
                  {item.subtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onSave({
                    ...item,
                    is_active: !item.is_active,
                  })
                }
                className="rounded-2xl bg-stone-900 px-4 py-3 text-base font-extrabold text-white"
              >
                {item.is_active ? "숨기기" : "노출"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-base font-extrabold text-stone-500">{title}</p>
      <p className="mt-2 text-3xl font-extrabold text-stone-900">{value}</p>
    </div>
  );
}