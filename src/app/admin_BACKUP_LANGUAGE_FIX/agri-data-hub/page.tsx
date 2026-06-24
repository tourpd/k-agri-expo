import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AgriDataHubPage() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("crop_market_signals")
    .select("*")
    .order("crop_name", { ascending: true });

  const rows = data ?? [];

  return (
    <main className="min-h-screen bg-[#eef3ee] p-4 text-black">
      <div className="mx-auto max-w-[1700px]">
        <div className="mb-4 flex justify-between">
          <div>
            <p className="font-black text-green-700">K-AGRI DATA HUB</p>
            <h1 className="text-4xl font-black">농업 데이터 관제센터</h1>
            <p className="mt-2 font-bold text-gray-700">
              가격·정책·중국·기후·소비·현장데이터가 얼마나 준비됐는지 확인합니다.
            </p>
          </div>
          <Link href="/expo" className="h-fit bg-black px-5 py-3 font-black text-white">
            EXPO 보기
          </Link>
        </div>

        <div className="overflow-auto border border-black bg-white">
          <table className="w-full min-w-[1500px] border-collapse text-sm">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                {["작물","상태","참고가","신뢰도","공공","현장","해외","소비","근거수","핵심위험","행동","상세"].map(h => (
                  <th key={h} className="border border-black px-3 py-2 text-left font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r:any) => (
                <tr key={r.id}>
                  <td className="border border-black px-3 py-2 font-black">{r.crop_name}</td>
                  <td className="border border-black px-3 py-2">{r.signal_status}</td>
                  <td className="border border-black px-3 py-2">{Number(r.today_price||0).toLocaleString()}원</td>
                  <td className="border border-black px-3 py-2">{r.data_confidence_percent || 0}%</td>
                  <td className="border border-black px-3 py-2">{r.public_data_percent || 0}%</td>
                  <td className="border border-black px-3 py-2">{r.field_data_percent || 0}%</td>
                  <td className="border border-black px-3 py-2">{r.global_data_percent || 0}%</td>
                  <td className="border border-black px-3 py-2">{r.consumer_data_percent || 0}%</td>
                  <td className="border border-black px-3 py-2">{r.evidence_count || 0}</td>
                  <td className="border border-black px-3 py-2">{r.risk_summary || "-"}</td>
                  <td className="border border-black px-3 py-2">{r.action_options || "-"}</td>
                  <td className="border border-black px-3 py-2">
                    <Link href={`/expo/crop-value?crop=${encodeURIComponent(r.crop_name)}`} className="bg-green-700 px-3 py-1 font-black text-white">
                      보기
                    </Link>
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
