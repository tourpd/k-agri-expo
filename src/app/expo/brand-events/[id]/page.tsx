import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getYoutubeId(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";
  if (v.includes("youtu.be/")) return v.split("youtu.be/")[1]?.split("?")[0] || "";
  if (v.includes("watch?v=")) return v.split("watch?v=")[1]?.split("&")[0] || "";
  if (v.includes("youtube.com/embed/")) {
    return v.split("youtube.com/embed/")[1]?.split("?")[0] || "";
  }
  return "";
}

function toYoutubeList(event: any) {
  const list = Array.isArray(event.youtube_urls) ? event.youtube_urls : [];
  const single = event.youtube_url ? [event.youtube_url] : [];
  return Array.from(new Set([...single, ...list].filter(Boolean)));
}

function safeText(v: unknown, fallback: string) {
  const s = String(v || "").trim();
  return s || fallback;
}

function money(v: unknown) {
  const n = Number(v || 0);
  if (!n) return "상담 후 안내";
  return `${n.toLocaleString("ko-KR")}원`;
}

function isPdf(url?: string | null) {
  return String(url || "").toLowerCase().includes(".pdf");
}

export default async function BrandEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: event } = await supabase
    .from("expo_brand_events")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (!event) notFound();

  const { data: brand } = await supabase
    .from("expo_brands")
    .select("*")
    .eq("id", event.brand_id)
    .maybeSingle();

  const youtubeUrls = toYoutubeList(event);

  const orderHref = `/expo/brand-order?brand_id=${encodeURIComponent(
    event.brand_id
  )}&event_id=${encodeURIComponent(event.id)}`;

  const aiConsultHref = `/expo/consult?brand_id=${encodeURIComponent(
    event.brand_id
  )}&type=event_ai&event_id=${encodeURIComponent(event.id)}`;

  const isDeal = event.event_type === "공동구매" || event.event_type === "특가";

  return (
    <main className="min-h-screen bg-[#f6f8f3] px-4 py-5">
      <section className="mx-auto max-w-6xl">
        <Link
          href={brand?.brand_slug ? `/expo/brands/${brand.brand_slug}` : "/expo/brands"}
          className="mb-4 inline-flex rounded-2xl bg-white px-4 py-3 text-base font-extrabold text-stone-800 ring-1 ring-black/10"
        >
          ← 브랜드관으로 돌아가기
        </Link>

        <div className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5">
          <div className="bg-yellow-400 p-6 text-stone-950">
            <p className="text-base font-extrabold">
              {brand?.brand_name || "K-Agri Expo"} · {event.event_type}
            </p>

            <h1 className="mt-2 text-4xl font-extrabold">{event.title}</h1>

            <p className="mt-3 text-xl font-bold text-stone-800">
              {event.description || "이벤트 상세 정보"}
            </p>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl bg-stone-50 p-5 ring-1 ring-black/5">
              <div className="flex h-96 items-center justify-center rounded-2xl bg-white">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-xl font-extrabold text-stone-400">
                    이벤트 이미지
                  </span>
                )}
              </div>

              <div className="mt-5 inline-flex rounded-full bg-yellow-200 px-4 py-2 text-base font-extrabold text-stone-900">
                {event.event_type || "이벤트"}
              </div>

              <div className="mt-5 rounded-3xl bg-yellow-50 p-5 ring-1 ring-yellow-200">
                <p className="text-lg font-extrabold text-stone-900">
                  행사가: {money(event.price_krw)}
                </p>
                <p className="mt-2 text-lg font-extrabold text-stone-900">
                  택배비: {money(event.shipping_fee_krw)}
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {event.catalog_url ? (
                  <ResourceCard url={event.catalog_url} title="상세 자료 보기" />
                ) : null}

                {event.manual_url ? (
                  <ResourceCard url={event.manual_url} title="사용설명서/이미지자료 보기" />
                ) : null}

                <Link
                  href={aiConsultHref}
                  className="rounded-2xl bg-white px-5 py-5 text-center text-xl font-extrabold text-stone-900 ring-1 ring-black/10"
                >
                  AI 상담하기
                </Link>

                <Link
                  href={orderHref}
                  className="rounded-2xl bg-yellow-300 px-5 py-5 text-center text-xl font-extrabold text-stone-950"
                >
                  {isDeal ? "공동구매 신청하기" : "이벤트 신청하기"}
                </Link>
              </div>
            </section>

            <section className="grid gap-5">
              <InfoBox title="상세 설명">
                {safeText(
                  event.detail_description || event.description,
                  "상세 설명을 준비 중입니다."
                )}
              </InfoBox>

              <div className="grid gap-5 md:grid-cols-2">
                <InfoBox title="행사 조건">
                  {safeText(event.event_condition, "행사 조건 준비중")}
                </InfoBox>

                <InfoBox title="행사 기간">
                  {safeText(event.event_period, "행사 기간 준비중")}
                </InfoBox>
              </div>

              <InfoBox title="대상 제품">
                {safeText(event.target_product, "대상 제품 정보 준비중")}
              </InfoBox>
            </section>
          </div>
        </div>

        {youtubeUrls.length > 0 ? (
          <section className="mt-8 rounded-[32px] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-3xl font-extrabold text-stone-900">
              관련 영상
            </h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {youtubeUrls.map((url) => (
                <YoutubeCard key={String(url)} url={String(url)} />
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

function ResourceCard({ url, title }: { url: string; title: string }) {
  if (isPdf(url)) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="rounded-2xl bg-white px-5 py-4 text-center text-lg font-extrabold text-stone-900 ring-1 ring-black/10"
      >
        {title}
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block overflow-hidden rounded-2xl bg-white ring-1 ring-black/10"
    >
      <img src={url} alt={title} className="max-h-80 w-full object-contain p-3" />
      <div className="bg-stone-100 px-5 py-4 text-center text-lg font-extrabold text-stone-900">
        {title}
      </div>
    </a>
  );
}

function YoutubeCard({ url }: { url: string }) {
  const vid = getYoutubeId(url);

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="overflow-hidden rounded-3xl bg-black"
    >
      {vid ? (
        <div className="relative aspect-video">
          <img
            src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`}
            alt="이벤트 영상"
            className="h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full bg-red-600 px-6 py-4 text-xl font-extrabold text-white">
              ▶
            </div>
          </div>
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center text-xl font-extrabold text-white">
          영상 보기
        </div>
      )}
    </a>
  );
}

function InfoBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <h2 className="text-2xl font-extrabold text-stone-900">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-lg font-bold leading-relaxed text-stone-700">
        {children}
      </p>
    </div>
  );
}