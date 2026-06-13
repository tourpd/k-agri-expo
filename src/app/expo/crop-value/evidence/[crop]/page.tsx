import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pct(v: unknown) {
  return `${Number(v ?? 0).toLocaleString("ko-KR")}%`;
}

export default async function CropEvidencePage({
  params,
}: {
  params: Promise<{ crop: string }>;
}) {
  const { crop } = await params;
  const cropName = decodeURIComponent(crop);

  const supabase = createSupabaseAdminClient();

  const { data: rows } = await supabase
    .from("crop_price_evidence")
    .select("*")
    .ilike("crop_name", `%${cropName}%`)
    .order("weight_percent", { ascending: false });

  const evidence = rows ?? [];
  const confidence = evidence.length
    ? Math.round(evidence.reduce((s:any,r:any)=>s+Number(r.confidence_percent??0),0) / evidence.length)
    : 0;

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href={`/expo/crop-value?crop=${encodeURIComponent(cropName)}`} className="font-black text-green-700">
          ← 가격 결과로 돌아가기
        </Link>

        <section className="mt-6 rounded-3xl bg-white p-8 shadow-xl">
          <p className="font-black text-green-700">K-AGRI PRICE EVIDENCE</p>
          <h1 className="mt-2 text-5xl font-black">{cropName} 가격 근거 데이터</h1>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Box title="반영 데이터" value={`${evidence.length}건`} />
            <Box title="평균 신뢰도" value={`${confidence}%`} />
            <Box title="근거 공개" value="상세보기" />
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[900px] border-collapse bg-white text-left">
              <thead className="bg-gray-100">
                <tr>
                  <Th>데이터</Th>
                  <Th>출처</Th>
                  <Th>등급</Th>
                  <Th>방향</Th>
                  <Th>반영비중</Th>
                  <Th>신뢰도</Th>
                  <Th>요약</Th>
                </tr>
              </thead>
              <tbody>
                {evidence.map((r:any) => (
                  <tr key={r.id} className="border-t">
                    <Td strong>{r.evidence_type}</Td>
                    <Td>{r.source_name}</Td>
                    <Td>{r.source_grade}</Td>
                    <Td>{r.signal_direction}</Td>
                    <Td green>{pct(r.weight_percent)}</Td>
                    <Td green>{pct(r.confidence_percent)}</Td>
                    <Td>{r.summary}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-6 text-sm font-bold text-gray-500">
            본 데이터는 가격을 보장하는 자료가 아니라 시장 판단을 돕기 위한 참고 근거입니다. 최종 판매 판단과 거래 결정은 이용자 본인의 책임입니다.
          </p>
        </section>
      </div>
    </main>
  );
}

function Box({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border bg-white p-5"><p className="font-bold text-gray-500">{title}</p><p className="mt-2 text-3xl font-black">{value}</p></div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-r px-4 py-3 text-sm font-black">{children}</th>;
}

function Td({ children, strong, green }: { children: React.ReactNode; strong?: boolean; green?: boolean }) {
  return <td className={`border-r px-4 py-3 text-sm ${strong ? "font-black" : "font-bold"} ${green ? "text-green-700" : ""}`}>{children}</td>;
}
