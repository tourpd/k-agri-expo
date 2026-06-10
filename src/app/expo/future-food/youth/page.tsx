import Link from "next/link";

export const dynamic = "force-dynamic";

export default function YouthPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/expo/future-food"
          className="font-black text-green-700"
        >
          ← 미래식량관
        </Link>

        <section className="mt-8">
          <img
            src="/images/youth-project-main.png"
            alt="KFFR 청년농 프로젝트"
            className="w-full rounded-3xl border shadow-2xl"
          />
        </section>
      </div>
    </main>
  );
}