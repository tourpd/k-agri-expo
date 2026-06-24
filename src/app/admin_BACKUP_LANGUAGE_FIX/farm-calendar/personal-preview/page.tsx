import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TODAY = new Date("2026-06-16T09:00:00+09:00");

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function monthNo(date: Date) {
  return date.getMonth() + 1;
}

function labelDate(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function periodLabel(days: number) {
  if (days === 0) return "오늘";
  if (days === 7) return "7일 후";
  if (days === 14) return "14일 후";
  if (days === 30) return "30일 후";
  return `${days}일 후`;
}

function Pill({ children, color = "gray" }: { children: React.ReactNode; color?: "green" | "blue" | "yellow" | "red" | "gray" }) {
  const cls =
    color === "green" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    color === "blue" ? "bg-blue-50 text-blue-700 border-blue-200" :
    color === "yellow" ? "bg-amber-50 text-amber-800 border-amber-200" :
    color === "red" ? "bg-red-50 text-red-700 border-red-200" :
    "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`inline-flex rounded border px-2 py-1 text-sm font-black ${cls}`}>{children}</span>;
}

export default async function PersonalFarmCalendarPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<{
    crop?: string;
    region?: string;
    area?: string;
    farm_type?: string;
    planting_date?: string;
  }>;
}) {
  const sp = await searchParams;

  const crop = sp?.crop || "고추";
  const region = sp?.region || "경기 고양시";
  const area = sp?.area || "1000평";
  const farmType = sp?.farm_type || "노지";
  const plantingDate = sp?.planting_date || "2026-04-20";

  const supabase = createSupabaseAdminClient();

  const periods = [0, 7, 14, 30].map((days) => {
    const date = addDays(TODAY, days);
    return {
      days,
      date,
      month: monthNo(date),
      label: periodLabel(days),
      dateLabel: labelDate(date),
    };
  });

  const months = Array.from(new Set(periods.map((p) => p.month)));

  const { data, error } = await supabase
    .from("farm_calendar_actions")
    .select("*")
    .eq("crop", crop)
    .in("month_no", months)
    .order("month_no", { ascending: true })
    .order("importance_score", { ascending: false })
    .limit(200);

  const rows = (data || []) as any[];

  const grouped = periods.map((p) => {
    const items = rows
      .filter((r) => r.month_no === p.month)
      .slice(0, 5);

    return {
      ...p,
      items,
    };
  });

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/farm-calendar" className="text-2xl font-black text-emerald-600">← 농사캘린더 엔진</Link>
            <div className="h-8 w-px bg-slate-300" />
            <h1 className="text-2xl font-black">개인 맞춤 농사캘린더 미리보기</h1>
          </div>
          <Link href="/expo/my-farm" className="rounded-lg bg-emerald-600 px-5 py-3 font-black text-white">
            고객 화면 보기
          </Link>
        </div>
      </header>

      <section className="w-full px-8 py-6">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-sm font-black text-emerald-700">PERSONAL FARM CALENDAR PREVIEW</div>
          <h2 className="mt-2 text-4xl font-black">
            {region} {crop} 농가 맞춤 30일 농사계획
          </h2>
          <p className="mt-2 text-lg font-bold text-slate-600">
            기준일은 2026년 6월 16일입니다. 오늘·7일 후·14일 후·30일 후 필요한 작업, 콘텐츠, 농자재, 공동구매를 미리 준비합니다.
          </p>

          {error ? (
            <div className="mt-4 rounded bg-red-50 px-4 py-3 font-black text-red-700">
              DB 조회 오류: {error.message}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-5 gap-4">
            <Stat title="작물" value={crop} />
            <Stat title="지역" value={region} />
            <Stat title="면적" value={area} />
            <Stat title="재배형태" value={farmType} />
            <Stat title="정식일" value={plantingDate} />
          </div>
        </div>

        <form className="mt-4 grid grid-cols-6 gap-3 rounded-lg border bg-white p-3">
          <input name="crop" defaultValue={crop} placeholder="작물 예: 고추" className="h-14 rounded border px-4 text-lg font-black" />
          <input name="region" defaultValue={region} placeholder="지역 예: 경기 고양시" className="h-14 rounded border px-4 text-lg font-black" />
          <input name="area" defaultValue={area} placeholder="면적 예: 1000평" className="h-14 rounded border px-4 text-lg font-black" />
          <select name="farm_type" defaultValue={farmType} className="h-14 rounded border px-4 text-lg font-black">
            <option value="노지">노지</option>
            <option value="시설">시설</option>
            <option value="하우스">하우스</option>
          </select>
          <input name="planting_date" defaultValue={plantingDate} placeholder="정식일" className="h-14 rounded border px-4 text-lg font-black" />
          <button className="h-14 rounded bg-emerald-600 px-6 text-lg font-black text-white">미리보기</button>
        </form>

        <div className="mt-5 grid grid-cols-1 gap-5">
          {grouped.map((g) => (
            <div key={g.days} className="rounded-xl border bg-white">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h3 className="text-3xl font-black">
                    {g.label} · {g.dateLabel}
                  </h3>
                  <p className="mt-1 font-bold text-slate-500">
                    {crop} {g.month}월 기준 농사캘린더에서 추출한 맞춤 작업입니다.
                  </p>
                </div>

                {g.days === 14 ? (
                  <div className="rounded-xl bg-orange-50 px-5 py-3 text-xl font-black text-orange-700">
                    공동구매 준비 핵심 구간
                  </div>
                ) : null}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1700px] border-collapse text-base">
                  <thead>
                    <tr className="bg-slate-200 text-left">
                      <th className="border px-4 py-3">문제/주제</th>
                      <th className="border px-4 py-3">고객 행동지시</th>
                      <th className="border px-4 py-3">추천 농자재</th>
                      <th className="border px-4 py-3">영상/쇼츠 소재</th>
                      <th className="border px-4 py-3">문자 발송안</th>
                      <th className="border px-4 py-3">매출 실행</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((r: any) => (
                      <tr key={`${g.days}-${r.id}`} className="hover:bg-emerald-50">
                        <td className="border px-4 py-4">
                          <div className="text-lg font-black">{r.problem_title}</div>
                          <div className="mt-1 flex gap-1">
                            <Pill color="green">{r.crop}</Pill>
                            <Pill color="yellow">{r.growth_stage || "재배관리"}</Pill>
                          </div>
                        </td>
                        <td className="border px-4 py-4 font-bold leading-7">
                          {r.action_instruction}
                        </td>
                        <td className="border px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(r.recommended_materials || []).map((m: string) => <Pill key={m} color="blue">{m}</Pill>)}
                          </div>
                        </td>
                        <td className="border px-4 py-4 font-bold">
                          {r.shorts_title}
                        </td>
                        <td className="border px-4 py-4 font-bold">
                          {r.sms_message}
                        </td>
                        <td className="border px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button className="rounded bg-slate-900 px-4 py-2 font-black text-white">영상준비</button>
                            <button className="rounded bg-emerald-600 px-4 py-2 font-black text-white">문자발송</button>
                            <button className="rounded bg-orange-600 px-4 py-2 font-black text-white">공동구매</button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {g.items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-xl font-black">
                          {crop} {g.month}월 행동지시가 없습니다.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-2xl font-black text-emerald-900">이 화면의 목적</h3>
          <p className="mt-2 text-lg font-bold text-emerald-900">
            오늘 할 일을 알려주는 것에서 끝나지 않고, 2주 후·1달 후 필요한 콘텐츠와 공동구매를 미리 준비하는 운영 화면입니다.
          </p>
        </div>
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-5">
      <div className="font-bold text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}
