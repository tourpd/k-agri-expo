import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const is48 = id === "48kcal";

  const name = is48 ? "48kcal" : id;
  const followers = is48 ? "20,900" : "분석대기";
  const topView = is48 ? "2.6M" : "분석대기";

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-6 text-black">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href="/admin/creator-center/discovery"
          className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
        >
          ← 발굴센터
        </Link>

        <section className="rounded-3xl bg-gradient-to-r from-purple-950 via-purple-800 to-green-700 p-8 text-white shadow-xl">
          <p className="text-lg font-black text-purple-100">Creator DNA</p>
          <h1 className="mt-3 text-5xl font-black">{name} 성장진단</h1>
          <p className="mt-4 text-2xl font-bold text-purple-50">
            성장 가능성, 광고 단가, 브랜드 적합도, 투자 가능성을 분석합니다.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Stat title="팔로워" value={followers} />
          <Stat title="최고조회수" value={topView} />
          <Stat title="광고 적합도" value={is48 ? "94점" : "분석대기"} />
          <Stat title="투자 가능성" value={is48 ? "Seed 후보" : "분석대기"} />
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-black">AI 성장 분석</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Box title="강점" lines={["짧은 기간 팔로워 2만 돌파", "100만 이상 릴스 경험", "다이어트·뷰티 카테고리 명확"]} />
            <Box title="약점" lines={["광고 단가표 미정리", "브랜드 제안서 없음", "성과 리포트 자동화 필요"]} />
            <Box title="다음 액션" lines={["포트폴리오 제작", "광고 패키지 3종 구성", "건강식품·뷰티 브랜드 우선 매칭"]} />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-xl">
          <h2 className="text-4xl font-black">AI 매니저 실행 메뉴</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {["포트폴리오 생성", "광고 단가표", "브랜드 제안서", "투자 검토서"].map((item) => (
              <button key={item} className="rounded-2xl bg-purple-700 px-5 py-5 text-xl font-black text-white">
                {item}
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl">
      <p className="text-lg font-black text-stone-500">{title}</p>
      <p className="mt-2 text-4xl font-black">{value}</p>
    </div>
  );
}

function Box({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-3xl bg-stone-100 p-6">
      <h3 className="text-2xl font-black">{title}</h3>
      <div className="mt-4 space-y-3">
        {lines.map((line) => (
          <p key={line} className="rounded-xl bg-white p-3 text-lg font-bold">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
