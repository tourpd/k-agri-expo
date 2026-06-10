import Link from "next/link";

export const dynamic = "force-dynamic";

const programs = [
  ["🎙 오늘의 농민라디오", "날씨·병해충·농업뉴스를 작업하면서 듣는 1시간 방송"],
  ["💌 오늘의 사연 3편", "농민들의 삶과 가족 이야기를 소개합니다"],
  ["🎵 오늘의 사연노래", "감동 사연 하나를 노래로 만들어 들려드립니다"],
  ["🎂 생일축하", "전국 농민의 생일과 기념일을 축하합니다"],
  ["📢 농민신문고", "농민의 어려움과 현장 문제를 함께 듣습니다"],
  ["📸 영상제보", "현장 영상을 보내면 뉴스와 방송 소재로 검토합니다"],
];

export default function RadioStarPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-6xl">
        <Link href="/expo" className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white">
          ← K-Agri Expo
        </Link>

        <section className="mt-6 rounded-3xl bg-black p-8 text-white shadow-xl">
          <p className="text-xl font-black text-green-300">한국농수산TV × K-Agri Expo</p>
          <h1 className="mt-3 text-5xl font-black">📻 라디오스타관</h1>
          <p className="mt-4 text-2xl font-bold">
            농민이 필요한 정보도 얻고, 사연도 보내고, 같이 웃고 울고 교류하는 농민 라디오 플랫폼입니다.
          </p>
        </section>

        <section className="mt-8 rounded-3xl border-4 border-red-700 bg-white p-6 shadow-xl">
          <p className="text-2xl font-black text-red-700">🔥 오늘의 대표 코너</p>
          <h2 className="mt-3 text-4xl font-black">사연 3개를 읽고, 감동 사연 하나를 노래로 만듭니다.</h2>
          <p className="mt-4 text-2xl font-bold text-stone-700">
            정보는 농민을 들어오게 만들고, 사연은 다시 오게 만듭니다.
          </p>
          <Link href="/expo/radio-star/submit" className="mt-6 inline-flex rounded-2xl bg-green-700 px-8 py-5 text-2xl font-black text-white">
            💌 사연 보내기 →
          </Link>
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2">
          {programs.map(([title, desc]) => (
            <div key={title} className="rounded-3xl bg-white p-6 shadow-xl">
              <h2 className="text-3xl font-black">{title}</h2>
              <p className="mt-4 text-xl font-bold text-stone-700">{desc}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
