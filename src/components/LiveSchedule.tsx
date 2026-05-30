"use client";

const lives = [
  {
    title: "영진 로타리 신제품 발표",
    date: "3월 28일",
    time: "20:00",
    prize: "3,200만원",
    desc: "대표 장비 소개와 경품 추첨 방송",
  },
  {
    title: "도프 신제품 발표",
    date: "4월 3일",
    time: "19:30",
    prize: "1,200만원",
    desc: "신제품 발표와 현장 문제 상담",
  },
];

export default function LiveSchedule() {
  return (
    <section className="rounded-3xl border border-white/20 bg-white/10 p-4 text-white md:p-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <div className="text-sm font-black text-emerald-200">
            LIVE SCHEDULE
          </div>
          <h2 className="mt-1 text-2xl font-black md:text-3xl">
            📺 예정된 다음 라이브
          </h2>
        </div>

        <a
          href="/event"
          className="shrink-0 rounded-full bg-white/15 px-4 py-2 text-sm font-black text-emerald-100 no-underline"
        >
          전체보기
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {lives.map((live, i) => (
          <div
            key={`${live.title}-${i}`}
            className="rounded-2xl border border-white/20 bg-white/10 p-4"
          >
            <div className="text-sm font-black text-emerald-200">
              {live.date} · {live.time}
            </div>

            <div className="mt-2 line-clamp-2 text-xl font-black leading-tight md:text-2xl">
              {live.title}
            </div>

            <div className="mt-2 line-clamp-2 text-sm font-bold leading-6 text-white/80 md:text-base">
              {live.desc}
            </div>

            <div className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm font-black text-yellow-200">
              경품 {live.prize}
            </div>

            <button
              type="button"
              className="mt-3 h-11 w-full rounded-xl bg-emerald-300 text-base font-black text-slate-950"
            >
              라이브 알림 신청
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}