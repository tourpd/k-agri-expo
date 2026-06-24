"use client";

import { useEffect, useMemo, useState } from "react";

type StorageAsset = {
  id: string;
  asset_type?: string | null;
  product_name?: string | null;
  variety_name?: string | null;
  owner_name?: string | null;
  owner_type?: string | null;
  region?: string | null;
  warehouse_name?: string | null;
  quantity?: number | null;
  unit?: string | null;
  expected_price?: number | null;
  estimated_value?: number | null;
  available_from?: string | null;
  processing_available?: boolean | null;
  buyer_target?: string | null;
  memo?: string | null;
  created_at?: string | null;
};

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function won(v: unknown) {
  return `${n(v).toLocaleString()}원`;
}

function assetTypeLabel(v?: string | null) {
  if (v === "crop") return "농산물";
  if (v === "livestock") return "축산물";
  if (v === "fishery") return "수산물";
  if (v === "processed") return "가공원료";
  if (v === "future_food") return "미래식량";
  if (v === "health_material") return "건강원료";
  return v || "-";
}

function ownerTypeLabel(v?: string | null) {
  if (v === "producer") return "생산자";
  if (v === "aggregator") return "수매상";
  if (v === "wholesaler") return "도매상";
  if (v === "cooperative") return "조합";
  if (v === "company") return "기업";
  return v || "-";
}

function aiMatch(x: StorageAsset) {
  const name = `${x.product_name || ""} ${x.buyer_target || ""}`;
  if (name.includes("마늘")) return "김치공장·깐마늘공장·식자재업체";
  if (name.includes("양파")) return "식자재업체·도매상·가공공장";
  if (name.includes("전복")) return "수출바이어·식당·식자재업체";
  if (x.asset_type === "livestock") return "정육점·식당·유통업체";
  return "AI 매칭대기";
}

export default function StorageAssetsPage() {
  const [items, setItems] = useState<StorageAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/storage-assets?ts=" + Date.now(), {
        cache: "no-store",
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "저장자산 조회 실패");
      }

      setItems(json.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장자산 조회 실패");
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
      quantity: items.reduce((sum, x) => sum + n(x.quantity), 0),
      value: items.reduce((sum, x) => sum + n(x.estimated_value), 0),
      process: items.filter((x) => x.processing_available).length,
      crop: items.filter((x) => x.asset_type === "crop").length,
      fishery: items.filter((x) => x.asset_type === "fishery").length,
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2600px]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-green-700">K-AGRI STORAGE ASSET CENTER</p>
            <h1 className="text-3xl font-black">저장자산센터</h1>
          </div>

          <div className="flex gap-2">
            <button onClick={load} className="h-10 rounded bg-green-700 px-4 text-sm font-black text-white">
              {loading ? "조회중" : "새로고침"}
            </button>
            <button className="h-10 rounded bg-blue-700 px-4 text-sm font-black text-white">AI 매칭</button>
            <button className="h-10 rounded bg-orange-600 px-4 text-sm font-black text-white">바이어 추출</button>
            <button className="h-10 rounded bg-black px-4 text-sm font-black text-white">엑셀 다운로드</button>
          </div>
        </div>

        {error ? (
          <section className="mb-3 border border-red-300 bg-red-50 p-3 font-black text-red-700">
            {error}
          </section>
        ) : null}

        <section className="mb-3 grid grid-cols-6 gap-2">
          <MiniStat title="전체자산" value={`${stats.total}건`} />
          <MiniStat title="총재고" value={`${stats.quantity.toLocaleString()} 단위`} />
          <MiniStat title="예상가치" value={won(stats.value)} />
          <MiniStat title="가공가능" value={`${stats.process}건`} />
          <MiniStat title="농산물" value={`${stats.crop}건`} />
          <MiniStat title="수산물" value={`${stats.fishery}건`} />
        </section>

        <section className="mb-3 border bg-white p-3">
          <div className="grid grid-cols-8 gap-2">
            <input className="h-10 border px-3 text-sm font-bold" placeholder="품목·보유자 검색" />
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 유형</option>
              <option>농산물</option>
              <option>축산물</option>
              <option>수산물</option>
              <option>가공원료</option>
            </select>
            <select className="h-10 border px-3 text-sm font-bold">
              <option>전체 역할</option>
              <option>생산자</option>
              <option>수매상</option>
              <option>도매상</option>
              <option>조합</option>
            </select>
            <input className="h-10 border px-3 text-sm font-bold" placeholder="지역" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="창고" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="최소재고" />
            <input className="h-10 border px-3 text-sm font-bold" placeholder="바이어타겟" />
            <button className="h-10 bg-neutral-900 px-4 text-sm font-black text-white">검색</button>
          </div>
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            표시 {items.length}건 / 전국 저온창고·냉장창고·저장재고를 거래 자산으로 관리합니다.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[2600px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-neutral-200">
                  <Th><input type="checkbox" /></Th>
                  <Th>번호</Th>
                  <Th>품목</Th>
                  <Th>품종</Th>
                  <Th>유형</Th>
                  <Th>보유자</Th>
                  <Th>역할</Th>
                  <Th>지역</Th>
                  <Th>창고</Th>
                  <Th>재고</Th>
                  <Th>단위</Th>
                  <Th>희망가</Th>
                  <Th>예상가치</Th>
                  <Th>출하가능</Th>
                  <Th>가공</Th>
                  <Th>바이어타겟</Th>
                  <Th>AI매칭</Th>
                  <Th>메모</Th>
                  <Th>관리</Th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="border p-8 text-center font-black text-neutral-500">
                      저장자산 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  items.map((x, i) => (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td><input type="checkbox" /></Td>
                      <Td>{i + 1}</Td>
                      <Td strong>{x.product_name || "-"}</Td>
                      <Td>{x.variety_name || "-"}</Td>
                      <Td>{assetTypeLabel(x.asset_type)}</Td>
                      <Td strong>{x.owner_name || "-"}</Td>
                      <Td>{ownerTypeLabel(x.owner_type)}</Td>
                      <Td>{x.region || "-"}</Td>
                      <Td>{x.warehouse_name || "-"}</Td>
                      <Td strong>{n(x.quantity).toLocaleString()}</Td>
                      <Td>{x.unit || "-"}</Td>
                      <Td>{won(x.expected_price)}</Td>
                      <Td strong>{won(x.estimated_value)}</Td>
                      <Td>{x.available_from || "-"}</Td>
                      <Td>{x.processing_available ? "가능" : "불가"}</Td>
                      <Td>{x.buyer_target || "-"}</Td>
                      <Td strong>{aiMatch(x)}</Td>
                      <Td>{x.memo || "-"}</Td>
                      <Td>
                        <a
                          href={`/admin/storage-assets/${x.id}`}
                          className="rounded bg-green-700 px-3 py-1 text-xs font-black text-white no-underline"
                        >
                          보기
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

function MiniStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="border bg-white px-4 py-3">
      <p className="text-xs font-black text-neutral-500">{title}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="sticky top-0 whitespace-nowrap border border-neutral-300 bg-neutral-200 px-2 py-2 text-left font-black">
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
