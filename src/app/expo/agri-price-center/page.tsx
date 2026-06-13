import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function won(v: unknown) {
  const n = Number(v ?? 0);
  return `${n.toLocaleString("ko-KR")}원`;
}

function statusStyle(status: string) {
  if (status === "강세") return "bg-green-700 text-white";
  if (status === "위험" || status === "폭락주의") return "bg-red-700 text-white";
  return "bg-yellow-500 text-black";
}

function actionText(status: string) {
  if (status === "강세") return "전량 판매보다 분할판매·바이어제안 검토";
  if (status === "폭락주의") return "집중출하 주의·직거래 확보·출하분산 필요";
  if (status === "위험") return "추가 저장 주의·선별강화·가공전환 검토";
  return "시장 상황 확인 후 관망";
}

export default async function AgriPriceCenterPage() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("crop_market_signals")
    .select("*")
    .order("updated_at", { ascending: false });

  const rows = data ?? [];

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-black text-green-700">K-AGRI PRICE DEFENSE CENTER</p>
            <h1 className="text-4xl font-black md:text-6xl">
              농산물 가격방어센터
            </h1>
            <p className="mt-3 text-lg font-bold text-gray-700">
              오늘 팔지, 기다릴지, 가공할지. 데이터를 근거로 농민의 판단을 돕습니다.
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

        <section className="mb-6 rounded-3xl bg-black p-6 text-white">
          <h2 className="text-3xl font-black">아침에 이것만 보세요</h2>
          <p className="mt-2 text-lg font-bold text-gray-300">
            가격 예측이 아니라, 현재 데이터 기준의 시장 신호입니다.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Morning title="지금 팔아도 되는 작물" value={rows.filter((r:any)=>r.signal_status==="강세").map((r:any)=>r.crop_name).join(", ") || "-"} />
            <Morning title="조심해야 할 작물" value={rows.filter((r:any)=>r.signal_status==="위험").map((r:any)=>r.crop_name).join(", ") || "-"} />
            <Morning title="폭락주의 작물" value={rows.filter((r:any)=>r.signal_status==="폭락주의").map((r:any)=>r.crop_name).join(", ") || "-"} />
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-700 bg-red-50 p-5 font-black text-red-700">
            crop_market_signals 테이블을 확인하세요.
          </div>
        ) : (
          <section className="grid gap-5">
            {rows.map((r:any) => (
              <article key={r.id} className="overflow-hidden rounded-3xl border bg-white shadow">
                <div className="grid md:grid-cols-[220px_1fr]">
                  <div className={`${statusStyle(r.signal_status)} flex flex-col justify-center p-6`}>
                    <p className="text-lg font-black">시장 신호</p>
                    <h2 className="mt-2 text-4xl font-black">{r.signal_status}</h2>
                    <p className="mt-4 text-sm font-bold opacity-90">
                      {r.region_name} · {r.standard_unit} 기준
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-4xl font-black">{r.crop_name}</h3>
                        <p className="mt-2 text-xl font-black text-green-700">
                          현재 기준가격 {won(r.today_price)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-gray-100 p-4 text-right">
                        <p className="font-bold text-gray-500">전주 대비</p>
                        <p className="text-2xl font-black">
                          {Number(r.today_price) - Number(r.last_week_price) >= 0 ? "+" : ""}
                          {won(Number(r.today_price) - Number(r.last_week_price))}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <PriceBox title="최저 방어가격" value={won(r.defense_price)} desc="이 가격 이하 주의" />
                      <PriceBox title="협상 시작가격" value={won(r.negotiation_price)} desc="바이어 협상 기준" />
                      <PriceBox title="목표가격" value={won(r.target_price)} desc="희망 판매 기준" />
                    </div>

                    <div className="mt-5 rounded-2xl bg-[#f4f7f2] p-5">
                      <p className="text-2xl font-black">오늘의 참고 행동</p>
                      <p className="mt-2 text-xl font-black text-green-800">
                        {r.ai_action || actionText(r.signal_status)}
                      </p>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      <Signal label="수입위험" value={Number(r.import_risk ?? 0)} />
                      <Signal label="정부개입위험" value={Number(r.government_risk ?? 0)} />
                      <Signal label="과잉출하위험" value={Number(r.oversupply_risk ?? 0)} />
                    </div>

                    <details className="mt-5 rounded-2xl border bg-white p-4">
                      <summary className="cursor-pointer text-lg font-black">
                        왜 이렇게 판단했나요? 근거 보기
                      </summary>
                      <div className="mt-4 space-y-3 font-bold text-gray-700">
                        <p>현재가: {won(r.today_price)}</p>
                        <p>지난주: {won(r.last_week_price)}</p>
                        <p>지난달: {won(r.last_month_price)}</p>
                        <p>반입량 변화율: {r.volume_change_rate ?? 0}%</p>
                        <p>현장 제보: {r.farmer_report_count ?? 0}건</p>
                        <p>요약: {r.ai_summary}</p>
                        <p>데이터 출처: {r.data_sources}</p>
                      </div>
                    </details>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <Link href="/expo/agri-market-report" className="rounded-xl bg-black px-5 py-3 font-black text-white">
                        현장 제보하기
                      </Link>
                      <Link href="/expo/agri-exchange/register" className="rounded-xl bg-green-700 px-5 py-3 font-black text-white">
                        내 농산물 등록
                      </Link>
                      <Link href="/expo/agri-exchange/market" className="rounded-xl bg-blue-700 px-5 py-3 font-black text-white">
                        거래소 보기
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        <p className="mt-8 rounded-2xl bg-white p-5 text-sm font-bold text-gray-600">
          본 정보는 공공데이터, 시장가격, 반입량, 수입동향, 저장물량, 농민 현장 제보 등을 바탕으로 한 참고 정보입니다.
          K-AGRI는 가격을 보장하거나 판매 결과를 책임지지 않습니다. 최종 판매 판단과 거래 결정은 이용자 본인의 책임입니다.
        </p>
      </div>
    </main>
  );
}

function Morning({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-5">
      <p className="font-bold text-gray-300">{title}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function PriceBox({ title, value, desc }: { title: string; value: string; desc: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="font-bold text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-1 font-bold text-gray-500">{desc}</p>
    </div>
  );
}

function Signal({ label, value }: { label: string; value: number }) {
  const cls = value >= 70 ? "text-red-700" : value >= 40 ? "text-yellow-700" : "text-green-700";
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="font-bold text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${cls}`}>{value}점</p>
    </div>
  );
}
