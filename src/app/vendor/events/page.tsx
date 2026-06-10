import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VendorEventsPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f3] p-5">
      <section className="mx-auto max-w-4xl rounded-[32px] bg-white p-6">
        <h1 className="text-3xl font-black">공동구매·샘플·이벤트 관리</h1>

        <div className="mt-6 grid gap-3">
          <Link
            href="/vendor/events/new"
            className="rounded-2xl bg-yellow-300 px-5 py-5 text-center text-xl font-black text-stone-950"
          >
            이벤트 새로 등록
          </Link>

          <Link
            href="/vendor/brand-hall"
            className="rounded-2xl bg-stone-900 px-5 py-5 text-center text-xl font-black text-white"
          >
            브랜드관 관리로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}