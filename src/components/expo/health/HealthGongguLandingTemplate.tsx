"use client";

import Script from "next/script";
import Link from "next/link";
import { useMemo, useState } from "react";

declare global {
  interface Window {
    daum?: any;
  }
}

type ProblemCard = {
  title: string;
  desc: string;
  image: string;
};

type Review = {
  name: string;
  text: string;
};

type Spec = {
  label: string;
  value: string;
};

type Props = {
  backHref: string;
  productName: string;
  brandText: string;
  headline: string;
  subHeadline: string;
  heroImage: string;
  productImage: string;
  regularPrice: number;
  salePrice: number;
  unitText: string;
  joinCount: number;
  goalCount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  benefits: string[];
  problems: ProblemCard[];
  specs: Spec[];
  reviews: Review[];
  apiUrl: string;
};

function formatPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

function onlyNumber(value: string) {
  const n = Number(String(value || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function HealthGongguLandingTemplate({
  backHref,
  productName,
  brandText,
  headline,
  subHeadline,
  heroImage,
  productImage,
  regularPrice,
  salePrice,
  unitText,
  joinCount,
  goalCount,
  bankName,
  bankAccount,
  bankHolder,
  benefits,
  problems,
  specs,
  reviews,
  apiUrl,
}: Props) {
  const [farmerName, setFarmerName] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [baseAddress, setBaseAddress] = useState("");
  const [detailAddress, setDetailAddress] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [depositorName, setDepositorName] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);

  const quantityNumber = Math.max(1, onlyNumber(quantity) || 1);
  const totalPrice = salePrice * quantityNumber;

  const fullAddress = useMemo(() => {
    return [baseAddress, detailAddress].filter(Boolean).join(" ");
  }, [baseAddress, detailAddress]);

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

  function handleQuantityChange(value: string) {
    const cleaned = value.replace(/[^0-9]/g, "");
    const n = onlyNumber(cleaned);
    setQuantity(String(Math.max(1, n || 1)));
  }

  async function submitOrder() {
    if (!farmerName.trim()) return alert("성함을 입력해주세요.");
    if (phone.replace(/\D/g, "").length < 10) return alert("전화번호를 정확히 입력해주세요.");
    if (!postcode || !baseAddress) return alert("주소 검색 버튼을 눌러 배송주소를 입력해주세요.");
    if (!detailAddress.trim()) return alert("상세주소를 입력해주세요.");

    const ok = confirm(
      `공동구매를 신청하시겠습니까?

상품: ${productName}
수량: ${quantityNumber.toLocaleString("ko-KR")}병
총 금액: ${totalPrice.toLocaleString("ko-KR")}원

입금계좌
${bankName} ${bankAccount}
예금주: ${bankHolder}`
    );

    if (!ok) return;

    try {
      setLoading(true);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_name: productName,
          farmer_name: farmerName,
          phone,
          postcode,
          base_address: baseAddress,
          detail_address: detailAddress,
          address: fullAddress,
          quantity: quantityNumber,
          unit_price: salePrice,
          total_price: totalPrice,
          depositor_name: depositorName,
          memo,
          payment_status: "waiting",
          order_status: "ordered",
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "주문 실패");

      alert("공동구매 신청이 완료되었습니다.\n입금 확인 후 순차 발송됩니다.");

      setFarmerName("");
      setPhone("");
      setPostcode("");
      setBaseAddress("");
      setDetailAddress("");
      setQuantity("1");
      setDepositorName("");
      setMemo("");
    } catch (error) {
      console.error(error);
      alert("신청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7f2] text-black">
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />

      <div className="mx-auto max-w-5xl p-5">
        <Link href={backHref} className="font-black text-green-700">
          ← K-Agri Expo
        </Link>

        <section className="mt-6 overflow-hidden rounded-[32px] bg-white shadow-xl">
          <img src={heroImage} alt={productName} className="w-full" />
        </section>

        <section className="mt-6 rounded-[32px] bg-white p-6 shadow-lg">
          <p className="text-lg font-black text-green-700">{brandText}</p>

          <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
            {headline}
          </h1>

          <p className="mt-4 text-xl font-bold leading-relaxed text-stone-700">
            {subHeadline}
          </p>

          <div className="mt-6 rounded-3xl border-2 border-red-200 bg-yellow-50 p-6">
            <p className="text-xl font-black text-stone-500 line-through">
              정가 {regularPrice.toLocaleString("ko-KR")}원
            </p>

            <p className="mt-2 text-5xl font-black text-red-600">
              {salePrice.toLocaleString("ko-KR")}원
            </p>

            <p className="mt-3 text-xl font-black">{unitText}</p>

            <p className="mt-2 text-lg font-black text-red-600">
              현재 {joinCount}명 참여 · {goalCount}명 달성 시 추가 혜택
            </p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {benefits.map((item) => (
            <div key={item} className="rounded-3xl bg-white p-5 shadow-lg">
              <div className="text-4xl">✅</div>
              <p className="mt-3 text-xl font-black leading-snug">{item}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-[32px] bg-white p-6 shadow-lg">
          <h2 className="text-3xl font-black">농민에게 왜 필요할까요?</h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {problems.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-3xl bg-stone-50 ring-1 ring-black/5"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-56 w-full object-cover"
                />

                <div className="p-5">
                  <h3 className="text-2xl font-black">{item.title}</h3>
                  <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
                    {item.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[32px] bg-white shadow-lg">
          <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
            <div className="flex items-center justify-center bg-stone-50 p-6">
              <img
                src={productImage}
                alt={productName}
                className="max-h-[520px] w-full object-contain"
              />
            </div>

            <div className="p-6">
              <h2 className="text-3xl font-black">제품 핵심 정보</h2>

              <div className="mt-5 grid gap-4">
                {specs.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-stone-50 p-4 text-lg font-black ring-1 ring-black/5"
                  >
                    <span className="text-stone-500">{item.label}: </span>
                    <span>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] bg-[#fff7e6] p-6 shadow-lg">
          <p className="font-black text-green-700">POINT</p>
          <h2 className="mt-2 text-3xl font-black">
            농민 건강 공동구매, 이렇게 준비했습니다
          </h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <PointCard title="농민 대상" desc="농사일이 많은 분들을 위한 건강관리 공동구매" />
            <PointCard title="가격 혜택" desc="정가 대비 낮춘 공동구매 특가" />
            <PointCard title="간편 신청" desc="주소 검색 후 수량만 선택하면 신청 완료" />
          </div>
        </section>

        <section className="mt-6 rounded-[32px] bg-white p-6 shadow-lg">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-black text-green-700">REVIEW</p>
              <h2 className="mt-2 text-3xl font-black">농민 후기</h2>
            </div>

            <div className="rounded-full bg-green-50 px-4 py-2 font-black text-green-800">
              후기 {reviews.length}개
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {reviews.map((review) => (
              <div
                key={review.name}
                className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5"
              >
                <div className="text-2xl text-yellow-500">★★★★★</div>
                <p className="mt-3 text-lg font-black leading-relaxed">
                  “{review.text}”
                </p>
                <p className="mt-4 font-black text-green-700">{review.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[32px] bg-white p-6 shadow-lg">
          <h2 className="text-3xl font-black">공동구매 신청</h2>

          <div className="mt-5 space-y-4">
            <input
              value={farmerName}
              onChange={(e) => setFarmerName(e.target.value)}
              className={inputClass}
              placeholder="성함"
            />

            <input
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              className={inputClass}
              placeholder="010-3838-3838"
              inputMode="numeric"
            />

            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                <input value={postcode} readOnly className={inputClass} placeholder="우편번호" />

                <button
                  type="button"
                  onClick={openPostcode}
                  className="rounded-2xl bg-stone-900 px-5 py-5 text-xl font-black text-white"
                >
                  주소 검색
                </button>
              </div>

              <input value={baseAddress} readOnly className={inputClass} placeholder="기본주소" />

              <input
                value={detailAddress}
                onChange={(e) => setDetailAddress(e.target.value)}
                className={inputClass}
                placeholder="상세주소 입력"
              />
            </div>

            <div>
              <label className="mb-3 block text-2xl font-black">구매 수량</label>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[1, 3, 5, 10].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuantity(String(count))}
                    className={`rounded-2xl border-2 py-5 text-2xl font-black ${
                      quantityNumber === count
                        ? "border-green-700 bg-green-700 text-white"
                        : "border-gray-300 bg-white text-black"
                    }`}
                  >
                    {count}병
                  </button>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-[1fr_80px] gap-3">
                <input
                  value={quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className={`${inputClass} text-center`}
                  placeholder="직접 입력 예: 20"
                  inputMode="numeric"
                />

                <div className="flex items-center justify-center rounded-2xl bg-stone-100 text-xl font-black">
                  병
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-green-50 p-5 ring-1 ring-green-200">
                <p className="text-2xl font-black text-green-900">
                  {quantityNumber.toLocaleString("ko-KR")}병
                </p>
                <p className="mt-2 text-3xl font-black text-red-600">
                  총 {totalPrice.toLocaleString("ko-KR")}원
                </p>
                <p className="mt-2 font-bold text-stone-600">
                  {salePrice.toLocaleString("ko-KR")}원 × {quantityNumber.toLocaleString("ko-KR")}병
                </p>
              </div>
            </div>

            <input
              value={depositorName}
              onChange={(e) => setDepositorName(e.target.value)}
              className={inputClass}
              placeholder="입금자명"
            />

            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className={textareaClass}
              placeholder="배송 요청사항 또는 입금자명이 다르면 적어주세요."
              rows={4}
            />

            <div className="rounded-2xl bg-yellow-50 p-5 ring-1 ring-yellow-200">
              <p className="text-xl font-black">입금계좌</p>
              <p className="mt-2 text-3xl font-black text-red-600">
                {bankName} {bankAccount}
              </p>
              <p className="mt-2 text-lg font-bold">예금주: {bankHolder}</p>
            </div>

            <button
              onClick={submitOrder}
              disabled={loading}
              className="w-full rounded-3xl bg-green-700 py-6 text-2xl font-black text-white disabled:bg-gray-400"
            >
              {loading
                ? "신청 처리중..."
                : `${totalPrice.toLocaleString("ko-KR")}원 공동구매 신청하기`}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold outline-none placeholder:text-stone-400 focus:border-green-700";

const textareaClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-5 py-5 text-xl font-bold outline-none placeholder:text-stone-400 focus:border-green-700";

function PointCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-yellow-100">
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">
        {desc}
      </p>
    </div>
  );
}