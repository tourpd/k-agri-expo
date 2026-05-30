// src/app/ai-consult/product-result/page.tsx

import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    id?: string;
  }>;
};

function cleanText(v: unknown) {
  return String(v || "").trim();
}

function cleanNumber(v: unknown) {
  const n = Number(String(v || "").replace(/[^0-9]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function InvalidConsultPage() {
  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-10">
      <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
        <h1 className="text-3xl font-extrabold text-stone-900">
          상담 결과 주소가 변경되었습니다.
        </h1>

        <p className="mt-4 text-lg font-bold leading-relaxed text-stone-600">
          제품 상세페이지에서 다시 상담을 시작해 주세요.
        </p>

        <Link
          href="/expo"
          className="mt-6 block rounded-2xl bg-green-700 px-5 py-5 text-xl font-extrabold text-white"
        >
          EXPO 홈으로 가기
        </Link>
      </div>
    </main>
  );
}

export default async function ProductConsultResultPage({
  searchParams,
}: Props) {
  const params = await searchParams;
  const consultId = cleanText(params.id);

  if (!consultId) {
    return <InvalidConsultPage />;
  }

  const supabase = createSupabaseAdminClient();

  const { data: consult, error: consultError } = await supabase
    .from("expo_ai_consult_logs")
    .select("*")
    .eq("id", consultId)
    .maybeSingle();

  if (consultError) {
    console.error("[product-result] consult error:", consultError);
    return <InvalidConsultPage />;
  }

  if (!consult) {
    return <InvalidConsultPage />;
  }

  const brandId = cleanText(consult.brand_id);
  const productId = cleanText(consult.product_id);
  const crop = cleanText(consult.crop);
  const farmSize = cleanNumber(consult.farm_size);
  const question = cleanText(consult.question);
  const answer = cleanText(consult.ai_answer);
  const recommendedQuantity = cleanNumber(consult.recommended_quantity);
  const quantityNote = cleanText(consult.quantity_note);

  const { data: product } = await supabase
    .from("expo_brand_products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  const { data: brand } = await supabase
    .from("expo_brands")
    .select("*")
    .eq("id", brandId)
    .maybeSingle();

  if (!product) notFound();

  const orderHref = `/expo/brand-order?brand_id=${encodeURIComponent(
    brandId
  )}&product_id=${encodeURIComponent(productId)}`;

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-6">
      <section className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5">
          <div className="bg-green-800 p-6 text-white">
            <p className="text-base font-extrabold text-yellow-200">
              K-Agri Expo AI 상담 결과
            </p>

            <h1 className="mt-2 text-4xl font-extrabold">
              {product.product_name}
            </h1>

            <p className="mt-3 text-xl font-bold text-green-50">
              {brand?.brand_name || "브랜드"}
            </p>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[0.8fr_1.2fr]">
            <section className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5">
              <div className="flex h-72 items-center justify-center rounded-2xl bg-white">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.product_name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xl font-extrabold text-stone-400">
                    제품 이미지
                  </span>
                )}
              </div>

              <div className="mt-5 inline-flex rounded-full bg-green-100 px-4 py-2 text-base font-extrabold text-green-800">
                {product.category || "제품"}
              </div>

              <h2 className="mt-4 text-3xl font-extrabold text-stone-900">
                {product.product_name}
              </h2>

              <p className="mt-3 text-lg font-bold leading-relaxed text-stone-600">
                {product.short_description || "제품 설명 준비중"}
              </p>
            </section>

            <section className="grid gap-5">
              <ResultBox title="재배 정보">
                <div className="space-y-2">
                  <p>재배작물: {crop || "미입력"}</p>
                  <p>
                    재배평수:{" "}
                    {farmSize
                      ? `${farmSize.toLocaleString("ko-KR")}평`
                      : "미입력"}
                  </p>
                </div>
              </ResultBox>

              <ResultBox title="농민 질문">
                {question || "질문 없음"}
              </ResultBox>

              <ResultBox title="AI 추천 사용 가이드">
                {answer || "AI 상담 답변을 생성하지 못했습니다. 다시 상담해 주세요."}
              </ResultBox>

              <div className="rounded-3xl bg-yellow-50 p-6 ring-1 ring-yellow-200">
                <p className="text-3xl font-extrabold text-stone-900">
                  추천 주문 수량
                </p>

                <p className="mt-5 text-5xl font-extrabold text-red-600">
                  {recommendedQuantity > 0
                    ? `${recommendedQuantity}개`
                    : "상담 후 결정"}
                </p>

                <p className="mt-4 text-lg font-bold leading-relaxed text-stone-700">
                  {quantityNote || "자동 계산 정보 없음"}
                </p>
              </div>

              <form
                action="/api/ai-consult/product"
                method="POST"
                className="rounded-3xl bg-green-50 p-5 ring-1 ring-green-200"
              >
                <input type="hidden" name="brand_id" value={brandId} />
                <input type="hidden" name="product_id" value={productId} />
                <input type="hidden" name="crop" value={crop} />
                <input type="hidden" name="farm_size" value={String(farmSize)} />
                <input type="hidden" name="previous_question" value={question} />

                <h2 className="text-2xl font-extrabold text-stone-900">
                  추가로 궁금한 점이 있으세요?
                </h2>

                <p className="mt-2 text-base font-bold text-stone-600">
                  작물과 평수는 그대로 유지됩니다. 추가 질문만 적으시면 됩니다.
                </p>

                <textarea
                  name="question"
                  rows={4}
                  placeholder="예: 지금 마늘밭에 뿌려도 되나요? 다른 영양제와 같이 써도 되나요?"
                  className="mt-4 w-full rounded-2xl border border-green-300 bg-white px-5 py-5 text-xl font-bold text-stone-900 outline-none focus:border-green-700"
                />

                <button
                  type="submit"
                  className="mt-4 w-full rounded-3xl bg-yellow-300 py-5 text-2xl font-extrabold text-stone-900"
                >
                  추가 상담하기
                </button>
              </form>

              <Link
                href={orderHref}
                className="rounded-3xl bg-green-700 py-6 text-center text-2xl font-extrabold text-white"
              >
                바로 주문하기
              </Link>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function ResultBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="text-2xl font-extrabold text-stone-900">{title}</h2>

      <div className="mt-4 whitespace-pre-line text-lg font-bold leading-relaxed text-stone-700">
        {children}
      </div>
    </div>
  );
}