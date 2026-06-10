import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NewsContentPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin/kagri-writers-room"
          className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
        >
          ← K-Agri 작가실
        </Link>

        <section className="mt-6 rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-5xl font-black">📰 뉴스 콘텐츠 공장</h1>
          <p className="mt-4 text-2xl font-bold text-stone-700">
            농업뉴스를 쇼츠, 라디오, 상세페이지, 공동구매 콘텐츠로 확장하는 공간입니다.
          </p>
        </section>
      </div>
    </main>
  );
}
