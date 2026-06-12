import Link from "next/link";

export const dynamic = "force-dynamic";

export default function MyTradesPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/expo" className="inline-flex rounded-2xl bg-black px-5 py-3 font-black text-white no-underline">
          ← K-Agri Expo
        </Link>

        <section className="mt-5 rounded-3xl border bg-white p-8 shadow">
          <p className="text-sm font-black text-orange-600">K-AGRI TRADE MANAGEMENT</p>
          <h1 className="mt-2 text-4xl font-black">내 거래 관리하기</h1>
          <p className="mt-3 text-lg font-bold text-neutral-600">
            거래제안, 화상상담, 계약, 정산 진행 상태를 확인합니다.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Link href="/admin/trade-offers" className="rounded-2xl bg-orange-600 p-6 text-center text-xl font-black text-white no-underline">
              거래제안센터
            </Link>
            <Link href="/admin/buyers" className="rounded-2xl bg-blue-700 p-6 text-center text-xl font-black text-white no-underline">
              인증 바이어센터
            </Link>
            <Link href="/admin/settlements" className="rounded-2xl bg-black p-6 text-center text-xl font-black text-white no-underline">
              정산센터
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
