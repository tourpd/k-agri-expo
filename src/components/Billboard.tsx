"use client";

export default function Billboard() {
  const products = ["싹쓰리충", "멸규니", "멀티피드"];
  const problems = ["총채벌레", "노균병", "비대불량"];

  return (
    <section className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-800 p-4 text-white md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black text-emerald-300">
            K-AGRI RANKING
          </div>
          <h2 className="mt-1 text-xl font-black md:text-2xl">
            농민 관심 TOP
          </h2>
        </div>

        <a
          href="/billboard"
          className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-xs font-black text-emerald-200 no-underline"
        >
          전체보기
        </a>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        <RankBox title="🌾 농민 선택 농자재" items={products} />
        <RankBox title="👨‍🌾 농민 고민" items={problems} />
      </div>
    </section>
  );
}

function RankBox({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2 text-sm font-black text-yellow-300">{title}</div>

      <div className="space-y-2">
        {items.map((item, i) => (
          <div
            key={item}
            className="flex items-center justify-between rounded-xl bg-white/10 px-3 py-3 text-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 text-sm font-black">
                {i + 1}
              </span>
              <span className="font-black">{item}</span>
            </div>

            <span className="text-xs font-bold text-emerald-200">보기 →</span>
          </div>
        ))}
      </div>
    </div>
  );
}