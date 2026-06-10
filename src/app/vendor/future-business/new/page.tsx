import Link from "next/link";

export const dynamic = "force-dynamic";

export default function VendorFutureBusinessNewPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f3] p-5">
      <section className="mx-auto max-w-4xl rounded-[32px] bg-white p-6">
        <h1 className="text-3xl font-black">미래식량·곤충 사업 등록</h1>
        <p className="mt-3 text-lg font-bold text-stone-600">
          컨테이너 사육농장, 교육, 전량수매, 치유농업, 건기식 사업 등록 화면입니다.
        </p>

        <Link
          href="/vendor/products/new"
          className="mt-6 block rounded-2xl bg-amber-600 px-5 py-5 text-center text-xl font-black text-white"
        >
          사업 등록 폼으로 이동
        </Link>
      </section>
    </main>
  );
}