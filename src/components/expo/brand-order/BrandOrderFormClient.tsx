// src/components/expo/brand-order/BrandOrderFormClient.tsx

"use client";

import Script from "next/script";
import { useMemo, useState } from "react";

type Props = {
  isEvent: boolean;
  brandId: string;
  productId: string;
  eventId: string;
  baseArea: number | string | null | undefined;
  rounds: number | string | null | undefined;
  sprayInterval: string | null | undefined;
  usePeriod: string | null | undefined;
};

declare global {
  interface Window {
    daum?: any;
  }
}

const HEALTH_JOINT_PRODUCT_ID = "85f7811a-1ff1-4b44-b4e6-2eae48beadf4";
const HEALTH_JOINT_UNIT_PRICE = 49900;

function onlyNumber(v: unknown) {
  const n = Number(String(v ?? "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function formatPhone(value: string) {
  const numbers = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (numbers.length < 4) return numbers;
  if (numbers.length < 8) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

export default function BrandOrderFormClient({
  isEvent,
  brandId,
  productId,
  eventId,
  baseArea,
  rounds,
  sprayInterval,
  usePeriod,
}: Props) {
  const isHealthJoint = productId === HEALTH_JOINT_PRODUCT_ID;

  const baseAreaNumber = onlyNumber(baseArea);
  const roundsNumber = onlyNumber(rounds);

  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [quantity, setQuantity] = useState("1");

  const quantityNumber = Math.max(1, onlyNumber(quantity) || 1);
  const unitPrice = isHealthJoint ? HEALTH_JOINT_UNIT_PRICE : 0;
  const totalPrice = isHealthJoint ? unitPrice * quantityNumber : 0;

  const fullAddress = useMemo(() => {
    return [baseAddress, detailAddress].filter(Boolean).join(" ");
  }, [baseAddress, detailAddress]);

  const calculated = useMemo(() => {
    const pyeong = onlyNumber(farmSize);

    if (
      isEvent ||
      isHealthJoint ||
      pyeong <= 0 ||
      baseAreaNumber <= 0 ||
      roundsNumber <= 0
    ) {
      return { pyeong, oneTimeQty: 0, seasonQty: 0, note: "" };
    }

    const oneTimeQty = Math.ceil(pyeong / baseAreaNumber);
    const seasonQty = Math.max(1, Math.ceil(oneTimeQty * roundsNumber));

    const noteParts = [
      `재배평수 ${pyeong.toLocaleString("ko-KR")}평 기준`,
      `1회 사용량 약 ${oneTimeQty}개`,
      `권장 ${roundsNumber}회`,
      `총 ${seasonQty}개 추천`,
    ];

    if (sprayInterval) noteParts.push(`살포 간격: ${sprayInterval}`);
    if (usePeriod) noteParts.push(`사용 시기: ${usePeriod}`);

    return {
      pyeong,
      oneTimeQty,
      seasonQty,
      note: noteParts.join(" / "),
    };
  }, [
    farmSize,
    baseAreaNumber,
    roundsNumber,
    sprayInterval,
    usePeriod,
    isEvent,
    isHealthJoint,
  ]);

  function openPostcode() {
    if (!window.daum?.Postcode) {
      alert("주소 검색 기능을 불러오는 중입니다. 잠시 후 다시 눌러주세요.");
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data: any) {
        setPostcode(data.zonecode || "");
        setBaseAddress(data.roadAddress || data.jibunAddress || "");
      },
    }).open();
  }

  function handleFarmSizeChange(value: string) {
    const cleaned = String(value || "").replace(/[^0-9]/g, "");
    setFarmSize(cleaned);

    const pyeong = onlyNumber(cleaned);

    if (
      !isEvent &&
      !isHealthJoint &&
      pyeong > 0 &&
      baseAreaNumber > 0 &&
      roundsNumber > 0
    ) {
      const oneTimeQty = Math.ceil(pyeong / baseAreaNumber);
      const seasonQty = Math.max(1, Math.ceil(oneTimeQty * roundsNumber));
      setQuantity(String(seasonQty));
    }
  }

  function handleQuantityChange(value: string) {
    const cleaned = String(value || "").replace(/[^0-9]/g, "");
    const n = onlyNumber(cleaned);
    setQuantity(String(Math.max(1, n || 1)));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!phone || phone.replace(/\D/g, "").length < 10) {
      e.preventDefault();
      alert("연락처를 정확히 입력해주세요.");
      return;
    }

    if (!postcode || !baseAddress) {
      e.preventDefault();
      alert("주소 검색 버튼을 눌러 배송 주소를 입력해주세요.");
      return;
    }

    if (!detailAddress.trim()) {
      e.preventDefault();
      alert("상세주소를 입력해주세요.");
      return;
    }

    if (isHealthJoint) {
      const ok = confirm(
        `공동구매를 신청하시겠습니까?

구매수량: ${quantityNumber.toLocaleString("ko-KR")}병
총 금액: ${totalPrice.toLocaleString("ko-KR")}원

입금계좌
기업은행 486-072683-04-011
예금주: 한국농수산TV

입금 확인 후 순차 발송됩니다.`
      );

      if (!ok) e.preventDefault();
    }
  }

  return (
    <>
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />

      <form
        action="/api/expo/brand-orders/create"
        method="POST"
        className="rounded-3xl bg-white p-1"
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          const target = e.target as HTMLElement | null;
          const tag = target?.tagName?.toLowerCase();

          if (e.key === "Enter" && tag !== "textarea") {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="brand_id" value={brandId} />
        <input type="hidden" name="product_id" value={productId} />
        <input type="hidden" name="event_id" value={eventId} />
        <input type="hidden" name="order_type" value={isEvent ? "event" : "product"} />

        <input type="hidden" name="postcode" value={postcode} />
        <input type="hidden" name="base_address" value={baseAddress} />
        <input type="hidden" name="address" value={fullAddress} />

        <input type="hidden" name="quantity" value={quantityNumber} />
        <input type="hidden" name="recommended_quantity" value={calculated.seasonQty || ""} />
        <input type="hidden" name="quantity_note" value={calculated.note} />

        <input type="hidden" name="unit_price" value={unitPrice} />
        <input type="hidden" name="unit_price_krw" value={unitPrice} />
        <input type="hidden" name="total_price" value={totalPrice} />
        <input type="hidden" name="total_amount" value={totalPrice} />
        <input type="hidden" name="total_amount_krw" value={totalPrice} />
        <input type="hidden" name="payment_status" value="waiting" />
        <input type="hidden" name="order_status" value="ordered" />

        <h2 className="text-3xl font-extrabold text-stone-900">
          {isHealthJoint ? "공동구매 신청" : "신청 정보 입력"}
        </h2>

        <div className="mt-6 grid gap-4">
          <Field label="성함">
            <input name="farmer_name" required placeholder="성함" className={inputClass} />
          </Field>

          <Field label="연락처">
            <input
              name="phone"
              required
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="010-3838-3838"
              className={inputClass}
            />
          </Field>

          <Field label="배송주소">
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-[1fr_190px]">
                <input value={postcode} readOnly placeholder="우편번호" className={inputClass} />

                <button
                  type="button"
                  onClick={openPostcode}
                  className="rounded-2xl bg-stone-900 px-5 py-5 text-xl font-extrabold text-white"
                >
                  주소 검색
                </button>
              </div>

              <input value={baseAddress} readOnly placeholder="기본주소" className={inputClass} />

              <input
                name="detail_address"
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                placeholder="상세주소 입력"
                className={inputClass}
              />
            </div>
          </Field>

          {!isHealthJoint ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="재배작물">
                  <input name="crop" placeholder="예: 고추, 마늘, 딸기" className={inputClass} />
                </Field>

                <Field label="재배평수">
                  <input
                    name="farm_size"
                    inputMode="numeric"
                    value={farmSize}
                    onChange={(e) => handleFarmSizeChange(e.target.value)}
                    placeholder="예: 3000"
                    className={inputClass}
                  />
                </Field>
              </div>

              {!isEvent && baseAreaNumber > 0 && roundsNumber > 0 && farmSize ? (
                <div className="rounded-3xl bg-green-50 p-5 text-lg font-extrabold text-green-900 ring-1 ring-green-200">
                  <p>자동 추천수량: 총 {calculated.seasonQty}개</p>
                  <p className="mt-2 text-base leading-relaxed text-green-800">
                    {calculated.note}
                  </p>
                </div>
              ) : null}
            </>
          ) : null}

          <Field label={isEvent ? "신청 수량" : isHealthJoint ? "구매 수량" : "주문 수량"}>
            {isHealthJoint ? (
              <div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[1, 3, 5, 10].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuantity(String(count))}
                      className={`rounded-2xl border-2 py-6 text-2xl font-extrabold ${
                        quantityNumber === count
                          ? "border-green-700 bg-green-700 text-white"
                          : "border-stone-300 bg-white text-stone-900"
                      }`}
                    >
                      {count}병
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-lg font-extrabold text-stone-800">
                    직접 입력
                  </label>

                  <div className="grid grid-cols-[1fr_90px] gap-3 sm:grid-cols-[1fr_120px]">
                    <input
                      inputMode="numeric"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      placeholder="예: 20, 30, 50, 100"
                      className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-center text-2xl font-extrabold text-stone-900 outline-none placeholder:text-stone-400 focus:border-green-700"
                    />

                    <div className="flex items-center justify-center rounded-2xl bg-stone-100 text-xl font-extrabold text-stone-700">
                      병
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-green-50 p-5 ring-1 ring-green-200">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-lg font-extrabold text-stone-700">
                        총 구매수량
                      </p>
                      <p className="mt-1 text-3xl font-extrabold text-green-900">
                        {quantityNumber.toLocaleString("ko-KR")}병
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-extrabold text-stone-700">
                        총 결제금액
                      </p>
                      <p className="mt-1 text-3xl font-extrabold text-red-600">
                        {totalPrice.toLocaleString("ko-KR")}원
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-base font-bold text-stone-600">
                    49,900원 × {quantityNumber.toLocaleString("ko-KR")}병
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-[64px_1fr_64px] gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(String(Math.max(1, onlyNumber(quantity) - 1)))}
                  className="rounded-2xl bg-stone-200 text-3xl font-extrabold text-stone-900"
                >
                  -
                </button>

                <input
                  required
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-center text-2xl font-extrabold text-stone-900 outline-none focus:border-green-700"
                />

                <button
                  type="button"
                  onClick={() => setQuantity(String(Math.max(1, onlyNumber(quantity) + 1)))}
                  className="rounded-2xl bg-green-700 text-3xl font-extrabold text-white"
                >
                  +
                </button>
              </div>
            )}
          </Field>

          <Field label="입금자명">
            <input name="depositor_name" placeholder="실제 입금자명 입력" className={inputClass} />
          </Field>

          <Field label="요청사항">
            <textarea
              name="memo"
              rows={4}
              placeholder="입금자명이 다르거나 배송 요청사항이 있으면 적어주세요."
              className={textareaClass}
            />
          </Field>

          {isHealthJoint ? (
            <div className="rounded-3xl bg-yellow-50 p-5 ring-1 ring-yellow-200">
              <p className="text-xl font-extrabold text-stone-900">입금계좌</p>
              <p className="mt-3 text-3xl font-extrabold text-red-600">
                기업은행 486-072683-04-011
              </p>
              <p className="mt-3 text-xl font-extrabold text-stone-900">
                예금주: 한국농수산TV
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            className="mt-2 w-full rounded-3xl bg-green-700 py-6 text-2xl font-extrabold text-white"
          >
            {isEvent
              ? "신청 접수하기"
              : isHealthJoint
                ? `${totalPrice.toLocaleString("ko-KR")}원 공동구매 신청하기`
                : "주문 접수하기"}
          </button>
        </div>
      </form>
    </>
  );
}

const inputClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-900 outline-none placeholder:text-stone-400 focus:border-green-700";

const textareaClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold text-stone-900 outline-none placeholder:text-stone-400 focus:border-green-700";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-3 block text-lg font-extrabold text-stone-800">
        {label}
      </span>
      {children}
    </label>
  );
}