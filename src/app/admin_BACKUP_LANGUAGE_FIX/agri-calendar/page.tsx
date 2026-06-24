import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function pickMonth(row: any) {
  const t = `${row.month_text || ""} ${row.growth_stage || ""} ${row.raw_text || ""}`;
  for (let i = 1; i <= 12; i++) {
    if (t.includes(`${i}월`)) return `${i}월`;
  }
  if (t.includes("정식")) return "4월";
  if (t.includes("육묘")) return "3월";
  if (t.includes("개화")) return "5월";
  if (t.includes("착과")) return "6월";
  if (t.includes("비대")) return "7월";
  if (t.includes("수확")) return "8월";
  if (t.includes("탄저") || t.includes("총채") || t.includes("고온")) return "6월";
  return "미정";
}

function materialSuggest(text: string) {
  const s = text || "";
  const items = [];
  if (s.includes("총채") || s.includes("진딧물") || s.includes("나방")) items.push("충해 방제 자재");
  if (s.includes("탄저") || s.includes("역병") || s.includes("곰팡이")) items.push("병해 방제 자재");
  if (s.includes("고온") || s.includes("낙화") || s.includes("낙과")) items.push("고온장해 완화제");
  if (s.includes("착과") || s.includes("비대") || s.includes("수확")) items.push("착과·비대 영양제");
  if (s.includes("칼슘") || s.includes("마그네슘") || s.includes("붕소")) items.push("미량요소 영양제");
  if (items.length === 0) items.push("생육관리 영양제");
  return Array.from(new Set(items));
}

function alertTiming(month: string) {
  if (month === "미정") return "시기 확인 필요";
  return `${month} 작업 2주 전 발송`;
}

function Pill({ children, color = "gray" }: { children: React.ReactNode; color?: "green" | "yellow" | "red" | "blue" | "gray" }) {
  const cls =
    color === "green" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    color === "yellow" ? "bg-amber-50 text-amber-800 border-amber-200" :
    color === "red" ? "bg-red-50 text-red-700 border-red-200" :
    color === "blue" ? "bg-blue-50 text-blue-700 border-blue-200" :
    "bg-slate-50 text-slate-700 border-slate-200";
  return <span className={`inline-flex rounded border px-2 py-1 text-sm font-black ${cls}`}>{children}</span>;
}

export default async function AgriCalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ crop?: string; month?: string }>;
}) {
  const sp = await searchParams;
  const cropFilter = sp?.crop || "";
  const monthFilter = sp?.month || "";

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("knowledge_page_index")
    .select("*")
    .not("crop", "is", null)
    .order("crop", { ascending: true })
    .order("page_number", { ascending: true })
    .limit(3000);

  if (cropFilter) query = query.eq("crop", cropFilter);

  const { data, error } = await query;
  const rows = (data || []) as any[];

  const calendar = rows.map((r) => {
    const body = `${r.raw_text || ""} ${r.topic || ""} ${r.disease_name || ""}`;
    const month = pickMonth(r);
    return {
      ...r,
      month,
      materials: materialSuggest(body),
      alert: alertTiming(month),
    };
  }).filter((r) => !monthFilter || r.month === monthFilter);

  const crops = Array.from(new Set(rows.map((r) => r.crop).filter(Boolean)));

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/knowledge-assets" className="text-2xl font-black text-emerald-600">← 지식자산</Link>
            <div className="h-8 w-px bg-slate-300" />
            <h1 className="text-2xl font-black">작물별 월별 농사캘린더</h1>
          </div>
          <Link href="/admin/knowledge-assets" className="rounded-lg bg-emerald-600 px-5 py-3 font-black text-white">자료센터</Link>
        </div>
      </header>

      <section className="w-full px-8 py-6">
        <div className="rounded-lg border bg-white p-6">
          <div className="text-sm font-black text-emerald-600">K-AGRI FARMING CALENDAR ENGINE</div>
          <h2 className="mt-2 text-3xl font-black">자료에서 농민 발송용 캘린더를 자동 생성</h2>
          <p className="mt-2 text-lg font-bold text-slate-600">
            농민이 농자재를 써야 할 시점보다 최소 2주 전에 정보·영상·농자재·공동구매를 연결하는 화면입니다.
          </p>

          <div className="mt-5 grid grid-cols-4 gap-4">
            <div className="rounded border bg-slate-50 p-4"><div className="font-bold text-slate-500">캘린더 항목</div><div className="mt-2 text-4xl font-black">{calendar.length}건</div></div>
            <div className="rounded border bg-slate-50 p-4"><div className="font-bold text-slate-500">작물 수</div><div className="mt-2 text-4xl font-black">{crops.length}개</div></div>
            <div className="rounded border bg-slate-50 p-4"><div className="font-bold text-slate-500">발송 기준</div><div className="mt-2 text-2xl font-black">작업 2주 전</div></div>
            <div className="rounded border bg-slate-50 p-4"><div className="font-bold text-slate-500">목표</div><div className="mt-2 text-2xl font-black">농자재 매출 연결</div></div>
          </div>
        </div>

        <form className="mt-4 flex gap-3 rounded-lg border bg-white p-3">
          <select name="crop" defaultValue={cropFilter} className="h-14 rounded border px-4 text-lg font-black">
            <option value="">전체 작물</option>
            {crops.map((c) => <option key={String(c)} value={String(c)}>{String(c)}</option>)}
          </select>
          <select name="month" defaultValue={monthFilter} className="h-14 rounded border px-4 text-lg font-black">
            <option value="">전체 월</option>
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            <option value="미정">미정</option>
          </select>
          <button className="h-14 rounded bg-emerald-600 px-10 text-lg font-black text-white">조회</button>
          <Link href="/admin/agri-calendar" className="flex h-14 items-center rounded bg-slate-100 px-8 text-lg font-black">초기화</Link>
        </form>

        <div className="mt-5 rounded-lg border bg-white">
          <div className="border-b px-5 py-4">
            <h3 className="text-2xl font-black">농민 발송용 월별 작업표</h3>
            <p className="mt-1 font-bold text-slate-500">이 표가 앞으로 문자, 카카오 알림, 쇼츠, 공동구매의 기준표가 됩니다.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1800px] border-collapse text-base">
              <thead>
                <tr className="bg-slate-200 text-left">
                  <th className="border px-3 py-3 text-center">월</th>
                  <th className="border px-3 py-3 text-center">작물</th>
                  <th className="border px-5 py-3">농민에게 보낼 정보</th>
                  <th className="border px-5 py-3">작업/위험</th>
                  <th className="border px-5 py-3">2주 전 알림</th>
                  <th className="border px-5 py-3">연결 농자재</th>
                  <th className="border px-5 py-3">콘텐츠</th>
                  <th className="border px-5 py-3">매출 실행</th>
                </tr>
              </thead>
              <tbody>
                {calendar.map((r) => {
                  const issue = r.disease_name || r.topic || r.growth_stage || "생육관리";
                  const info = String(r.raw_text || r.visual_summary || "").slice(0, 180);

                  return (
                    <tr key={r.id} className="hover:bg-emerald-50">
                      <td className="border px-3 py-4 text-center text-xl font-black">{r.month}</td>
                      <td className="border px-3 py-4 text-center"><Pill color="green">{r.crop || "공통"}</Pill></td>
                      <td className="border px-5 py-4 font-bold leading-7">{info}</td>
                      <td className="border px-5 py-4"><Pill color="yellow">{issue}</Pill></td>
                      <td className="border px-5 py-4"><Pill color="red">{r.alert}</Pill></td>
                      <td className="border px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {r.materials.map((m: string) => <Pill key={m} color="blue">{m}</Pill>)}
                        </div>
                      </td>
                      <td className="border px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Pill color="green">쇼츠</Pill>
                          <Pill color="green">상담답변</Pill>
                          <Pill color="green">뉴스소재</Pill>
                        </div>
                      </td>
                      <td className="border px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button className="rounded bg-emerald-600 px-4 py-2 font-black text-white">발송안 생성</button>
                          <button className="rounded bg-orange-600 px-4 py-2 font-black text-white">공동구매 연결</button>
                          <Link href={`/admin/knowledge-assets/${encodeURIComponent(r.job_id || r.source_title)}?q=${encodeURIComponent(String(r.page_number || ""))}`} className="rounded border bg-white px-4 py-2 font-black">원문</Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {calendar.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-20 text-center text-2xl font-black">
                      캘린더 항목이 없습니다.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between border-t px-5 py-4 text-lg font-black">
            <div>총 {calendar.length}개 항목</div>
            <div className="text-emerald-700">자료 → 월별 작업 → 2주 전 알림 → 농자재 → 공동구매 → 매출</div>
          </div>
        </div>
      </section>
    </main>
  );
}
