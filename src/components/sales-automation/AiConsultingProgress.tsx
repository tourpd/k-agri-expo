"use client";

type Props = {
  progress: number;
  phase: string;
  done: boolean;
};

const tasks = [
  "홈페이지/유튜브/업로드 자료 확인",
  "DART·공개자료·언론자료 수집",
  "사업영역·제품군·조직구조 추출",
  "콘텐츠 자산·유튜브 활용도 분석",
  "마케팅 비용 구조와 돈이 새는 구간 탐색",
  "AI 전략회의 및 성장전략 보고서 작성",
];

export default function AiConsultingProgress({ progress, phase, done }: Props) {
  return (
    <section className="mt-8 rounded-3xl border-4 border-green-700 bg-white p-8 shadow-xl">
      <p className="text-xl font-black text-green-700">
        AI 컨설팅 진행센터
      </p>

      <h2 className="mt-3 text-5xl font-black">
        {phase}
      </h2>

      <div className="mt-6 h-8 overflow-hidden rounded-full bg-stone-200">
        <div
          className="h-full bg-green-700 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-4 text-2xl font-black">
        진행률 {progress}%
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {tasks.map((task, index) => {
          const active = progress >= (index + 1) * 15;
          return (
            <div
              key={task}
              className={`rounded-2xl p-5 text-xl font-black ${
                active ? "bg-green-100 text-green-900" : "bg-stone-100 text-stone-500"
              }`}
            >
              {active ? "✓" : "…"} {task}
            </div>
          );
        })}
      </div>

      {done && (
        <div className="mt-8 rounded-3xl bg-black p-6 text-white">
          <h3 className="text-3xl font-black">
            1차 분석 준비 완료
          </h3>
          <p className="mt-3 text-xl font-bold leading-relaxed">
            이제 결과를 바로 단정하지 않고, 수집된 자료를 바탕으로
            문제·기회·성장전략·실행패키지를 순서대로 검토합니다.
          </p>
        </div>
      )}
    </section>
  );
}
