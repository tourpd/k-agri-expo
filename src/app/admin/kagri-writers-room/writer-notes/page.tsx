export const dynamic = "force-dynamic";

export default function WriterNotesPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-8 shadow-xl">
        <h1 className="text-5xl font-black">📝 작가노트</h1>
        <p className="mt-4 text-2xl font-bold text-stone-700">
          떠오른 생각, 인터뷰 메모, 콘텐츠 소재를 임시 저장하는 공간입니다.
        </p>

        <textarea
          className="mt-8 min-h-[360px] w-full rounded-3xl border-4 border-black p-6 text-2xl font-bold"
          placeholder="예) 작물이 농민에게 칼슘을 먹으라고 말하는 광고..."
        />

        <button className="mt-5 rounded-2xl bg-green-700 px-8 py-5 text-2xl font-black text-white">
          작가노트 저장
        </button>
      </div>
    </main>
  );
}
