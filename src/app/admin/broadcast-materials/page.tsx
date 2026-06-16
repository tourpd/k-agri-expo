import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function BroadcastMaterialsPage() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("knowledge_broadcast_materials")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = data || [];

  return (
    <main className="p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-green-700 font-black">
            K-AGRI BRAIN / 방송소재센터
          </div>
          <h1 className="text-5xl font-black">
            방송소재센터
          </h1>
          <p className="mt-2 text-gray-600">
            AI가 생성한 방송소재 후보 관리
          </p>
        </div>

        <Link
          href="/admin/visual-knowledge"
          className="rounded-xl bg-black px-5 py-3 text-white font-black"
        >
          자료화면 AI DB
        </Link>
      </div>

      <div className="mb-5 rounded-2xl border p-5">
        <div className="text-sm text-gray-500">전체 방송소재</div>
        <div className="text-5xl font-black">
          {rows.length}
        </div>
      </div>

      <div className="overflow-auto rounded-2xl border">
        <table className="min-w-full">
          <thead className="bg-black text-white">
            <tr>
              <th className="p-3 text-left">제목</th>
              <th className="p-3 text-left">기획각도</th>
              <th className="p-3 text-left">핵심메시지</th>
              <th className="p-3 text-left">상태</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r:any) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.title}</td>
                <td className="p-3">{r.angle}</td>
                <td className="p-3">{r.key_message}</td>
                <td className="p-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
