import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function BrainPage() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("writers_room_recommendations")
    .select("*")
    .order("score", { ascending: false })
    .limit(3);

  const items = data ?? [];

  return (
    <main className="min-h-screen bg-[#f4f6f8] p-6 text-black">
      <div className="mx-auto max-w-6xl">
        <section className="rounded-3xl bg-black p-8 text-white">
          <div className="font-black text-green-400">K-AGRI BRAIN</div>
          <h1 className="mt-3 text-5xl font-black">오늘의 결정</h1>
          <p className="mt-3 text-gray-300">
            데이터를 보는 곳이 아니라 오늘 무엇을 할지 결정하는 곳
          </p>
        </section>

        <section className="mt-8 rounded-3xl bg-white p-8 shadow">
          <div className="text-center">
            <div className="text-sm font-black text-green-700">AI 추천 후보</div>
            <h2 className="mt-2 text-3xl font-black">오늘 결정할 콘텐츠 TOP 3</h2>
            <p className="mt-2 text-gray-600">
              셋 중 하나를 고르고, 그 다음 공동편집실에서 보강합니다.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {items.map((item: any, i: number) => (
              <article
                key={item.id}
                className="rounded-3xl border-2 border-black bg-white p-5"
              >
                <div className="text-2xl font-black">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} 후보 {i + 1}
                </div>

                <h3 className="mt-4 min-h-[100px] text-2xl font-black leading-tight">
                  {item.title}
                </h3>

                <div className="mt-5 text-center">
                  <div className="text-6xl font-black text-green-700">
                    {item.score ?? 0}
                  </div>
                  <div className="font-bold">추천도</div>
                </div>

                <div className="mt-5 rounded-2xl bg-yellow-50 p-4">
                  <div className="mb-2 font-black">왜 후보인가?</div>
                  <div className="space-y-2 text-sm font-bold">
                    <div>✓ 농민 관심 가능성</div>
                    <div>✓ 지금 시기 검토 필요</div>
                    <div>✓ 콘텐츠화 가능</div>
                    <div>✓ 제품·공동구매 연결 여지</div>
                  </div>
                </div>

                <div className="mt-5 grid gap-2">
                  <Link
                    href={`/admin/brain/editor/${item.id}`}
                    className="rounded-xl bg-black py-3 text-center font-black text-white"
                  >
                    이 후보로 공동편집 →
                  </Link>

                  <button className="rounded-xl bg-green-700 py-3 font-black text-white">
                    이 주제로 채택
                  </button>

                  <button className="rounded-xl bg-gray-200 py-3 font-black text-black">
                    보류
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-black p-5">
            <div className="mb-3 text-xl font-black">AI에게 질문하기</div>
            <textarea
              className="w-full rounded-xl border border-black p-4 text-black"
              rows={4}
              placeholder="셋 중 뭐가 제일 낫냐? 다른 각도는 없냐?"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
