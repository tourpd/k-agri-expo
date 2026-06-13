import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function won(v: unknown) {
  const n = Number(v ?? 0);
  return `${n.toLocaleString("ko-KR")}원`;
}

function badge(status?: string | null) {
  if (status === "강세") return "bg-green-100 text-green-800 border-green-700";
  if (status === "위험" || status === "폭락주의") return "bg-red-100 text-red-800 border-red-700";
  return "bg-yellow-100 text-yellow-800 border-yellow-700";
}

export default async function AgriMarketRadarPage() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("crop_market_signals")
    .select("*")
    .order("updated_at", { ascending: false });

  const rows = data ?? [];

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-4 text-black">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-black text-green-700">K-AGRI MARKET RADAR</p>
            <h1 className="text-4xl font-black md:text-6xl">
              농산물 시장 레이더
            </h1>
            <p className="mt-2 text-lg font-bold text-gray-700">
              가격을 예언하지 않습니다. 시장 신호를 모아 농민의 판매 판단을 돕습니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/expo/agri-market-report" className="rounded-xl bg-green-700 px-5 py-3 font-black text-white">
              현장 제보
            </Link>
            <Link href="/expo/agri-exchange/register" className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white">
              내 농산물 등록
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-700 bg-red-50 p-5 font-black text-red-700">
            crop_market_signals 테이블이 아직 없습니다. supabase/sql/create_crop_market_signals.sql 내용을 Supabase SQL Editor에서 먼저 실행하세요.
          </div>
        ) : (
          <>
            <section className="mb-5 grid gap-3 md:grid-cols-3">
              <TopBox title="오늘 팔아도 되는 작물" value={rows.filter((r:any)=>r.signal_status==="강세").map((r:any)=>r.crop_name).join(", ") || "-"} color="green" />
              <TopBox title="오늘 조심해야 할 작물" value={rows.filter((r:any)=>r.signal_status==="위험" || r.signal_status==="폭락주의").map((r:any)=>r.crop_name).join(", ") || "-"} color="red" />
              <TopBox title="현장 제보 건수" value={`${rows.reduce((s:number,r:any)=>s+Number(r.farmer_report_count??0),0)}건`} color="yellow" />
            </section>

            <section className="grid gap-4">
              {rows.map((r:any) => (
                <article key={r.id} className="rounded-3xl border bg-white p-5 shadow">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className={`inline-flex rounded-full border px-4 py-2 text-lg font-black ${badge(r.signal_status)}`}>
                        {r.signal_status}
                      </div>
                      <h2 className="mt-4 text-4xl font-black">
                        {r.crop_name}
                      </h2>
                      <p className="mt-1 font-bold text-gray-600">
                        {r.region_name || "전국"} · 기준 {r.standard_unit || "kg"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-gray-500">현재 기준가격</p>
                      <p className="text-4xl font-black text-green-700">
                        {won(r.today_price)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <Metric title="최저 방어가격" value={won(r.defense_price)} />
                    <Metric title="협상 시작가격" value={won(r.negotiation_price)} />
                    <Metric title="목표가격" value={won(r.target_price)} />
                    <Metric title="전주 대비" value={`${Number(r.today_price ?? 0) - Number(r.last_week_price ?? 0) >= 0 ? "+" : ""}${won(Number(r.today_price ?? 0) - Number(r.last_week_price ?? 0))}`} />
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <Risk title="수입위험" score={Number(r.import_risk ?? 0)} />
                    <Risk title="정부개입위험" score={Number(r.government_risk ?? 0)} />
                    <Risk title="과잉출하위험" score={Number(r.oversupply_risk ?? 0)} />
                    <Risk title="현장 제보" score={Number(r.farmer_report_count ?? 0)} suffix="건" />
                  </div>

                  <div className="mt-5 rounded-2xl bg-gray-50 p-5">
                    <h3 className="text-xl font-black">시장 신호 요약</h3>
                    <p className="mt-2 text-lg font-bold text-gray-800">
                      {r.ai_summary || "아직 분석 내용이 없습니다."}
                    </p>
                    <div className="mt-4 rounded-xl bg-white p-4 font-black text-green-800">
                      참고 행동: {r.ai_action || "데이터 축적 후 판단"}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link href="/expo/agri-exchange/market" className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white">
                      거래소 보기
                    </Link>
                    <Link href="/expo/agri-exchange/register" className="rounded-xl bg-green-700 px-5 py-3 font-black text-white">
                      내 농산물 등록
                    </Link>
                    <Link href="/expo/agri-market-report" className="rounded-xl bg-black px-5 py-3 font-black text-white">
                      현장 제보하기
                    </Link>
                  </div>

                  <p className="mt-4 text-xs font-bold text-gray-500">
                    본 정보는 공공데이터, 시장가격, 반입량, 수입동향, 저장물량, 농민 제보 등을 기반으로 한 참고 정보입니다. 최종 판매 판단과 거래 결정은 이용자 본인의 책임입니다.
                  </p>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function TopBox({ title, value, color }: { title: string; value: string; color: "green" | "red" | "yellow" }) {
  const cls = color === "green" ? "border-green-700 bg-green-50 text-green-800" : color === "red" ? "border-red-700 bg-red-50 text-red-800" : "border-yellow-700 bg-yellow-50 text-yellow-800";
  return <div className={`rounded-2xl border p-5 ${cls}`}><p className="font-black">{title}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function Metric({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl border bg-white p-4"><p className="font-bold text-gray-500">{title}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function Risk({ title, score, suffix = "점" }: { title: string; score: number; suffix?: string }) {
  const high = score >= 70;
  const mid = score >= 40 && score < 70;
  const cls = high ? "text-red-700" : mid ? "text-yellow-700" : "text-green-700";
  return <div className="rounded-2xl border bg-white p-4"><p className="font-bold text-gray-500">{title}</p><p className={`mt-2 text-2xl font-black ${cls}`}>{score}{suffix}</p></div>;
}
