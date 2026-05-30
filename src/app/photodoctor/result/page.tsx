import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    id?: string;
  }>;
};

function safe(v: unknown) {
  return String(v || "").trim();
}

function normalize(v: unknown) {
  return safe(v).toLowerCase().replace(/\s+/g, "");
}

function includesKeyword(source: string, keyword: string) {
  const s = normalize(source);
  const k = normalize(keyword);

  if (!s || !k) return false;

  return s.includes(k) || k.includes(s);
}

export default async function PhotoDoctorResultPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const diagnosisId = safe(params.id);

  if (!diagnosisId) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center">
          <h1 className="text-3xl font-black">
            진단 결과를 찾을 수 없습니다
          </h1>

          <Link
            href="/ai-consult"
            className="mt-6 block rounded-2xl bg-green-600 py-5 text-xl font-black text-white"
          >
            포토닥터 다시 시작하기
          </Link>
        </div>
      </main>
    );
  }

  const supabase = createSupabaseAdminClient();

  const { data: diagnosisData } = await supabase
    .from("photodoctor_raw_logs")
    .select("*")
    .eq("diagnosis_id", diagnosisId)
    .maybeSingle();

  if (!diagnosisData) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl bg-white p-8 text-center">
          <h1 className="text-3xl font-black">
            진단 결과가 존재하지 않습니다
          </h1>

          <Link
            href="/ai-consult"
            className="mt-6 block rounded-2xl bg-green-600 py-5 text-xl font-black text-white"
          >
            포토닥터 다시 시작하기
          </Link>
        </div>
      </main>
    );
  }

  const crop = safe(diagnosisData.crop);

  const diagnosis = safe(diagnosisData.diagnosis);

  const finalJudgement = safe(diagnosisData.final_judgement);

  const possibleCauses = Array.isArray(diagnosisData.possible_causes)
    ? diagnosisData.possible_causes
    : [];

  const sourceText = [
    diagnosis,
    finalJudgement,
    JSON.stringify(possibleCauses),
  ]
    .filter(Boolean)
    .join(" ");

  const { data: rules } = await supabase
    .from("photodoctor_recommend_rules")
    .select("*")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("exposure_priority", { ascending: true })
    .order("recommend_order", { ascending: true });

  const matched = (rules || []).filter((rule: any) => {
    const keyword = safe(rule.diagnosis_keyword);

    if (!keyword) return false;

    const diagnosisMatched = includesKeyword(sourceText, keyword);

    if (!diagnosisMatched) return false;

    const ruleCrop = safe(rule.crop_name);

    const cropMatched =
      !ruleCrop || !crop || includesKeyword(crop, ruleCrop);

    return cropMatched;
  });

  const uniqueMap = new Map();

  matched.forEach((rule: any) => {
    const productName = safe(rule.product_name);

    if (!productName) return;

    const key = normalize(productName);

    if (uniqueMap.has(key)) return;

    uniqueMap.set(key, rule);
  });

  const recommendItems = Array.from(uniqueMap.values()).slice(0, 5);

  return (
    <main className="min-h-screen bg-[#f5f7f2] px-4 py-6">
      <section className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5">
          <div className="bg-green-800 p-6 text-white">
            <div className="text-base font-extrabold text-yellow-200">
              PHOTO DOCTOR RESULT
            </div>

            <h1 className="mt-3 text-4xl font-extrabold">
              포토닥터 진단 결과
            </h1>

            <p className="mt-4 text-2xl font-extrabold text-red-200">
              {diagnosis || finalJudgement || "추가 확인 필요"}
            </p>

            {crop ? (
              <p className="mt-3 text-lg font-bold text-green-50">
                작물: {crop}
              </p>
            ) : null}
          </div>

          <div className="p-6">
            <section className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5">
              <h2 className="text-2xl font-extrabold text-stone-900">
                AI 진단 판단
              </h2>

              <div className="mt-4 whitespace-pre-line text-lg font-bold leading-relaxed text-stone-700">
                {finalJudgement ||
                  "진단 결과 설명이 없습니다. 사진과 재배환경을 함께 확인해 주세요."}
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-green-300 bg-green-50 p-6">
              <div className="text-2xl font-extrabold text-green-900">
                🌱 진단 결과 기반 추천 자재
              </div>

              <p className="mt-3 text-lg font-bold leading-8 text-stone-700">
                포토닥터 진단 결과와 연결된 대응 자재입니다.
                실제 사용 전 작물 적용 여부와 사용방법을 확인하세요.
              </p>

              {recommendItems.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-white p-5 text-lg font-bold text-stone-700">
                  연결된 추천 자재가 아직 등록되지 않았습니다.
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {recommendItems.map((item: any) => {
                    const productName = safe(item.product_name);

                    const href =
                      item.button_link ||
                      `/photodoctor/buy?product=${encodeURIComponent(
                        productName
                      )}&source=photodoctor&crop=${encodeURIComponent(
                        crop
                      )}&diagnosis=${encodeURIComponent(
                        diagnosis || finalJudgement
                      )}&diagnosis_id=${encodeURIComponent(diagnosisId)}`;

                    return (
                      <div
                        key={item.id}
                        className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5"
                      >
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                          <div className="flex-1">
                            <div className="text-3xl font-extrabold text-stone-900">
                              {productName}
                            </div>

                            {item.recommend_label ? (
                              <div className="mt-2 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-extrabold text-green-800">
                                {item.recommend_label}
                              </div>
                            ) : null}

                            {item.recommend_reason ? (
                              <p className="mt-4 text-lg font-bold leading-8 text-stone-700">
                                {item.recommend_reason}
                              </p>
                            ) : null}
                          </div>

                          <Link
                            href={href}
                            className="flex min-h-[72px] min-w-[240px] items-center justify-center rounded-3xl bg-green-600 px-6 text-2xl font-extrabold text-white no-underline"
                          >
                            자재 확인 →
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <Link
              href="/ai-consult"
              className="mt-6 block rounded-3xl border border-stone-300 py-5 text-center text-2xl font-extrabold text-stone-800"
            >
              포토닥터 다시 진단하기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}