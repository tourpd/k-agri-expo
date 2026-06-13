import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function createVideoCall(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const payload = {
    asset_id: String(formData.get("asset_id") ?? "").trim() || null,
    asset_name: String(formData.get("asset_name") ?? "").trim(),
    farmer_name: String(formData.get("farmer_name") ?? "").trim(),
    farmer_phone: String(formData.get("farmer_phone") ?? "").trim(),
    buyer_name: String(formData.get("buyer_name") ?? "").trim(),
    buyer_company: String(formData.get("buyer_company") ?? "").trim(),
    buyer_phone: String(formData.get("buyer_phone") ?? "").trim(),
    preferred_date: String(formData.get("preferred_date") ?? "").trim(),
    preferred_time: String(formData.get("preferred_time") ?? "").trim(),
    call_type: String(formData.get("call_type") ?? "창고확인"),
    status: "예약요청",
    admin_memo: String(formData.get("memo") ?? "").trim(),
  };

  const { error } = await supabase.from("agri_video_calls").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/expo/agri-exchange/video-call?success=1");
}

export default async function VideoCallPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const success = sp.success === "1";
  const assetId = String(sp.assetId ?? "");

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-5xl">
        <Link href="/expo/agri-exchange/market" className="inline-flex rounded-xl bg-black px-5 py-3 font-black text-white">
          ← 농산물거래소
        </Link>

        <section className="mt-6 border border-black bg-white">
          <div className="border-b border-black bg-green-800 p-6 text-white">
            <p className="font-black text-green-200">K-AGRI VIDEO TRADING ROOM</p>
            <h1 className="mt-2 text-4xl font-black">농민 · 거상 영상상담 예약센터</h1>
            <p className="mt-3 text-lg font-bold">
              농산물 상태, 창고 보관상태, 수량, 성적서, 출하 가능 여부를 영상으로 확인합니다.
            </p>
          </div>

          {success && (
            <div className="border-b border-black bg-yellow-50 p-4 font-black text-yellow-800">
              영상상담 예약 요청이 접수되었습니다. 운영자가 확인 후 상담 슬롯을 확정합니다.
            </div>
          )}

          <div className="grid border-b border-black md:grid-cols-3">
            <Info title="농민" desc="창고, 농산물, 포장상태, 출하 가능 여부를 영상으로 보여줍니다." />
            <Info title="거상/바이어" desc="방문 전 품질과 물량을 확인하고 거래 가능성을 판단합니다." />
            <Info title="운영자" desc="예약 승인, 상담 배정, 상담 기록, 거래제안 연결을 관리합니다." />
          </div>

          <form action={createVideoCall}>
            <input type="hidden" name="asset_id" value={assetId} />

            <Block title="1. 상담 대상 농산물">
              <Grid>
                <Cell label="농산물명">
                  <Input name="asset_name" placeholder="예: 홍산마늘 170톤" required />
                </Cell>
                <Cell label="상담유형">
                  <select name="call_type" className="w-full p-3 font-bold outline-none">
                    <option value="창고확인">창고확인</option>
                    <option value="품질확인">품질확인</option>
                    <option value="성적서확인">성적서확인</option>
                    <option value="가격협의">가격협의</option>
                    <option value="계약전확인">계약전확인</option>
                  </select>
                </Cell>
              </Grid>
            </Block>

            <Block title="2. 농민 정보">
              <Grid>
                <Cell label="농민명"><Input name="farmer_name" placeholder="김용식" required /></Cell>
                <Cell label="농민 연락처"><Input name="farmer_phone" placeholder="010-0000-0000" required /></Cell>
              </Grid>
            </Block>

            <Block title="3. 거상/바이어 정보">
              <Grid>
                <Cell label="회사명"><Input name="buyer_company" placeholder="삼성웰스토리" required /></Cell>
                <Cell label="담당자"><Input name="buyer_name" placeholder="구매담당자" /></Cell>
                <Cell label="연락처"><Input name="buyer_phone" placeholder="010-0000-0000" /></Cell>
              </Grid>
            </Block>

            <Block title="4. 희망 상담 시간">
              <Grid>
                <Cell label="희망일"><Input name="preferred_date" type="date" placeholder="" required /></Cell>
                <Cell label="희망시간">
                  <select name="preferred_time" className="w-full p-3 font-bold outline-none">
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                  </select>
                </Cell>
              </Grid>
            </Block>

            <Block title="5. 상담 메모">
              <textarea
                name="memo"
                className="h-32 w-full border-t border-black p-4 font-bold outline-none"
                placeholder="확인해야 할 내용: 창고상태, 포장상태, 성적서, 단가, 출하 가능일 등"
              />
            </Block>

            <div className="sticky bottom-0 flex gap-3 border-t border-black bg-white p-4">
              <button className="flex-1 bg-green-700 px-6 py-5 text-2xl font-black text-white">
                영상상담 예약 요청
              </button>
              <Link href="/admin/video-call-control" className="bg-black px-6 py-5 text-2xl font-black text-white">
                관리자 관제
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Info({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border-r border-black p-4">
      <div className="text-xl font-black text-green-700">{title}</div>
      <p className="mt-2 font-bold text-gray-700">{desc}</p>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="border-b border-black"><div className="bg-gray-100 px-4 py-3 font-black">{title}</div>{children}</section>;
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid border-t border-black md:grid-cols-2">{children}</div>;
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="grid grid-cols-[140px_1fr] border-b border-black md:border-r"><div className="bg-gray-50 p-3 font-black">{label}</div><div className="border-l border-black">{children}</div></div>;
}

function Input({ name, placeholder, type = "text", required = false }: { name: string; placeholder: string; type?: string; required?: boolean }) {
  return <input name={name} type={type} placeholder={placeholder} required={required} className="w-full p-3 font-bold outline-none" />;
}
