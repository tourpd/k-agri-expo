"use client";

export default function Billboard() {
  const products = ["싹쓰리충", "멸규니", "멀티피드"];
  const problems = ["총채벌레", "노균병", "비대불량"];

  return (
    <div className="rounded-[20px] bg-gradient-to-b from-slate-900 to-slate-800 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-black sm:text-lg">K-Agri Billboard</h2>
        <a href="/billboard" className="text-xs font-bold text-emerald-300">
          전체 보기 →
        </a>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-1">
        <div>
          <div className="mb-2 text-xs font-extrabold text-yellow-300 sm:text-sm">
            🌾 농민 선택 농자재 TOP3
          </div>

          <div className="space-y-2">
            {products.map((item, i) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-xs sm:text-sm"
              >
                <span className="font-black">{i + 1}</span>
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-extrabold text-yellow-300 sm:text-sm">
            👨‍🌾 농민 고민 TOP3
          </div>

          <div className="space-y-2">
            {problems.map((item, i) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2 text-xs sm:text-sm"
              >
                <span className="font-black">{i + 1}</span>
                <span className="font-semibold">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}