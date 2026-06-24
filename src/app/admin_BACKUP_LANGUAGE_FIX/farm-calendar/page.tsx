import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function monthName(m: number | null) {
  return m ? `${m}월` : "시기확인";
}

function Pill({ children, color = "gray" }: { children: React.ReactNode; color?: "green" | "blue" | "yellow" | "gray" }) {
  const cls =
    color === "green" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    color === "blue" ? "bg-blue-50 text-blue-700 border-blue-200" :
    color === "yellow" ? "bg-amber-50 text-amber-800 border-amber-200" :
    "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`inline-flex rounded border px-2 py-1 text-sm font-black ${cls}`}>{children}</span>;
}

export default async function FarmCalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ crop?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const crop = sp?.crop || "";
  const month = sp?.month || "";

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("farm_calendar_actions")
    .select("*")
    .order("crop", { ascending: true })
    .order("month_no", { ascending: true })
    .order("importance_score", { ascending: false })
    .limit(1000);

  if (crop) query = query.eq("crop", crop);
  if (month) query = query.eq("month_no", Number(month));

  const { data, error } = await query;
  const rows = (data || []) as any[];

  const { data: allData } = await supabase
    .from("farm_calendar_actions")
    .select("crop,month_no")
    .limit(3000);

  const all = (allData || []) as any[];
  const crops = Array.from(new Set(all.map((r) => r.crop).filter(Boolean))).sort();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/content-engine" className="text-2xl font-black text-emerald-600">← 콘텐츠 엔진</Link>
            <div className="h-8 w-px bg-slate-300" />
            <h1 className="text-2xl font-black">농사캘린더 엔진</h1>
          </div>
          <Link href="/admin/knowledge-assets" className="rounded-lg bg-emerald-600 px-5 py-3 font-black text-white">
            자료센터
          </Link>
        </div>
      </header>

      <section className="w-full px-8 py-6">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-sm font-black text-emerald-700">FARM CALENDAR ACTION ENGINE</div>
          <h2 className="mt-2 text-4xl font-black">통합 자료를 고객 행동지시로 변환</h2>
          <p className="mt-2 text-lg font-bold text-slate-600">
            안이영 PPT, 도프 PDF, 한미양행, 유튜브, 농진청 자료를 작물·월·생육단계·행동지시·추천 농자재·문자문구로 바꾸는 통합 캘린더 엔진입니다.
          </p>

          {error ? (
            <div className="mt-4 rounded bg-red-50 px-4 py-3 font-black text-red-700">
              DB 조회 오류: {error.message}
            </div>
          ) : null}

          <div className="mt-5 grid grid-cols-4 gap-4">
            <Stat title="행동지시" value={`${rows.length}건`} />
            <Stat title="작물 수" value={`${crops.length}개`} />
            <Stat title="발송 기준" value="2주 전" />
            <Stat title="상태" value="초안 검수" />
          </div>
        </div>

        <form className="mt-4 flex gap-3 rounded-lg border bg-white p-3">
          <select name="crop" defaultValue={crop} className="h-14 rounded border px-4 text-lg font-black">
            <option value="">전체 작물</option>
            {crops.map((c) => <option key={String(c)} value={String(c)}>{String(c)}</option>)}
          </select>
          <select name="month" defaultValue={month} className="h-14 rounded border px-4 text-lg font-black">
            <option value="">전체 월</option>
            {Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}
          </select>
          <button className="h-14 rounded bg-emerald-600 px-10 text-lg font-black text-white">조회</button>
          <Link href="/admin/farm-calendar" className="flex h-14 items-center rounded bg-slate-100 px-8 text-lg font-black">초기화</Link>
        </form>

        <div className="mt-5 rounded-xl border bg-white">
          <div className="border-b px-5 py-4">
            <h3 className="text-2xl font-black">작물별·월별 행동지시 목록</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1900px] border-collapse text-base">
              <thead>
                <tr className="bg-slate-200 text-left">
                  <th className="border px-3 py-3 text-center">월</th>
                  <th className="border px-3 py-3 text-center">작물</th>
                  <th className="border px-4 py-3">생육단계</th>
                  <th className="border px-4 py-3">문제/주제</th>
                  <th className="border px-4 py-3">고객 행동지시</th>
                  <th className="border px-4 py-3">2주 전 농자재</th>
                  <th className="border px-4 py-3">쇼츠 제목</th>
                  <th className="border px-4 py-3">문자 문구</th>
                  <th className="border px-3 py-3 text-center">점수</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-emerald-50">
                    <td className="border px-3 py-4 text-center text-lg font-black">{monthName(r.month_no)}</td>
                    <td className="border px-3 py-4 text-center"><Pill color="green">{r.crop}</Pill></td>
                    <td className="border px-4 py-4"><Pill color="yellow">{r.growth_stage || "재배관리"}</Pill></td>
                    <td className="border px-4 py-4 font-black">{r.problem_title}</td>
                    <td className="border px-4 py-4 font-bold leading-7">{r.action_instruction}</td>
                    <td className="border px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(r.recommended_materials || []).map((m: string) => <Pill key={m} color="blue">{m}</Pill>)}
                      </div>
                    </td>
                    <td className="border px-4 py-4 font-bold">{r.shorts_title}</td>
                    <td className="border px-4 py-4 font-bold">{r.sms_message}</td>
                    <td className="border px-3 py-4 text-center font-black">{r.importance_score}</td>
                  </tr>
                ))}

                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-20 text-center text-2xl font-black">
                      행동지시 데이터가 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-slate-50 p-5">
      <div className="font-bold text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}
