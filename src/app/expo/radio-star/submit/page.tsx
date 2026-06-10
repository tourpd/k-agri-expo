import Link from "next/link";

export const dynamic = "force-dynamic";

export default function RadioStorySubmitPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-4xl">
        <Link href="/expo/radio-star" className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white">
          ← 라디오스타관
        </Link>

        <section className="mt-6 rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-5xl font-black">💌 농민라디오 사연 보내기</h1>
          <p className="mt-4 text-2xl font-bold text-stone-700">
            생일축하, 부모님께 보내는 편지, 농사 이야기, 우리집 자랑을 보내주세요.
            채택되면 사연을 읽고 노래로 만들어 방송합니다.
          </p>

          <div className="mt-8 grid gap-5">
            {["성명", "휴대전화", "지역", "작물/축종", "사연 제목"].map((label) => (
              <label key={label} className="block">
                <p className="mb-2 text-xl font-black">{label}</p>
                <input className="w-full rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder={label} />
              </label>
            ))}

            <label className="block">
              <p className="mb-2 text-xl font-black">사연 내용</p>
              <textarea className="min-h-[260px] w-full rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder="농민라디오에서 읽어줄 사연을 적어주세요." />
            </label>

            <div className="rounded-2xl bg-green-50 p-5">
              <p className="text-2xl font-black">🎵 노래 제작 희망</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {["사연을 노래로 만들어 주세요", "생일축하송", "부모님께 드리는 노래", "아내/남편에게 보내는 노래"].map((v) => (
                  <label key={v} className="flex items-center gap-3 text-xl font-bold">
                    <input type="checkbox" className="h-6 w-6" />
                    {v}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-stone-100 p-5">
              <p className="text-2xl font-black">📎 사진/영상 첨부</p>
              <p className="mt-2 text-lg font-bold text-stone-700">1차 버전은 접수 화면 골격입니다. 실제 업로드 기능은 다음 단계에서 연결합니다.</p>
            </div>

            <button className="rounded-2xl bg-green-700 px-8 py-5 text-2xl font-black text-white">
              사연 접수하기
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
