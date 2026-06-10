export const dynamic = "force-dynamic";

const ideas = [
  "작물이 농민에게 말한다",
  "철수동무가 처음 켈팍을 본 날",
  "DMZ 미래농장",
  "농민 카톡극장",
  "농민 라디오스타",
  "텃밭 농사 게임",
  "손주 시점 건강식품 광고",
  "블로킹칼 안 쓴 고추의 일기",
];

export default function IdeasPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-5xl font-black">💡 아이디어 보관함</h1>
        <div className="mt-8 overflow-x-auto rounded-3xl bg-white p-6 shadow-xl">
          <table className="w-full min-w-[900px] border-collapse text-left">
            <thead>
              <tr className="bg-black text-white">
                <th className="p-4 text-xl">번호</th>
                <th className="p-4 text-xl">아이디어</th>
                <th className="p-4 text-xl">상태</th>
                <th className="p-4 text-xl">활용</th>
              </tr>
            </thead>
            <tbody>
              {ideas.map((idea, i) => (
                <tr key={idea} className="border-b-2 border-black">
                  <td className="p-4 text-xl font-black">{i + 1}</td>
                  <td className="p-4 text-xl font-bold">{idea}</td>
                  <td className="p-4 text-xl font-bold">보관</td>
                  <td className="p-4">
                    <button className="rounded-xl bg-green-700 px-4 py-3 font-black text-white">
                      공동 편집으로 보내기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
