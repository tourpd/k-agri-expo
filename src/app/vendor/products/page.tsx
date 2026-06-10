/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Product = {
  id: string;
  product_name?: string | null;
  category?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  price_krw?: number | null;
  unit_label?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const DEFAULT_BRAND_SLUG = "dof-eagle-five";

function sortLatest(items: Product[]) {
  return [...items].sort((a, b) => {
    const bt = new Date(b.created_at || b.updated_at || 0).getTime();
    const at = new Date(a.created_at || a.updated_at || 0).getTime();
    return bt - at;
  });
}

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return products;

    return products.filter((p) =>
      [p.product_name, p.category, p.short_description, p.unit_label, p.is_active === false ? "숨김" : "노출"]
        .join(" ")
        .toLowerCase()
        .includes(keyword)
    );
  }, [products, q]);

  async function loadProducts() {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/vendor/brand-hall?brand_slug=${DEFAULT_BRAND_SLUG}`,
        { cache: "no-store" }
      );

      const json = await res.json();
      setProducts(sortLatest(json.products || []));
    } finally {
      setLoading(false);
    }
  }

  async function hideProduct(id: string) {
    if (!confirm("이 제품을 농민 화면에서 숨김 처리할까요?")) return;

    const res = await fetch("/api/vendor/brand-products/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "숨김 처리 실패");
      return;
    }

    await loadProducts();
  }

  async function hardDeleteProduct(id: string) {
    const first = confirm("이 제품을 완전히 삭제할까요? 복구할 수 없습니다.");
    if (!first) return;

    const second = confirm("정말 삭제합니다. 주문 이력이 있으면 삭제되지 않습니다.");
    if (!second) return;

    const res = await fetch("/api/vendor/brand-products/delete-hard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    const json = await res.json();

    if (!json.ok) {
      alert(json.error || "완전 삭제 실패");
      return;
    }

    await loadProducts();
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/vendor/brand-hall" className="text-base font-black text-stone-700">
              ← 업체 운영센터
            </Link>

            <h1 className="mt-3 text-3xl font-black text-stone-950">
              내 제품 관리
            </h1>

            <p className="mt-2 text-base font-bold text-stone-600">
              등록한 제품을 엑셀처럼 한 줄씩 확인하고 수정·숨김·삭제합니다.
            </p>
          </div>

          <Link
            href="/vendor/products/new"
            className="rounded-xl bg-stone-900 px-6 py-4 text-lg font-black text-white"
          >
            + 제품 등록
          </Link>
        </div>

        <section className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-black text-stone-900">
              전체 {products.length}개 · 표시 {filtered.length}개
            </div>

            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="제품명, 카테고리, 상태 검색"
              className="w-full max-w-md rounded-xl border border-stone-300 bg-white px-4 py-3 text-base font-bold text-stone-900 outline-none focus:border-stone-700"
            />
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full min-w-[1200px] border-collapse bg-white text-left">
              <thead className="sticky top-0 bg-stone-100">
                <tr className="text-sm font-black text-stone-700">
                  <th className="w-14 border-b px-3 py-3">번호</th>
                  <th className="w-24 border-b px-3 py-3">이미지</th>
                  <th className="border-b px-3 py-3">제품명</th>
                  <th className="w-40 border-b px-3 py-3">카테고리</th>
                  <th className="border-b px-3 py-3">설명</th>
                  <th className="w-28 border-b px-3 py-3">가격</th>
                  <th className="w-24 border-b px-3 py-3">상태</th>
                  <th className="w-[310px] border-b px-3 py-3 text-center">관리</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-lg font-black text-stone-500">
                      제품을 불러오는 중...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-lg font-black text-stone-500">
                      표시할 제품이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, index) => (
                    <tr key={item.id} className="border-b border-stone-100 text-base hover:bg-stone-50">
                      <td className="px-3 py-3 font-bold text-stone-500">{index + 1}</td>

                      <td className="px-3 py-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-stone-50 ring-1 ring-stone-200">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name || "제품"}
                              className="h-full w-full rounded-lg object-contain"
                            />
                          ) : (
                            <span className="text-xs font-bold text-stone-400">없음</span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="font-black text-stone-950">
                          {item.product_name || "제품명 없음"}
                        </div>
                        <div className="mt-1 text-xs font-bold text-stone-400">
                          {item.id}
                        </div>
                      </td>

                      <td className="px-3 py-3 font-bold text-stone-700">
                        {item.category || "-"}
                      </td>

                      <td className="max-w-[340px] px-3 py-3 font-bold text-stone-600">
                        <div className="line-clamp-2">
                          {item.short_description || "-"}
                        </div>
                      </td>

                      <td className="px-3 py-3 font-black text-stone-900">
                        {item.price_krw ? `${Number(item.price_krw).toLocaleString()}원` : "-"}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-black ${
                            item.is_active === false
                              ? "bg-stone-200 text-stone-600"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.is_active === false ? "숨김" : "노출"}
                        </span>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex justify-center gap-2">
                          <Link
                            href={`/expo/brand-products/${item.id}`}
                            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-black text-stone-800"
                          >
                            보기
                          </Link>

                          <Link
                            href={`/vendor/products/${item.id}/edit`}
                            className="rounded-lg bg-stone-800 px-3 py-2 text-sm font-black text-white"
                          >
                            수정
                          </Link>

                          <button
                            type="button"
                            onClick={() => hideProduct(item.id)}
                            className="rounded-lg bg-stone-500 px-3 py-2 text-sm font-black text-white"
                          >
                            숨김
                          </button>

                          <button
                            type="button"
                            onClick={() => hardDeleteProduct(item.id)}
                            className="rounded-lg bg-red-700 px-3 py-2 text-sm font-black text-white"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}