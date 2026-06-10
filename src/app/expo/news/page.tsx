import Link from "next/link";

export const dynamic = "force-dynamic";

const alerts = [
  {
    level: "긴급",
    title: "폭염 시작, 고추 일소피해 비상",
    desc: "고추가 익는 게 아니라 타고 있을 수 있습니다. 고추·오이·수박·과수 농가는 강한 햇빛과 고온 스트레스 관리가 필요합니다.",
    crops: "고추 · 오이 · 수박 · 과수",
    action: "블로킹칼 + 아미65 대응",
  },
  {
    level: "주의",
    title: "장마 전 탄저병 예방 필요",
    desc: "탄저병은 발생 후 잡기 어렵습니다. 장마 전 예방 관리가 중요합니다.",
    crops: "고추 · 사과 · 복숭아",
    action: "예방 방제 점검",
  },
  {
    level: "주의",
    title: "총채벌레 초기 예찰 필요",
    desc: "어린 잎과 꽃, 과실 주변을 확인하십시오. 초기 밀도 관리가 중요합니다.",
    crops: "고추 · 오이 · 딸기",
    action: "초기 예찰",
  },
];

export default function ExpoNewsPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap gap-3">
          <Link
            href="/expo"
            className="rounded-2xl bg-black px-6 py-4 text-xl font-black text-white"
          >
            ← K-Agri Expo
          </Link>
        </div>

        <section className="rounded-3xl bg-red-700 p-7 text-white shadow-xl">
          <p className="text-xl font-black text-red-100">
            K-Agri News
          </p>
          <h1 className="mt-3 text-5xl font-black">
            🚨 오늘의 농사속보
          </h1>
          <p className="mt-4 text-2xl font-bold">
            오늘 농민이 꼭 알아야 할 날씨·병해충·재난·재배 정보를 알려드립니다.
          </p>
        </section>

        <section className="mt-7 rounded-3xl border-4 border-red-700 bg-white p-6 shadow-xl">
          <p className="text-2xl font-black text-red-700">🚨 긴급속보</p>
          <h2 className="mt-3 text-4xl font-black leading-tight">
            고추가 익는 게 아닙니다. 타고 있는 겁니다.
          </h2>
          <p className="mt-4 text-2xl font-bold text-stone-800">
            폭염과 강한 햇빛으로 고추·오이·수박·과수 일소피해 위험이 커지고 있습니다.
          </p>
          <p className="mt-4 text-2xl font-black text-green-700">
            오늘 대응: 블로킹칼 + 아미65
          </p>
        </section>

        <section className="mt-7 grid gap-5">
          {alerts.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-stone-200"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-4 py-2 text-lg font-black text-white ${
                  item.level === "긴급" ? "bg-red-700" : "bg-orange-500"
                }`}>
                  {item.level}
                </span>
                <span className="rounded-full bg-green-100 px-4 py-2 text-lg font-black text-green-800">
                  {item.crops}
                </span>
              </div>

              <h3 className="mt-4 text-3xl font-black">{item.title}</h3>
              <p className="mt-3 text-xl font-bold leading-relaxed text-stone-700">
                {item.desc}
              </p>
              <p className="mt-3 text-xl font-black text-green-700">
                해야 할 일: {item.action}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-7 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-3xl font-black">📻 오늘의 농민라디오</h2>
            <p className="mt-4 text-xl font-bold text-stone-700">
              작업하면서 듣는 5분 농업뉴스입니다.
            </p>
            <button className="mt-5 rounded-2xl bg-black px-7 py-5 text-2xl font-black text-white">
              ▶ 라디오 듣기
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-3xl font-black">📸 농사응급실</h2>
            <p className="mt-4 text-xl font-bold">
              뉴스에서 본 증상, 내 밭에도 있는지 확인하세요.
            </p>
            <img
              src="/images/photodoctor-qr.png"
              alt="포토닥터 QR"
              className="mx-auto mt-5 w-56 rounded-2xl border-4 border-green-600"
            />
            <p className="mt-4 text-center text-xl font-black text-red-600">
              농사는 추측보다 확인입니다.
            </p>
          </div>
        </section>

        <section className="mt-7 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-3xl font-black">📹 현장제보</h2>
            <p className="mt-4 text-xl font-bold text-stone-700">
              병해충, 재난, 가격 문제, 농협 문제를 영상으로 제보해 주세요.
            </p>
            <button className="mt-5 rounded-2xl bg-green-700 px-7 py-5 text-2xl font-black text-white">
              영상 제보하기
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl">
            <h2 className="text-3xl font-black">📢 농민신문고</h2>
            <p className="mt-4 text-xl font-bold text-stone-700">
              농민의 어려움과 현장의 문제를 K-Agri가 함께 듣겠습니다.
            </p>
            <button className="mt-5 rounded-2xl bg-red-700 px-7 py-5 text-2xl font-black text-white">
              신문고 제보하기
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
