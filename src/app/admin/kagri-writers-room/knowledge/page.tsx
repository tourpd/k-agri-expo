export const dynamic = "force-dynamic";

const items = [
  "감자 재배와 병충해 방제",
  "복숭아 핵심재배기술",
  "학교급식용 주요작물 재배기술",
  "병해충 발생정보",
  "작물별 재배력",
  "포토닥터 진단 사례",
  "고추 일소피해 대응",
  "마늘·양파 시기별 관리",
];

export default function KnowledgePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-5xl font-black">🎓 농사지식센터</h1>
        <p className="mt-4 text-2xl font-bold text-stone-700">
          안이영 소장 자료, 농진청 정보, 포토닥터 사례, 작물 재배력을 모으는 곳입니다.
        </p>

        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          {items.map((item) => (
            <div key={item} className="border-b-2 border-stone-200 py-5">
              <h2 className="text-2xl font-black">{item}</h2>
              <p className="mt-2 text-lg font-bold text-stone-600">
                추후 원본 파일·요약·콘텐츠 변환·공동구매 연결을 붙입니다.
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
