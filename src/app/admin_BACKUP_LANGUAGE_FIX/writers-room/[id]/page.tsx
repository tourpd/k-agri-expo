import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function label(v: unknown) {
  return String(v ?? "").trim() || "-";
}

export default async function WritersRoomDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: rec } = await supabase
    .from("writers_room_recommendations")
    .select("*")
    .eq("id", id)
    .single();

  if (!rec) notFound();

  let page: any = null;

  if (rec.source_page_id) {
    const { data } = await supabase
      .from("knowledge_page_index")
      .select("*")
      .eq("id", rec.source_page_id)
      .single();

    page = data;
  }

  return (
    <main className="min-h-screen bg-[#f4f5f7] p-5 text-black">
      <div className="mb-5">
        <Link href="/admin/writers-room" className="font-black text-green-700">
          ← 작가실 목록
        </Link>
      </div>

      <section className="mb-5 rounded-2xl bg-black p-6 text-white">
        <p className="text-sm font-black text-green-300">PD DECISION</p>
        <h1 className="mt-2 text-3xl font-black">{rec.title}</h1>
        <p className="mt-3 text-gray-300">{rec.reason}</p>

        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-xs text-gray-300">유형</div>
            <div className="text-2xl font-black">{rec.content_type}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-xs text-gray-300">점수</div>
            <div className="text-2xl font-black">{rec.score}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-xs text-gray-300">상태</div>
            <div className="text-2xl font-black">{rec.status}</div>
          </div>
          <div className="rounded-xl bg-white/10 p-4">
            <div className="text-xs text-gray-300">원본 페이지</div>
            <div className="text-2xl font-black">{page?.page_number ?? "-"}</div>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-2xl font-black">PD 결정</h2>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-xl bg-green-700 px-5 py-3 font-black text-white">채택</button>
          <button className="rounded-xl bg-yellow-500 px-5 py-3 font-black text-black">보류</button>
          <button className="rounded-xl bg-red-600 px-5 py-3 font-black text-white">폐기</button>
          <button className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white">방송 전환</button>
          <button className="rounded-xl bg-purple-700 px-5 py-3 font-black text-white">쇼츠 전환</button>
          <button className="rounded-xl bg-pink-700 px-5 py-3 font-black text-white">시트콤 전환</button>
          <button className="rounded-xl bg-gray-800 px-5 py-3 font-black text-white">광고 전환</button>
        </div>
      </section>


      {page?.full_image_url && (
        <section className="mb-5 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">원본 PPT 슬라이드</h2>
            <a
              href={page.full_image_url}
              target="_blank"
              className="rounded-lg bg-black px-4 py-2 text-sm font-black text-white"
            >
              원본 크게 보기
            </a>
          </div>
          <div className="overflow-hidden rounded-xl border bg-gray-100">
            <a href={page.full_image_url} target="_blank">
              <img
                src={page.full_image_url}
                alt={`원본 ${page.page_number}페이지`}
                className="mx-auto max-h-[700px] w-auto max-w-full object-contain"
              />
            </a>
          </div>
        </section>
      )}

      <section className="mb-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-2xl font-black">원본 근거</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><th className="border bg-gray-100 p-3 text-left">자료명</th><td className="border p-3">{label(page?.source_title)}</td></tr>
              <tr><th className="border bg-gray-100 p-3 text-left">페이지</th><td className="border p-3">{label(page?.page_number)}</td></tr>
              <tr><th className="border bg-gray-100 p-3 text-left">작물</th><td className="border p-3">{label(page?.crop)}</td></tr>
              <tr><th className="border bg-gray-100 p-3 text-left">주제</th><td className="border p-3">{label(page?.topic)}</td></tr>
              <tr><th className="border bg-gray-100 p-3 text-left">병해충</th><td className="border p-3">{label(page?.disease_name)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-2xl font-black">AI 판단 점수</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><th className="border bg-gray-100 p-3 text-left">중요도</th><td className="border p-3">{label(page?.importance_score)}</td></tr>
              <tr><th className="border bg-gray-100 p-3 text-left">고객가치</th><td className="border p-3">{label(page?.farmer_value_score)}</td></tr>
              <tr><th className="border bg-gray-100 p-3 text-left">방송성</th><td className="border p-3">{label(page?.broadcast_score)}</td></tr>
              <tr><th className="border bg-gray-100 p-3 text-left">쇼츠성</th><td className="border p-3">{label(page?.shorts_score)}</td></tr>
              <tr><th className="border bg-gray-100 p-3 text-left">사업성</th><td className="border p-3">{label(page?.business_score)}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-5 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-2xl font-black">증상 · 원인 · 대책 · 행동지시</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <h3 className="font-black">증상</h3>
            <p className="mt-2 whitespace-pre-wrap">{label(page?.symptom)}</p>
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="font-black">원인</h3>
            <p className="mt-2 whitespace-pre-wrap">{label(page?.cause)}</p>
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="font-black">대책</h3>
            <p className="mt-2 whitespace-pre-wrap">{label(page?.countermeasure)}</p>
          </div>
          <div className="rounded-xl border p-4">
            <h3 className="font-black">고객 행동지시</h3>
            <p className="mt-2 whitespace-pre-wrap">{label(page?.action_instruction)}</p>
          </div>
        </div>
      </section>


      <section className="mb-5 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-2xl font-black">AI 제작 브리프</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border p-4">
            <h3 className="font-black">방송 제목 후보</h3>
            <p className="mt-2 text-lg font-bold">{rec.title}</p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-black">첫 멘트</h3>
            <p className="mt-2">
              “고객 여러분, 이 문제를 단순 병해충으로만 보면 해결이 늦어질 수 있습니다.”
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-black">고객 오해 포인트</h3>
            <p className="mt-2">
              {label(page?.cause)}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-black">핵심 해결 방향</h3>
            <p className="mt-2">
              {label(page?.countermeasure)}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-black">쇼츠 훅</h3>
            <p className="mt-2 text-lg font-bold">
              “이 증상 보이면 그냥 넘기면 안 됩니다.”
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <h3 className="font-black">촬영 컷</h3>
            <p className="mt-2">
              원본 슬라이드 → 현장 작물 증상 → 고객 인터뷰 → 해결 방법 → 제품/관리법은 자연스럽게 등장
            </p>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-2xl font-black">작가실 메모</h2>
        <p className="whitespace-pre-wrap leading-7">{label(page?.writer_room_memo)}</p>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-2xl font-black">원문 텍스트</h2>
        <pre className="max-h-[500px] overflow-auto whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-7">
          {label(page?.raw_text)}
        </pre>
      </section>
    </main>
  );
}
