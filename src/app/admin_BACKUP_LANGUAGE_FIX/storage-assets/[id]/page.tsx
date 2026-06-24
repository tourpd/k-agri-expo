import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function n(v: unknown) {
  const num = Number(v || 0);
  return Number.isFinite(num) ? num : 0;
}

function won(v: unknown) {
  return `${n(v).toLocaleString()}원`;
}

function typeLabel(v?: string | null) {
  if (v === "crop") return "농산물";
  if (v === "livestock") return "축산물";
  if (v === "fishery") return "수산물";
  if (v === "processed") return "가공원료";
  if (v === "future_food") return "미래식량";
  if (v === "health_material") return "건강원료";
  return v || "-";
}

function ownerLabel(v?: string | null) {
  if (v === "producer") return "생산자";
  if (v === "aggregator") return "수매상";
  if (v === "wholesaler") return "도매상";
  if (v === "cooperative") return "조합";
  if (v === "company") return "기업";
  return v || "-";
}

function aiBuyerMatch(name?: string | null) {
  const x = String(name || "");
  if (x.includes("마늘")) return ["김치공장", "깐마늘공장", "식자재업체", "급식업체"];
  if (x.includes("양파")) return ["식자재업체", "도매상", "김치공장", "가공공장"];
  if (x.includes("전복")) return ["수출바이어", "식당", "식자재업체", "온라인몰"];
  return ["바이어 매칭대기"];
}

export default async function StorageAssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: item } = await supabase
    .from("storage_assets")
    .select("*")
    .eq("id", id)
    .single();

  if (!item) {
    return (
      <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
        <Link href="/admin/storage-assets" className="rounded bg-black px-4 py-3 font-black text-white">
          ← 저장자산센터
        </Link>
        <div className="mt-4 border bg-white p-6 font-black">저장자산을 찾을 수 없습니다.</div>
      </main>
    );
  }

  const matches = aiBuyerMatch(item.product_name);

  const { data: buyers } = await supabase
    .from("agri_buyers")
    .select("*")
    .order("ai_score", { ascending: false });

  function makeKeywords(asset: any) {
    const text = `${asset.product_name || ""} ${asset.variety_name || ""} ${asset.buyer_target || ""}`;
    const base = text
      .split(/[·,\\s,]+/)
      .map((x: string) => x.trim())
      .filter(Boolean);

    const extra: string[] = [];

    if (text.includes("마늘")) extra.push("마늘", "홍산마늘", "깐마늘");
    if (text.includes("양파")) extra.push("양파", "저장양파");
    if (text.includes("전복")) extra.push("전복", "활전복");
    if (text.includes("한우")) extra.push("한우", "축산");
    if (text.includes("김치")) extra.push("김치공장", "식자재");

    return Array.from(new Set([...base, ...extra]));
  }

  const keywords = makeKeywords(item);

  const buyerRows = (buyers ?? []).filter((b: any) => {
    const buyerText = `${b.company_name || ""} ${b.interest_products || ""} ${b.buyer_type || ""} ${b.region || ""} ${b.memo || ""}`;
    return keywords.some((word: string) => buyerText.includes(word));
  });

  return (
    <main className="min-h-screen bg-[#f3f4f6] p-4 text-black">
      <div className="mx-auto max-w-[2200px]">
        <div className="mb-3 flex items-center justify-between">
          <Link href="/admin/storage-assets" className="rounded bg-black px-4 py-3 font-black text-white">
            ← 저장자산센터
          </Link>

          <div className="flex gap-2">
            <button className="rounded bg-blue-700 px-4 py-3 text-sm font-black text-white">AI 매칭</button>
            <button className="rounded bg-orange-600 px-4 py-3 text-sm font-black text-white">바이어 추출</button>
            <button className="rounded bg-green-700 px-4 py-3 text-sm font-black text-white">거래 등록</button>
          </div>
        </div>

        <section className="mb-3 border bg-white p-4">
          <p className="text-xs font-black text-green-700">STORAGE ASSET CARD</p>
          <h1 className="mt-1 text-3xl font-black">{item.product_name} 저장자산카드</h1>
          <p className="mt-2 text-lg font-bold text-neutral-700">
            {typeLabel(item.asset_type)} · {item.owner_name || "-"} · {item.region || "-"} · {item.warehouse_name || "-"}
          </p>
        </section>

        <section className="mb-3 grid grid-cols-6 gap-2">
          <MiniStat title="재고" value={`${n(item.quantity).toLocaleString()}${item.unit || ""}`} />
          <MiniStat title="희망가" value={won(item.expected_price)} />
          <MiniStat title="예상가치" value={won(item.estimated_value)} />
          <MiniStat title="출하가능" value={item.available_from || "-"} />
          <MiniStat title="가공가능" value={item.processing_available ? "가능" : "불가"} />
          <MiniStat title="매칭대상" value={`${matches.length}종`} />
        </section>

        <section className="mb-3 grid gap-3 lg:grid-cols-2">
          <Box
            title="저장자산 기본정보"
            rows={[
              ["품목", item.product_name || "-"],
              ["품종", item.variety_name || "-"],
              ["유형", typeLabel(item.asset_type)],
              ["보유자", item.owner_name || "-"],
              ["역할", ownerLabel(item.owner_type)],
              ["지역", item.region || "-"],
              ["창고", item.warehouse_name || "-"],
            ]}
          />

          <Box
            title="재고·가격 정보"
            rows={[
              ["재고", `${n(item.quantity).toLocaleString()} ${item.unit || ""}`],
              ["희망가", won(item.expected_price)],
              ["예상가치", won(item.estimated_value)],
              ["출하가능일", item.available_from || "-"],
              ["가공가능", item.processing_available ? "가능" : "불가"],
              ["메모", item.memo || "-"],
            ]}
          />

          <Box
            title="AI 바이어 매칭"
            rows={[
              ["타겟", item.buyer_target || "-"],
              ["추천 1", matches[0] || "-"],
              ["추천 2", matches[1] || "-"],
              ["추천 3", matches[2] || "-"],
              ["추천 4", matches[3] || "-"],
            ]}
          />

          <Box
            title="거래 전략"
            rows={[
              ["원물판매", "도매상·식자재업체 연결"],
              ["가공판매", item.processing_available ? "김치공장·깐마늘공장·가공업체 연결" : "가공 불가"],
              ["소비자판매", "공동구매·예약판매 가능"],
              ["다음액션", "바이어센터 생성 후 실제 업체 매칭"],
            ]}
          />
        </section>

        <section className="border bg-white">
          <div className="border-b bg-neutral-100 px-3 py-2 text-sm font-black">
            AI 매칭 바이어 / 실제 agri_buyers 데이터 기준
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] border-collapse text-sm">
              <thead>
                <tr className="bg-neutral-200">
                  <th className="border px-3 py-2 text-left">번호</th>
                  <th className="border px-3 py-2 text-left">회사명</th>
                  <th className="border px-3 py-2 text-left">담당자</th>
                  <th className="border px-3 py-2 text-left">전화</th>
                  <th className="border px-3 py-2 text-left">유형</th>
                  <th className="border px-3 py-2 text-left">지역</th>
                  <th className="border px-3 py-2 text-left">관심품목</th>
                  <th className="border px-3 py-2 text-left">월구매량</th>
                  <th className="border px-3 py-2 text-left">예상구매액</th>
                  <th className="border px-3 py-2 text-left">AI점수</th>
                  <th className="border px-3 py-2 text-left">실행</th>
                </tr>
              </thead>

              <tbody>
                {buyerRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="border p-6 text-center font-black text-neutral-500">
                      실제 매칭 바이어가 없습니다. 바이어센터에 관심품목을 추가하세요.
                    </td>
                  </tr>
                ) : (
                  buyerRows.map((b: any, i: number) => (
                    <tr key={b.id} className="hover:bg-green-50">
                      <td className="border px-3 py-2 font-bold">{i + 1}</td>
                      <td className="border px-3 py-2 font-black">{b.company_name || "-"}</td>
                      <td className="border px-3 py-2 font-bold">{b.contact_name || "-"}</td>
                      <td className="border px-3 py-2 font-bold">{b.phone || "-"}</td>
                      <td className="border px-3 py-2 font-bold">{b.buyer_type || "-"}</td>
                      <td className="border px-3 py-2 font-bold">{b.region || "-"}</td>
                      <td className="border px-3 py-2 font-bold">{b.interest_products || "-"}</td>
                      <td className="border px-3 py-2 font-bold">{Number(b.monthly_purchase_qty || 0).toLocaleString()}</td>
                      <td className="border px-3 py-2 font-black">{Number(b.expected_purchase_amount || 0).toLocaleString()}원</td>
                      <td className="border px-3 py-2 font-black text-green-700">{b.ai_score || 0}</td>
                      <td className="border px-3 py-2">
                        <button className="rounded bg-green-700 px-3 py-1 text-xs font-black text-white">
                          거래제안
                        </button>
                      </td>
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

function Box({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="border bg-white">
      <h2 className="border-b bg-neutral-100 px-3 py-2 text-lg font-black">{title}</h2>
      <table className="w-full border-collapse text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td className="w-44 border bg-neutral-50 px-3 py-2 font-black">{k}</td>
              <td className="border px-3 py-2 font-bold">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
