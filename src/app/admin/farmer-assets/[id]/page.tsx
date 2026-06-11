import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function calcGrade(item: any) {
  const revenue = n(item.total_revenue_krw || item.total_purchase_amount);
  const orders = n(item.order_count);
  const area = n(item.farm_area_pyeong);
  const consults = n(item.consult_count);

  if (revenue >= 1000000 || orders >= 10 || area >= 10000) return "S";
  if (revenue >= 500000 || orders >= 5 || consults >= 5) return "A";
  if (revenue >= 200000 || orders >= 2 || consults >= 2) return "B";
  return "C";
}

function areaText(item: any) {
  if (item.farm_area_pyeong && item.farm_area_pyeong > 0) {
    return `${n(item.farm_area_pyeong).toLocaleString()}평`;
  }
  return item.farm_area || "-";
}

function aiRecommendations(item: any) {
  const recs: string[] = [];

  if (n(item.joint_score) < 75) recs.push("MSM 관절 공동구매 추천");
  if (n(item.blood_score) < 75) recs.push("혈행 건강 제품 추천");
  if (n(item.eye_score) < 75) recs.push("루테인 눈건강 제품 추천");
  if ((item.crop || "").includes("마늘")) recs.push("마늘 저장·병해충 교육 추천");
  if ((item.crop || "").includes("딸기")) recs.push("딸기 생육관리 교육 추천");

  return recs.length ? recs : ["현재 추가 추천 없음"];
}

export default async function FarmerAssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: item } = await supabase
    .from("farmer_assets")
    .select("*")
    .eq("id", id)
    .single();

  const { data: logs } = await supabase
    .from("farmer_activity_logs")
    .select("*")
    .eq("farmer_id", id)
    .order("created_at", { ascending: false });

  if (!item) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] p-5 text-black">
        <Link href="/admin/farmer-assets" className="rounded bg-black px-4 py-3 font-black text-white">
          ← 농민 자산센터
        </Link>
        <div className="mt-6 border bg-white p-6 font-black">농민 정보를 찾을 수 없습니다.</div>
      </main>
    );
  }

  const revenue = n(item.total_revenue_krw || item.total_purchase_amount);
  const recs = aiRecommendations(item);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-5 text-black">
      <div className="mx-auto max-w-[1900px] space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/admin/farmer-assets" className="rounded bg-black px-4 py-3 font-black text-white">
            ← 농민 자산센터
          </Link>

          <div className="flex gap-2">
            <button className="rounded bg-green-700 px-4 py-3 font-black text-white">문자발송</button>
            <button className="rounded bg-blue-700 px-4 py-3 font-black text-white">CRM 등록</button>
            <button className="rounded bg-orange-600 px-4 py-3 font-black text-white">건강관리</button>
          </div>
        </div>

        <section className="border bg-white p-5">
          <p className="text-xs font-black text-green-700">FARMER ASSET CARD</p>
          <h1 className="mt-1 text-4xl font-black">{item.name} 자산카드</h1>
          <p className="mt-2 text-xl font-bold text-neutral-700">
            {item.region || "-"} · {item.crop || "-"} · {areaText(item)}
          </p>
        </section>

        <section className="grid gap-2 md:grid-cols-5">
          <Stat title="등급" value={calcGrade(item)} />
          <Stat title="건강점수" value={`${n(item.health_score)}점`} />
          <Stat title="총 주문" value={`${n(item.order_count)}회`} />
          <Stat title="총 매출" value={`${revenue.toLocaleString()}원`} />
          <Stat title="행동로그" value={`${logs?.length || 0}건`} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Box
            title="농사 프로필"
            rows={[
              ["이름", item.name || "-"],
              ["전화", item.phone || "-"],
              ["지역", item.region || "-"],
              ["작목", item.crop || "-"],
              ["재배면적", areaText(item)],
            ]}
          />

          <Box
            title="건강 프로필"
            rows={[
              ["건강점수", `${n(item.health_score)}점`],
              ["관절", `${n(item.joint_score)}점`],
              ["혈행", `${n(item.blood_score)}점`],
              ["눈건강", `${n(item.eye_score)}점`],
              ["면역", `${n(item.immune_score)}점`],
              ["수면", `${n(item.sleep_score)}점`],
            ]}
          />

          <Box
            title="구매 프로필"
            rows={[
              ["총 주문", `${n(item.order_count)}회`],
              ["총 매출", `${revenue.toLocaleString()}원`],
              ["관심제품", item.interest_products || "-"],
              ["공동구매", `${n(item.groupbuy_count)}회`],
            ]}
          />

          <Box
            title="AI 추천"
            rows={recs.map((v, i) => [`추천 ${i + 1}`, v])}
          />
        </section>

        <section className="border bg-white">
          <h2 className="border-b bg-neutral-100 px-4 py-3 text-xl font-black">
            행동 로그
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-200">
                  <Th>일시</Th>
                  <Th>유형</Th>
                  <Th>내용</Th>
                  <Th>값</Th>
                  <Th>출처</Th>
                  <Th>메모</Th>
                </tr>
              </thead>
              <tbody>
                {(logs ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="border p-5 text-center font-black text-neutral-500">
                      행동 로그가 없습니다.
                    </td>
                  </tr>
                ) : (
                  (logs ?? []).map((log: any) => (
                    <tr key={log.id} className="hover:bg-green-50">
                      <Td>{String(log.created_at || "").slice(0, 16)}</Td>
                      <Td strong>{log.activity_type || "-"}</Td>
                      <Td>{log.activity_title || "-"}</Td>
                      <Td>{log.activity_value || "-"}</Td>
                      <Td>{log.source || "-"}</Td>
                      <Td>{log.memo || "-"}</Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border bg-white px-4 py-3">
      <p className="text-xs font-black text-neutral-500">{title}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Box({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="border bg-white">
      <h2 className="border-b bg-neutral-100 px-4 py-3 text-xl font-black">{title}</h2>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="w-40 border bg-neutral-50 px-3 py-3 font-black">{k}</td>
              <td className="border px-3 py-3 font-bold">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border px-3 py-2 text-left font-black">{children}</th>;
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <td className={`border px-3 py-2 ${strong ? "font-black" : "font-bold text-neutral-700"}`}>
      {children}
    </td>
  );
}
