import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const farm = {
  farmerName: "김철수 농민",
  region: "경북 영양",
  crop: "고추",
  variety: "홍고추",
  cultivationType: "노지",
  transplantDate: "2026-04-25",
  area: "3,000평",
  continuousYears: "4년차",
};

function daysAfter(dateText: string) {
  const today = new Date("2026-06-17");
  const planted = new Date(dateText);
  const diff = today.getTime() - planted.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export default async function MyFarmPage() {
  const supabase = createSupabaseAdminClient();

  const afterDays = daysAfter(farm.transplantDate);
  const currentMonth = 6;

  const { data } = await supabase
    .from("agri_calendar_rules")
    .select("*")
    .eq("crop", "고추")
    .eq("month", currentMonth)
    .eq("status", "active")
    .order("risk_level", { ascending: false })
    .limit(5);

  const rules = data ?? [];

  return (
    <main className="min-h-screen bg-[#f4f6f8] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-3xl bg-black p-7 text-white">
          <div className="text-sm font-black text-green-400">K-AGRI FARM OS</div>
          <h1 className="mt-3 text-4xl font-black">내 농장</h1>
          <p className="mt-3 text-gray-300">
            로그인하면 내 농장의 작물·지역·정식일·평수를 기준으로 이번 주 해야 할 일을 알려줍니다.
          </p>
        </section>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow">
          <h2 className="text-3xl font-black">{farm.farmerName}의 농장</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Info title="지역" value={farm.region} />
            <Info title="작물" value={`${farm.crop} / ${farm.variety}`} />
            <Info title="재배형태" value={farm.cultivationType} />
            <Info title="면적" value={farm.area} />
            <Info title="정식일" value={farm.transplantDate} />
            <Info title="정식 후" value={`${afterDays}일`} />
            <Info title="연작년수" value={farm.continuousYears} />
            <Info title="현재 단계" value="착과기·장마 전 관리" />
          </div>
        </section>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow">
          <h2 className="text-3xl font-black">이번 주 농업지시서</h2>
          <p className="mt-2 font-bold text-red-600">
            원칙: 문제 생기고 나서가 아니라 최소 2주 전에 준비합니다.
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {rules.slice(0, 3).map((r: any, i: number) => (
              <div key={r.id} className="rounded-3xl border-2 border-black p-5">
                <div className="text-xl font-black">지시 {i + 1}</div>
                <h3 className="mt-3 text-2xl font-black">{r.event_name}</h3>
                <div className="mt-3 rounded-xl bg-red-50 p-3 font-black text-red-700">
                  위험도 {r.risk_level}
                </div>
                <p className="mt-4 text-lg font-bold leading-relaxed">
                  {r.action_instruction}
                </p>
                <div className="mt-4 rounded-xl bg-yellow-50 p-3">
                  <div className="font-black">필요 자재</div>
                  <div>{r.material_needed || "확인 필요"}</div>
                </div>
                <div className="mt-3 text-sm text-gray-500">
                  근거: 안이영 PPT {r.source_page_number}p
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-3xl font-black">오늘 찍어야 할 사진</h2>
            <div className="mt-5 space-y-3 text-lg font-bold">
              <div>✓ 포장 전체 사진 1장</div>
              <div>✓ 고추 잎 근접 사진 2장</div>
              <div>✓ 열매·꽃 사진 2장</div>
              <div>✓ 이상 증상 부위 사진 2장</div>
            </div>
            <p className="mt-5 rounded-2xl bg-green-50 p-4 font-bold text-green-800">
              이 사진은 병해충 예방, 수확량 예측, 생산이력서, 직판장 판매자료에 사용됩니다.
            </p>
            <button className="mt-5 w-full rounded-2xl bg-green-700 py-4 text-xl font-black text-white">
              사진 올리기
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <h2 className="text-3xl font-black">이번 주 위험 신호</h2>
            <div className="mt-5 space-y-4">
              <Risk title="총채벌레" level="높음" />
              <Risk title="역병·과습" level="주의" />
              <Risk title="칼슘 부족" level="주의" />
              <Risk title="장마 대비" level="긴급 점검" />
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-3xl bg-white p-6 shadow">
          <h2 className="text-3xl font-black">추천 영상 · 추천 제품</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border p-5">
              <h3 className="text-2xl font-black">먼저 볼 영상</h3>
              <p className="mt-3 font-bold">
                장마 전 고추밭에서 반드시 확인해야 할 3가지
              </p>
              <button className="mt-4 rounded-xl bg-black px-5 py-3 font-black text-white">
                영상 보기
              </button>
            </div>

            <div className="rounded-2xl border p-5">
              <h3 className="text-2xl font-black">필요 가능 자재</h3>
              <p className="mt-3 font-bold">
                칼슘 · 아미노산 · 발근제 · 살균제
              </p>
              <p className="mt-2 text-sm text-gray-500">
                제품은 농업지시서 기준으로만 추천합니다.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Info({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-gray-50 p-4">
      <div className="text-sm font-bold text-gray-500">{title}</div>
      <div className="mt-1 text-xl font-black">{value}</div>
    </div>
  );
}

function Risk({ title, level }: { title: string; level: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border p-4">
      <div className="text-xl font-black">{title}</div>
      <div className="rounded-full bg-red-100 px-4 py-2 font-black text-red-700">
        {level}
      </div>
    </div>
  );
}
