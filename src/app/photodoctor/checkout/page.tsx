"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function formatPhoneInput(value: string) {
  const d = value.replace(/\D/g, "");
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

function money(v: number) {
  return `${Number(v || 0).toLocaleString()}원`;
}

function PhotoDoctorCheckoutPageInner() {
  const params = useSearchParams();

  const product = params.get("product") || "";
  const volume = params.get("volume") || "500ml";
  const crop = params.get("crop") || "";
  const issue = params.get("issue") || "";
  const diagnosisId = params.get("diagnosis_id") || "";
  const areaText = params.get("area_text") || "";
  const source = params.get("source") || "photodoctor";
  const video = params.get("video") || "";

  const quantity = Number(params.get("quantity") || 1);
  const unitPrice = Number(params.get("unit_price_krw") || 0);
  const shippingFee = Number(params.get("shipping_fee_krw") || 3000);
  const imageUrl =
    params.get("image_url") || "/products/product-placeholder.png";

  const productAmount = unitPrice * quantity;
  const totalAmount = productAmount + shippingFee;

  const [farmerName, setFarmerName] = useState("");
  const [farmerPhone, setFarmerPhone] = useState("");

  const [zipcode, setZipcode] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [emailId, setEmailId] = useState("");
  const [emailDomain, setEmailDomain] = useState("");
  const [memo, setMemo] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [depositBank, setDepositBank] = useState(
    "기업 466-072683-04-011 한국농수산TV"
  );
  const [depositName, setDepositName] = useState("");

  const [loading, setLoading] = useState(false);
  const [doneOrderCode, setDoneOrderCode] = useState("");
  const [error, setError] = useState("");

  const email = useMemo(() => {
    if (!emailId.trim()) return "";
    if (!emailDomain.trim()) return "";
    return `${emailId.trim()}@${emailDomain.trim()}`;
  }, [emailId, emailDomain]);

  async function submitOrder() {
    setError("");
    setDoneOrderCode("");

    if (!farmerName.trim()) {
      setError("이름을 입력해주세요.");
      return;
    }

    if (farmerPhone.replace(/\D/g, "").length < 10) {
      setError("휴대전화를 정확히 입력해주세요.");
      return;
    }

    if (!address1.trim()) {
      setError("주소를 입력해주세요.");
      return;
    }

    if (paymentMethod === "bank_transfer" && depositName.trim().length < 2) {
      setError("입금자명을 2자 이상 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/photodoctor/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          farmer_name: farmerName.trim(),
          farmer_phone: farmerPhone.trim(),

          receiver_name: farmerName.trim(),
          receiver_phone: farmerPhone.trim(),

          zipcode: zipcode.trim(),
          address1: address1.trim(),
          address2: address2.trim(),
          email,

          product_name: product,
          crop_name: crop,
          issue_type: issue,
          area_text: areaText,
          diagnosis_id: diagnosisId,

          quantity,
          unit_price_krw: unitPrice,
          shipping_fee_krw: shippingFee,
          total_amount_krw: totalAmount,

          payment_method: paymentMethod,
          deposit_bank: depositBank,
          deposit_name: depositName.trim(),

          source_type: source,
          source,
          video,

          memo:
            memo.trim() ||
            [
              "포토닥터 구매페이지 주문",
              source ? `유입: ${source}` : "",
              video ? `영상: ${video}` : "",
              diagnosisId ? `진단ID: ${diagnosisId}` : "",
            ]
              .filter(Boolean)
              .join("\n"),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "주문 저장 실패");
      }

      setDoneOrderCode(json.order?.order_code || "주문 접수 완료");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "주문 저장 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-3 py-6">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white">
        <header className="border-b bg-white px-5 py-4 text-center">
          <h1 className="text-xl font-black">한국농수산TV</h1>
        </header>

        <div className="bg-black px-5 py-4 text-center text-xl font-black text-white">
          주문/결제
        </div>

        <section className="border-b p-5">
          <h2 className="mb-4 text-xl font-black">배송 정보</h2>

          <div className="space-y-3">
            <input
              value={farmerName}
              onChange={(e) => {
                setFarmerName(e.target.value);
                if (!depositName) setDepositName(e.target.value);
              }}
              placeholder="이름"
              className="w-full border px-4 py-3 font-bold"
            />

            <input
              value={farmerPhone}
              onChange={(e) => setFarmerPhone(formatPhoneInput(e.target.value))}
              placeholder="휴대전화 예: 010-1234-5678"
              className="w-full border px-4 py-3 font-bold"
            />

            <div className="grid grid-cols-[1fr_120px] gap-2">
              <input
                value={zipcode}
                onChange={(e) => setZipcode(e.target.value)}
                placeholder="우편번호"
                className="w-full border px-4 py-3 font-bold"
              />
              <button
                type="button"
                className="border bg-neutral-100 px-4 py-3 font-black"
                onClick={() =>
                  alert(
                    "주소검색 API는 다음 단계에서 붙입니다. 지금은 직접 입력하세요."
                  )
                }
              >
                주소검색
              </button>
            </div>

            <input
              value={address1}
              onChange={(e) => setAddress1(e.target.value)}
              placeholder="기본주소"
              className="w-full border px-4 py-3 font-bold"
            />

            <input
              value={address2}
              onChange={(e) => setAddress2(e.target.value)}
              placeholder="상세주소"
              className="w-full border px-4 py-3 font-bold"
            />

            <div className="grid grid-cols-[1fr_24px_1fr] items-center gap-2">
              <input
                value={emailId}
                onChange={(e) => setEmailId(e.target.value)}
                placeholder="이메일"
                className="w-full border px-4 py-3 font-bold"
              />
              <div className="text-center font-bold">@</div>
              <input
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
                placeholder="직접입력"
                className="w-full border px-4 py-3 font-bold"
              />
            </div>

            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="배송 요청사항"
              rows={3}
              className="w-full border px-4 py-3 font-bold"
            />
          </div>
        </section>

        <section className="border-b p-5">
          <h2 className="mb-4 text-xl font-black">주문상품</h2>

          <div className="flex gap-4">
            <img
              src={imageUrl}
              alt={product}
              className="h-24 w-24 rounded border object-contain"
            />

            <div className="flex-1">
              <div className="text-lg font-black">{product}</div>
              <div className="mt-1 text-sm font-bold text-neutral-600">
                {volume} / 수량 {quantity}개
              </div>
              <div className="mt-2 text-lg font-black">
                {money(productAmount)}
              </div>
              <div className="mt-1 text-sm font-bold text-neutral-500">
                작물: {crop || "-"} / 진단: {issue || "-"} / 면적:{" "}
                {areaText || "-"}
              </div>
              <div className="mt-1 text-xs font-bold text-neutral-400">
                유입: {source || "-"} {video ? `/ 영상: ${video}` : ""}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b p-5">
          <h2 className="mb-4 text-xl font-black">결제정보</h2>

          <div className="space-y-3 text-lg font-bold">
            <div className="flex justify-between">
              <span>주문상품</span>
              <span>{money(productAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>배송비</span>
              <span>+{money(shippingFee)}</span>
            </div>
            <div className="flex justify-between border-t pt-4 text-2xl font-black">
              <span>최종 결제 금액</span>
              <span>{money(totalAmount)}</span>
            </div>
          </div>
        </section>

        <section className="border-b p-5">
          <h2 className="mb-4 text-xl font-black">결제수단</h2>

          <div className="space-y-2">
            {[
              ["bank_transfer", "무통장입금"],
              ["card", "신용카드"],
              ["virtual_account", "가상계좌"],
              ["account_transfer", "계좌이체"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentMethod(value)}
                className={`w-full border px-4 py-4 text-left font-black ${
                  paymentMethod === value
                    ? "border-blue-600 text-blue-700"
                    : "border-neutral-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {paymentMethod === "bank_transfer" && (
            <div className="mt-4 space-y-3 rounded bg-neutral-50 p-4">
              <select
                value={depositBank}
                onChange={(e) => setDepositBank(e.target.value)}
                className="w-full border px-4 py-3 font-bold"
              >
                <option value="기업 466-072683-04-011 한국농수산TV">
                  기업 466-072683-04-011 한국농수산TV
                </option>
              </select>

              <input
                value={depositName}
                onChange={(e) => setDepositName(e.target.value)}
                placeholder="입금자명"
                className="w-full border px-4 py-3 font-bold"
              />
            </div>
          )}

          {paymentMethod !== "bank_transfer" && (
            <div className="mt-4 rounded bg-amber-50 p-4 text-sm font-bold text-amber-800">
              카드/가상계좌/계좌이체 PG 연동은 다음 단계에서 붙입니다.
              지금은 주문 데이터 저장까지 진행됩니다.
            </div>
          )}
        </section>

        <section className="p-5">
          {error && (
            <div className="mb-4 rounded border border-red-200 bg-red-50 p-4 font-black text-red-600">
              {error}
            </div>
          )}

          {doneOrderCode && (
            <div className="mb-4 rounded border border-green-300 bg-green-50 p-5 text-center">
              <div className="text-2xl font-black text-green-700">
                ✅ 주문이 접수되었습니다
              </div>
              <div className="mt-2 font-bold">주문번호: {doneOrderCode}</div>
              {paymentMethod === "bank_transfer" && (
                <div className="mt-2 text-sm font-bold text-neutral-700">
                  입금계좌: {depositBank}
                  <br />
                  입금자명: {depositName}
                </div>
              )}
              <div className="mt-3 text-sm font-bold text-neutral-600">
                관리자 주문관리 화면에서 바로 확인할 수 있습니다.
              </div>
            </div>
          )}

          <div className="mb-4 rounded bg-neutral-50 p-4 text-center text-sm font-bold">
            주문 내용을 확인하였으며 결제 진행에 동의합니다.
          </div>

          <button
            type="button"
            onClick={submitOrder}
            disabled={loading || Boolean(doneOrderCode)}
            className="w-full bg-black px-5 py-5 text-xl font-black text-white disabled:opacity-50"
          >
            {doneOrderCode
              ? "주문 완료"
              : loading
                ? "처리 중..."
                : `${money(totalAmount)} 결제하기`}
          </button>
        </section>
      </div>
    </main>
  );
}

export default function PhotoDoctorCheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-neutral-100 px-3 py-6">
          <div className="mx-auto max-w-4xl rounded-3xl border bg-white p-6 text-center text-xl font-black">
            주문/결제 페이지를 불러오는 중입니다...
          </div>
        </main>
      }
    >
      <PhotoDoctorCheckoutPageInner />
    </Suspense>
  );
}