import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VendorEventNewPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f3] p-5">
      <section className="mx-auto max-w-4xl rounded-[32px] bg-white p-6">
        <h1 className="text-3xl font-black">이벤트 새로 등록</h1>
        <p className="mt-3 text-lg font-bold text-stone-600">
          다음 단계에서 공동구매·샘플 등록 전용 폼을 붙입니다.
        </p>

        <Link
          href="/vendor/brand-hall"
          className="mt-6 block rounded-2xl bg-green-700 px-5 py-5 text-center text-xl font-black text-white"
        >
          돌아가기
        </Link>
      </section>
    </main>
  );
}