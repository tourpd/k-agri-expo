"use client";

const cardItems = [
  {
    type: "hero",
    icon: "🏁",
    title: "히어로",
    desc: "첫 화면 / 대표 이미지 / 핵심 문구",
  },
  {
    type: "problem",
    icon: "🔥",
    title: "문제 공감",
    desc: "농민 고민 / 병해 / 손해 공포",
  },
  {
    type: "solution",
    icon: "✅",
    title: "해결책",
    desc: "제품이 해결하는 핵심 문제",
  },
  {
    type: "compare",
    icon: "📊",
    title: "비교",
    desc: "기존 방식 vs 개선 방식",
  },
  {
    type: "before",
    icon: "😟",
    title: "Before",
    desc: "사용 전 / 문제 상태",
  },
  {
    type: "after",
    icon: "🌱",
    title: "After",
    desc: "사용 후 / 기대 장면",
  },
  {
    type: "usage",
    icon: "🧑‍🌾",
    title: "사용 장면",
    desc: "농민이 실제 사용하는 모습",
  },
  {
    type: "dosage",
    icon: "🧪",
    title: "시비법",
    desc: "작물별 사용량 / 사용시기",
  },
  {
    type: "warning",
    icon: "⚠️",
    title: "주의사항",
    desc: "혼용 / 보관 / 사용 주의",
  },
  {
    type: "ingredient",
    icon: "🧬",
    title: "성분표",
    desc: "성분 / 인증 / 원료",
  },
  {
    type: "proof",
    icon: "📑",
    title: "증거자료",
    desc: "시험자료 / 인증 / 데이터",
  },
  {
    type: "review",
    icon: "💬",
    title: "농가후기",
    desc: "농민 인터뷰 / 현장 반응",
  },
  {
    type: "price",
    icon: "💰",
    title: "가격",
    desc: "판매가 / 할인 / 혜택",
  },
  {
    type: "event",
    icon: "🎁",
    title: "이벤트",
    desc: "샘플 / 증정 / 프로모션",
  },
  {
    type: "cta",
    icon: "🚀",
    title: "신청하기",
    desc: "상담 / 공동구매 / 주문",
  },
];

export default function CardLibrary() {
  return (
    <aside className="border-r bg-white p-5">
      <h2 className="text-2xl font-black">카드 라이브러리</h2>

      <p className="mt-2 text-base font-bold text-stone-500">
        상세페이지 재료를 카드처럼 조립합니다.
      </p>

      <div className="mt-5 grid gap-3">
        {cardItems.map((item) => (
          <button
            key={item.type}
            type="button"
            className="rounded-2xl border-2 border-stone-200 bg-stone-50 p-4 text-left hover:border-green-700 hover:bg-green-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <p className="text-lg font-black">{item.title}</p>
                <p className="mt-1 text-sm font-bold text-stone-500">
                  {item.desc}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}