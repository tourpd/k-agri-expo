"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    daum?: any;
  }
}

type ProductInfo = {
  product_id: string;
  name: string;
  slug: string;
  volume: string;
  unitLabel: string;
  price: number;
  shippingFee: number;
  imageUrl: string;
  coveragePerUnit: number;
  guide: string;
  caution: string;
};

type OrderForm = {
  buyerName: string;
  buyerPhone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  memo: string;
};

function extractAreaNumber(value: string) {
  const n = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatAreaInput(value: string) {
  const d = value.replace(/[^\d]/g, "");
  if (!d) return "";
  return `${Number(d).toLocaleString()}평`;
}

function formatWon(v: number) {
  return `${Number(v || 0).toLocaleString()}원`;
}

function formatPhone(value: string) {
  const d = value.replace(/[^\d]/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

function PhotoDoctorBuyPageInner() {
  const params = useSearchParams();

  const productParam = params.get("product") || "";
  const crop = params.get("crop") || "";
  const diagnosis = params.get("diagnosis") || "";
  const issue = params.get("issue") || diagnosis || "";
  const diagnosisId = params.get("diagnosis_id") || "";
  const source = params.get("source") || "photodoctor";
  const video = params.get("video") || "";

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [product, setProduct] = useState<ProductInfo | null>(null);

  const [areaText, setAreaText] = useState("");
  const [quantityManual, setQuantityManual] = useState<number | null>(null);
  const [orderDone, setOrderDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState("");

  const [orderForm, setOrderForm] = useState<OrderForm>({
    buyerName: "",
    buyerPhone: "",
    zipcode: "",
    address: "",
    addressDetail: "",
    memo: "",
  });

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      setLoadError("");

      const res = await fetch(
        `/api/photodoctor/product?product=${encodeURIComponent(productParam)}`,
        { cache: "no-store" }
      );

      const data = await res.json().catch(() => null);

      setLoading(false);

      if (!data?.success || !data.product) {
        setProduct(null);
        setLoadError(data?.error || "상품 정보를 불러오지 못했습니다.");
        return;
      }

      const p = data.product;

      setProduct({
        product_id: p.product_id,
        name: p.name,
        slug: p.slug || "",
        volume: p.volume_text || "",
        unitLabel: p.unit_label || "개",
        price: Number(p.price_krw || 0),
        shippingFee: Number(p.shipping_fee_krw || 0),
        imageUrl: p.image_url || "/products/product-placeholder.png",
        coveragePerUnit: Number(p.coverage_per_unit || 300),
        guide: p.usage_text || "포토닥터 진단 결과와 연결된 농자재입니다.",
        caution:
          p.caution_text ||
          "실제 사용 전에는 제품 라벨과 작물 적용 여부를 확인하세요.",
      });
    }

    if (productParam) loadProduct();
    else {
      setLoading(false);
      setLoadError("product 값이 없습니다.");
    }
  }, [productParam]);

  const areaNumber = extractAreaNumber(areaText);

  const autoQuantity = useMemo(() => {
    if (!product) return 1;
    if (!areaNumber) return 1;
    return Math.max(1, Math.ceil(areaNumber / product.coveragePerUnit));
  }, [areaNumber, product]);

  const quantity = quantityManual ?? autoQuantity;
  const productAmount = product ? product.price * quantity : 0;
  const totalAmount = product ? productAmount + product.shippingFee : 0;
  const isManualQuantity = quantityManual !== null;
  const hasProduct = !!product && product.price > 0;

  function resetOrderDone() {
    setOrderDone(false);
    setCreatedOrderCode("");
  }

  function handleAreaChange(value: string) {
    setAreaText(formatAreaInput(value));
    setQuantityManual(null);
    resetOrderDone();
  }

  function setFormValue(key: keyof OrderForm, value: string) {
    resetOrderDone();
    setOrderForm((prev) => ({
      ...prev,
      [key]: key === "buyerPhone" ? formatPhone(value) : value,
    }));
  }

  function openPostcode() {
    if (!window.daum?.Postcode) {
      alert("주소검색을 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        resetOrderDone();
        setOrderForm((prev) => ({
          ...prev,
          zipcode: data.zonecode || "",
          address: data.roadAddress || data.jibunAddress || "",
        }));
      },
    }).open();
  }

  function validateOrder() {
    if (!product || !hasProduct) {
      alert("제품 정보가 없습니다.");
      return false;
    }

    if (!areaNumber) {
      alert("재배면적을 입력해 주세요.");
      return false;
    }

    if (!orderForm.buyerName.trim()) {
      alert("주문자 성함을 입력해 주세요.");
      return false;
    }

    if (orderForm.buyerPhone.replace(/[^\d]/g, "").length < 10) {
      alert("연락처를 정확히 입력해 주세요.");
      return false;
    }

    if (!orderForm.zipcode.trim()) {
      alert("우편번호를 입력해 주세요.");
      return false;
    }

    if (!orderForm.address.trim()) {
      alert("주소를 입력해 주세요.");
      return false;
    }

    if (!orderForm.addressDetail.trim()) {
      alert("상세주소를 입력해 주세요.");
      return false;
    }

    return true;
  }

  async function submitOrder() {
    if (submitting || orderDone) return;
    if (!product) return;
    if (!validateOrder()) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/photodoctor/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.product_id,
          product_name: product.name,
          product_slug: product.slug,

          crop,
          diagnosis,
          issue,
          diagnosis_id: diagnosisId,

          buyer_name: orderForm.buyerName,
          buyer_phone: orderForm.buyerPhone,
          zipcode: orderForm.zipcode,
          address: orderForm.address,
          address_detail: orderForm.addressDetail,

          area_text: areaText,
          area_pyeong: areaNumber,
          quantity,
          unit_label: product.unitLabel,

          unit_price: product.price,
          unit_price_krw: product.price,
          shipping_fee: product.shippingFee,
          shipping_fee_krw: product.shippingFee,
          total_amount: totalAmount,
          total_amount_krw: totalAmount,

          memo: orderForm.memo,
          source,
          video,

          payment_method: "bank_transfer",
          deposit_bank: "기업은행 486-072683-04-011",
          deposit_name: orderForm.buyerName,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!data?.ok && !data?.success) {
        alert(data?.error || "주문 저장에 실패했습니다.");
        return;
      }

      setCreatedOrderCode(data?.order?.order_code || "");
      setOrderDone(true);

      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
      }, 100);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-3xl border bg-white p-6 text-center text-xl font-black text-black">
          상품 정보를 불러오는 중입니다...
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-red-300 bg-red-50 p-6 text-center text-xl font-black text-red-900">
          제품 연결 실패
          <div className="mt-3 text-base font-bold">{loadError}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 md:py-10">
      <Script
        src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />

      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <div className="text-sm font-black text-green-700">
            포토닥터 진단 결과 연계
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-green-800 md:text-5xl">
            🌿 {product.name} 바로 주문
          </h1>

          <p className="mt-3 text-base font-bold text-neutral-800 md:text-xl">
            평수 입력하면 필요한 수량을 자동 계산하고, 주소 입력 후 무통장입금으로 주문합니다.
          </p>
        </header>

        <section className="mt-6 rounded-3xl border bg-white p-4 shadow-sm md:p-6">
          <div className="grid gap-5 md:grid-cols-[280px_1fr]">
            <div className="rounded-3xl border bg-white p-4">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="mx-auto h-[220px] w-full object-contain md:h-[260px]"
              />

              <div className="mt-4 rounded-2xl bg-neutral-100 p-4 text-center text-black">
                <div className="text-base font-black text-neutral-700">
                  제품 단가
                </div>
                <div className="mt-1 text-3xl font-black text-red-600">
                  {formatWon(product.price)}
                </div>
                <div className="mt-1 text-sm font-bold text-neutral-700">
                  {product.volume} / 배송비 {formatWon(product.shippingFee)}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-green-300 bg-green-50 p-5 text-black">
              <div className="text-base font-black text-green-800">
                포토닥터 추천 제품
              </div>

              <h2 className="mt-2 text-4xl font-black tracking-tight text-black md:text-5xl">
                {product.name}
              </h2>

              <div className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-lg font-black text-green-900">
                {product.volume}
              </div>

              <div className="mt-5 rounded-2xl bg-white p-5 text-lg font-bold leading-9 text-black">
                포토닥터 진단 결과를 확인한 뒤 필요한 경우 선택하는 대응 자재입니다.
              </div>

              <p className="mt-4 rounded-2xl bg-white p-5 text-lg font-bold leading-9 text-black">
                {product.guide}
              </p>

              <div className="mt-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-base font-black leading-8 text-amber-950">
                ⚠ {product.caution}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="rounded-3xl border p-5 text-black">
              <label className="text-xl font-black">재배면적 입력</label>

              <input
                value={areaText}
                onChange={(e) => handleAreaChange(e.target.value)}
                placeholder="예: 600평"
                inputMode="numeric"
                disabled={orderDone}
                className="mt-3 w-full rounded-2xl border px-5 py-5 text-2xl font-black text-black placeholder:text-neutral-400 disabled:bg-neutral-100"
              />

              <div className="mt-4 rounded-2xl bg-neutral-50 p-4 text-base font-bold leading-8 text-black">
                기준: {product.volume} 1{product.unitLabel}당 약{" "}
                {product.coveragePerUnit.toLocaleString()}평
                <br />
                입력 면적:{" "}
                <span className="font-black text-black">
                  {areaNumber ? `${areaNumber.toLocaleString()}평` : "미입력"}
                </span>
                <br />
                자동 추천 수량:{" "}
                <span className="text-2xl font-black text-red-600">
                  {autoQuantity}
                  {product.unitLabel}
                </span>
              </div>
            </div>

            <div className="rounded-3xl border p-5 text-black">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xl font-black">주문 수량</div>
                <div className="text-sm font-black text-neutral-700">
                  {isManualQuantity ? "수동 조정" : "평수 기준 자동"}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-center gap-5">
                <button
                  type="button"
                  onClick={() => setQuantityManual(Math.max(1, quantity - 1))}
                  disabled={orderDone}
                  className="h-16 w-16 rounded-2xl border bg-white text-3xl font-black text-black disabled:bg-neutral-100"
                >
                  -
                </button>

                <div className="min-w-28 text-center text-black">
                  <div className="text-5xl font-black">{quantity}</div>
                  <div className="mt-1 text-base font-black text-neutral-700">
                    {product.unitLabel}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQuantityManual(quantity + 1)}
                  disabled={orderDone}
                  className="h-16 w-16 rounded-2xl border bg-white text-3xl font-black text-black disabled:bg-neutral-100"
                >
                  +
                </button>
              </div>

              {isManualQuantity && !orderDone && (
                <button
                  type="button"
                  onClick={() => setQuantityManual(null)}
                  className="mt-5 w-full rounded-2xl border px-4 py-4 text-base font-black text-black"
                >
                  자동수량으로 복귀
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-neutral-100 p-5 text-black">
            <div className="flex justify-between gap-3 text-lg font-black">
              <span>
                상품금액 ({formatWon(product.price)} × {quantity}
                {product.unitLabel})
              </span>
              <span>{formatWon(productAmount)}</span>
            </div>

            <div className="mt-2 flex justify-between text-lg font-black">
              <span>배송비</span>
              <span>{formatWon(product.shippingFee)}</span>
            </div>

            <div className="mt-4 border-t border-neutral-300 pt-4 text-right text-black">
              <div className="text-base font-black text-neutral-700">
                총 결제금액
              </div>
              <div className="text-4xl font-black text-red-600 md:text-5xl">
                {formatWon(totalAmount)}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border bg-white p-5 text-black">
            <h3 className="text-2xl font-black">주문자 / 배송지 정보</h3>

            <div className="mt-5 grid gap-4">
              <input
                value={orderForm.buyerName}
                onChange={(e) => setFormValue("buyerName", e.target.value)}
                placeholder="주문자 성함"
                disabled={orderDone}
                className="h-16 rounded-2xl border px-5 text-xl font-black text-black placeholder:text-neutral-400 disabled:bg-neutral-100"
              />

              <input
                value={orderForm.buyerPhone}
                onChange={(e) => setFormValue("buyerPhone", e.target.value)}
                placeholder="연락처 예: 010-1234-5678"
                inputMode="tel"
                disabled={orderDone}
                className="h-16 rounded-2xl border px-5 text-xl font-black text-black placeholder:text-neutral-400 disabled:bg-neutral-100"
              />

              <div className="grid grid-cols-[1fr_140px] gap-3">
                <input
                  value={orderForm.zipcode}
                  onChange={(e) => setFormValue("zipcode", e.target.value)}
                  placeholder="우편번호"
                  inputMode="numeric"
                  disabled={orderDone}
                  className="h-16 rounded-2xl border px-5 text-xl font-black text-black placeholder:text-neutral-400 disabled:bg-neutral-100"
                />

                <button
                  type="button"
                  onClick={openPostcode}
                  disabled={orderDone}
                  className="h-16 rounded-2xl bg-black px-4 text-lg font-black text-white disabled:bg-neutral-400"
                >
                  주소검색
                </button>
              </div>

              <input
                value={orderForm.address}
                onChange={(e) => setFormValue("address", e.target.value)}
                placeholder="주소"
                disabled={orderDone}
                className="h-16 rounded-2xl border px-5 text-xl font-black text-black placeholder:text-neutral-400 disabled:bg-neutral-100"
              />

              <input
                value={orderForm.addressDetail}
                onChange={(e) => setFormValue("addressDetail", e.target.value)}
                placeholder="상세주소"
                disabled={orderDone}
                className="h-16 rounded-2xl border px-5 text-xl font-black text-black placeholder:text-neutral-400 disabled:bg-neutral-100"
              />

              <input
                value={orderForm.memo}
                onChange={(e) => setFormValue("memo", e.target.value)}
                placeholder="배송 요청사항 선택 입력"
                disabled={orderDone}
                className="h-16 rounded-2xl border px-5 text-xl font-black text-black placeholder:text-neutral-400 disabled:bg-neutral-100"
              />
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-yellow-300 bg-yellow-50 p-5 text-black">
            <div className="text-2xl font-black">무통장입금 안내</div>

            <div className="mt-3 text-2xl font-black text-red-600">
              기업은행 486-072683-04-011
            </div>

            <div className="mt-1 text-lg font-black">예금주: 한국농수산TV</div>

            <div className="mt-4 text-base font-bold leading-8 text-neutral-800">
              입금 확인 후 순차 발송됩니다.
              <br />
              반드시 주문자명과 동일하게 입금해 주세요.
            </div>
          </div>

          {orderDone && (
            <div className="mt-5 rounded-3xl border-4 border-green-500 bg-green-50 p-6 text-black">
              <div className="text-3xl font-black text-green-800">
                ✅ 주문 접수 완료
              </div>

              <div className="mt-4 text-xl font-black leading-9">
                {createdOrderCode && (
                  <>
                    주문번호: {createdOrderCode}
                    <br />
                  </>
                )}
                주문자: {orderForm.buyerName}
                <br />
                연락처: {orderForm.buyerPhone}
                <br />
                상품: {product.name} {quantity}
                {product.unitLabel}
                <br />
                결제금액: {formatWon(totalAmount)}
              </div>

              <div className="mt-5 rounded-2xl bg-white p-5 text-xl font-black text-red-600">
                기업은행 486-072683-04-011
                <br />
                예금주: 한국농수산TV
              </div>

              <p className="mt-4 text-lg font-bold leading-8">
                입금 확인 후 순차 발송됩니다.
                <br />
                반드시 주문자명과 동일하게 입금해 주세요.
              </p>

              <div className="mt-6 rounded-2xl border border-blue-300 bg-blue-50 p-5">
                <div className="text-2xl font-black text-blue-900">
                  🚚 주문 진행상태 확인 안내
                </div>

                <p className="mt-3 text-lg font-bold leading-8 text-blue-950">
                  입금 직후 바로 배송조회가 되는 것은 아닙니다.
                  <br />
                  입금확인 후 출고가 진행되고, 송장번호가 등록되면
                  진행상태를 확인할 수 있습니다.
                </p>

                <a
                  href="/photodoctor/tracking"
                  className="mt-5 flex min-h-[64px] w-full items-center justify-center rounded-2xl bg-blue-600 px-5 text-2xl font-black text-white no-underline"
                >
                  주문 진행상태 확인하기
                </a>
              </div>
            </div>
          )}

          {!orderDone ? (
            <button
              type="button"
              onClick={submitOrder}
              disabled={!hasProduct || submitting}
              className="mt-5 w-full rounded-3xl bg-green-600 py-6 text-2xl font-black text-white hover:bg-green-700 disabled:bg-neutral-300"
            >
              {submitting
                ? "주문 접수 중..."
                : `${formatWon(totalAmount)} 무통장입금 주문하기`}
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="mt-5 w-full rounded-3xl bg-neutral-400 py-6 text-2xl font-black text-white"
            >
              주문 접수 완료
            </button>
          )}
        </section>
      </div>
    </main>
  );
}

export default function PhotoDoctorBuyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-50 px-4 py-8">
          <div className="mx-auto max-w-4xl rounded-3xl border bg-white p-6 text-center text-xl font-black text-black">
            포토닥터 주문 페이지를 불러오는 중입니다...
          </div>
        </main>
      }
    >
      <PhotoDoctorBuyPageInner />
    </Suspense>
  );
}