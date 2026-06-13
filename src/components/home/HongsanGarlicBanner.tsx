import Link from "next/link";

export default function HongsanGarlicBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-6">
      <div className="overflow-hidden rounded-3xl border bg-white shadow-xl">

        <img
          src="/images/hongsan-garlic-main.png"
          alt="홍산마늘 긴급특가"
          className="w-full"
        />

        <div className="flex gap-3 p-4">
          <a
            href="tel:01085561010"
            className="flex-1 rounded-2xl bg-red-600 py-4 text-center text-xl font-black text-white"
          >
            📞 이성준 회장 상담하기
          </a>

          <Link
            href="/hongsan-garlic"
            className="flex-1 rounded-2xl bg-green-700 py-4 text-center text-xl font-black text-white"
          >
            상세보기 →
          </Link>
        </div>

      </div>
    </section>
  );
}
