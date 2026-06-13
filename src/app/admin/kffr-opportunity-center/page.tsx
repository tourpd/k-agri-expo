import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function KFFROpportunityCenterPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: kffr }, { data: processing }, { data: crops }] = await Promise.all([
    supabase.from("agri_kffr_opportunity").select("*").order("priority_percent", { ascending: false }),
    supabase.from("agri_processing_opportunity").select("*").order("opportunity_percent", { ascending: false }),
    supabase.from("agri_crop_master").select("*").order("crop_group", { ascending: true }).order("crop_name", { ascending: true })
  ]);

  const top = (kffr ?? [])[0];

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-4 text-black">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-5 flex justify-between">
          <div>
            <p className="font-black text-green-700">KFFR RAW MATERIAL STRATEGY ROOM</p>
            <h1 className="text-5xl font-black">KFFR 원료기회 전략실</h1>
            <p className="mt-2 text-lg font-bold text-gray-700">
              가격폭락 작물을 농가구제 원료·가공식품·건강식품·미래식량 자원으로 전환합니다.
            </p>
          </div>
          <Link href="/admin/agri-ai-data-center" className="h-fit bg-black px-6 py-4 text-lg font-black text-white">
            데이터센터
          </Link>
        </div>

        <section className="mb-5 grid grid-cols-4 border border-black bg-white">
          <Summary title="관리 작물" value={`${crops?.length ?? 0}개`} />
          <Summary title="KFFR 후보" value={`${kffr?.length ?? 0}건`} />
          <Summary title="가공기회" value={`${processing?.length ?? 0}건`} />
          <Summary title="최우선" value={top?.crop_name ?? "-"} />
        </section>

        {top ? (
          <section className="mb-5 border-2 border-green-700 bg-white p-5">
            <p className="font-black text-green-700">오늘의 최우선 원료기회</p>
            <h2 className="mt-2 text-4xl font-black">{top.crop_name}</h2>
            <p className="mt-2 text-2xl font-black text-green-700">{top.priority_percent}점</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Card title="제품컨셉" value={top.product_concept} />
              <Card title="농가구제 이유" value={top.farmer_rescue_reason} />
              <Card title="다음 행동" value={top.next_action} />
            </div>
          </section>
        ) : null}

        <Table title="AI 수매·건기식 추천 TOP" rows={kffr ?? []} columns={[
          ["점수","priority_percent"],["작물","crop_name"],["기능키워드","functional_keyword"],["제품컨셉","product_concept"],
          ["한미양행 이유","hanmi_reason"],["KFFR 이유","kffr_reason"],["농가구제 이유","farmer_rescue_reason"],["원료형태","raw_material_form"],["다음행동","next_action"],["상태","status"]
        ]} />

        <div className="mt-5" />

        <Table title="폭락작물 가공전환 전략" rows={processing ?? []} columns={[
          ["기회%","opportunity_percent"],["긴급%","urgency_percent"],["작물","crop_name"],["폭락/기회 이유","trigger_reason"],
          ["제품 아이디어","product_idea"],["원료형태","raw_material_form"],["가공방식","processing_method"],["대상 바이어","target_buyer"],["농가구제 이유","farmer_rescue_reason"],["상태","status"]
        ]} />

        <div className="mt-5" />

        <Table title="K-AGRI 관리 작물 마스터" rows={crops ?? []} columns={[
          ["작물","crop_name"],["그룹","crop_group"],["대표지역","region_hint"],["단위","standard_unit"],["우선","is_priority"],["KFFR","is_kffr_candidate"],["메모","story_note"]
        ]} />
      </div>
    </main>
  );
}

function Summary({ title, value }: { title: string; value: string }) {
  return <div className="border-r border-black p-4"><p className="font-bold text-gray-500">{title}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function Card({ title, value }: { title: string; value: string }) {
  return <div className="border border-black bg-[#f4f7f2] p-4"><p className="font-black text-gray-500">{title}</p><p className="mt-2 text-lg font-black">{value}</p></div>;
}

function Table({ title, rows, columns }: { title: string; rows: any[]; columns: string[][] }) {
  return (
    <section className="border border-black bg-white">
      <div className="flex justify-between border-b border-black bg-gray-100 p-3">
        <h2 className="text-2xl font-black">{title}</h2>
        <p className="font-black">총 {rows.length}건</p>
      </div>
      <div className="overflow-auto">
        <table className="w-full min-w-[1800px] border-collapse text-sm">
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
