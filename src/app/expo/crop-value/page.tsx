import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function won(v: unknown) {
  return `${Number(v ?? 0).toLocaleString("ko-KR")}원`;
}

function mainMessage(status?: string | null) {
  if (status === "강세") return "급하게 팔기보다, 바이어 제안을 먼저 받아보는 것이 유리할 수 있습니다.";
  if (status === "폭락주의") return "출하가 몰릴 가능성이 있습니다. 가격 확인 후 신중하게 판단하세요.";
  if (status === "위험") return "수입·정부개입·과잉출하 신호가 있어 주의가 필요합니다.";
  return "현재는 시장 흐름을 조금 더 확인하는 것이 좋습니다.";
}

export default async function CropValuePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const crop = String(sp.crop ?? "").trim();

  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("crop_market_signals")
    .select("*")
    .or(`crop_name.ilike.%${crop}%,region_name.ilike.%${crop}%`)
    .limit(1);

  const row = data?.[0];

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-3xl">
        <Link href="/expo" className="font-black text-green-700">
          ← K-Agri Expo
        </Link>

        {!row ? (
          <section className="mt-8 rounded-3xl bg-white p-8 text-center shadow-xl">
            <h1 className="text-4xl font-black">{crop}</h1>
            <p className="mt-5 text-2xl font-black">
              지금 시장 데이터를 확인 중입니다.
            </p>
            <p className="mt-4 text-lg font-bold text-gray-600">
              K-AGRI는 근거 없는 가격을 제시하지 않습니다. 공공가격, 시장뉴스, 수입동향, 정부정책, 현장 데이터를 모아 분석합니다.
            </p>
            <Link
              href={`/expo/agri-market-report?crop=${encodeURIComponent(crop)}`}
              className="mt-8 inline-block rounded-2xl bg-green-700 px-8 py-5 text-xl font-black text-white"
            >
              내가 아는 가격 입력하기
            </Link>
          </section>
        ) : (
          <section className="mt-8 rounded-3xl bg-white p-8 shadow-xl">
            <p className="text-sm font-black text-green-700">K-AGRI 시장신호</p>

            <h1 className="mt-2 text-5xl font-black">{row.crop_name}</h1>

            <div className="mt-6 rounded-3xl bg-[#f4f7f2] p-6 text-center">
              <p className="text-lg font-black text-gray-600">현재 참고가격</p>
              <p className="mt-2 text-6xl font-black text-green-700">
                {won(row.today_price)}
              </p>
              <p className="mt-2 text-lg font-bold text-gray-600">
                / {row.standard_unit || "kg"} 기준
              </p>
            </div>

            <div className="mt-6 rounded-3xl border p-6">
              <p className="text-lg font-black text-gray-500">오늘의 한 줄 판단</p>
              <p className="mt-3 text-3xl font-black">
                {mainMessage(row.signal_status)}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Box title="방어가격" value={won(row.defense_price)} />
              <Box title="협상가격" value={won(row.negotiation_price)} />
              <Box title="목표가격" value={won(row.target_price)} />
            </div>

            <div className="mt-6 grid grid-cols-4 gap-3">
              <Box title="신뢰도" value={`${row.data_confidence_percent || 0}%`} />
              <Box title="공공데이터" value={`${row.public_data_percent || 0}%`} />
              <Box title="현장데이터" value={`${row.field_data_percent || 0}%`} />
              <Box title="해외데이터" value={`${row.global_data_percent || 0}%`} />
            </div>

            <section className="mt-6 rounded-3xl border bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-black">근거 있는 가격인가요?</p>
                  <p className="mt-1 font-bold text-gray-600">
                    이 가격은 여러 데이터 출처를 비중과 신뢰도로 나누어 반영한 참고가격입니다.
                  </p>
                </div>
                <Link
                  href={`/expo/crop-value/evidence/${encodeURIComponent(row.crop_name)}`}
                  className="rounded-2xl bg-green-700 px-6 py-4 font-black text-white"
                >
                  근거 데이터 상세보기
                </Link>
              </div>
            </section>

            {row.breed_story ? (
              <section className="mt-6 rounded-3xl bg-yellow-50 p-6">
                <h2 className="text-2xl font-black">품종 이야기</h2>
                <p className="mt-3 text-lg font-bold text-gray-800">{row.breed_story}</p>
              </section>
            ) : null}

            <details className="mt-6 rounded-2xl border p-5">
              <summary className="cursor-pointer text-lg font-black">
                왜 이렇게 나왔나요?
              </summary>
              <div className="mt-4 space-y-2 font-bold text-gray-700">
                <p>수입위험: {row.import_risk}%</p>
                <p>정부개입위험: {row.government_risk}%</p>
                <p>과잉출하위험: {row.oversupply_risk}%</p>
                <p>현장제보: {row.farmer_report_count}건</p>
                <p>분석근거: {row.ai_summary}</p>
              </div>
            </details>

            <section className="mt-6 rounded-3xl bg-green-50 p-6">
              <h2 className="text-2xl font-black">
                더 정확한 분석을 원하십니까?
              </h2>
              <p className="mt-2 font-bold text-gray-700">
                농부님의 실제 거래가격, 재배면적, 저장물량이 더해질수록 K-AGRI의 시장신호는 더 정확해집니다.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Link href={`/expo/agri-market-report?crop=${encodeURIComponent(row.crop_name)}`} className="rounded-2xl bg-green-700 px-5 py-4 text-center font-black text-white">
                  실제 가격 입력
                </Link>
                <Link href="/expo/agri-exchange/register" className="rounded-2xl bg-black px-5 py-4 text-center font-black text-white">
                  내 물량 등록
                </Link>
                <Link href="/expo/agri-exchange/market" className="rounded-2xl bg-blue-700 px-5 py-4 text-center font-black text-white">
                  바이어 보기
                </Link>
              </div>
            </section>

            <p className="mt-6 text-xs font-bold text-gray-500">
              본 정보는 시장가격, 수입동향, 정부정책, 기후위험, 현장 제보 등을 기반으로 한 참고 정보입니다.
              K-AGRI는 가격과 거래 결과를 보장하지 않으며 최종 판단은 이용자 본인의 책임입니다.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function Box({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 text-center">
      <p className="font-bold text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
