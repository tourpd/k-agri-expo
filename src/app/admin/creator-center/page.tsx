import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CreatorCenterPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6 text-black">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href="/admin/sales-automation"
          className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
        >
          ← AI 판매자동화센터
        </Link>

        <section className="rounded-3xl bg-gradient-to-r from-purple-950 via-purple-800 to-green-700 p-8 text-white shadow-xl">
          <p className="text-lg font-black text-purple-100">K-HUB AI Creator Center</p>
          <h1 className="mt-3 text-5xl font-black">AI 크리에이터센터</h1>
          <p className="mt-4 text-2xl font-bold text-purple-50">
            인스타·유튜브 크리에이터를 분석하고 광고단가, 포트폴리오, 브랜드 매칭을 자동화합니다.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <Link href="/admin/creator-center/discovery" className="rounded-3xl bg-purple-700 p-6 text-2xl font-black text-white shadow-xl">
            전 세계 크리에이터 발굴센터 →
          </Link>
          <Link href="/admin/brand-matching" className="rounded-3xl bg-green-700 p-6 text-2xl font-black text-white shadow-xl">
            브랜드 매칭센터 →
          </Link>
          <Link href="/admin/sales-automation/1/hub" className="rounded-3xl bg-black p-6 text-2xl font-black text-white shadow-xl">
            판매 확장 허브 →
          </Link>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <p className="text-lg font-black text-purple-700">AI 크리에이터 프로필</p>
          <h2 className="mt-2 text-5xl font-black">48kcal</h2>
          <p className="mt-2 text-2xl font-bold text-stone-600">@48kcal</p>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Stat title="팔로워" value="20,900" />
            <Stat title="게시물" value="124개" />
            <Stat title="최고 조회수" value="2.6M" />
            <Stat title="광고 적합도" value="94점" />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-black">광고 단가 추천</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Stat title="릴스 1건" value="30만원" />
            <Stat title="스토리 1건" value="10만원" />
            <Stat title="패키지" value="50만원" />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-black">브랜드 매칭</h2>
          <div className="mt-6 rounded-3xl border-2 border-black p-6">
            <p className="text-xl font-black text-green-700">한미양행 · 건강식품</p>
            <h3 className="mt-2 text-3xl font-black">@48kcal 적합도 94점</h3>
            <p className="mt-3 text-xl font-bold">
              다이어트·뷰티·라이프스타일 콘텐츠와 건강식품 캠페인 적합도가 높습니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-stone-100 p-6">
      <p className="text-lg font-black text-stone-500">{title}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
    </div>
  );
}
