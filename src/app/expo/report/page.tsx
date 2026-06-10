import Link from "next/link";

export const dynamic = "force-dynamic";

export default function FieldReportPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-4xl">
        <Link href="/expo" className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white">
          ← K-Agri Expo
        </Link>

        <section className="mt-6 rounded-3xl bg-green-700 p-8 text-white shadow-xl">
          <h1 className="text-5xl font-black">📹 현장제보센터</h1>
          <p className="mt-4 text-2xl font-bold">
            병해충, 재난, 가격 문제, 농협 문제, 좋은 사례를 영상으로 보내주세요.
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-3xl font-black">제보자 정보</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {["성명", "휴대전화", "지역", "작물/축종"].map((label) => (
              <input key={label} className="rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder={label} />
            ))}
          </div>

          <div className="mt-6 rounded-3xl border-4 border-dashed border-black p-8 text-center">
            <p className="text-3xl font-black">📹 영상 / 📸 사진 / 🎤 음성 업로드</p>
            <p className="mt-3 text-xl font-bold text-stone-700">
              1차 버전은 화면 골격입니다. 다음 단계에서 Supabase Storage 또는 파일 업로드 API를 연결합니다.
            </p>
          </div>

          <label className="mt-6 flex items-center gap-3 text-xl font-bold">
            <input type="checkbox" className="h-6 w-6" />
            K-Agri 뉴스와 한국농수산TV 방송 사용에 동의합니다.
          </label>

          <button className="mt-6 rounded-2xl bg-green-700 px-8 py-5 text-2xl font-black text-white">
            현장 제보 보내기
          </button>
        </section>
      </div>
    </main>
  );
}
