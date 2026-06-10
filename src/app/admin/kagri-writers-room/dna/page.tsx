export const dynamic = "force-dynamic";

const rules = [
  "농민에게 도움 되는 정보가 최우선이다.",
  "돈 되는 정보, 손해를 막는 정보가 우선이다.",
  "제품보다 문제를 먼저 설명한다.",
  "문제 → 원인 → 해결 → 제품 → 신청 순서로 간다.",
  "정보가 먼저이고 예능은 그 위에 얹는다.",
  "작물 시점, 가족 시점, 손주 시점, 역관점, 역발상을 허용한다.",
  "실제 농업 데이터와 전문가 근거를 우선한다.",
  "공동구매는 자연스럽게 연결한다.",
  "철수동무는 신기술·미래농업·예능형 콘텐츠의 특수 카드로 활용한다.",
  "전문농가, 초보농부, 텃밭농부, 베란다식집사까지 대상별로 바꿔 쓴다.",
];

export default function DnaPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-5xl font-black">📖 콘텐츠 DNA</h1>
        <p className="mt-4 text-2xl font-bold text-stone-700">
          한국농수산TV 콘텐츠 제작 원칙입니다. 새 아이디어는 여기에 규칙으로 추가됩니다.
        </p>

        <div className="mt-8 grid gap-4">
          {rules.map((rule, i) => (
            <div key={rule} className="rounded-2xl border-2 border-black p-5">
              <p className="text-xl font-black">제{i + 1}원칙</p>
              <p className="mt-2 text-2xl font-bold">{rule}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
