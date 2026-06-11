import Link from "next/link";

export default function KHubPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6">
      <div className="mx-auto max-w-7xl space-y-8">

        <Link
          href="/admin"
          className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
        >
          ← 관리자
        </Link>

        <section className="rounded-3xl bg-gradient-to-r from-purple-950 via-purple-700 to-green-700 p-10 text-white">
          <h1 className="text-6xl font-black">
            K-HUB
          </h1>

          <p className="mt-4 text-3xl font-bold">
            Creator • Brand • Investment • Global
          </p>

          <p className="mt-6 text-2xl">
            전세계 유망 크리에이터 발굴 → 브랜드 연결 → 투자 → 글로벌 진출
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-3">

          <MenuCard
            title="Creator Discovery"
            href="/admin/creator-center/discovery"
            desc="전세계 크리에이터 발굴"
          />

          <MenuCard
            title="Brand Matching"
            href="/admin/brand-matching"
            desc="브랜드 자동 매칭"
          />

          <MenuCard
            title="Campaign Center"
            href="/admin/campaign-center"
            desc="광고 캠페인 생성"
          />

          <MenuCard
            title="Creator Fund"
            href="/admin/creator-fund"
            desc="투자 검토"
          />

          <MenuCard
            title="Global Launch"
            href="/admin/global-launch"
            desc="글로벌 진출"
          />

          <MenuCard
            title="Revenue Share"
            href="/admin/revenue-share"
            desc="수익 공유"
          />

        </div>

      </div>
    </main>
  );
}

function MenuCard({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-white p-8 shadow-xl"
    >
      <h2 className="text-4xl font-black">{title}</h2>
      <p className="mt-4 text-xl">{desc}</p>
    </Link>
  );
}
