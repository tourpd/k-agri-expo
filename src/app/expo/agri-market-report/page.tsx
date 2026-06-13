import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function createReport(formData: FormData) {
  "use server";

  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("crop_field_reports").insert({
    crop_name: String(formData.get("crop_name") ?? "").trim(),
    region_name: String(formData.get("region_name") ?? "").trim(),
    reporter_name: String(formData.get("reporter_name") ?? "").trim(),
    reporter_phone: String(formData.get("reporter_phone") ?? "").trim(),
    supply_status: String(formData.get("supply_status") ?? "").trim(),
    price_feeling: String(formData.get("price_feeling") ?? "").trim(),
    harvest_status: String(formData.get("harvest_status") ?? "").trim(),
    storage_status: String(formData.get("storage_status") ?? "").trim(),
    memo: String(formData.get("memo") ?? "").trim(),
  });

  if (error) throw new Error(error.message);

  redirect("/expo/agri-market-radar");
}

export default function AgriMarketReportPage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-5 text-black">
      <div className="mx-auto max-w-4xl">
        <Link href="/expo/agri-market-radar" className="inline-flex rounded-xl bg-black px-5 py-3 font-black text-white">
          ← 시장 레이더
        </Link>

        <section className="mt-6 rounded-3xl border bg-white p-6 shadow">
          <p className="font-black text-green-700">K-AGRI FIELD REPORT</p>
          <h1 className="mt-2 text-4xl font-black">농민 현장 제보센터</h1>
          <p className="mt-3 text-lg font-bold text-gray-700">
            정부 데이터보다 빠른 것은 현장입니다. 농민 제보가 모이면 가격 붕괴를 더 빨리 감지할 수 있습니다.
          </p>

          <form action={createReport} className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field name="crop_name" label="작물명" placeholder="오이, 마늘, 양파" />
              <Field name="region_name" label="지역" placeholder="강원 홍천 내면" />
              <Field name="reporter_name" label="제보자명" placeholder="홍길동" />
              <Field name="reporter_phone" label="연락처" placeholder="010-0000-0000" />
            </div>

            <Select name="supply_status" label="이번 주 출하량" options={["많음", "보통", "적음", "출하대기 많음"]} />
            <Select name="price_feeling" label="현장 가격 분위기" options={["오르는 중", "보합", "떨어지는 중", "후려치기 심함"]} />
            <Select name="harvest_status" label="수확 상황" options={["수확 전", "수확 시작", "수확 피크", "수확 마무리"]} />
            <Select name="storage_status" label="저장 상황" options={["저장 가능", "저장 한계", "즉시 출하 필요", "해당 없음"]} />

            <div>
              <label className="font-black">현장 메모</label>
              <textarea name="memo" className="mt-2 h-32 w-full rounded-2xl border px-5 py-4 font-bold" placeholder="예: 이번 주 홍천 오이 출하가 몰릴 것 같습니다. 가격이 갑자기 빠지고 있습니다." />
            </div>

            <button className="w-full rounded-2xl bg-green-700 px-6 py-5 text-2xl font-black text-white">
              현장 제보 등록
            </button>

            <p className="text-xs font-bold text-gray-500">
              제보 내용은 시장 신호 분석 참고자료로 활용되며, 개별 거래 판단의 최종 책임은 이용자 본인에게 있습니다.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({ name, label, placeholder }: { name: string; label: string; placeholder: string }) {
  return <div><label className="font-black">{label}</label><input name={name} placeholder={placeholder} required className="mt-2 w-full rounded-2xl border px-5 py-4 font-bold" /></div>;
}

function Select({ name, label, options }: { name: string; label: string; options: string[] }) {
  return (
    <div>
      <label className="font-black">{label}</label>
      <select name={name} className="mt-2 w-full rounded-2xl border bg-white px-5 py-4 font-bold">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
