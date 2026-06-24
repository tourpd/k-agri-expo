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
              href={`/admin/sales-automation/${id}/analysis`}
              className="rounded-2xl bg-orange-600 px-6 py-4 text-xl font-black text-white"
            >
              자료 분석실
            </Link>

            <Link
              href={`/admin/sales-automation/${id}/meeting`}
              className="rounded-2xl bg-purple-700 px-6 py-4 text-xl font-black text-white"
            >
              AI 전략회의실
            </Link>

            <Link
              href={`/admin/sales-automation/${id}/report`}
              className="rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white"
            >
              성장전략 보고서
            </Link>
          </div>
        </div>

        <section className="rounded-3xl bg-gradient-to-r from-green-950 via-green-800 to-green-600 p-8 text-white shadow-xl">
          <p className="text-xl font-black text-white">
            K-Agri Expo AI Growth Strategy
          </p>

          <h1 className="mt-3 text-5xl font-black leading-tight">
            대한민국 농업기업 AI 성장전략 대시보드
          </h1>

          <p className="mt-4 text-2xl font-bold leading-relaxed text-white">
            홈페이지를 만드는 것이 아니라, 회사 자료를 분석하고 성장전략·콘텐츠·광고·공동구매·CRM까지 연결하는 실행 프로젝트입니다.
          </p>

          <p className="mt-5 rounded-2xl bg-white/15 p-4 text-2xl font-black text-white">
            프로젝트 ID : {id}
          </p>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <StrategyCard
            title="현재 방향"
            value="AI 성장전략"
            desc="단순 판매페이지가 아니라 기업 성장 프로젝트"
            bg="bg-white"
          />

          <StrategyCard
            title="핵심 진단"
            value="자산 연결"
            desc="홈페이지·PDF·영상·제품·고객 데이터를 연결"
            bg="bg-white"
          />

          <StrategyCard
            title="실행 축"
            value="콘텐츠+공동구매"
            desc="쇼츠·상세페이지·광고·주문상담으로 전환"
            bg="bg-white"
          />

          <StrategyCard
            title="실행 목표"
            value="AI 성장 파트너"
            desc="진단·전략·제작·발행을 연결"
            bg="bg-white"
          />
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl ring-1 ring-stone-200">
          <h2 className="text-4xl font-black">
            오늘 보여줄 핵심 흐름
          </h2>

          <p className="mt-3 text-2xl font-bold text-black">
            대표에게 바로 결과를 보여주는 것이 아니라, 자료를 읽고 전략을 만드는 과정을 보여줍니다.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <FlowCard
              no="01"
              title="자료 분석실"
              desc="회사소개서, 제품 PDF, 홈페이지, 유튜브를 읽고 제품군과 콘텐츠 자산을 추출합니다."
              href={`/admin/sales-automation/${id}/analysis`}
              button="자료 분석실 열기"
            />

            <FlowCard
              no="02"
              title="AI 전략회의실"
              desc="기업분석, 고객심리, 콘텐츠, 공동구매, 성장전략 관점에서 토론합니다."
              href={`/admin/sales-automation/${id}/meeting`}
              button="전략회의실 열기"
            />

            <FlowCard
              no="03"
              title="성장전략 보고서"
              desc="1개월·3개월·6개월·12개월 실행 로드맵과 계약 제안 구조를 만듭니다."
              href={`/admin/sales-automation/${id}/report`}
              button="보고서 보기"
            />
          </div>
        </section>

        <section className="mt-8 rounded-3xl border-4 border-black bg-stone-50 p-8">
          <h2 className="text-4xl font-black text-black">
            도프 페이지를 바꾸는 핵심 방향
          </h2>

          <p className="mt-3 text-2xl font-bold text-black">
            제품 나열형 홈페이지에서 고객 문제 해결형 AI 작물솔루션 플랫폼으로 전환합니다.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            <ConceptCard
              rank="1단계"
              title="고객 고민센터"
              score="우선"
              desc="고객은 제품명을 찾지 않고 문제를 찾습니다. 총채벌레, 탄저병, 칼슘결핍, 일소피해 중심으로 진입시킵니다."
              example="“무슨 문제로 오셨습니까?”"
            />

            <ConceptCard
              rank="2단계"
              title="성공사례 연결"
              score="중요"
              desc="고추, 마늘, 딸기, 감귤, 생강 등 작물별 성공사례와 한국농수산TV 영상을 연결합니다."
              example="“비슷한 농가 사례를 먼저 보여줍니다.”"
            />

            <ConceptCard
              rank="3단계"
              title="제품·상담·공동구매"
              score="전환"
              desc="문제 해결 콘텐츠를 본 뒤 관련 제품, 상담, 공동구매로 자연스럽게 이동시킵니다."
              example="“제품은 마지막에 등장해야 합니다.”"
            />
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-black p-8 text-white">
          <h2 className="text-4xl font-black">
            다음 실행 순서
          </h2>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StepLink
              href={`/admin/sales-automation/${id}/analysis`}
              step="STEP 1"
              title="자료 분석실"
            />

            <StepLink
              href={`/admin/sales-automation/${id}/meeting`}
              step="STEP 2"
              title="AI 전략회의실"
            />

            <StepLink
              href={`/admin/sales-automation/${id}/report`}
              step="STEP 3"
              title="성장전략 보고서"
            />

            <StepLink
              href={`/admin/sales-automation/${id}/builder`}
              step="STEP 4"
              title="상세페이지 빌더"
            />

            <StepLink
              href={`/admin/sales-automation/${id}/publish`}
              step="STEP 5"
              title="콘텐츠 발행센터"
            />

            <StepLink
              href={`/admin/sales-automation/${id}/publish`}
              step="STEP 6"
              title="공동구매 발행"
            />
          </div>
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

function FlowCard({
  no,
  title,
  desc,
  href,
  button,
}: {
  no: string;
  title: string;
  desc: string;
  href: string;
  button: string;
}) {
  return (
    <div className="rounded-3xl bg-stone-100 p-6 ring-1 ring-black/10">
      <p className="text-xl font-black text-green-700">{no}</p>
      <h3 className="mt-3 text-3xl font-black">{title}</h3>
      <p className="mt-4 text-xl font-bold leading-relaxed text-black">
        {desc}
      </p>
      <Link
        href={href}
        className="mt-6 inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
      >
        {button}
      </Link>
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

      <p className="mt-4 text-lg font-bold leading-relaxed text-black">
        {desc}
      </p>

      <div className="mt-5 rounded-2xl bg-white p-4 text-xl font-black text-black">
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
      className="rounded-3xl bg-white p-6 text-black transition hover:bg-white"
    >
      <p className="text-lg font-black text-green-700">{step}</p>
      <p className="mt-3 text-3xl font-black">{title}</p>
    </Link>
  );
}
