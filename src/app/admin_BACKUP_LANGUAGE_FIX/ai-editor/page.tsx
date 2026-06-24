import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function Pill({
  children,
  color = "gray",
}: {
  children: React.ReactNode;
  color?: "green" | "blue" | "orange" | "red" | "gray";
}) {
  const cls =
    color === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : color === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : color === "orange"
      ? "bg-orange-50 text-orange-700 border-orange-200"
      : color === "red"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-slate-50 text-slate-700 border-slate-200";

  return (
    <span className={`inline-flex rounded border px-2 py-1 text-sm font-black ${cls}`}>
      {children}
    </span>
  );
}

export default async function AIEditorPage() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("ai_content_materials")
    .select("*")
    .order("priority_score", { ascending: false })
    .limit(100);

  const rows = (data || []) as any[];

  const todayTop = rows.slice(0, 5);
  const videoTop = rows.filter((r) => r.video_title).slice(0, 5);
  const shortsTop = rows.filter((r) => r.shorts_title).slice(0, 5);
  const adTop = rows.filter((r) => r.ad_title).slice(0, 5);
  const salesTop = rows.filter((r) => r.group_buy_item).slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-black text-emerald-700">
              K-AGRI AI EDITOR DIRECTOR
            </div>
            <h1 className="text-3xl font-black">AI 편집국장</h1>
            <p className="mt-1 font-bold text-slate-500">
              행동지시 474건을 영상·쇼츠·광고·공동구매 실행 후보로 정리합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href="/admin/farm-calendar"
              className="rounded bg-emerald-600 px-5 py-3 font-black text-white"
            >
              농사캘린더
            </Link>
            <Link
              href="/admin/knowledge-assets"
              className="rounded border bg-white px-5 py-3 font-black"
            >
              자료센터
            </Link>
          </div>
        </div>
      </header>

      <section className="p-6">
        {error ? (
          <div className="mb-4 rounded bg-red-50 p-4 font-black text-red-700">
            DB 조회 오류: {error.message}
          </div>
        ) : null}

        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-4xl font-black">오늘 조세환 PD가 결정할 일</h2>
          <p className="mt-2 text-lg font-bold text-slate-600">
            전체 자료를 다 보는 화면이 아니라, 지금 콘텐츠·광고·공동구매로 바꿀 항목만 보여줍니다.
          </p>

          <div className="mt-5 grid grid-cols-5 gap-4">
            <Stat title="AI 콘텐츠 후보" value={`${rows.length}건`} />
            <Stat title="오늘 결정" value={`${todayTop.length}건`} />
            <Stat title="영상 후보" value={`${videoTop.length}건`} />
            <Stat title="쇼츠 후보" value={`${shortsTop.length}건`} />
            <Stat title="공동구매" value={`${salesTop.length}건`} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <DecisionBox
            title="1. 오늘 반드시 결정할 TOP 5"
            rows={todayTop}
            kind="decision"
            button="결정"
            color="red"
          />

          <DecisionBox
            title="2. 이번 주 반드시 찍을 영상 TOP 5"
            rows={videoTop}
            kind="video"
            button="영상대본"
            color="green"
          />

          <DecisionBox
            title="3. AI 쇼츠로 만들 TOP 5"
            rows={shortsTop}
            kind="shorts"
            button="쇼츠생성"
            color="blue"
          />

          <DecisionBox
            title="4. 드라마·시트콤 광고 TOP 5"
            rows={adTop}
            kind="ad"
            button="광고안"
            color="orange"
          />

          <DecisionBox
            title="5. 공동구매 연결 TOP 5"
            rows={salesTop}
            kind="sales"
            button="공동구매"
            color="orange"
            wide
          />
        </div>

        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-2xl font-black text-emerald-900">
            현재 단계
          </h3>
          <p className="mt-2 text-lg font-bold text-emerald-900">
            안이영 PPT → 946페이지 색인 → 474개 행동지시 → 474개 AI 콘텐츠 소재까지 연결 완료.
            다음은 버튼을 실제 생성 API와 연결하는 단계입니다.
          </p>
        </div>
      </section>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded border bg-slate-50 p-5">
      <div className="font-bold text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}

function DecisionBox({
  title,
  rows,
  kind,
  button,
  color,
  wide,
}: {
  title: string;
  rows: any[];
  kind: "decision" | "video" | "shorts" | "ad" | "sales";
  button: string;
  color: "green" | "blue" | "orange" | "red";
  wide?: boolean;
}) {
  const btn =
    color === "green"
      ? "bg-emerald-600"
      : color === "blue"
      ? "bg-blue-600"
      : color === "red"
      ? "bg-red-600"
      : "bg-orange-600";

  return (
    <div className={`rounded-xl border bg-white ${wide ? "xl:col-span-2" : ""}`}>
      <div className="border-b bg-slate-100 px-5 py-4">
        <h3 className="text-2xl font-black">{title}</h3>
      </div>

      <div className="divide-y">
        {rows.map((r, i) => {
          const mainTitle =
            kind === "video"
              ? r.video_title
              : kind === "shorts"
              ? r.shorts_title
              : kind === "ad"
              ? r.ad_title
              : kind === "sales"
              ? `${r.crop} 공동구매 후보`
              : r.video_title || r.shorts_title || r.ad_title;

          const body =
            kind === "video"
              ? r.video_outline
              : kind === "shorts"
              ? r.shorts_script
              : kind === "ad"
              ? r.ad_script
              : kind === "sales"
              ? r.group_buy_reason
              : r.action_instruction;

          return (
            <div key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-5">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill color="green">{r.crop || "공통"}</Pill>
                    <Pill color="blue">{r.month_no ? `${r.month_no}월` : "시기확인"}</Pill>
                    <Pill color="orange">점수 {r.priority_score}</Pill>
                    {kind === "sales" && r.group_buy_item ? (
                      <Pill color="red">공동구매</Pill>
                    ) : null}
                  </div>

                  <div className="mt-3 text-2xl font-black">
                    {i + 1}. {mainTitle}
                  </div>

                  <div className="mt-2 font-bold leading-7 text-slate-700">
                    {body}
                  </div>

                  {kind === "sales" ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {String(r.group_buy_item || "")
                        .split(",")
                        .map((m: string) => m.trim())
                        .filter(Boolean)
                        .map((m: string) => (
                          <Pill key={m} color="blue">
                            {m}
                          </Pill>
                        ))}
                    </div>
                  ) : null}
                </div>

                <button className={`shrink-0 rounded px-5 py-3 font-black text-white ${btn}`}>
                  {button}
                </button>
              </div>
            </div>
          );
        })}

        {rows.length === 0 ? (
          <div className="p-10 text-center text-xl font-black">
            후보가 없습니다.
          </div>
        ) : null}
      </div>
    </div>
  );
}
