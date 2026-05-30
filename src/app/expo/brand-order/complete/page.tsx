import Link from "next/link";

export default function BrandOrderCompletePage() {
  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-10">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5">
        <div className="bg-green-700 p-8 text-white">
          <p className="text-lg font-bold">
            K-Agri Expo 주문접수 완료
          </p>

          <h1 className="mt-3 text-4xl font-extrabold">
            주문이 정상 접수되었습니다
          </h1>

          <p className="mt-4 text-xl font-bold text-green-100">
            입금 확인 후 업체 출고가 진행됩니다.
          </p>
        </div>

        <div className="p-8">
          <div className="rounded-3xl bg-yellow-50 p-6">
            <p className="text-xl font-extrabold text-stone-900">
              다음 진행 순서
            </p>

            <div className="mt-5 space-y-4 text-lg font-bold text-stone-700">
              <p>1. 업체 계좌로 입금</p>
              <p>2. K-Agri Expo 입금 확인</p>
              <p>3. 업체 출고 진행</p>
              <p>4. 송장번호 문자 발송</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <Link
              href="/order-status"
              className="flex items-center justify-center rounded-3xl bg-yellow-400 py-5 text-2xl font-extrabold text-slate-950"
            >
              내 주문 배송조회하기
            </Link>

            <Link
              href="/expo"
              className="flex items-center justify-center rounded-3xl bg-green-700 py-5 text-2xl font-extrabold text-white"
            >
              박람회 홈으로 이동
            </Link>
          </div>

          <div className="mt-8 rounded-3xl bg-slate-50 p-6">
            <p className="text-lg font-extrabold text-slate-900">
              배송조회 안내
            </p>

            <p className="mt-3 text-base font-bold leading-7 text-slate-700">
              주문 후 송장번호가 등록되면 배송조회 페이지에서
              실시간으로 배송상태를 확인할 수 있습니다.
            </p>

            <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <p className="text-sm font-black text-slate-500">
                배송조회 주소
              </p>

              <p className="mt-2 break-all text-lg font-extrabold text-green-700">
                /order-status
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}