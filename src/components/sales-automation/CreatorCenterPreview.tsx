export default function CreatorCenterPreview() {
  return (
    <section className="rounded-3xl bg-white p-8 text-black shadow-xl">
      <h2 className="text-4xl font-black">AI 크리에이터센터</h2>
      <p className="mt-3 text-xl font-bold text-stone-600">
        인스타·유튜브 크리에이터의 콘텐츠 가치, 광고 단가, 브랜드 매칭 가능성을 분석합니다.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {["팔로워", "광고문의", "예상단가", "브랜드적합도"].map((item) => (
          <div key={item} className="rounded-3xl bg-purple-50 p-6">
            <p className="text-lg font-black text-purple-700">{item}</p>
            <p className="mt-2 text-3xl font-black">분석대기</p>
          </div>
        ))}
      </div>
    </section>
  );
}
