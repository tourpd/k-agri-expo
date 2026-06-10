import Link from "next/link";

export const dynamic = "force-dynamic";

const CARDS = [
  {
    icon: "💪",
    title: "근력감소",
    text: "농사 체력이 예전 같지 않습니까?",
    items: ["고소애 단백질", "아미노산", "고단백 건강식"],
  },
  {
    icon: "🦵",
    title: "관절·허리",
    text: "무릎과 허리가 아프십니까?",
    items: ["MSM", "보스웰리아", "관절건강"],
  },
  {
    icon: "👁",
    title: "눈 건강",
    text: "눈이 침침하십니까?",
    items: ["루테인", "지아잔틴"],
  },
  {
    icon: "🫀",
    title: "혈행",
    text: "혈압과 혈행이 걱정되십니까?",
    items: ["오메가3", "코엔자임Q10"],
  },
  {
    icon: "🧠",
    title: "기억력",
    text: "깜빡깜빡 하십니까?",
    items: ["포스파티딜세린", "은행잎"],
  },
  {
    icon: "🛡",
    title: "면역",
    text: "감기에 자주 걸리십니까?",
    items: ["홍삼", "아연", "비타민C"],
  },
  {
    icon: "😴",
    title: "수면",
    text: "잠이 잘 안 오십니까?",
    items: ["테아닌", "수면건강"],
  },
  {
    icon: "🐛",
    title: "미래식량",
    text: "곤충단백질 건강산업",
    items: ["고소애", "갈색거저리", "한미양행 특허기술"],
  },
];

export default function HealthPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] text-black">
      <div className="mx-auto max-w-7xl p-5">
        <Link href="/expo/future-food" className="font-black text-green-700">
          ← 미래식량관
        </Link>

        <section className="mt-8 rounded-[32px] bg-gradient-to-r from-green-800 to-green-950 p-10 text-white shadow-2xl md:p-14">
          <div className="mb-8 inline-flex items-center rounded-2xl bg-white p-4 shadow-xl">
            <img
              src="/images/hanmi-logo.png"
              alt="한미양행"
              className="h-16 w-auto object-contain"
            />
          </div>

          <p className="text-2xl font-black text-green-200">
            한미양행 × 한국농수산TV
          </p>

          <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
            농사는 평생 하셨습니다.
            <br />
            이제는 건강을 챙길 시간입니다.
          </h1>

          <p className="mt-8 text-2xl font-black md:text-3xl">
            23만 농민 데이터 기반 AI 농민건강관
          </p>

          <p className="mt-5 max-w-4xl text-xl font-bold leading-relaxed md:text-2xl">
            한미양행 1,836개 제품을 농민의 건강 문제 기준으로 AI가 재분류했습니다.
            <br />
            제품을 나열하는 것이 아니라, 농민의 실제 고민에 맞춰 다시 보여줍니다.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-center text-4xl font-black md:text-5xl">
            농민이 가장 많이 고민하는 건강문제
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border-2 border-gray-200 bg-white p-7 shadow-xl"
              >
                <div className="text-6xl">{card.icon}</div>

                <h3 className="mt-5 text-3xl font-black">{card.title}</h3>

                <p className="mt-3 min-h-[56px] text-lg font-bold leading-relaxed text-gray-700">
                  {card.text}
                </p>

                <ul className="mt-5 space-y-3">
                  {card.items.map((item) => (
                    <li key={item} className="text-lg font-black">
                      ✓ {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-white p-10 shadow-xl md:p-12">
          <h2 className="text-4xl font-black md:text-5xl">
            왜 농민건강관이 필요한가?
          </h2>

          <p className="mt-7 text-2xl font-bold leading-relaxed">
            대한민국 농업인의 평균연령은 계속 높아지고 있습니다.
            <br />
            농민의 건강은 개인의 문제가 아닙니다.
            <br />
            생산성의 문제이며, 농촌의 미래 문제입니다.
            <br />
            <br />
            한미양행과 한국농수산TV는 농민 건강수명 연장 프로젝트를 시작합니다.
          </p>
        </section>

        <section className="mt-16 grid gap-8 rounded-3xl bg-green-50 p-10 shadow-inner md:grid-cols-2 md:p-12">
          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-center text-4xl font-black">건강 → 생산 → 소득</h2>

            <div className="mt-10 text-center text-3xl font-black leading-loose">
              건강
              <br />↓<br />
              생산
              <br />↓<br />
              소득
              <br />↓<br />
              행복한 노후
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg">
            <h2 className="text-center text-4xl font-black">KFFR 산업 연결 구조</h2>

            <div className="mt-10 text-center text-3xl font-black leading-loose">
              곤충사육
              <br />↓<br />
              원료생산
              <br />↓<br />
              한미양행
              <br />↓<br />
              건강기능식품
              <br />↓<br />
              농민건강
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-3xl bg-black p-12 text-center text-white shadow-2xl">
          <h2 className="text-5xl font-black leading-tight md:text-6xl">
            치유농업은 체험이 아닙니다.
          </h2>

          <p className="mt-8 text-3xl font-black text-green-300">
            건강 → 생산 → 소득
          </p>

          <p className="mt-10 text-2xl font-bold">KFFR 미래농업 프로젝트</p>

          <p className="mt-5 text-4xl font-black leading-tight text-yellow-400 md:text-5xl">
            농사를 물려주지 마십시오.
            <br />
            미래를 물려주십시오.
          </p>
        </section>
      </div>
    </main>
  );
}