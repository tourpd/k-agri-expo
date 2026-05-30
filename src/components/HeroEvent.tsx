"use client";

export default function HeroEvent() {
  return (
    <section className="rounded-3xl bg-slate-900 text-white p-5 md:p-10">
      
      <div className="grid gap-6 md:grid-cols-2 md:items-center">

        {/* 텍스트 영역 */}
        <div>

          <div className="inline-block rounded-full bg-emerald-500 px-3 py-1 text-xs font-black md:text-sm">
            🔥 신제품 경품 이벤트
          </div>

          <h1 className="mt-3 text-2xl font-black leading-tight md:text-5xl">
            영진 로타리 YJ-180
          </h1>

          <p className="mt-3 text-sm font-bold text-white/80 md:text-lg">
            3,200만원 상당 신제품 로터리  
            농민 대상 특별 경품 이벤트
          </p>

          <div className="mt-4 text-base font-black text-emerald-300 md:text-xl">
            응모자 5,432명
          </div>

          <button className="mt-4 h-12 w-full rounded-xl bg-white text-base font-black text-slate-900 md:w-auto md:px-8">
            경품 응모하기
          </button>

        </div>

        {/* 이미지 영역 */}
        <div>
          <img
            src="/sample_rotary.jpg"
            className="w-full rounded-2xl object-cover"
          />
        </div>

      </div>

    </section>
  );
}