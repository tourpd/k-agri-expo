import Link from "next/link";

export const dynamic = "force-dynamic";

export default function TempPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
        >
          ← 관리자
        </Link>

        <section className="mt-6 rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-5xl font-black">준비중</h1>
          <p className="mt-4 text-2xl font-bold text-black">
            이 페이지는 아직 내용 작성 전입니다.
          </p>
        </section>
      </div>
    </main>
  );
}
