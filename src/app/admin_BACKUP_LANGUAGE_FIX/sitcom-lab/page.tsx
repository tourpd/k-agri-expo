import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SitcomLabPage() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("sitcom_materials")
    .select("*")
    .eq("crop", "고추")
    .order("sitcom_score", { ascending: false })
    .limit(10);

  const rows = data || [];

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-black text-emerald-700">
            K-AGRI RURAL SITCOM LAB
          </div>
          <h1 className="text-4xl font-black">오늘 뭐 찍지? 농촌시트콤 실험실</h1>
          <p className="mt-2 text-lg font-bold text-slate-600">
            안이영 고추 자료에서 나온 고객 문제를 재미있는 시트콤 소재로 바꿉니다.
          </p>
        </div>

        <div className="flex gap-2">
          <Link href="/admin/ai-editor" className="rounded border bg-white px-5 py-3 font-black">
            AI 편집국장
          </Link>
          <Link href="/admin/farm-calendar" className="rounded bg-emerald-600 px-5 py-3 font-black text-white">
            농사캘린더
          </Link>
        </div>
      </div>

      {error ? (
        <div className="mb-5 rounded bg-red-50 p-4 font-black text-red-700">
          DB 오류: {error.message}
        </div>
      ) : null}

      <section className="mb-5 rounded-xl border bg-white p-5">
        <h2 className="text-2xl font-black">고추 시트콤 TOP {rows.length}</h2>
        <p className="mt-2 font-bold text-slate-600">
          목표는 강의가 아니라 웃음 → 정보 → 공동구매 → 매출입니다.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-5">
        {rows.map((r: any, i: number) => (
          <section key={r.id} className="rounded-xl border bg-white">
            <div className="border-b bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-700">
                      고추
                    </span>
                    <span className="rounded bg-orange-50 px-3 py-1 text-sm font-black text-orange-700">
                      점수 {r.sitcom_score}
                    </span>
                    <span className="rounded bg-blue-50 px-3 py-1 text-sm font-black text-blue-700">
                      {r.problem_title}
                    </span>
                  </div>
                  <h2 className="mt-3 text-3xl font-black">
                    {i + 1}. {r.episode_title}
                  </h2>
                </div>

                <div className="rounded bg-orange-600 px-5 py-3 font-black text-white">
                  Gemini 복사
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-3">
              <Box title="8초 광고">
                <pre className="whitespace-pre-wrap font-bold leading-7">{r.episode_8s}</pre>
              </Box>

              <Box title="16초 광고">
                <pre className="whitespace-pre-wrap font-bold leading-7">{r.episode_16s}</pre>
              </Box>

              <Box title="24초 광고">
                <pre className="whitespace-pre-wrap font-bold leading-7">{r.episode_24s}</pre>
              </Box>
            </div>

            <div className="border-t p-5">
              <h3 className="text-xl font-black">공동구매 연결</h3>
              <div className="mt-2 inline-flex rounded bg-orange-50 px-3 py-2 font-black text-orange-700">
                {r.joint_purchase_item || "공동구매 후보 미정"}
              </div>
            </div>

            <div className="border-t p-5">
              <h3 className="text-xl font-black">Gemini 영상 프롬프트</h3>
              <textarea
                readOnly
                className="mt-3 h-80 w-full rounded border bg-slate-50 p-4 font-mono text-sm leading-6"
                defaultValue={r.gemini_prompt || ""}
              />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border bg-slate-50 p-4">
      <h3 className="mb-3 text-xl font-black">{title}</h3>
      {children}
    </div>
  );
}
