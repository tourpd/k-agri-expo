"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ProductRow = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price_krw: number;
  category: string | null;
};

export default function VendorApplyPage() {
  const router = useRouter();

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [form, setForm] = useState({
    company_name: "",
    applicant_name: "",
    phone: "",
    email: "",
    product_code: "",
    note: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();

        if (data.success) {
          setProducts(data.products || []);
          if ((data.products || []).length > 0) {
            setForm((prev) => ({
              ...prev,
              product_code: prev.product_code || data.products[0].code,
            }));
          }
        } else {
          setErrorText(data.error || "상품 목록을 불러오지 못했습니다.");
        }
      } catch {
        setErrorText("상품 목록 조회 중 네트워크 오류가 발생했습니다.");
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProducts();
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.code === form.product_code) || null;
  }, [products, form.product_code]);

  const submit = async () => {
    setMessage("");
    setErrorText("");

    if (!form.company_name.trim()) {
      setErrorText("회사명을 입력해 주세요.");
      return;
    }

    if (!form.phone.trim()) {
      setErrorText("연락처를 입력해 주세요.");
      return;
    }

    if (!form.product_code.trim()) {
      setErrorText("신청 상품을 선택해 주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/vendor/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "신청에 실패했습니다.");
        return;
      }

      setMessage("신청이 접수되었습니다. 완료 페이지로 이동합니다.");

      const complete = data.complete || {};
      const params = new URLSearchParams({
        order_id: String(complete.order_id || ""),
        company_name: String(complete.company_name || form.company_name || ""),
        product_name: String(
          complete.product_name || selectedProduct?.name || ""
        ),
        amount_krw: String(
          complete.amount_krw || selectedProduct?.price_krw || 0
        ),
        phone: String(form.phone || ""),
      });

      router.push(`/vendor/apply/complete?${params.toString()}`);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl">
          <div className="text-sm font-black text-emerald-300">
            VENDOR APPLICATION
          </div>
          <h1 className="mt-3 text-4xl font-black">업체 입점 신청</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-200">
            K-Agri Expo에 참가할 업체는 원하는 입점 상품을 선택하고 신청서를 제출해 주세요.
            신청 완료 후 입금 안내 페이지가 바로 열리며, 입금 확인 후 부스 개설이 진행됩니다.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="mb-5">
            <div className="text-sm font-black text-emerald-700">PRODUCTS</div>
            <h2 className="mt-2 text-2xl font-black">입점 상품 선택</h2>
          </div>

          {loadingProducts ? (
            <div className="text-slate-500">상품 정보를 불러오는 중...</div>
          ) : products.length === 0 ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 font-bold text-red-700">
              현재 신청 가능한 상품이 없습니다.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => {
                const active = form.product_code === product.code;

                return (
                  <button
                    key={product.code}
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, product_code: product.code }))
                    }
                    className={`rounded-2xl border p-5 text-left transition ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-900"
                    }`}
                  >
                    <div className="text-sm font-black text-emerald-400">
                      {product.category || "PRODUCT"}
                    </div>
                    <div className="mt-2 text-xl font-black">{product.name}</div>
                    <div
                      className={`mt-3 text-sm leading-7 ${
                        active ? "text-slate-200" : "text-slate-600"
                      }`}
                    >
                      {product.description || "상품 설명이 없습니다."}
                    </div>
                    <div className="mt-4 text-2xl font-black">
                      {product.price_krw.toLocaleString()}원
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="mb-5">
            <div className="text-sm font-black text-emerald-700">
              APPLICATION FORM
            </div>
            <h2 className="mt-2 text-2xl font-black">신청 정보 입력</h2>
          </div>

          {selectedProduct ? (
            <div className="mb-6 rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">선택 상품</div>
              <div className="mt-1 text-xl font-black">{selectedProduct.name}</div>
              <div className="mt-1 text-sm text-slate-600">
                {selectedProduct.description || "상품 설명 없음"}
              </div>
              <div className="mt-2 text-lg font-black text-emerald-700">
                {selectedProduct.price_krw.toLocaleString()}원
              </div>
            </div>
          ) : null}

          {message ? (
            <div className="mb-4 rounded-xl bg-emerald-100 px-4 py-3 font-bold text-emerald-700">
              {message}
            </div>
          ) : null}

          {errorText ? (
            <div className="mb-4 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700">
              {errorText}
            </div>
          ) : null}

          <div className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">회사명 *</label>
                <input
                  value={form.company_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      company_name: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="예: 영진로타리"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">담당자명</label>
                <input
                  value={form.applicant_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      applicant_name: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="예: 홍길동"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">연락처 *</label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="예: 010-1234-5678"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">이메일</label>
                <input
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="예: company@example.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">신청 메모</label>
              <textarea
                value={form.note}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    note: e.target.value,
                  }))
                }
                className="min-h-[140px] w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="희망 노출 방식, 라이브 소개 희망 여부, 문의사항 등을 입력해 주세요."
              />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={submit}
                disabled={submitting || products.length === 0}
                className="rounded-2xl bg-slate-950 px-6 py-4 text-lg font-black text-white disabled:opacity-60"
              >
                {submitting ? "신청 접수 중..." : "입점 신청하기"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}