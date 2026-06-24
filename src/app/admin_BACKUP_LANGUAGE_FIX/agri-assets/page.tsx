"use client";

import { useEffect, useMemo, useState } from "react";

type AgriAsset = {
  id: string;
  asset_name?: string | null;
  product_name?: string | null;
  variety_name?: string | null;
  producer_name?: string | null;
  producer_region?: string | null;
  main_grade?: string | null;
  size_spec?: string | null;
  total_quantity?: number | null;
  unit?: string | null;
  large_quantity?: number | null;
  medium_quantity?: number | null;
  small_quantity?: number | null;
  harvest_date?: string | null;
  storage_location?: string | null;
  storage_method?: string | null;
  expected_price?: number | null;
  estimated_value?: number | null;
  photo_count?: number | null;
  video_count?: number | null;
  certificate_count?: number | null;
  quality_score?: number | null;
  ai_sales_score?: number | null;
  recommended_channel?: string | null;
  memo?: string | null;
};

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function won(v: unknown) {
  return `${n(v).toLocaleString()}원`;
}

export default function AgriAssetsPage() {
  const [items, setItems] = useState<AgriAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/agri-assets?ts=" + Date.now(), {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "농산물 자산 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "농산물 자산 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    return {
      total: items.length,
      qty: items.reduce((sum, x) => sum + n(x.total_quantity), 0),
      value: items.reduce((sum, x) => sum + n(x.estimated_value), 0),
      photos: items.reduce((sum, x) => sum + n(x.photo_count), 0),
      videos: items.reduce((sum, x) => sum + n(x.video_count), 0),
      certs: items.reduce((sum, x) => sum + n(x.certificate_count), 0),
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[3000px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI AGRI ASSET CENTER</p>
            <h1 className="text-4xl font-black">농산물 자산센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <a href="/admin/storage-assets" className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white no-underline">
              저장자산
            </a>
            <a href="/admin/processors" className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white no-underline">
              가공센터
            </a>
            <button className="rounded bg-black px-4 py-3 text-sm font-black text-white">
              엑셀 다운로드
            </button>
          </div>
        </div>

        {error ? (
          <section className="mb-3 border border-red-300 bg-red-50 p-3 font-black text-red-700">
            {error}
          </section>
        ) : null}

        <section className="mb-3 grid grid-cols-6 gap-2">
          <Stat title="농산물 자산" value={`${stats.total}건`} />
          <Stat title="총수량" value={`${stats.qty.toLocaleString()}톤`} />
          <Stat title="예상가치" value={won(stats.value)} />
          <Stat title="사진" value={`${stats.photos}장`} />
          <Stat title="영상" value={`${stats.videos}개`} />
          <Stat title="성적서" value={`${stats.certs}개`} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-8 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="품목·생산자 검색" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="지역" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="품종" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="규격" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소수량" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="품질점수" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="AI점수" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}건 / 농산물을 사진·영상·품질·규격·재고까지 디지털 자산화합니다.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[3300px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>자산명</Th>
                  <Th>품목</Th>
                  <Th>품종</Th>
                  <Th>생산자</Th>
                  <Th>지역</Th>
                  <Th>등급</Th>
                  <Th>규격</Th>
                  <Th>총수량</Th>
                  <Th>단위</Th>
                  <Th>대</Th>
                  <Th>중</Th>
                  <Th>소</Th>
                  <Th>수확일</Th>
                  <Th>저장위치</Th>
                  <Th>저장방식</Th>
                  <Th>기준가</Th>
                  <Th>예상가치</Th>
                  <Th>사진</Th>
                  <Th>영상</Th>
                  <Th>성적서</Th>
                  <Th>품질점수</Th>
                  <Th>AI판매점수</Th>
                  <Th>추천판매처</Th>
                  <Th>메모</Th>
                  <Th>관리</Th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={27} className="border p-8 text-center font-black text-neutral-500">
                      농산물 자산 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td strong>{x.asset_name || "-"}</Td>
                      <Td strong>{x.product_name || "-"}</Td>
                      <Td>{x.variety_name || "-"}</Td>
                      <Td strong>{x.producer_name || "-"}</Td>
                      <Td>{x.producer_region || "-"}</Td>
                      <Td>{x.main_grade || "-"}</Td>
                      <Td>{x.size_spec || "-"}</Td>
                      <Td strong>{n(x.total_quantity).toLocaleString()}</Td>
                      <Td>{x.unit || "-"}</Td>
                      <Td>{n(x.large_quantity).toLocaleString()}</Td>
                      <Td>{n(x.medium_quantity).toLocaleString()}</Td>
                      <Td>{n(x.small_quantity).toLocaleString()}</Td>
                      <Td>{x.harvest_date || "-"}</Td>
                      <Td>{x.storage_location || "-"}</Td>
                      <Td>{x.storage_method || "-"}</Td>
                      <Td>{won(x.expected_price)}</Td>
                      <Td strong>{won(x.estimated_value)}</Td>
                      <Td>{n(x.photo_count)}장</Td>
                      <Td>{n(x.video_count)}개</Td>
                      <Td>{n(x.certificate_count)}개</Td>
                      <Td strong>{n(x.quality_score)}점</Td>
                      <Td strong>{n(x.ai_sales_score)}점</Td>
                      <Td>{x.recommended_channel || "-"}</Td>
                      <Td>{x.memo || "-"}</Td>
                      <Td>
                        <a
                          href={`/admin/agri-assets/${x.id}`}
                          className="rounded bg-green-700 px-3 py-1 text-xs font-black text-white no-underline"
                        >
                          자산카드
                        </a>
                      </Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border bg-white p-4">
      <p className="text-xs font-black text-neutral-500">{title}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap border border-neutral-300 bg-neutral-200 px-2 py-2 text-left font-black">
      {children}
    </th>
  );
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <td className={`whitespace-nowrap border border-neutral-200 px-2 py-2 ${strong ? "font-black" : "font-bold text-neutral-700"}`}>
      {children}
    </td>
  );
}
