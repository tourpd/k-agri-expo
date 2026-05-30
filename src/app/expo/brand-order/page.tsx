import Link from "next/link";
import Script from "next/script";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import BrandOrderFormClient from "@/components/expo/brand-order/BrandOrderFormClient";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = {
  searchParams: Promise<{
    brand_id?: string;
    product_id?: string;
    event_id?: string;
  }>;
};

function money(v: unknown) {
  const n = Number(v || 0);
  if (!n) return "접수 후 안내";
  return `${n.toLocaleString("ko-KR")}원`;
}

function num(v: unknown) {
  const n = Number(v || 0);
  return Number.isFinite(n) ? n : 0;
}

export default async function BrandOrderPage({ searchParams }: Props) {
  const params = await searchParams;

  const brandId = String(params.brand_id || "").trim();
  const productId = String(params.product_id || "").trim();
  const eventId = String(params.event_id || "").trim();

  const supabase = createSupabaseAdminClient();

  const { data: brand } = brandId
    ? await supabase
        .from("expo_brands")
        .select("*")
        .eq("id", brandId)
        .maybeSingle()
    : { data: null };

  const { data: product } = productId
    ? await supabase
        .from("expo_brand_products")
        .select("*")
        .eq("id", productId)
        .maybeSingle()
    : { data: null };

  const { data: event } = eventId
    ? await supabase
        .from("expo_brand_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle()
    : { data: null };

  const item = product || event;
  const isEvent = !!event && !product;

  if (!brand || !item) {
    return (
      <main className="min-h-screen bg-[#f6f8f3] px-4 py-10">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
          <h1 className="text-3xl font-extrabold text-stone-900">
            주문 정보를 찾을 수 없습니다.
          </h1>

          <Link
            href="/expo"
            className="mt-6 block rounded-2xl bg-green-700 px-5 py-5 text-xl font-extrabold text-white"
          >
            EXPO 홈으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const itemTitle = isEvent ? event.title : product.product_name;
  const itemDesc = isEvent ? event.description : product.short_description;
  const itemImage = isEvent ? event.image_url : product.image_url;
  const itemCategory = isEvent
    ? event.event_type || "이벤트"
    : product.category || "제품";

  const bankName = brand.bank_name || "기업은행";
  const bankAccount = brand.bank_account || "486-072683-04-011";
  const bankHolder = brand.bank_holder || "한국농수산TV";

  const baseArea = !isEvent ? num(product.base_area_pyeong) : 0;
  const rounds = !isEvent ? num(product.recommended_rounds) : 0;
  const sprayInterval = !isEvent ? product.spray_interval || "" : "";
  const usePeriod = !isEvent ? product.use_period || "" : "";

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-6">
      <Script
        src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        strategy="afterInteractive"
      />

      <section className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5">
          <div className="bg-green-800 p-6 text-white">
            <p className="text-base font-extrabold text-yellow-200">
              K-Agri Expo
            </p>

            <h1 className="mt-2 text-4xl font-extrabold">
              {isEvent ? "공동구매 · 이벤트 신청" : "제품 주문"}
            </h1>

            <p className="mt-3 text-xl font-bold text-green-50">
              {brand.brand_name}
            </p>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr]">
            <section>
              <div className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5">
                <div className="flex h-72 items-center justify-center rounded-2xl bg-white">
                  {itemImage ? (
                    <img
                      src={itemImage}
                      alt={itemTitle}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xl font-extrabold text-stone-400">
                      이미지 준비중
                    </span>
                  )}
                </div>

                <div className="mt-5 inline-flex rounded-full bg-green-100 px-4 py-2 text-base font-extrabold text-green-800">
                  {itemCategory}
                </div>

                <h2 className="mt-4 text-3xl font-extrabold text-stone-900">
                  {itemTitle}
                </h2>

                <p className="mt-3 text-lg font-bold leading-relaxed text-stone-600">
                  {itemDesc || "상세 내용은 접수 후 안내드립니다."}
                </p>

                {!isEvent ? (
                  <div className="mt-5 rounded-3xl bg-yellow-50 p-5 ring-1 ring-yellow-200">
                    <p className="text-lg font-extrabold text-stone-900">
                      제품가: {money(product.price_krw)}
                    </p>

                    <p className="mt-2 text-lg font-extrabold text-stone-900">
                      택배비: {money(product.shipping_fee_krw)}
                    </p>

                    {baseArea > 0 || rounds > 0 ? (
                      <div className="mt-4 rounded-2xl bg-white p-4 text-base font-extrabold text-stone-800 ring-1 ring-yellow-200">
                        {baseArea > 0 ? (
                          <p>
                            1개 기준 사용 평수:{" "}
                            {baseArea.toLocaleString("ko-KR")}평
                          </p>
                        ) : null}

                        {rounds > 0 ? (
                          <p className="mt-1">권장 살포 횟수: {rounds}회</p>
                        ) : null}

                        {sprayInterval ? (
                          <p className="mt-1">살포 간격: {sprayInterval}</p>
                        ) : null}

                        {usePeriod ? (
                          <p className="mt-1">사용 가능 시기: {usePeriod}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 rounded-3xl bg-yellow-50 p-6 ring-1 ring-yellow-300">
                  <p className="text-2xl font-extrabold text-stone-900">
                    무통장입금 안내
                  </p>

                  <p className="mt-5 text-4xl font-extrabold leading-tight text-red-600">
                    {bankName} {bankAccount}
                  </p>

                  <p className="mt-4 text-2xl font-extrabold text-stone-900">
                    예금주: {bankHolder}
                  </p>

                  <div className="mt-6 space-y-2 text-lg font-bold leading-relaxed text-stone-700">
                    <p>입금 확인 후 순차 발송됩니다.</p>
                    <p>입금자명이 다를 경우 요청사항에 함께 남겨주세요.</p>
                  </div>
                </div>
              </div>
            </section>

            <BrandOrderFormClient
              isEvent={isEvent}
              brandId={brandId}
              productId={productId}
              eventId={eventId}
              baseArea={baseArea}
              rounds={rounds}
              sprayInterval={sprayInterval}
              usePeriod={usePeriod}
            />
          </div>
        </div>
      </section>
    </main>
  );
}