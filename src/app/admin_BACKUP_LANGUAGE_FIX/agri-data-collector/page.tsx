import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AgriDataCollectorPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: runs }, { data: apiStatus }] = await Promise.all([
    supabase.from("agri_collection_runs").select("*").order("started_at", { ascending: false }).limit(10),
    supabase.from("agri_api_credentials_status").select("*").order("checked_at", { ascending: false }).limit(20),
  ]);

  return (
    <main className="min-h-screen bg-[#eef3ee] p-5 text-black">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex justify-between">
          <div>
            <p className="font-black text-green-700">K-AGRI REAL DATA COLLECTOR</p>
            <h1 className="text-4xl font-black">공식 API 자동수집센터</h1>
            <p className="mt-2 font-bold text-gray-700">
              KAMIS·가락시장·농림부·기상청 데이터를 수집하고, 폭락작물 KFFR 원료기회를 자동 생성합니다.
            </p>
          </div>
          <Link href="/admin/agri-ai-data-center" className="h-fit bg-black px-5 py-3 font-black text-white">
            데이터센터
          </Link>
        </div>

        <section className="mb-5 rounded-2xl border bg-white p-6">
          <h2 className="text-2xl font-black">수집 실행</h2>
          <p className="mt-2 font-bold text-gray-600">
            API 키가 있으면 실제 수집, 없으면 키 없음 상태를 기록합니다.
          </p>
          <form action="/api/admin/agri-data-collector" method="post" className="mt-5">
            <button className="rounded-2xl bg-green-700 px-8 py-5 text-2xl font-black text-white">
              오늘 데이터 수집 실행
            </button>
          </form>
        </section>

        <section className="mb-5 border border-black bg-white">
          <div className="border-b border-black bg-gray-100 p-3 text-xl font-black">API 키 상태</div>
          <div className="overflow-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr>
                  {["API", "필요 ENV", "상태", "메시지", "확인시간"].map((h) => (
                    <th key={h} className="border border-black px-3 py-2 text-left font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(apiStatus ?? []).map((r: any) => (
                  <tr key={r.id}>
                    <td className="border border-black px-3 py-2 font-bold">{r.api_name}</td>
                    <td className="border border-black px-3 py-2 font-bold">{r.required_env_key}</td>
                    <td className="border border-black px-3 py-2 font-black">{r.status}</td>
                    <td className="border border-black px-3 py-2">{r.message}</td>
                    <td className="border border-black px-3 py-2">{r.checked_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="border border-black bg-white">
          <div className="border-b border-black bg-gray-100 p-3 text-xl font-black">최근 수집 기록</div>
          <div className="overflow-auto">
            <table className="w-full min-w-[1000px] border-collapse text-sm">
              <thead>
                <tr>
                  {["상태", "가격", "정책", "기후", "오류", "시작", "종료"].map((h) => (
                    <th key={h} className="border border-black px-3 py-2 text-left font-black">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(runs ?? []).map((r: any) => (
                  <tr key={r.id}>
                    <td className="border border-black px-3 py-2 font-black">{r.status}</td>
                    <td className="border border-black px-3 py-2">{r.collected_price_count}</td>
                    <td className="border border-black px-3 py-2">{r.collected_policy_count}</td>
                    <td className="border border-black px-3 py-2">{r.collected_weather_count}</td>
                    <td className="border border-black px-3 py-2">{r.error_message || "-"}</td>
                    <td className="border border-black px-3 py-2">{r.started_at}</td>
                    <td className="border border-black px-3 py-2">{r.finished_at || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
