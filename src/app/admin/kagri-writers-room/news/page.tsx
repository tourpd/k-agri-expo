import Link from "next/link";

export const dynamic = "force-dynamic";

const urgentItems = [
  {
    label: "폭염·일소피해",
    crop: "고추 · 오이 · 수박 · 과수",
    action: "블로킹칼 + 아미65 긴급 콘텐츠 제작",
    level: "긴급",
  },
  {
    label: "탄저병",
    crop: "고추 · 사과 · 복숭아",
    action: "장마 전 예방 방제 뉴스 제작",
    level: "주의",
  },
  {
    label: "총채벌레",
    crop: "고추 · 오이 · 딸기",
    action: "초기 예찰과 방제 콘텐츠 제작",
    level: "주의",
  },
];

const formats = [
  "🚨 긴급뉴스",
  "📻 5분 농민라디오",
  "🎬 60초 쇼츠",
  "🛒 공동구매 상세페이지",
  "📱 농민 카톡극장",
];

export default function KagriNewsCenterPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <Link
            href="/admin/kagri-writers-room"
            className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
          >
            ← K-Agri 작가실
          </Link>
        </div>

        <section className="rounded-3xl bg-red-700 p-8 text-white shadow-xl">
          <p className="text-xl font-black text-red-100">K-Agri News Desk</p>
          <h1 className="mt-3 text-5xl font-black">🚨 K-Agri 뉴스센터</h1>
          <p className="mt-4 text-2xl font-bold">
            오늘 농민이 알아야 할 긴급 이슈를 뉴스·라디오·쇼츠·공동구매로 연결합니다.
          </p>
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/kagri-writers-room/news-desk"
            className="rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
          >
            📰 뉴스 편집 데스크
          </Link>
          <Link
            href="/admin/sales-automation/test/builder"
            className="rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white"
          >
            🤝 공동편집구역
          </Link>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-4xl font-black">🔥 내일 새벽 1호 뉴스 주제</h2>

          <div className="mt-6 rounded-3xl border-4 border-red-700 bg-red-50 p-6">
            <p className="text-2xl font-black text-red-700">
              폭염 시작, 고추 일소피해 비상
            </p>
            <h3 className="mt-3 text-5xl font-black leading-tight">
              고추가 익는 게 아닙니다. 타고 있는 겁니다.
            </h3>
            <p className="mt-4 text-2xl font-bold text-stone-800">
              강한 햇빛과 고온 스트레스로 고추·오이·수박·과수 일소피해 위험이 커지고 있습니다.
              오늘 콘텐츠는 블로킹칼과 아미65를 중심으로 구성합니다.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-4xl font-black">🚨 긴급 이슈 보드</h2>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="bg-black text-white">
                    <th className="p-4 text-xl">상태</th>
                    <th className="p-4 text-xl">이슈</th>
                    <th className="p-4 text-xl">대상 작물</th>
                    <th className="p-4 text-xl">오늘 할 일</th>
                  </tr>
                </thead>
                <tbody>
                  {urgentItems.map((item) => (
                    <tr key={item.label} className="border-b-2 border-black">
                      <td className="p-4 text-xl font-black text-red-700">{item.level}</td>
                      <td className="p-4 text-xl font-black">{item.label}</td>
                      <td className="p-4 text-xl font-bold">{item.crop}</td>
                      <td className="p-4 text-xl font-bold">{item.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-4xl font-black">🎥 생성할 콘텐츠</h2>

            <div className="mt-6 grid gap-3">
              {formats.map((format) => (
                <button
                  key={format}
                  className="rounded-2xl bg-green-700 px-6 py-5 text-left text-2xl font-black text-white"
                >
                  {format}
                </button>
              ))}
            </div>

            <Link
              href="/admin/sales-automation/test/builder"
              className="mt-6 flex rounded-2xl bg-black px-6 py-5 text-2xl font-black text-white"
            >
              🤝 공동 편집구역으로 보내기 →
            </Link>
          </aside>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-4xl font-black">📻 내일 아침 농민라디오 초안</h2>

          <div className="mt-6 rounded-3xl bg-stone-100 p-6">
            <p className="whitespace-pre-wrap text-2xl font-bold leading-relaxed">
{`안녕하십니까. K-Agri 농업뉴스입니다.

오늘의 첫 번째 소식입니다.
전국적으로 기온이 오르면서 고추, 오이, 수박, 과수 농가의 일소피해 위험이 커지고 있습니다.

일소피해는 단순히 햇볕에 그을리는 문제가 아닙니다.
과실 표면이 타고, 조직이 약해지고, 상품성이 떨어질 수 있습니다.

특히 고추는 빨갛게 익는 것처럼 보여도 실제로는 강한 햇빛에 타는 경우가 있습니다.

오늘 농가에서는 강한 햇빛 차단과 고온 스트레스 완화 관리가 필요합니다.
블로킹칼과 아미65를 활용한 사전 관리가 중요한 시기입니다.

한국농수산TV는 오늘 폭염과 일소피해 대응법을 집중적으로 전해드리겠습니다.`}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
