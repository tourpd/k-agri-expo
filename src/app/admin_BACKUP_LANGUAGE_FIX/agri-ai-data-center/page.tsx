import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AgriAIDataCenterPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: sources }, { data: signals }, { data: opps }] = await Promise.all([
    supabase.from("agri_data_sources").select("*").order("source_category"),
    supabase.from("agri_ai_market_data").select("*").order("created_at", { ascending: false }),
    supabase.from("agri_kffr_opportunities").select("*").order("priority_score", { ascending: false }),
  ]);

  return (
    <main className="min-h-screen bg-[#eef3ee] p-4 text-black">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-4 flex justify-between">
          <div>
            <p className="font-black text-green-700">K-AGRI AI DATA CENTER</p>
            <h1 className="text-4xl font-black">농업 AI 데이터센터</h1>
            <p className="mt-2 font-bold text-gray-700">
              가격·정책·중국·기후·소비·현장·KFFR 원료기회를 한곳에서 봅니다.
            </p>
          </div>
          <Link href="/admin/kffr-opportunity-center" className="h-fit bg-green-700 px-5 py-3 font-black text-white">
            KFFR 원료기회
          </Link>
        </div>

        <section className="mb-4 grid grid-cols-3 border border-black bg-white">
          <Summary title="데이터 출처" value={`${sources?.length ?? 0}개`} />
          <Summary title="시장신호" value={`${signals?.length ?? 0}건`} />
          <Summary title="KFFR 기회" value={`${opps?.length ?? 0}건`} />
        </section>

        <Table title="시장신호 데이터" rows={signals ?? []} columns={[
          ["작물","crop_name"],["지역","region_name"],["분류","data_category"],["출처","source_name"],
          ["방향","signal_direction"],["위험%","risk_percent"],["기회%","opportunity_percent"],["신뢰%","confidence_percent"],["요약","summary"]
        ]} />

        <div className="mt-5" />

        <Table title="데이터 출처 관리" rows={sources ?? []} columns={[
          ["출처","source_name"],["분류","source_category"],["등급","source_grade"],["주기","update_cycle"],["설명","description"]
        ]} />
      </div>
    </main>
  );
}

function Summary({ title, value }: { title: string; value: string }) {
  return <div className="border-r border-black p-4"><p className="font-bold text-gray-500">{title}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function Table({ title, rows, columns }: { title: string; rows: any[]; columns: string[][] }) {
  return (
    <section className="border border-black bg-white">
      <div className="border-b border-black bg-gray-100 p-3 text-xl font-black">{title}</div>
      <div className="overflow-auto">
        <table className="w-full min-w-[1400px] border-collapse text-sm">
          <thead>
            <tr>{columns.map(([label]) => <th key={label} className="border border-black px-3 py-2 text-left font-black">{label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id ?? i}>
                {columns.map(([label, key]) => (
                  <td key={label} className="border border-black px-3 py-2 font-bold">{String(r[key] ?? "-")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
