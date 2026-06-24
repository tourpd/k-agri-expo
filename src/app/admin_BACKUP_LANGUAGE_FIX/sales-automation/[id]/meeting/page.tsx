import Link from "next/link";

export const dynamic = "force-dynamic";

const members = [
  {
    title: "AI CEO",
    color: "bg-white",
    comment:
      "현재 회사는 제품은 많지만 대표 브랜드가 약합니다. 무엇을 가장 먼저 밀 것인지 우선순위가 필요합니다.",
  },
  {
    title: "AI 콘텐츠 PD",
    color: "bg-white",
    comment:
      "독수리5형제를 하나의 브랜드 세계관으로 만들고 유튜브·쇼츠·상세페이지를 연결해야 합니다.",
  },
  {
    title: "AI 고객심리관",
    color: "bg-white",
    comment:
      "고객은 제품명을 검색하지 않습니다. 총채벌레, 탄저병, 칼슘결핍 같은 문제를 검색합니다.",
  },
  {
    title: "AI 공동구매 전문가",
    color: "bg-orange-100",
    comment:
      "공동구매는 베스트셀러 1~2개만 집중해야 합니다. 제품이 많을수록 전환율은 떨어집니다.",
  },
  {
    title: "AI 성장전략관",
    color: "bg-white",
    comment:
      "향후 목표는 홈페이지 개편이 아니라 AI 작물솔루션 플랫폼으로 전환하는 것입니다.",
  },
];

export default async function MeetingPage({
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
            AI 전략회의실
          </h1>

          <p className="mt-4 text-2xl font-bold text-black">
            AI 전문가들이 회사를 분석하고 토론하고 있습니다.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">

            {members.map((m) => (
              <div
                key={m.title}
                className={`rounded-3xl ${m.color} p-6 ring-1 ring-black/10`}
              >
                <h2 className="text-3xl font-black text-black">
                  {m.title}
                </h2>

                <p className="mt-5 text-xl font-bold leading-relaxed text-black">
                  {m.comment}
                </p>
              </div>
            ))}

          </div>

        </section>
      </div>
    </main>
  );
}
