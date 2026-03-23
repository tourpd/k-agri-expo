"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const BANK_INFO = {
  bankName: "기업은행",
  accountNumber: "123-456789-01-012",
  accountHolder: "한국농수산TV",
  contactPhone: "010-0000-0000",
  contactEmail: "kaftv@example.com",
};

export default function VendorApplyCompletePage() {
  const params = useSearchParams();

  const orderId = params.get("order_id") || "-";
  const companyName = params.get("company_name") || "-";
  const productName = params.get("product_name") || "-";
  const amountKrw = Number(params.get("amount_krw") || "0");
  const phone = params.get("phone") || "";

  const copyAccountText = `${BANK_INFO.bankName} ${BANK_INFO.accountNumber} / 예금주 ${BANK_INFO.accountHolder}`;
  const copyOrderText = `주문번호 ${orderId} / 회사명 ${companyName} / 상품 ${productName} / 금액 ${amountKrw.toLocaleString()}원`;

  const orderStatusHref =
    phone.trim().length > 0
      ? `/vendor/order-status?order_id=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone)}`
      : "/vendor/order-status";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-3xl bg-emerald-700 p-8 text-white shadow-2xl">
          <div className="text-sm font-black text-emerald-100">
            APPLICATION COMPLETE
          </div>
          <h1 className="mt-3 text-4xl font-black">
            입점 신청이 접수되었습니다
          </h1>
          <p className="mt-4 text-base leading-8 text-emerald-50">
            아래 안내에 따라 입금해 주시면 관리자가 확인 후 부스 진행을 시작합니다.
            주문번호와 연락처는 꼭 저장해 주세요.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">ORDER INFO</div>
          <h2 className="mt-2 text-2xl font-black">신청 내역</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">주문번호</div>
              <div className="mt-1 text-xl font-black">{orderId}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">회사명</div>
              <div className="mt-1 text-xl font-black">{companyName}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">신청 상품</div>
              <div className="mt-1 text-xl font-black">{productName}</div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-sm font-bold text-slate-500">입금 금액</div>
              <div className="mt-1 text-2xl font-black text-emerald-700">
                {amountKrw.toLocaleString()}원
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-8 text-slate-700">
            <div>
              <b>주문번호 보관:</b> 나중에 신청 상태 확인할 때 필요합니다.
            </div>
            <div>
              <b>회사명/연락처 유지:</b> 신청 시 입력한 연락처 기준으로 조회합니다.
            </div>
            <div>
              <b>입금 전 확인:</b> 선택 상품과 금액이 맞는지 다시 확인해 주세요.
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(copyOrderText);
                  alert("주문 정보가 복사되었습니다.");
                } catch {
                  alert("복사에 실패했습니다.");
                }
              }}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900"
            >
              주문정보 복사
            </button>

            <Link
              href={orderStatusHref}
              className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
            >
              신청 상태 확인
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-lg">
          <div className="text-sm font-black text-amber-700">
            BANK TRANSFER GUIDE
          </div>
          <h2 className="mt-2 text-2xl font-black">입금 안내</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-4">
              <div className="text-sm font-bold text-slate-500">은행명</div>
              <div className="mt-1 text-xl font-black">{BANK_INFO.bankName}</div>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <div className="text-sm font-bold text-slate-500">계좌번호</div>
              <div className="mt-1 text-xl font-black">
                {BANK_INFO.accountNumber}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <div className="text-sm font-bold text-slate-500">예금주</div>
              <div className="mt-1 text-xl font-black">
                {BANK_INFO.accountHolder}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <div className="text-sm font-bold text-slate-500">입금 금액</div>
              <div className="mt-1 text-2xl font-black text-emerald-700">
                {amountKrw.toLocaleString()}원
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-white p-5 text-sm leading-8 text-slate-700">
            <div>
              <b>입금자명:</b> 회사명 또는 담당자명으로 맞춰 주세요.
            </div>
            <div>
              <b>입금 기한:</b> 신청 후 가능한 빠르게 입금해 주세요.
            </div>
            <div>
              <b>확인 방법:</b> 관리자가 입금 확인 후 주문 상태를 승인 처리합니다.
            </div>
            <div>
              <b>주의:</b> 다른 이름으로 입금하면 확인이 지연될 수 있습니다.
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(copyAccountText);
                  alert("계좌 정보가 복사되었습니다.");
                } catch {
                  alert("복사에 실패했습니다.");
                }
              }}
              className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
            >
              계좌정보 복사
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">NEXT STEP</div>
          <h2 className="mt-2 text-2xl font-black">다음 진행 절차</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-black text-emerald-700">01</div>
              <div className="mt-2 text-lg font-black">입금 진행</div>
              <div className="mt-2 text-sm leading-7 text-slate-600">
                위 계좌로 정확한 금액을 입금해 주세요.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-black text-emerald-700">02</div>
              <div className="mt-2 text-lg font-black">관리자 확인</div>
              <div className="mt-2 text-sm leading-7 text-slate-600">
                관리자가 입금 확인 후 주문을 승인합니다.
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="text-sm font-black text-emerald-700">03</div>
              <div className="mt-2 text-lg font-black">부스 생성/오픈</div>
              <div className="mt-2 text-sm leading-7 text-slate-600">
                승인 완료 후 부스가 자동 생성되거나 연결됩니다.
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">SUPPORT</div>
          <h2 className="mt-2 text-2xl font-black">문의 안내</h2>

          <div className="mt-4 space-y-2 text-base leading-8 text-slate-700">
            <div>
              <b>문의 전화:</b> {BANK_INFO.contactPhone}
            </div>
            <div>
              <b>문의 이메일:</b> {BANK_INFO.contactEmail}
            </div>
            <div>
              입금 후 반영이 늦거나 신청 내용 수정이 필요하면 위 연락처로 문의해 주세요.
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/vendor/apply"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900"
            >
              다른 상품 다시 신청
            </Link>

            <Link
              href="/vendor/order-status"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900"
            >
              신청 상태 확인 페이지
            </Link>

            <Link
              href="/expo"
              className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
            >
              엑스포 메인으로
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}