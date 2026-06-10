import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6 text-black">
      <div className="mx-auto max-w-7xl">

        <Link
          href={`/admin/sales-automation/${id}`}
          className="rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
        >
          ← 대시보드
        </Link>

        <section className="mt-6 rounded-3xl bg-white p-8 shadow-xl">

          <h1 className="text-5xl font-black">
            AI 성장전략 보고서
          </h1>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">

            <ReportBox
              title="현재 상황"
              content="제품군은 다양하지만 대표 브랜드 집중도가 낮습니다."
            />

            <ReportBox
              title="핵심 문제"
              content="제품 설명 중심이며 문제 해결형 콘텐츠 구조가 부족합니다."
            />

            <ReportBox
              title="성장 기회"
              content="유튜브, 공동구매, CRM, 작물별 솔루션 페이지 확장 가능."
            />

            <ReportBox
              title="실행 전략"
              content="독수리5형제 브랜드 집중 + 작물별 콘텐츠 + 공동구매 구조."
            />

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-4">

            <RoadmapCard
              month="1개월"
              text="대표 상품 선정"
              bg="bg-white"
            />

            <RoadmapCard
              month="3개월"
              text="콘텐츠 구축"
              bg="bg-white"
            />

            <RoadmapCard
              month="6개월"
              text="공동구매 확대"
              bg="bg-white"
            />

            <RoadmapCard
              month="12개월"
              text="AI 플랫폼 전환"
              bg="bg-white"
            />

          </div>

        </section>
      </div>
    </main>
  );
}

function ReportBox({
  title,
  content,
}: {
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-3xl bg-stone-100 p-6">
      <h2 className="text-3xl font-black text-black">
        {title}
      </h2>

      <p className="mt-4 text-xl font-bold text-black leading-relaxed">
        {content}
      </p>
    </div>
  );
}

function RoadmapCard({
  month,
  text,
  bg,
}: {
  month: string;
  text: string;
  bg: string;
}) {
  return (
    <div className={`rounded-3xl ${bg} p-6`}>
      <p className="text-3xl font-black text-black">
        {month}
      </p>

      <p className="mt-4 text-xl font-bold text-black">
        {text}
      </p>
    </div>
  );
}
