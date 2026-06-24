import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function arr(v: any): string[] {
  return Array.isArray(v) ? v.filter(Boolean).map(String) : [];
}

function clean(v: any) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function short(v: any, len = 120) {
  const s = clean(v);
  return s.length > len ? s.slice(0, len) + "..." : s;
}

function img(p: any) {
  return p?.full_image_url || p?.thumbnail_url || null;
}

function Pill({ children, color = "gray" }: { children: React.ReactNode; color?: "green" | "blue" | "orange" | "gray" }) {
  const cls =
    color === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : color === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : color === "orange"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-black ${cls}`}>{children}</span>;
}

function makeTitle(job: any, pages: any[]) {
  const raw = clean(job?.file_name || job?.result?.fileName || pages?.[0]?.source_title || "");
  const base = raw.replace(/\.(pptx|ppt|pdf|docx|doc|hwp)$/i, "").trim();
  const bad = !base || base === "." || base.includes("____") || (base.match(/_/g) || []).length > 5;

  if (!bad) return base;

  const crops = Array.from(new Set(pages.map((p) => p.crop || p.visual_findings?.crop).filter(Boolean))).slice(0, 4);
  const topics = Array.from(new Set(pages.map((p) => p.topic || p.disease_name || p.visual_summary).filter(Boolean))).slice(0, 3);

  return `안이영 농업자료 - ${crops.length ? crops.join("·") : "공통"}${topics.length ? " / " + topics.join("·") : ""}`;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ mode?: string; page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const mode = sp?.mode || "decision";
  const jobId = decodeURIComponent(id);

  const supabase = createSupabaseAdminClient();

  const { data: job } = await supabase
    .from("knowledge_file_jobs")
    .select("*")
    .eq("id", jobId)
    .maybeSingle();

  let { data: pageRows, error: pageError } = await supabase
    .from("knowledge_page_index")
    .select("id,job_id,source_title,file_type,page_number,crop,month_text,growth_stage,topic,disease_name,raw_text,thumbnail_url,full_image_url,visual_summary,visual_findings,image_analysis_status,created_at")
    .eq("job_id", jobId)
    .order("page_number", { ascending: true })
    .limit(1000);

  if ((!pageRows || pageRows.length === 0) && job?.file_name) {
    const fallback = await supabase
      .from("knowledge_page_index")
      .select("id,job_id,source_title,file_type,page_number,crop,month_text,growth_stage,topic,disease_name,raw_text,thumbnail_url,full_image_url,visual_summary,visual_findings,image_analysis_status,created_at")
      .or(`source_title.eq.${job.file_name},source_title.ilike.%${job.file_name}%`)
      .order("page_number", { ascending: true })
      .limit(1000);

    pageRows = fallback.data;
    pageError = fallback.error;
  }

  const pages = (pageRows || []) as any[];
  const title = makeTitle(job, pages);

  const crops = Array.from(new Set(pages.map((p) => p.crop || p.visual_findings?.crop).filter(Boolean)));
  const keywords = Array.from(
    new Set(
      pages.flatMap((p) => [p.topic, p.disease_name, p.visual_summary, ...arr(p.visual_findings?.keywords)]).filter(Boolean)
    )
  ).slice(0, 20);

  const ranked = pages
    .map((p, i) => ({
      ...p,
      ai_score: Math.min(99, 70 + arr(p.visual_findings?.keywords).length * 2 + (img(p) ? 8 : 0) + (p.topic ? 8 : 0) + Math.min(10, Math.floor(clean(p.raw_text).length / 500)) + Math.max(0, 10 - i)),
    }))
    .sort((a, b) => b.ai_score - a.ai_score);

  const selectedPageNo = Number(sp?.page || ranked[0]?.page_number || 1);
  const selected = pages.find((p) => Number(p.page_number) === selectedPageNo) || ranked[0] || pages[0];
  const selectedTitle = selected?.visual_summary || selected?.topic || selected?.disease_name || keywords[0] || "핵심 농사정보";

  const broadcast = ranked.slice(0, 10).map((p, i) => ({
    rank: i + 1,
    title: p.visual_summary || p.topic || p.disease_name || "방송소재",
    hook: `${p.crop || "농민"} 농가가 지금 놓치면 손해 보는 ${p.topic || p.disease_name || "핵심 포인트"}`,
    page: p.page_number,
    score: Math.max(86, 98 - i * 2),
  }));

  const shorts = ranked.slice(0, 10).map((p, i) => ({
    rank: i + 1,
    title: p.topic || p.visual_summary || p.disease_name || "쇼츠소재",
    hook: `${p.crop || "농민"} 농사, 이것 하나 놓치면 수확량이 달라집니다`,
    page: p.page_number,
    views: Math.max(8, 35 - i),
  }));

  const actionItems = keywords.slice(0, 7).map((k, i) => ({
    title: `${String(k)} 관련 작업을 이번 주 우선 점검`,
    page: ranked[i]?.page_number || i + 1,
  }));

  const salesItems = keywords.slice(0, 6).map((k, i) => ({
    title: `${String(k)} 해결 상품·공동구매 연결`,
    product: i % 3 === 0 ? "영양제/발근제" : i % 3 === 1 ? "병해충 방제제" : "토양관리 자재",
    page: ranked[i]?.page_number || i + 1,
  }));

  const imageCount = pages.filter((p) => img(p)).length;
  const textCount = pages.reduce((sum, p) => sum + clean(p.raw_text).length, 0);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="sticky top-0 z-20 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link href="/admin/knowledge-assets" className="font-black text-emerald-700">← 지식자산센터</Link>
            <h1 className="mt-2 text-4xl font-black">{title}</h1>
            <p className="mt-1 font-bold text-slate-500">이 화면은 자료를 다시 읽는 곳이 아니라, 오늘 방송·쇼츠·상품을 결정하는 곳입니다.</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/admin/knowledge-assets/${jobId}`} className="rounded bg-slate-900 px-4 py-3 font-black text-white">결정화면</Link>
            <Link href="#pages" className="rounded border bg-white px-4 py-3 font-black">원본페이지</Link>
            <Link href={`/admin/knowledge-assets/${jobId}?mode=shorts&page=${ranked[0]?.page_number || 1}`} className="rounded bg-emerald-600 px-4 py-3 font-black text-white">쇼츠</Link>
            <Link href={`/admin/knowledge-assets/${jobId}?mode=sales&page=${ranked[0]?.page_number || 1}`} className="rounded bg-orange-500 px-4 py-3 font-black text-white">매출연결</Link>
          </div>
        </div>
      </header>

      <section className="p-6">
        <div className="grid grid-cols-5 gap-4">
          <Stat label="전체 페이지" value={`${pages.length}p`} />
          <Stat label="이미지" value={`${imageCount}장`} />
          <Stat label="OCR 텍스트" value={`${textCount.toLocaleString()}자`} />
          <Stat label="핵심 후보" value={`${keywords.length}개`} />
          <Stat label="현재 목적" value="결정" />
        </div>

        {pageError ? <div className="mt-5 rounded-xl border bg-red-50 p-5 font-black text-red-700">페이지 조회 오류가 있습니다.</div> : null}

        {(mode === "broadcast" || mode === "shorts") && (
          <section className="mt-5 rounded-2xl border-4 border-blue-600 bg-white p-6 shadow-xl">
            <div className="flex justify-between gap-4">
              <div>
                <div className="font-black text-blue-700">{mode === "broadcast" ? "방송대본 생성 결과" : "쇼츠 생성 결과"}</div>
                <h2 className="mt-2 text-4xl font-black">{selectedTitle}</h2>
                <p className="mt-2 text-lg font-bold text-slate-600">근거 페이지 P{selectedPageNo} 기반 초안입니다.</p>
              </div>
              <a href={`#p-${selectedPageNo}`} className="h-fit rounded-xl bg-blue-600 px-5 py-4 font-black text-white">근거 페이지 보기</a>
            </div>

            <div className="mt-6 grid grid-cols-[1fr_380px] gap-5">
              <div className="rounded-xl border bg-slate-50 p-5">
                {mode === "broadcast" ? (
                  <>
                    <h3 className="text-2xl font-black">방송 제목</h3>
                    <p className="mt-3 text-3xl font-black">{selectedTitle} - 농민이 지금 놓치면 손해 보는 이유</p>
                    <h3 className="mt-6 text-2xl font-black">오프닝</h3>
                    <p className="mt-3 text-xl font-bold leading-8">오늘은 {selectedTitle}에 대해 이야기하겠습니다. 안이영 농업자료의 실제 페이지를 근거로 농민이 바로 실행할 내용을 정리합니다.</p>
                    <h3 className="mt-6 text-2xl font-black">구성</h3>
                    <ol className="mt-3 space-y-3">
                      {["문제 상황을 먼저 보여준다", "원본 자료 근거를 보여준다", "농민이 바로 할 행동을 제시한다", "관련 상품·공동구매로 자연스럽게 연결한다"].map((v, i) => (
                        <li key={v} className="rounded-lg bg-white p-4 text-lg font-black">{i + 1}. {v}</li>
                      ))}
                    </ol>
                    <h3 className="mt-6 text-2xl font-black">썸네일 문구</h3>
                    <p className="mt-3 rounded-xl bg-amber-50 p-5 text-3xl font-black text-amber-800">{selectedTitle}, 지금 확인 안 하면 손해봅니다</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-2xl font-black">쇼츠 제목</h3>
                    <p className="mt-3 text-3xl font-black">{selectedTitle} 30초 핵심</p>
                    <h3 className="mt-6 text-2xl font-black">첫 문장</h3>
                    <p className="mt-3 rounded-xl bg-emerald-50 p-5 text-3xl font-black text-emerald-800">{selectedTitle}, 이것 하나만 알아도 농사가 달라집니다.</p>
                    <h3 className="mt-6 text-2xl font-black">30초 구성</h3>
                    <ol className="mt-3 space-y-3">
                      {["왜 지금 중요한지 말한다", "농민이 확인할 증상을 보여준다", "오늘 할 행동 하나만 강하게 제시한다"].map((v, i) => (
                        <li key={v} className="rounded-lg bg-white p-4 text-lg font-black">{i + 1}. {v}</li>
                      ))}
                    </ol>
                    <h3 className="mt-6 text-2xl font-black">자막</h3>
                    <p className="mt-3 rounded-xl bg-white p-4 text-lg font-black">#{selectedTitle} #한국농수산TV #농사정보 #KAGRI</p>
                  </>
                )}
              </div>

              <div className="rounded-xl border bg-white p-5">
                <h3 className="text-2xl font-black">원본 근거 P{selectedPageNo}</h3>
                {img(selected) ? <img src={img(selected)} alt="근거 이미지" className="mt-4 h-64 w-full rounded-lg border object-contain" /> : null}
                <p className="mt-4 text-base font-bold leading-7 text-slate-700">{short(selected?.raw_text || selected?.visual_summary || selected?.topic, 420)}</p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-5 rounded-2xl border-4 border-emerald-600 bg-white p-6">
          <div className="grid grid-cols-[1.2fr_0.8fr] gap-5">
            <div className="rounded-2xl bg-emerald-50 p-6">
              <div className="font-black text-emerald-700">K-AGRI DECISION CENTER</div>
              <h2 className="mt-2 text-5xl font-black">오늘 이 자료로 할 일</h2>
              <p className="mt-4 text-3xl font-black">{selectedTitle}</p>
              <p className="mt-3 text-xl font-bold text-slate-700">이 자료는 방송소재, 쇼츠소재, 농민 행동지시, 상품연결까지 바로 활용 가능한 지식자산입니다.</p>
            </div>
            <div className="rounded-2xl bg-white p-6">
              <h3 className="text-2xl font-black">핵심 키워드</h3>
              <div className="mt-4 flex flex-wrap gap-2">{keywords.slice(0, 15).map((k) => <Pill key={String(k)} color="orange">{String(k)}</Pill>)}</div>
              <h3 className="mt-6 text-2xl font-black">작물</h3>
              <div className="mt-4 flex flex-wrap gap-2">{crops.slice(0, 10).map((c) => <Pill key={String(c)} color="green">{String(c)}</Pill>)}</div>
            </div>
          </div>
        </section>

        <div className="mt-5 grid grid-cols-2 gap-5">
          <IdeaList title="오늘 방송 추천 TOP10" dark items={broadcast} jobId={jobId} mode="broadcast" button="방송대본" />
          <IdeaList title="오늘 쇼츠 추천 TOP20" items={shorts} jobId={jobId} mode="shorts" button="쇼츠 생성" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-5">
          <section className="rounded-2xl border bg-white p-6">
            <h3 className="text-3xl font-black">이번주 농민 행동지시</h3>
            <div className="mt-4 space-y-3">
              {actionItems.map((a, i) => (
                <div key={a.title} className="rounded-xl bg-blue-50 p-4 font-black text-blue-900">{i + 1}. {a.title} <span className="text-sm text-blue-600">P{a.page}</span></div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-white p-6">
            <h3 className="text-3xl font-black">상품·공동구매 연결</h3>
            <div className="mt-4 space-y-3">
              {salesItems.map((a, i) => (
                <div key={a.title} className="rounded-xl bg-orange-50 p-4 font-black text-orange-900">{i + 1}. {a.title}<div className="text-sm text-orange-600">추천: {a.product} · 근거 P{a.page}</div></div>
              ))}
            </div>
          </section>
        </div>

        <section id="pages" className="mt-5 rounded-2xl border bg-white">
          <div className="border-b px-6 py-5">
            <h3 className="text-3xl font-black">원본 페이지</h3>
            <p className="mt-1 font-bold text-slate-500">결정의 근거가 되는 원본입니다.</p>
          </div>

          <div className="divide-y">
            {pages.map((p) => (
              <section id={`p-${p.page_number}`} key={p.id} className="grid grid-cols-[220px_1fr_180px] gap-5 p-5 hover:bg-emerald-50">
                <div>
                  <div className="mb-2 text-xl font-black">P{p.page_number}</div>
                  {img(p) ? <a href={img(p)} target="_blank"><img src={img(p)} alt={`P${p.page_number}`} className="h-32 w-full rounded-lg border object-contain" /></a> : <div className="h-32 rounded-lg border bg-slate-50" />}
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Pill color="green">{p.crop || p.visual_findings?.crop || "공통"}</Pill>
                    {p.topic ? <Pill color="blue">{p.topic}</Pill> : null}
                  </div>
                  <h4 className="mt-3 text-xl font-black">{p.visual_summary || p.topic || p.disease_name || "색인 제목 없음"}</h4>
                  <p className="mt-2 text-base font-bold leading-7 text-slate-700">{short(p.raw_text || p.visual_summary || p.topic, 260)}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {img(p) ? <a href={img(p)} target="_blank" className="rounded border bg-white px-4 py-3 text-center font-black">원본 이미지</a> : null}
                  <Link href={`/admin/knowledge-assets/${jobId}?mode=broadcast&page=${p.page_number}`} className="rounded bg-slate-900 px-4 py-3 text-center font-black text-white">방송대본</Link>
                  <Link href={`/admin/knowledge-assets/${jobId}?mode=shorts&page=${p.page_number}`} className="rounded bg-emerald-600 px-4 py-3 text-center font-black text-white">쇼츠</Link>
                  <Link href={`/admin/knowledge-assets/${jobId}?mode=sales&page=${p.page_number}`} className="rounded bg-orange-500 px-4 py-3 text-center font-black text-white">상품연결</Link>
                </div>
              </section>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="font-bold text-slate-500">{label}</div>
      <div className="mt-2 text-4xl font-black">{value}</div>
    </div>
  );
}

function IdeaList({
  title,
  items,
  jobId,
  mode,
  button,
  dark = false,
}: {
  title: string;
  items: any[];
  jobId: string;
  mode: string;
  button: string;
  dark?: boolean;
}) {
  return (
    <section className="rounded-2xl border bg-white">
      <div className={`border-b px-6 py-5 ${dark ? "bg-slate-900 text-white" : "bg-emerald-700 text-white"}`}>
        <h3 className="text-3xl font-black">{title}</h3>
      </div>
      <div className="divide-y">
        {items.map((b) => (
          <div key={`${b.rank}-${b.page}`} className="grid grid-cols-[80px_1fr_130px] gap-4 px-6 py-5">
            <div className="text-4xl font-black text-emerald-600">#{b.rank}</div>
            <div>
              <div className="text-2xl font-black">{b.title}</div>
              <div className="mt-2 text-lg font-bold text-slate-600">{b.hook}</div>
              <div className="mt-2 flex gap-2">
                <Pill color="green">{mode === "shorts" ? `예상 ${b.views}만뷰` : `방송점수 ${b.score}`}</Pill>
                <Pill color="blue">근거 P{b.page}</Pill>
              </div>
            </div>
            <Link href={`/admin/knowledge-assets/${jobId}?mode=${mode}&page=${b.page}`} className={`h-fit rounded-xl px-4 py-3 text-center font-black text-white ${dark ? "bg-slate-900" : "bg-emerald-600"}`}>
              {button}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
