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
  const baseAreaNumber = onlyNumber(baseArea);
  const roundsNumber = onlyNumber(rounds);

  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [farmSize, setFarmSize] = useState("");
  const [quantity, setQuantity] = useState("1");

  const fullAddress = useMemo(() => {
    return [postcode, baseAddress, detailAddress].filter(Boolean).join(" ");
  }, [postcode, baseAddress, detailAddress]);

  const calculated = useMemo(() => {
    const pyeong = onlyNumber(farmSize);

    if (isEvent || pyeong <= 0 || baseAreaNumber <= 0 || roundsNumber <= 0) {
      return {
        pyeong,
        oneTimeQty: 0,
        seasonQty: 0,
        note: "",
      };
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
  }, [farmSize, baseAreaNumber, roundsNumber, sprayInterval, usePeriod, isEvent]);

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

    if (!isEvent && pyeong > 0 && baseAreaNumber > 0 && roundsNumber > 0) {
      const oneTimeQty = Math.ceil(pyeong / baseAreaNumber);
      const seasonQty = Math.max(1, Math.ceil(oneTimeQty * roundsNumber));
      setQuantity(String(seasonQty));
    }
  }

  function handleQuantityChange(value: string) {
    const n = onlyNumber(value);
    setQuantity(String(Math.max(1, n || 1)));
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

        <input type="hidden" name="recommended_quantity" value={calculated.seasonQty || ""} />
        <input type="hidden" name="quantity_note" value={calculated.note} />

        <h2 className="text-3xl font-extrabold text-stone-900">
          신청 정보 입력
        </h2>

        <div className="mt-6 grid gap-4">
          <Field label="성함">
            <input name="farmer_name" required className={inputClass} />
          </Field>

          <Field label="연락처">
            <input
              name="phone"
              required
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="010-0000-0000"
              className={inputClass}
            />
          </Field>

          <Field label="우편번호">
            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
              <input
                value={postcode}
                readOnly
                placeholder="주소 검색을 눌러주세요"
                className={inputClass}
              />

              <button
                type="button"
                onClick={openPostcode}
                className="rounded-2xl bg-stone-900 px-5 py-5 text-xl font-extrabold text-white"
              >
                주소 검색
              </button>
            </div>
          </Field>

          <Field label="기본주소">
            <input
              value={baseAddress}
              readOnly
              placeholder="주소 검색 후 자동 입력"
              className={inputClass}
            />
          </Field>

          <Field label="상세주소">
            <input
              name="detail_address"
              value={detailAddress}
              onChange={(e) => setDetailAddress(e.target.value)}
              placeholder="동/호수, 마을명, 상세 위치"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="재배작물">
              <input
                name="crop"
                placeholder="예: 고추, 마늘, 딸기"
                className={inputClass}
              />
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

          <Field label={isEvent ? "신청 수량" : "주문 수량"}>
            <div className="grid grid-cols-[64px_1fr_64px] gap-3">
              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, onlyNumber(quantity) - 1);
                  setQuantity(String(next));
                }}
                className="rounded-2xl bg-stone-200 text-3xl font-extrabold text-stone-900"
              >
                -
              </button>

              <input
                name="quantity"
                required
                inputMode="numeric"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                className="w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-center text-2xl font-extrabold text-stone-900 outline-none focus:border-green-700"
              />

              <button
                type="button"
                onClick={() => {
                  const next = Math.max(1, onlyNumber(quantity) + 1);
                  setQuantity(String(next));
                }}
                className="rounded-2xl bg-green-700 text-3xl font-extrabold text-white"
              >
                +
              </button>
            </div>
          </Field>

          <Field label="입금자명">
            <input
              name="depositor_name"
              placeholder="실제 입금자명 입력"
              className={inputClass}
            />
          </Field>

          <Field label="요청사항">
            <textarea
              name="memo"
              rows={4}
              placeholder="입금자명이 다르거나 배송 요청사항이 있으면 적어주세요."
              className={textareaClass}
            />
          </Field>

          <button
            type="submit"
            className="mt-2 w-full rounded-3xl bg-green-700 py-6 text-2xl font-extrabold text-white"
          >
            {isEvent ? "신청 접수하기" : "주문 접수하기"}
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