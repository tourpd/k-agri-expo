import Link from "next/link";

export const dynamic = "force-dynamic";

const items = [
  { status: "대기", source: "기상청", category: "폭염", title: "전국 폭염특보 확대", importance: 5 },
  { status: "대기", source: "농진청", category: "병해충", title: "6월 고추 탄저병 예보", importance: 5 },
  { status: "대기", source: "농민신문", category: "재배", title: "고추 일소피해 주의", importance: 4 },
  { status: "대기", source: "현장제보", category: "농민신문고", title: "지역 농가 제보 대기", importance: 3 },
];

export default function NewsDeskPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/admin/kagri-writers-room/news" className="rounded-2xl bg-black px-6 py-4 text-xl font-black text-white">
            ← 뉴스센터
          </Link>
          <Link href="/admin/sales-automation/test/builder" className="rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white">
            🤝 공동편집구역
          </Link>
        </div>

        <section className="rounded-3xl bg-white p-6 shadow-xl">
          <h1 className="text-5xl font-black">📰 K-Agri 뉴스 편집 데스크</h1>
          <p className="mt-3 text-2xl font-bold text-stone-600">
            뉴스·날씨·병해충·제보를 모아 라디오, 쇼츠, 공동구매 콘텐츠로 변환합니다.
          </p>
        </section>

        <section className="mt-8 overflow-x-auto rounded-3xl bg-white p-6 shadow-xl">
          <table className="w-full min-w-[1200px] border-collapse text-left">
            <thead>
              <tr className="bg-black text-white">
                <th className="p-4 text-xl">상태</th>
                <th className="p-4 text-xl">출처</th>
                <th className="p-4 text-xl">분야</th>
                <th className="p-4 text-xl">제목</th>
                <th className="p-4 text-xl">중요도</th>
                <th className="p-4 text-xl">작업</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.title} className="border-b-2 border-stone-200">
                  <td className="p-4 text-xl font-black text-red-600">{item.status}</td>
                  <td className="p-4 text-xl font-bold">{item.source}</td>
                  <td className="p-4 text-xl font-bold">{item.category}</td>
                  <td className="p-4 text-xl font-black">{item.title}</td>
                  <td className="p-4 text-xl text-orange-600">{"★".repeat(item.importance)}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-xl bg-blue-600 px-4 py-3 font-black text-white">뉴스</button>
                      <button className="rounded-xl bg-red-600 px-4 py-3 font-black text-white">라디오</button>
                      <button className="rounded-xl bg-green-700 px-4 py-3 font-black text-white">쇼츠</button>
                      <Link href="/admin/sales-automation/test/builder" className="rounded-xl bg-purple-700 px-4 py-3 font-black text-white">
                        공동편집
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-3xl font-black">📸 농사응급실 / 포토닥터</h2>
            <p className="mt-4 text-xl font-bold">내 밭이 괜찮은지 궁금하십니까?</p>
            <p className="mt-2 text-lg font-bold text-stone-700">사진 한 장 · 30초 진단</p>
            <p className="mt-2 text-lg font-bold text-stone-700">농사는 추측보다 확인입니다.</p>
            <div className="mt-4 rounded-2xl border-2 border-green-600 bg-white p-4 text-center">
              <img
                src="/images/photodoctor-qr.png"
                alt="포토닥터 QR"
                className="mx-auto w-64"
              />

              <p className="mt-4 text-2xl font-black text-green-700">
                📸 농사응급실
              </p>

              <p className="mt-2 text-lg font-bold">
                뉴스에서 본 증상, 내 밭에도 있는지 확인하세요.
              </p>

              <p className="text-lg font-bold">
                사진 한 장 · 30초 진단
              </p>

              <p className="mt-2 font-black text-red-600">
                농사는 추측보다 확인입니다.
              </p>

              <a
                href="https://plant-doctor-kaftv.replit.app"
                target="_blank"
                className="mt-4 inline-block rounded-2xl bg-green-700 px-6 py-4 text-xl font-black text-white"
              >
                📸 포토닥터 바로가기
              </a>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-3xl font-black">🎯 내일 아침 1호 뉴스</h2>
            <div className="mt-4 rounded-2xl bg-red-50 p-5">
              <p className="text-2xl font-black text-red-700">🚨 폭염 시작</p>
              <p className="mt-3 text-3xl font-black leading-tight">
                고추가 익는 게 아닙니다. 타고 있는 겁니다.
              </p>
              <p className="mt-3 text-xl font-bold">
                고추 · 오이 · 수박 · 과수 일소피해 비상
              </p>
              <p className="mt-3 text-xl font-black text-green-700">
                연결 제품: 블로킹칼 + 아미65
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
