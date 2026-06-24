import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function typeLabel(v: string) {
  if (v === "broadcast") return "방송";
  if (v === "shorts") return "쇼츠";
  if (v === "sitcom") return "시트콤";
  if (v === "ad") return "광고";
  if (v === "lecture") return "강의";
  return v || "-";
}

export default async function WritersRoomPage() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("writers_room_recommendations")
    .select(`
      id,
      title,
      content_type,
      reason,
      score,
      expected_views,
      status,
      source_page_id,
      created_at
    `)
    .order("score", { ascending: false })
    .limit(120);

  const rows = (data ?? []) as any[];

  return (
    <main className="min-h-screen bg-[#f4f5f7] p-5 text-black">
      <section className="mb-5 rounded-2xl bg-black p-6 text-white">
        <p className="text-sm font-black text-green-300">K-AGRI AI BRAIN</p>
        <h1 className="mt-2 text-4xl font-black">AI 작가실 · PD 결정실</h1>
        <p className="mt-3 text-gray-300">
          추천 → 원본 확인 → 채택/보류/폐기 결정
        </p>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black">PD 결정 대기 목록</h2>
          <div className="text-sm font-bold text-gray-500">총 {rows.length}건</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1300px] border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3 text-left">순위</th>
                <th className="border p-3 text-left">등급</th>
                <th className="border p-3 text-left">상태</th>
                <th className="border p-3 text-left">종합</th>
                <th className="border p-3 text-left">고객도움</th>
                <th className="border p-3 text-left">돈</th>
                <th className="border p-3 text-left">조회수</th>
                <th className="border p-3 text-left">공동구매</th>
                <th className="border p-3 text-left">시급성</th>
                <th className="border p-3 text-left">유형</th>
                <th className="border p-3 text-left">제목</th>
                <th className="border p-3 text-left">원본p</th>
                <th className="border p-3 text-left">결정</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r: any, i: number) => (
                <tr key={r.id} className="hover:bg-yellow-50">
                  <td className="border p-3 font-black">{i + 1}</td>
                  <td className="border p-3 text-lg font-black">
                    {r.grade === "S+" ? "🟢 S+" : r.grade === "S" ? "🟢 S" : r.grade === "A" ? "🟡 A" : r.grade === "B" ? "🟠 B" : "🔴 C"}
                  </td>
                  <td className="border p-3">{r.status}</td>
                  <td className="border p-3 font-black">{r.score}</td>
                  <td className="border p-3">{r.farmer_score}</td>
                  <td className="border p-3">{r.money_score}</td>
                  <td className="border p-3">{r.view_score}</td>
                  <td className="border p-3">{r.commerce_score}</td>
                  <td className="border p-3">{r.urgency_score}</td>
                  <td className="border p-3">{typeLabel(r.content_type)}</td>
                  <td className="border p-3 font-bold">{r.title}</td>
                  <td className="border p-3">{r.source_page_number ?? "-"}</td>
                  <td className="border p-3">
                    <Link
                      href={`/admin/writers-room/${r.id}`}
                      className="rounded-lg bg-black px-4 py-2 text-xs font-black text-white"
                    >
                      상세 결정
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
