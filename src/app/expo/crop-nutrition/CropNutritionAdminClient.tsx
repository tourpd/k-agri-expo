"use client";

import { useState } from "react";
import Link from "next/link";

type Issue = {
  id: string;
  title: string;
  crop: string;
  description: string;
  isActive: boolean;
};

type FeaturedBrand = {
  id: string;
  brandName: string;
  hall: string;
  reason: string;
  isFeatured: boolean;
};

const initialIssues: Issue[] = [
  {
    id: "issue-1",
    title: "고추 칼슘관리",
    crop: "고추",
    description: "일소·배꼽썩음·착과기 칼슘 관리",
    isActive: true,
  },
  {
    id: "issue-2",
    title: "마늘 구비대",
    crop: "마늘",
    description: "월동 후 회복과 구비대 영양관리",
    isActive: true,
  },
  {
    id: "issue-3",
    title: "딸기 후기관리",
    crop: "딸기",
    description: "당도·잎관리·뿌리 회복",
    isActive: false,
  },
];

const initialBrands: FeaturedBrand[] = [
  {
    id: "brand-1",
    brandName: "DOF 독수리 5형제",
    hall: "작물영양관",
    reason: "기후변화 대응 작물영양 패키지",
    isFeatured: true,
  },
  {
    id: "brand-2",
    brandName: "해조추출물 솔루션관",
    hall: "작물영양관",
    reason: "저온기 회복·뿌리 활착",
    isFeatured: true,
  },
];

export default function CropNutritionAdminClient() {
  const [issues, setIssues] = useState<Issue[]>(initialIssues);
  const [brands, setBrands] = useState<FeaturedBrand[]>(initialBrands);

  function toggleIssue(id: string) {
    setIssues((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isActive: !item.isActive } : item
      )
    );
  }

  function toggleBrand(id: string) {
    setBrands((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFeatured: !item.isFeatured } : item
      )
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
            작물영양관 메인 화면의 월별 이슈, 추천 브랜드, 노출 콘텐츠를
            관리합니다.
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
            <Link
              href="/admin/expo"
              className="rounded-2xl bg-stone-700 px-5 py-4 text-center text-lg font-extrabold text-white"
            >
              Expo 관리자 홈
            </Link>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard title="노출 이슈" value={`${issues.filter((i) => i.isActive).length}개`} />
          <StatCard title="추천 브랜드" value={`${brands.filter((b) => b.isFeatured).length}개`} />
          <StatCard title="관리 관" value="작물영양관" />
        </section>

        <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-stone-900">
                월별·작물별 이슈 관리
              </h2>
              <p className="mt-1 text-base font-bold text-stone-600">
                농민이 가장 먼저 누르는 이슈 버튼입니다.
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-green-700 px-5 py-4 text-base font-extrabold text-white"
            >
              이슈 추가
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-extrabold text-green-800">
                        {issue.crop}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-extrabold ${
                          issue.isActive
                            ? "bg-blue-100 text-blue-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {issue.isActive ? "노출중" : "숨김"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-extrabold text-stone-900">
                      {issue.title}
                    </h3>
                    <p className="mt-1 text-base font-bold text-stone-600">
                      {issue.description}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleIssue(issue.id)}
                      className="rounded-2xl bg-stone-900 px-4 py-3 text-base font-extrabold text-white"
                    >
                      {issue.isActive ? "숨기기" : "노출"}
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl bg-white px-4 py-3 text-base font-extrabold text-stone-800 ring-1 ring-black/10"
                    >
                      수정
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold text-stone-900">
                추천 브랜드 관리
              </h2>
              <p className="mt-1 text-base font-bold text-stone-600">
                작물영양관 메인에 노출할 브랜드관을 선택합니다.
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-green-700 px-5 py-4 text-base font-extrabold text-white"
            >
              브랜드 추가
            </button>
          </div>

          <div className="mt-5 grid gap-3">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-lime-100 px-3 py-1 text-sm font-extrabold text-green-800">
                        {brand.hall}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-sm font-extrabold ${
                          brand.isFeatured
                            ? "bg-yellow-200 text-stone-900"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {brand.isFeatured ? "추천 노출" : "일반"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-extrabold text-stone-900">
                      {brand.brandName}
                    </h3>
                    <p className="mt-1 text-base font-bold text-stone-600">
                      {brand.reason}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleBrand(brand.id)}
                      className="rounded-2xl bg-stone-900 px-4 py-3 text-base font-extrabold text-white"
                    >
                      {brand.isFeatured ? "추천 해제" : "추천"}
                    </button>
                    <button
                      type="button"
                      className="rounded-2xl bg-white px-4 py-3 text-base font-extrabold text-stone-800 ring-1 ring-black/10"
                    >
                      수정
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-yellow-100 p-5 ring-1 ring-yellow-300">
          <h2 className="text-2xl font-extrabold text-stone-900">
            다음 연결 예정
          </h2>
          <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
            현재는 화면 골격용 임시 데이터입니다. 다음 단계에서 Supabase
            테이블과 연결해 관리자 수정 내용이 실제 작물영양관 메인에
            반영되도록 연결합니다.
          </p>
        </section>
      </section>
    </main>
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