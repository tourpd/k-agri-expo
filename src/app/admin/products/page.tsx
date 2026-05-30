"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import ProductDesktopTable, {
  type ProductRow,
} from "@/components/admin/products/ProductDesktopTable";
import ProductMobileCardList from "@/components/admin/products/ProductMobileCardList";

const PAGE_SIZE = 30;

const FILTERS = [
  { value: "all", label: "전체" },
  { value: "vendor", label: "업체 업로드" },
  { value: "material", label: "농자재" },
  { value: "photodoctor", label: "포토닥터 추천" },
  { value: "booth_product", label: "업체 판매상품" },
  { value: "booth_plan", label: "입점상품" },
  { value: "event", label: "경품/프로모션" },
  { value: "inactive", label: "숨김" },
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function loadProducts() {
    setLoading(true);
    setErrorText("");

    try {
      const params = new URLSearchParams();

      if (keyword.trim()) {
        params.set("keyword", keyword.trim());
      }

      if (filter === "vendor") {
        params.set("source_type", "vendor");
      }

      if (filter === "material") {
        params.set("product_group", "material");
      }

      if (filter === "photodoctor") {
        params.set("photodoctor", "true");
      }

      if (filter === "booth_product") {
        params.set("booth_product", "true");
      }

      if (filter === "booth_plan") {
        params.set("booth_plan", "true");
      }

      if (filter === "event") {
        params.set("product_group", "event");
      }

      if (filter === "inactive") {
        params.set("active", "inactive");
      }

      const res = await fetch(`/api/admin/products?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!data.success) {
        setProducts([]);
        setSelectedIds([]);
        setErrorText(data.error || "상품 목록 조회 실패");
        return;
      }

      setProducts(data.products || []);
      setSelectedIds([]);
      setPage(1);
    } catch {
      setProducts([]);
      setSelectedIds([]);
      setErrorText("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((p) => p.active).length,
      hidden: products.filter((p) => !p.active).length,
      vendor: products.filter((p) => p.source_type === "vendor").length,
      selected: selectedIds.length,
    };
  }, [products, selectedIds]);

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));

  const pageProducts = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return products.slice(start, start + PAGE_SIZE);
  }, [products, page]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  }

  function togglePageSelect() {
    const ids = pageProducts.map((p) => p.product_id);

    if (ids.length === 0) return;

    const allChecked = ids.every((id) => selectedIds.includes(id));

    if (allChecked) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...ids])));
    }
  }

  async function bulkUpdate(active: boolean) {
    if (selectedIds.length === 0) {
      alert("상품을 먼저 선택하세요.");
      return;
    }

    const label = active ? "승인/노출" : "숨김";

    if (!confirm(`선택한 ${selectedIds.length}개 상품을 ${label} 처리할까요?`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/products/bulk", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ids: selectedIds,
          active,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "일괄 처리 실패");
        return;
      }

      alert(data.message || "처리되었습니다.");
      await loadProducts();
    } catch {
      alert("네트워크 오류");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-3 text-slate-950 md:p-6">
      <section className="mb-4 rounded-3xl bg-white p-5 shadow-sm md:mb-5 md:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm font-black text-emerald-700 md:text-base">
              PRODUCT REVIEW CENTER
            </div>

            <h1 className="mt-2 text-3xl font-black md:text-4xl">
              상품 검수센터
            </h1>

            <p className="mt-3 text-base font-bold text-slate-600 md:text-lg">
              업체 업로드 상품을 확인하고 승인·숨김·추천 여부를 관리합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
            <Link
              href="/admin/products/new"
              className="h-14 rounded-2xl bg-emerald-700 px-6 text-center text-base font-black leading-[56px] text-white md:px-7 md:text-lg"
            >
              관리자 상품 등록
            </Link>

            <button
              type="button"
              onClick={loadProducts}
              className="h-14 rounded-2xl bg-slate-950 px-6 text-base font-black text-white md:px-7 md:text-lg"
            >
              새로고침
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 md:mt-7 md:grid-cols-5">
          <Stat label="현재 목록" value={`${stats.total}개`} color="bg-slate-950" />
          <Stat label="노출중" value={`${stats.active}개`} color="bg-emerald-700" />
          <Stat label="숨김" value={`${stats.hidden}개`} color="bg-red-700" />
          <Stat label="업체 업로드" value={`${stats.vendor}개`} color="bg-blue-700" />
          <Stat label="선택" value={`${stats.selected}개`} color="bg-purple-700" />
        </div>
      </section>

      <section className="mb-4 rounded-3xl bg-white p-4 shadow-sm md:mb-5 md:p-6">
        <div className="mb-5 flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`min-h-12 rounded-2xl px-4 py-3 text-sm font-black md:px-5 md:text-base ${
                filter === item.value
                  ? "bg-slate-950 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") loadProducts();
            }}
            placeholder="상품명 / 업체명 / 작물 / 병해충 검색"
            className="h-14 w-full rounded-2xl border-2 border-slate-300 px-5 text-base font-bold outline-none focus:border-emerald-600 md:text-lg"
          />

          <button
            type="button"
            onClick={loadProducts}
            className="h-14 rounded-2xl bg-slate-950 px-7 text-lg font-black text-white"
          >
            검색
          </button>

          <button
            type="button"
            onClick={() => bulkUpdate(true)}
            className="h-14 rounded-2xl bg-emerald-700 px-7 text-lg font-black text-white"
          >
            선택 승인
          </button>

          <button
            type="button"
            onClick={() => bulkUpdate(false)}
            className="h-14 rounded-2xl bg-red-700 px-7 text-lg font-black text-white"
          >
            선택 숨김
          </button>
        </div>

        {errorText ? (
          <div className="mt-4 rounded-2xl bg-red-100 px-5 py-4 text-base font-black text-red-700 md:text-lg">
            {errorText}
          </div>
        ) : null}
      </section>

      <section className="rounded-3xl bg-white p-4 shadow-sm md:p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-black text-emerald-700">PRODUCTS</div>
            <div className="mt-1 text-3xl font-black">상품 목록</div>
          </div>

          <div className="text-base font-black text-slate-600">
            {loading
              ? "불러오는 중..."
              : `총 ${products.length.toLocaleString()}개 / 현재 ${pageProducts.length}개 표시`}
          </div>
        </div>

        <ProductDesktopTable
          products={pageProducts}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onTogglePageSelect={togglePageSelect}
        />

        <ProductMobileCardList
          products={pageProducts}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />

        <div className="mt-6 flex flex-col items-center justify-center gap-3 md:flex-row">
          <button
            type="button"
            onClick={() => setPage((v) => Math.max(1, v - 1))}
            disabled={page <= 1}
            className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-6 text-lg font-black disabled:opacity-40 md:w-auto"
          >
            이전
          </button>

          <div className="text-lg font-black">
            {page} / {pageCount} 페이지
          </div>

          <button
            type="button"
            onClick={() => setPage((v) => Math.min(pageCount, v + 1))}
            disabled={page >= pageCount}
            className="h-14 w-full rounded-2xl border border-slate-300 bg-white px-6 text-lg font-black disabled:opacity-40 md:w-auto"
          >
            다음
          </button>
        </div>
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`rounded-3xl ${color} p-4 text-white md:p-5`}>
      <div className="text-xs font-black opacity-90 md:text-sm">{label}</div>
      <div className="mt-2 text-2xl font-black md:text-3xl">{value}</div>
    </div>
  );
}