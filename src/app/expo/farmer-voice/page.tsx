import Link from "next/link";

export const dynamic = "force-dynamic";

const categories = ["농협 문제", "유통 문제", "가격 문제", "재난 피해", "불량 농자재", "정책 건의", "좋은 사례", "축산 애로", "과수 애로"];

export default function FarmerVoicePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/expo" className="inline-flex rounded-2xl bg-black px-6 py-4 text-xl font-black text-white">
          ← K-Agri Expo
        </Link>

        <section className="mt-6 rounded-3xl bg-red-700 p-8 text-white shadow-xl">
          <h1 className="text-5xl font-black">📢 농민신문고</h1>
          <p className="mt-4 text-2xl font-bold">
            농민의 어려움은 콘텐츠가 아니라 해결 과제입니다. K-Agri가 듣고, 정리하고, 알리고, 연결하겠습니다.
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-3xl font-black">제보 분야</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {categories.map((c) => (
              <button key={c} className="rounded-2xl border-2 border-black bg-white px-5 py-4 text-xl font-black">
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-6 shadow-xl">
          <h2 className="text-3xl font-black">기본 정보</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {["성명", "휴대전화", "지역", "작물/축종"].map((label) => (
              <input key={label} className="rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder={label} />
            ))}
          </div>
          <textarea className="mt-5 min-h-[240px] w-full rounded-2xl border-4 border-black p-4 text-xl font-bold" placeholder="제보 내용을 적어주세요. 영상이나 사진은 다음 단계에서 연결합니다." />
          <button className="mt-5 rounded-2xl bg-red-700 px-8 py-5 text-2xl font-black text-white">
            신문고 접수하기
          </button>
        </section>
      </div>
    </main>
  );
}
