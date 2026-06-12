import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AgriAssetRow = {
  id: string;
  asset_name?: string | null;
  product_name?: string | null;
  variety_name?: string | null;
  producer_name?: string | null;
  producer_region?: string | null;
  main_grade?: string | null;
  size_spec?: string | null;
  total_quantity?: number | string | null;
  unit?: string | null;
  expected_price?: number | string | null;
  estimated_value?: number | string | null;
  storage_location?: string | null;
  storage_method?: string | null;
  quality_score?: number | string | null;
  ai_sales_score?: number | string | null;
  status?: string | null;
  created_at?: string | null;
};

function money(v: unknown) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}

function num(v: unknown) {
  const n = Number(v ?? 0);
  if (!Number.isFinite(n) || n <= 0) return "-";
  return n.toLocaleString("ko-KR");
}

function date(v?: string | null) {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("ko-KR");
}

export default async function AgriExchangeMarketPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (key: string) => String(sp[key] ?? "").trim();

  const product = q("product");
  const region = q("region");
  const variety = q("variety");
  const spec = q("spec");
  const minQty = q("minQty");
  const maxPrice = q("maxPrice");
  const quality = q("quality");
  const aiScore = q("aiScore");

  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("agri_assets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (product) query = query.ilike("product_name", `%${product}%`);
  if (region) query = query.ilike("producer_region", `%${region}%`);
  if (variety) query = query.ilike("variety_name", `%${variety}%`);
  if (spec) query = query.ilike("size_spec", `%${spec}%`);
  if (minQty) query = query.gte("total_quantity", Number(minQty));
  if (maxPrice) query = query.lte("expected_price", Number(maxPrice));
  if (quality) query = query.gte("quality_score", Number(quality));
  if (aiScore) query = query.gte("ai_sales_score", Number(aiScore));

  const { data, error } = await query;
  const rows = (data ?? []) as AgriAssetRow[];

  return (
    <main className="min-h-screen bg-[#f4f7f2] p-4 text-black">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/expo" className="text-sm font-black text-green-700">
              ← K-Agri Expo
            </Link>
            <h1 className="mt-3 text-3xl font-black md:text-5xl">
              K-Agri 농산물거래소
            </h1>
            <p className="mt-2 text-base font-bold text-gray-700">
              전국 농산물을 품목·지역·수량·단가·규격 기준으로 빠르게 비교합니다.
            </p>
          </div>

          <Link
            href="/expo/agri-exchange/register"
            className="rounded-2xl bg-green-700 px-6 py-4 text-lg font-black text-white shadow"
          >
            내 농산물 등록하기
          </Link>
        </div>

        <form className="mb-5 rounded-3xl border bg-white p-4 shadow">
          <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
            <input name="product" defaultValue={product} placeholder="품목 검색" className="rounded-xl border px-3 py-3 font-bold" />
            <input name="region" defaultValue={region} placeholder="지역 검색" className="rounded-xl border px-3 py-3 font-bold" />
            <input name="variety" defaultValue={variety} placeholder="품종 검색" className="rounded-xl border px-3 py-3 font-bold" />
            <input name="spec" defaultValue={spec} placeholder="규격 검색" className="rounded-xl border px-3 py-3 font-bold" />
            <input name="minQty" defaultValue={minQty} placeholder="최소수량" type="number" className="rounded-xl border px-3 py-3 font-bold" />
            <input name="maxPrice" defaultValue={maxPrice} placeholder="최대단가" type="number" className="rounded-xl border px-3 py-3 font-bold" />
            <input name="quality" defaultValue={quality} placeholder="품질점수 이상" type="number" className="rounded-xl border px-3 py-3 font-bold" />
            <input name="aiScore" defaultValue={aiScore} placeholder="AI점수 이상" type="number" className="rounded-xl border px-3 py-3 font-bold" />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button className="rounded-xl bg-black px-5 py-3 font-black text-white">
              검색
            </button>
            <Link href="/expo/agri-exchange/market" className="rounded-xl border px-5 py-3 font-black">
              초기화
            </Link>
            <label className="flex items-center gap-2 rounded-xl border px-4 py-3 font-black">
              <input type="checkbox" name="live" />
              LIVE 창고인증
            </label>
          </div>
        </form>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 font-black text-red-700">
            농산물 목록을 불러오지 못했습니다: {error.message}
          </div>
        ) : (
          <section className="overflow-hidden rounded-3xl border bg-white shadow">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-black">전국 농산물 목록</h2>
              <p className="font-black text-green-700">{rows.length}건</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1800px] w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-gray-100">
                  <tr className="text-left">
                    {[
                      "선택","품목","품종","산지","생산자","규격","총수량","단위",
                      "희망단가","예상금액","보관위치","저장방식","품질점수",
                      "AI판매점수","등록일","상태","관리"
                    ].map((h) => (
                      <th key={h} className="border-b px-3 py-3 font-black whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="p-10 text-center text-lg font-black text-gray-500">
                        등록된 농산물이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="hover:bg-green-50">
                        <td className="border-b px-3 py-3"><input type="checkbox" /></td>
                        <td className="border-b px-3 py-3 font-black">{r.product_name ?? r.asset_name ?? "-"}</td>
                        <td className="border-b px-3 py-3">{r.variety_name ?? "-"}</td>
                        <td className="border-b px-3 py-3 font-bold">{r.producer_region ?? "-"}</td>
                        <td className="border-b px-3 py-3">{r.producer_name ?? "-"}</td>
                        <td className="border-b px-3 py-3">{r.size_spec ?? r.main_grade ?? "-"}</td>
                        <td className="border-b px-3 py-3 text-right font-black">{num(r.total_quantity)}</td>
                        <td className="border-b px-3 py-3">{r.unit ?? "-"}</td>
                        <td className="border-b px-3 py-3 text-right font-black">{money(r.expected_price)}</td>
                        <td className="border-b px-3 py-3 text-right font-black text-green-700">{money(r.estimated_value)}</td>
                        <td className="border-b px-3 py-3">{r.storage_location ?? "-"}</td>
                        <td className="border-b px-3 py-3">{r.storage_method ?? "-"}</td>
                        <td className="border-b px-3 py-3 text-center font-black">{r.quality_score ?? "-"}</td>
                        <td className="border-b px-3 py-3 text-center font-black">{r.ai_sales_score ?? "-"}</td>
                        <td className="border-b px-3 py-3">{date(r.created_at)}</td>
                        <td className="border-b px-3 py-3">
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">
                            {r.status ?? "거래가능"}
                          </span>
                        </td>
                        <td className="border-b px-3 py-3">
                          <div className="flex gap-2 whitespace-nowrap">
                            <Link href={`/admin/agri-assets/${r.id}`} className="rounded-lg border px-3 py-2 font-black">
                              상세보기
                            </Link>
                            <Link href={`/admin/buyers?assetId=${r.id}`} className="rounded-lg bg-blue-700 px-3 py-2 font-black text-white">
                              거래문의
                            </Link>
                            <Link href={`/admin/trade-offers?assetId=${r.id}`} className="rounded-lg bg-green-700 px-3 py-2 font-black text-white">
                              거래제안 생성
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
