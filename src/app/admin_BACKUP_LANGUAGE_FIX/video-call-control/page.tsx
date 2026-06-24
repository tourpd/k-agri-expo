import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function updateStatus(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const meet_url = String(formData.get("meet_url") ?? "").trim();
  const admin_memo = String(formData.get("admin_memo") ?? "").trim();

  if (!id) return;

  await supabase
    .from("agri_video_calls")
    .update({
      status,
      meet_url,
      admin_memo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}

export default async function VideoCallControlPage() {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("agri_video_calls")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = data ?? [];

  return (
    <main className="min-h-screen bg-[#eef3ee] p-4 text-black">
      <div className="mx-auto max-w-[1900px]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-black text-green-700">K-AGRI VIDEO CALL CONTROL</p>
            <h1 className="text-4xl font-black">영상상담 관리자 관제센터</h1>
            <p className="mt-2 font-bold text-gray-700">
              고객과 거상의 영상상담 예약을 승인하고, 상담 링크·상태·메모를 관리합니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/expo/agri-exchange/video-call" className="bg-purple-700 px-4 py-3 font-black text-white">
              상담 예약
            </Link>
            <Link href="/admin/k-agri-command-center" className="bg-black px-4 py-3 font-black text-white">
              거래본부 상황실
            </Link>
          </div>
        </div>

        <section className="mb-4 grid grid-cols-5 border border-black bg-white">
          <Summary title="전체 예약" value={`${rows.length}건`} />
          <Summary title="예약요청" value={`${rows.filter((r:any)=>r.status==="예약요청").length}건`} />
          <Summary title="확정" value={`${rows.filter((r:any)=>r.status==="확정").length}건`} />
          <Summary title="상담완료" value={`${rows.filter((r:any)=>r.status==="상담완료").length}건`} />
          <Summary title="거래연결" value={`${rows.filter((r:any)=>r.status==="거래연결").length}건`} />
        </section>

        {error ? (
          <div className="border border-red-600 bg-red-50 p-5 font-black text-red-700">
            agri_video_calls 테이블이 아직 없을 수 있습니다. 아래 SQL을 Supabase SQL Editor에서 실행하세요.
          </div>
        ) : (
          <section className="border border-black bg-white">
            <div className="flex items-center justify-between border-b border-black bg-gray-100 px-3 py-3">
              <h2 className="text-xl font-black">상담 예약 엑셀형 관리표</h2>
              <div className="font-black">총 {rows.length}건</div>
            </div>

            <div className="max-h-[75vh] overflow-auto">
              <table className="w-full min-w-[2100px] border-collapse text-[12px]">
                <thead className="sticky top-0 z-10 bg-gray-200">
                  <tr>
                    {[
                      "NO","상태","농산물","상담유형","고객","고객전화","거상회사","담당자","거상전화",
                      "희망일","희망시간","상담링크","관리메모","예약일","상태변경","입장","거래제안"
                    ].map((h) => (
                      <th key={h} className="border border-black px-2 py-2 text-left font-black whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.map((r:any, i:number) => (
                    <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-green-50"}>
                      <Cell>{i + 1}</Cell>
                      <Cell bold>{r.status || "-"}</Cell>
                      <Cell bold>{r.asset_name || "-"}</Cell>
                      <Cell>{r.call_type || "-"}</Cell>
                      <Cell>{r.farmer_name || "-"}</Cell>
                      <Cell>{r.farmer_phone || "-"}</Cell>
                      <Cell>{r.buyer_company || "-"}</Cell>
                      <Cell>{r.buyer_name || "-"}</Cell>
                      <Cell>{r.buyer_phone || "-"}</Cell>
                      <Cell>{r.preferred_date || "-"}</Cell>
                      <Cell>{r.preferred_time || "-"}</Cell>
                      <Cell>{r.meet_url || "-"}</Cell>
                      <Cell>{r.admin_memo || "-"}</Cell>
                      <Cell>{r.created_at ? new Date(r.created_at).toLocaleDateString("ko-KR") : "-"}</Cell>
                      <td className="border border-black p-1">
                        <form action={updateStatus} className="flex gap-1">
                          <input type="hidden" name="id" value={r.id} />
                          <select name="status" defaultValue={r.status || "예약요청"} className="border border-black px-2 py-1 font-bold">
                            <option value="예약요청">예약요청</option>
                            <option value="확정">확정</option>
                            <option value="상담중">상담중</option>
                            <option value="상담완료">상담완료</option>
                            <option value="거래연결">거래연결</option>
                            <option value="취소">취소</option>
                          </select>
                          <input name="meet_url" defaultValue={r.meet_url || ""} placeholder="Meet/Zoom 링크" className="w-44 border border-black px-2 py-1 font-bold" />
                          <input name="admin_memo" defaultValue={r.admin_memo || ""} placeholder="메모" className="w-44 border border-black px-2 py-1 font-bold" />
                          <button className="bg-black px-3 py-1 font-black text-white">저장</button>
                        </form>
                      </td>
                      <td className="border border-black p-1 text-center">
                        {r.meet_url ? (
                          <a href={r.meet_url} target="_blank" className="inline-block bg-purple-700 px-3 py-1 font-black text-white">
                            상담실 입장
                          </a>
                        ) : (
                          <span className="font-bold text-gray-400">링크대기</span>
                        )}
                      </td>
                      <td className="border border-black p-1 text-center">
                        <Link href={`/admin/trade-offers?assetId=${r.asset_id || ""}`} className="inline-block bg-green-700 px-3 py-1 font-black text-white">
                          제안서 작성
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="mt-5 border border-black bg-white">
          <div className="border-b border-black bg-gray-100 px-4 py-3 font-black">
            Supabase 테이블 생성 SQL
          </div>
          <pre className="overflow-auto p-4 text-xs font-bold">
{`create table if not exists agri_video_calls (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid null,
  asset_name text,
  farmer_name text,
  farmer_phone text,
  buyer_name text,
  buyer_company text,
  buyer_phone text,
  preferred_date date,
  preferred_time text,
  call_type text,
  status text default '예약요청',
  meet_url text,
  admin_memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);`}
          </pre>
        </section>
      </div>
    </main>
  );
}

function Summary({ title, value }: { title: string; value: string }) {
  return <div className="border-r border-black px-3 py-3"><div className="text-xs font-black text-gray-500">{title}</div><div className="text-xl font-black">{value}</div></div>;
}

function Cell({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return <td className={`border border-black px-2 py-2 whitespace-nowrap ${bold ? "font-black" : "font-bold"}`}>{children}</td>;
}
