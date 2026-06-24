import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function monthOf(r: any) {
  const t = `${r.month_text || ""} ${r.growth_stage || ""} ${r.raw_text || ""}`;
  if (t.includes("정식")) return "4월";
  if (t.includes("개화")) return "5월";
  if (t.includes("착과")) return "6월";
  if (t.includes("비대")) return "7월";
  if (t.includes("수확")) return "8월";
  if (t.includes("탄저") || t.includes("총채") || t.includes("고온")) return "6월";
  return r.month_text || "시기확인";
}

function materialOf(r: any) {
  const t = `${r.raw_text || ""} ${r.topic || ""} ${r.disease_name || ""}`;
  const a: string[] = [];
  if (t.includes("총채") || t.includes("진딧") || t.includes("나방")) a.push("충해 방제 자재");
  if (t.includes("탄저") || t.includes("역병") || t.includes("바이러스")) a.push("병해 방제 자재");
  if (t.includes("고온") || t.includes("낙화") || t.includes("낙과")) a.push("고온장해 완화제");
  if (t.includes("칼슘") || t.includes("붕소") || t.includes("마그네슘")) a.push("미량요소 영양제");
  if (t.includes("착과") || t.includes("비대")) a.push("착과·비대 영양제");
  return a.length ? a : ["생육관리 영양제"];
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

export default async function AhnKnowledgeFinalPage() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("knowledge_page_index")
    .select("*")
    .order("importance_score", { ascending: false })
    .limit(2000);

  const rows = (data || []) as any[];

  const calendar = rows
    .filter((r) => r.crop && r.crop !== "공통")
    .slice(0, 80)
    .map((r) => ({
      ...r,
      month: monthOf(r),
      materials: materialOf(r),
    }));

  const shorts = [...rows].sort((a, b) => (b.shorts_score || 0) - (a.shorts_score || 0)).slice(0, 10);
  const broadcast = [...rows].sort((a, b) => (b.broadcast_score || 0) - (a.broadcast_score || 0)).slice(0, 10);
  const sales = [...rows].sort((a, b) => (b.business_score || 0) - (a.business_score || 0)).slice(0, 10);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/knowledge-assets" className="text-2xl font-black text-emerald-600">← 지식자산</Link>
            <div className="h-8 w-px bg-slate-300" />
            <h1 className="text-2xl font-black">안이영 자료 최종 결과센터</h1>
          </div>
          <Link href="/admin/agri-calendar" className="rounded-lg bg-emerald-600 px-5 py-3 font-black text-white">
            농사캘린더 보기
          </Link>
        </div>
      </header>

      <section className="w-full px-8 py-6">
        <div className="rounded-xl border bg-white p-6">
          <div className="text-sm font-black text-emerald-700">AHN YIYOUNG KNOWLEDGE RESULT</div>
          <h2 className="mt-2 text-4xl font-black">안이영 자료 946페이지 결과물</h2>
          <p className="mt-2 text-lg font-bold text-slate-600">
            자료를 보는 화면이 아니라, 농민에게 보낼 캘린더·쇼츠·방송소재·농자재 연결 후보를 바로 보는 화면입니다.
          </p>

          <div className="mt-5 grid grid-cols-4 gap-4">
            <div className="rounded-lg border bg-slate-50 p-5"><div className="font-bold text-slate-500">색인 자료</div><div className="mt-2 text-4xl font-black">{rows.length}건</div></div>
            <div className="rounded-lg border bg-slate-50 p-5"><div className="font-bold text-slate-500">캘린더 후보</div><div className="mt-2 text-4xl font-black">{calendar.length}건</div></div>
            <div className="rounded-lg border bg-slate-50 p-5"><div className="font-bold text-slate-500">쇼츠 후보</div><div className="mt-2 text-4xl font-black">{shorts.length}건</div></div>
            <div className="rounded-lg border bg-slate-50 p-5"><div className="font-bold text-slate-500">매출연결 후보</div><div className="mt-2 text-4xl font-black">{sales.length}건</div></div>
          </div>
        </div>

        <Block title="1. 농민 발송용 작물별 월별 캘린더 후보">
          <Table headers={["월", "작물", "농민에게 보낼 내용", "2주 전 준비 농자재", "실행"]}>
            {calendar.slice(0, 30).map((r) => (
              <tr key={r.id} className="hover:bg-emerald-50">
                <td className="border px-3 py-3 text-center text-lg font-black">{r.month}</td>
                <td className="border px-3 py-3"><Pill color="green">{r.crop}</Pill></td>
                <td className="border px-4 py-3 font-bold">{String(r.raw_text || r.visual_summary || "").slice(0, 160)}</td>
                <td className="border px-4 py-3"><div className="flex flex-wrap gap-1">{r.materials.map((m: string) => <Pill key={m} color="blue">{m}</Pill>)}</div></td>
                <td className="border px-4 py-3"><button className="rounded bg-emerald-600 px-4 py-2 font-black text-white">발송안</button></td>
              </tr>
            ))}
          </Table>
        </Block>

        <Block title="2. 쇼츠 자동 제작 후보 TOP 10">
          <Table headers={["페이지", "작물", "쇼츠 제목 후보", "원문", "실행"]}>
            {shorts.map((r) => (
              <tr key={r.id}>
                <td className="border px-3 py-3 text-center font-black">P{r.page_number}</td>
                <td className="border px-3 py-3"><Pill color="green">{r.crop || "공통"}</Pill></td>
                <td className="border px-4 py-3 text-lg font-black">{r.crop || "농사"} {r.topic || r.disease_name || "관리"} 지금 놓치면 손해봅니다</td>
                <td className="border px-4 py-3 font-bold">{String(r.raw_text || "").slice(0, 120)}</td>
                <td className="border px-4 py-3"><button className="rounded bg-emerald-600 px-4 py-2 font-black text-white">쇼츠 생성</button></td>
              </tr>
            ))}
          </Table>
        </Block>

        <Block title="3. 방송소재 후보 TOP 10">
          <Table headers={["페이지", "작물", "방송 아이템", "현장 질문", "실행"]}>
            {broadcast.map((r) => (
              <tr key={r.id}>
                <td className="border px-3 py-3 text-center font-black">P{r.page_number}</td>
                <td className="border px-3 py-3"><Pill color="green">{r.crop || "공통"}</Pill></td>
                <td className="border px-4 py-3 text-lg font-black">{r.crop || "농민"} 농가가 꼭 알아야 할 {r.topic || "재배관리"}</td>
                <td className="border px-4 py-3 font-bold">이 관리가 수확량과 소득에 어떤 영향을 주는가?</td>
                <td className="border px-4 py-3"><button className="rounded bg-slate-900 px-4 py-2 font-black text-white">방송안</button></td>
              </tr>
            ))}
          </Table>
        </Block>

        <Block title="4. 농자재·공동구매 연결 후보 TOP 10">
          <Table headers={["페이지", "작물", "문제", "연결 농자재", "실행"]}>
            {sales.map((r) => (
              <tr key={r.id}>
                <td className="border px-3 py-3 text-center font-black">P{r.page_number}</td>
                <td className="border px-3 py-3"><Pill color="green">{r.crop || "공통"}</Pill></td>
                <td className="border px-4 py-3 text-lg font-black">{r.topic || r.disease_name || "생육관리"}</td>
                <td className="border px-4 py-3"><div className="flex flex-wrap gap-1">{materialOf(r).map((m) => <Pill key={m} color="blue">{m}</Pill>)}</div></td>
                <td className="border px-4 py-3"><button className="rounded bg-orange-600 px-4 py-2 font-black text-white">공동구매</button></td>
              </tr>
            ))}
          </Table>
        </Block>
      </section>
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-xl border bg-white">
      <div className="border-b px-5 py-4">
        <h3 className="text-2xl font-black">{title}</h3>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full min-w-[1400px] border-collapse text-base">
      <thead>
        <tr className="bg-slate-200 text-left">
          {headers.map((h) => <th key={h} className="border px-4 py-3">{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
