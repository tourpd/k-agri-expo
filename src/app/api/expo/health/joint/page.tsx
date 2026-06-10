import Link from "next/link";

export const dynamic = "force-dynamic";

export default function JointHealthPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] text-black">
      <div className="mx-auto max-w-5xl p-5">

        <Link
          href="/expo/future-food/health"
          className="font-black text-green-700"
        >
          ← 농민건강관
        </Link>

        <section className="mt-6 rounded-3xl bg-gradient-to-r from-green-700 to-green-900 p-10 text-white">

          <div className="text-7xl">🦵</div>

          <h1 className="mt-4 text-5xl font-black">
            무릎이 아프십니까?
          </h1>

          <p className="mt-6 text-2xl font-bold">
            농사는 계속해야 하는데
            관절은 예전 같지 않습니다.
          </p>

          <p className="mt-4 text-xl opacity-90">
            한국농수산TV와 K-Agri Expo가
            농민을 위한 관절건강 공동구매를 시작합니다.
          </p>

        </section>

        <section className="mt-10 rounded-3xl bg-white p-8 shadow-lg">

          <h2 className="text-4xl font-black">
            공동구매 진행현황
          </h2>

          <div className="mt-8">

            <div className="flex justify-between text-xl font-black">
              <span>현재 참여</span>
              <span>73명</span>
            </div>

            <div className="mt-4 h-8 overflow-hidden rounded-full bg-gray-200">

              <div
                className="h-full bg-green-600"
                style={{ width: "73%" }}
              />

            </div>

            <div className="mt-4 text-center text-2xl font-black text-green-700">
              목표 100명 달성 시 특별 할인가 적용
            </div>

          </div>

        </section>

        <section className="mt-10 rounded-3xl bg-white p-8 shadow-lg">

          <h2 className="text-4xl font-black">
            공동구매 예정 상품
          </h2>

          <div className="mt-8 rounded-3xl border p-6">

            <div className="text-3xl font-black">
              한미양행 관절건강 솔루션
            </div>

            <div className="mt-6 flex flex-col gap-3 text-2xl">

              <div>
                정상가 :
                <span className="ml-2 line-through">
                  79,000원
                </span>
              </div>

              <div className="font-black text-red-600">
                공동구매 예상가 :
                49,000원
              </div>

            </div>

            <div className="mt-6 text-xl leading-relaxed">
              MSM · 보스웰리아 · 관절건강 기능성 원료
            </div>

          </div>

        </section>

        <section className="mt-10 rounded-3xl bg-yellow-50 p-8">

          <h2 className="text-4xl font-black">
            어떤 분들에게 필요할까요?
          </h2>

          <ul className="mt-8 space-y-4 text-2xl font-bold">
            <li>✓ 무릎이 자주 아프신 분</li>
            <li>✓ 허리가 불편하신 분</li>
            <li>✓ 농사 후 관절 피로가 심한 분</li>
            <li>✓ 오래 걷기 힘드신 분</li>
            <li>✓ 부모님 건강이 걱정되는 분</li>
          </ul>

        </section>

        <section className="mt-10 rounded-3xl bg-black p-10 text-center text-white">

          <h2 className="text-5xl font-black">
            공동구매 신청하기
          </h2>

          <p className="mt-6 text-2xl">
            목표 인원 달성 시
            특별 할인가로 공급됩니다.
          </p>

          <button className="mt-10 rounded-3xl bg-yellow-400 px-12 py-6 text-3xl font-black text-black">
            공동구매 참여 신청
          </button>

        </section>

      </div>
    </main>
  );
}