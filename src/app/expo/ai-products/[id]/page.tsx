/* eslint-disable @next/next/no-img-element */

import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = {
  params: Promise<{ id: string }>;
};

function money(v: unknown) {
  const n = Number(v || 0);
  if (!n) return "가격 문의";
  return `${n.toLocaleString("ko-KR")}원`;
}

function youtubeId(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";
  if (v.includes("youtu.be/")) return v.split("youtu.be/")[1]?.split("?")[0] || "";
  if (v.includes("watch?v=")) return v.split("watch?v=")[1]?.split("&")[0] || "";
  if (v.includes("youtube.com/shorts/")) return v.split("youtube.com/shorts/")[1]?.split("?")[0] || "";
  if (v.includes("youtube.com/embed/")) return v.split("youtube.com/embed/")[1]?.split("?")[0] || "";
  return "";
}

function salesTypeLabel(v?: string | null) {
  switch (v) {
    case "group_buy":
      return "공동구매";
    case "sample":
      return "샘플신청";
    case "live":
      return "라이브판매";
    case "consulting":
      return "상담형 판매";
    default:
      return "일반판매";
  }
}

function formatBankAccount(v?: string | null) {
  const s = String(v || "").trim();
  if (!s) return "계좌번호 준비중";
  if (s.includes("-")) return s;

  const n = s.replace(/\D/g, "");
  if (n.length === 14) return `${n.slice(0, 3)}-${n.slice(3, 10)}-${n.slice(10)}`;
  if (n.length === 13) return `${n.slice(0, 3)}-${n.slice(3, 9)}-${n.slice(9)}`;
  return s;
}

function imageList(v: unknown) {
  return Array.isArray(v) ? v.map((x) => String(x || "").trim()).filter(Boolean) : [];
}

export default async function AIProductDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: product } = await supabase
    .from("expo_ai_products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const productName = product.product_name || "AI 추천 제품";
  const category = product.category || "농자재";
  const salesLabel = salesTypeLabel(product.sales_type);

  const salePrice = Number(product.group_buy_price || product.sale_price || 0);
  const regularPrice = Number(product.regular_price || 0);
  const shippingFee = Number(product.shipping_fee || 0);
  const discount =
    regularPrice > salePrice && salePrice > 0
      ? Math.round(((regularPrice - salePrice) / regularPrice) * 100)
      : 0;

  const videoUrls = Array.isArray(product.video_urls) ? product.video_urls : [];
  const mainVideo = product.youtube_url || videoUrls[0] || "";
  const mainVideoId = youtubeId(mainVideo);

  const images = imageList(product.image_urls);
  const heroImage =
    images[0] ||
    (mainVideoId ? `https://img.youtube.com/vi/${mainVideoId}/hqdefault.jpg` : "");

  const productImage = images[1] || heroImage;
  const problemImage = images[2] || heroImage;
  const solutionImage = images[3] || productImage || heroImage;

  return (
    <main className="min-h-screen bg-[#f4f7f2] text-stone-950">
      <section className="mx-auto max-w-6xl px-4 py-6">
        <section className="overflow-hidden rounded-[36px] bg-white shadow-xl ring-1 ring-black/5">
          <div className="grid lg:grid-cols-[1fr_1fr]">
            <div className="bg-gradient-to-br from-green-900 via-green-800 to-green-600 p-8 text-white">
              <p className="text-lg font-black text-yellow-200">
                K-Agri Expo 농민 설득형 판매페이지
              </p>

              <h1 className="mt-4 text-5xl font-black leading-tight">
                {productName}
              </h1>

              <h2 className="mt-6 text-4xl font-black leading-tight text-yellow-200">
                농민이 현장에서 겪는 문제,
                <br />
                지금 해결해야 합니다.
              </h2>

              <p className="mt-5 text-2xl font-bold leading-relaxed text-green-50">
                제품 설명보다 중요한 것은 “내 농사에 도움이 되는가”입니다.
                피해, 해결, 영상, 가격을 한눈에 보고 바로 신청할 수 있게 구성했습니다.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/15 px-5 py-3 text-lg font-black text-white">
                  {category}
                </span>
                <span className="rounded-full bg-yellow-300 px-5 py-3 text-lg font-black text-stone-950">
                  {salesLabel}
                </span>
                <span className="rounded-full bg-red-500 px-5 py-3 text-lg font-black text-white">
                  {shippingFee === 0 ? "무료배송" : `배송비 ${money(shippingFee)}`}
                </span>
              </div>
            </div>

            <div className="relative min-h-[420px] bg-stone-950">
              {heroImage ? (
                <img
                  src={heroImage}
                  alt={`${productName} 대표 이미지`}
                  className="h-full min-h-[420px] w-full object-cover opacity-90"
                />
              ) : (
                <div className="flex h-full min-h-[420px] items-center justify-center bg-stone-800 text-3xl font-black text-white">
                  제품 대표 이미지
                </div>
              )}

              <div className="absolute inset-x-5 bottom-5 rounded-3xl bg-black/70 p-5 text-white backdrop-blur">
                <p className="text-xl font-black text-yellow-200">
                  농민 현장 문제 해결 상품
                </p>
                <p className="mt-2 text-3xl font-black">
                  {money(salePrice)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[32px] bg-red-50 shadow-lg ring-1 ring-red-100">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="bg-red-900">
              {problemImage ? (
                <img
                  src={problemImage}
                  alt="피해 작물 이미지"
                  className="h-full min-h-[360px] w-full object-cover opacity-90"
                />
              ) : (
                <div className="flex h-full min-h-[360px] items-center justify-center text-2xl font-black text-white">
                  피해 작물 이미지
                </div>
              )}
            </div>

            <div className="p-7">
              <p className="text-lg font-black text-red-700">STEP 01 문제 공감</p>
              <h2 className="mt-2 text-4xl font-black text-stone-950">
                이런 문제, 그냥 넘기면 수확 때 차이가 납니다.
              </h2>

              <div className="mt-6 grid gap-4">
                <ProblemCard title="작물 상태가 약해진다" desc="초기에는 작아 보여도 시간이 지나면 생육과 수량 차이로 이어집니다." />
                <ProblemCard title="피해가 반복된다" desc="한 번 잡힌 것 같아도 다시 올라오는 문제가 농가를 가장 힘들게 합니다." />
                <ProblemCard title="수확량이 줄어든다" desc="농민에게 가장 큰 손실은 결국 수확량과 상품성 저하입니다." />
                <ProblemCard title="지금 판단이 중요하다" desc="작기가 지나면 다시 되돌리기 어렵기 때문에 빠른 판단이 필요합니다." />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[32px] bg-white shadow-lg ring-1 ring-black/5">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-7">
              <p className="text-lg font-black text-green-700">STEP 02 해결 제안</p>
              <h2 className="mt-2 text-4xl font-black text-stone-950">
                그래서 {productName}을 확인해야 합니다.
              </h2>

              <div className="mt-6 grid gap-4">
                <PointCard title="농민 문제 중심" desc="제품 설명보다 현장 문제 해결에 초점을 맞췄습니다." />
                <PointCard title="사용 판단 쉬움" desc="언제, 왜 필요한지 농민 기준으로 이해할 수 있게 구성했습니다." />
                <PointCard title="영상 확인 가능" desc="글만 보는 것이 아니라 영상으로 제품과 현장을 확인할 수 있습니다." />
              </div>
            </div>

            <div className="bg-green-900">
              {solutionImage ? (
                <img
                  src={solutionImage}
                  alt="제품 해결 이미지"
                  className="h-full min-h-[360px] w-full object-cover opacity-90"
                />
              ) : (
                <div className="flex h-full min-h-[360px] items-center justify-center text-2xl font-black text-white">
                  제품 사용 이미지
                </div>
              )}
            </div>
          </div>
        </section>

        {mainVideoId ? (
          <section className="mt-6 rounded-[32px] bg-black p-7 text-white shadow-lg">
            <p className="text-lg font-black text-red-300">STEP 03 홍보영상</p>
            <h2 className="mt-2 text-4xl font-black">
              영상으로 먼저 확인하세요.
            </h2>

            <a
              href={mainVideo}
              target="_blank"
              rel="noreferrer"
              className="mt-6 block overflow-hidden rounded-3xl bg-stone-900"
            >
              <div className="relative aspect-video">
                <img
                  src={`https://img.youtube.com/vi/${mainVideoId}/hqdefault.jpg`}
                  alt="홍보 영상"
                  className="h-full w-full object-cover opacity-90"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-red-600 px-8 py-6 text-4xl font-black text-white shadow-xl">
                    ▶
                  </div>
                </div>
              </div>
              <div className="bg-red-600 px-5 py-5 text-center text-2xl font-black text-white">
                홍보영상 보기
              </div>
            </a>
          </section>
        ) : null}

        <section className="mt-6 rounded-[32px] bg-yellow-50 p-7 shadow-lg ring-1 ring-yellow-200">
          <p className="text-lg font-black text-yellow-800">STEP 04 가격 확인</p>
          <h2 className="mt-2 text-4xl font-black text-stone-950">
            지금 신청 가능한 가격입니다.
          </h2>

          <div className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-yellow-200">
            {regularPrice > 0 ? (
              <p className="text-3xl font-black text-stone-400 line-through">
                정상가 {money(regularPrice)}
              </p>
            ) : null}

            {discount > 0 ? (
              <p className="mt-3 text-2xl font-black text-red-600">
                {discount}% 할인
              </p>
            ) : null}

            <p className="mt-2 text-7xl font-black text-green-700">
              {money(salePrice)}
            </p>

            <div className="mt-5 grid gap-2 text-2xl font-black text-stone-800">
              <p>판매단위: {product.unit_label || "상담 후 안내"}</p>
              <p>배송비: {shippingFee === 0 ? "무료배송" : money(shippingFee)}</p>
              <p>판매방식: {salesLabel}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] bg-white p-7 shadow-lg ring-1 ring-black/5">
          <p className="text-lg font-black text-green-700">STEP 05 신청 안내</p>
          <h2 className="mt-2 text-4xl font-black text-stone-950">
            신청 후 입금 확인되면 순차 안내됩니다.
          </h2>

          <div className="mt-6 rounded-3xl bg-blue-50 p-6 ring-1 ring-blue-100">
            <p className="text-2xl font-black text-stone-950">입금계좌</p>
            <p className="mt-3 text-4xl font-black text-red-600">
              {product.bank_name || "은행명"} {formatBankAccount(product.bank_account)}
            </p>
            <p className="mt-3 text-2xl font-black text-stone-900">
              예금주: {product.bank_holder || "예금주 준비중"}
            </p>
          </div>
        </section>

        <section className="sticky bottom-0 mt-8 rounded-t-3xl bg-white/95 p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-black text-stone-600">신청가</p>
              <p className="text-4xl font-black text-green-700">
                {money(salePrice)}
              </p>
            </div>

            <button className="rounded-3xl bg-green-700 px-10 py-5 text-3xl font-black text-white">
              지금 신청하기
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

function ProblemCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-red-100">
      <h3 className="text-2xl font-black text-stone-950">{title}</h3>
      <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">{desc}</p>
    </div>
  );
}

function PointCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5">
      <h3 className="text-2xl font-black text-stone-950">{title}</h3>
      <p className="mt-3 text-lg font-bold leading-relaxed text-stone-700">{desc}</p>
    </div>
  );
}