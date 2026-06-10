import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SalesAutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href="/admin/sales-automation"
            className="inline-flex w-fit rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
          >
            ← 목록
          </Link>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/admin/sales-automation/${id}/builder`}
              className="rounded-2xl bg-blue-700 px-6 py-4 text-xl font-black text-white"
            >
              상세페이지 빌더
            </Link>

            <Link
              href={`/admin/sales-automation/${id}/editor`}
              className="rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white"
            >
              AI 결과 편집
            </Link>
          </div>
        </div>

        <section className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-stone-200">
          <p className="text-xl font-black text-green-700">
            AI 판매전략 대시보드
          </p>

          <h1 className="mt-3 text-5xl font-black text-black">
            이 제품, 어떻게 팔아야 하는가?
          </h1>

          <p className="mt-4 text-2xl font-black text-stone-700">
            프로젝트 ID : {id}
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-4">
            <StrategyCard
              title="추천 판매전략"
              value="농촌 시트콤형"
              desc="공감·웃음·공동구매 전환"
              bg="bg-green-100"
            />

            <StrategyCard
              title="추천 후킹"
              value="옆집은 멀쩡한디?"
              desc="비교 심리로 스크롤 정지"
              bg="bg-blue-100"
            />

            <StrategyCard
              title="공동구매 가능성"
              value="매우 높음"
              desc="마감·가격·동네심리 활용"
              bg="bg-yellow-100"
            />

            <StrategyCard
              title="재구매 예측"
              value="30일 후"
              desc="CRM 문자 자동예약 후보"
              bg="bg-red-100"
            />
          </div>

          <section className="mt-12 rounded-3xl border-4 border-black bg-stone-50 p-8">
            <h2 className="text-4xl font-black text-black">
              AI가 먼저 추천한 광고 방향
            </h2>

            <div className="mt-8 grid gap-5 lg:grid-cols-3">
              <ConceptCard
                rank="1위"
                title="옆집 비교극"
                score="97점"
                desc="농민은 내 밭보다 옆집 밭이 좋아 보일 때 바로 반응합니다."
                example="“옆집은 멀쩡한디, 우리 밭만 왜 이래?”"
              />

              <ConceptCard
                rank="2위"
                title="농촌 시트콤"
                score="94점"
                desc="박씨·영희·이장님·몽몽이 캐릭터로 웃기면서 제품을 기억시킵니다."
                example="“오늘까지여~ 뭐가? 내일부터 오른다니께!”"
              />

              <ConceptCard
                rank="3위"
                title="현장 다큐형"
                score="91점"
                desc="한국농수산TV 현장 취재 느낌으로 업체 신뢰도를 높입니다."
                example="“문제는 원인을 알아야 풀립니다.”"
              />
            </div>
          </section>

          <section className="mt-10 rounded-3xl bg-black p-8 text-white">
            <h2 className="text-4xl font-black">
              다음 실행 순서
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <StepLink
                href={`/admin/sales-automation/${id}/editor`}
                step="STEP 1"
                title="AI 전략 수정"
              />

              <StepLink
                href={`/admin/sales-automation/${id}/builder`}
                step="STEP 2"
                title="상세페이지 조립"
              />

              <StepLink
                href={`/admin/sales-automation/${id}/ads`}
                step="STEP 3"
                title="광고 컨셉 확정"
              />

              <StepLink
                href={`/admin/sales-automation/${id}/shorts`}
                step="STEP 4"
                title="쇼츠 제작"
              />

              <StepLink
                href={`/admin/sales-automation/${id}/images`}
                step="STEP 5"
                title="이미지 생성"
              />

              <StepLink
                href={`/admin/sales-automation/${id}/publish`}
                step="STEP 6"
                title="공동구매 발행"
              />
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function StrategyCard({
  title,
  value,
  desc,
  bg,
}: {
  title: string;
  value: string;
  desc: string;
  bg: string;
}) {
  return (
    <div className={`rounded-3xl ${bg} p-6 ring-1 ring-black/10`}>
      <p className="text-2xl font-black text-black">{title}</p>
      <p className="mt-5 text-4xl font-black leading-tight text-black">
        {value}
      </p>
      <p className="mt-4 text-lg font-bold leading-relaxed text-stone-800">
        {desc}
      </p>
    </div>
  );
}

function ConceptCard({
  rank,
  title,
  score,
  desc,
  example,
}: {
  rank: string;
  title: string;
  score: string;
  desc: string;
  example: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 ring-2 ring-black">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-black px-4 py-2 text-lg font-black text-white">
          {rank}
        </span>
        <span className="text-2xl font-black text-green-700">{score}</span>
      </div>

      <h3 className="mt-5 text-3xl font-black text-black">{title}</h3>

      <p className="mt-4 text-lg font-bold leading-relaxed text-stone-700">
        {desc}
      </p>

      <div className="mt-5 rounded-2xl bg-yellow-100 p-4 text-xl font-black text-black">
        {example}
      </div>
    </div>
  );
}

function StepLink({
  href,
  step,
  title,
}: {
  href: string;
  step: string;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl bg-white p-6 text-black transition hover:bg-yellow-100"
    >
      <p className="text-lg font-black text-green-700">{step}</p>
      <p className="mt-3 text-3xl font-black">{title}</p>
    </Link>
  );
}
