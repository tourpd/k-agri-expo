import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function won(v: unknown) {
  const n = Number(v ?? 0);
  return `${n.toLocaleString("ko-KR")}원`;
}

export default async function KAgriCommandCenterPage() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("agri_assets")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const totalValue = rows.reduce((s: number, r: any) => s + Number(r.estimated_value ?? 0), 0);
  const topAsset = [...rows].sort((a: any, b: any) => Number(b.estimated_value ?? 0) - Number(a.estimated_value ?? 0))[0];

  return (
    <main className="min-h-screen bg-[#eef3ee] p-4 text-black">
      <div className="mx-auto max-w-[1900px]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-black text-green-700">K-AGRI TRADING WAR ROOM</p>
            <h1 className="text-5xl font-black">K-Agri 거래본부 상황실</h1>
            <p className="mt-2 text-lg font-bold text-gray-700">
              오늘 무엇을 팔아야 하는지, 누구에게 연락해야 하는지, 어디가 막혀 있는지 한눈에 보는 거래 지휘 화면입니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/expo/agri-exchange/register" className="bg-green-700 px-4 py-3 font-black text-white">
              농민 등록
            </Link>
            <Link href="/expo/agri-exchange/market" className="bg-blue-700 px-4 py-3 font-black text-white">
              거상 화면
            </Link>
            <Link href="/admin/agri-assets" className="bg-black px-4 py-3 font-black text-white">
              자산센터
            </Link>
          </div>
        </div>

        <section className="mb-4 grid grid-cols-7 border border-black bg-white text-sm">
          <Summary title="총 등록" value={`${rows.length}건`} />
          <Summary title="총 자산가치" value={won(totalValue)} />
          <Summary title="거래가능" value={`${rows.filter((r:any)=>r.status==="거래가능").length}건`} />
          <Summary title="AI추천 대기" value={`${rows.length}건`} />
          <Summary title="상담예정" value="0건" />
          <Summary title="계약진행" value="0건" />
          <Summary title="정산대기" value="0건" />
        </section>

        <section className="mb-4 grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div className="border border-black bg-white">
            <div className="border-b border-black bg-red-50 px-4 py-3 font-black text-red-700">
              🚨 AI 추천 우선 판매 물량
            </div>
            <div className="p-4">
              {topAsset ? (
                <>
                  <div className="text-3xl font-black">
                    {topAsset.product_name || "-"} {topAsset.total_quantity || 0}{topAsset.unit || ""}
                  </div>
                  <div className="mt-2 text-xl font-black text-green-700">
                    예상가치 {won(topAsset.estimated_value)}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-black">
                    <Box title="AI점수" value={`${topAsset.ai_sales_score || 0}점`} />
                    <Box title="품질점수" value={`${topAsset.quality_score || 0}점`} />
                    <Box title="산지" value={topAsset.producer_region || "-"} />
                  </div>
                  <div className="mt-4 border border-black">
                    <div className="border-b border-black bg-gray-100 px-3 py-2 font-black">
                      추천 거상
                    </div>
                    <div className="grid grid-cols-3 text-center font-black">
                      <div className="border-r border-black p-3">삼성웰스토리</div>
                      <div className="border-r border-black p-3">현대그린푸드</div>
                      <div className="p-3">아워홈</div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/admin/buyers?assetId=${topAsset.id}`} className="bg-blue-700 px-4 py-3 font-black text-white">
                      거상 연락
                    </Link>
                    <Link href={`/expo/agri-exchange/video-call?assetId=${topAsset.id}`} className="bg-purple-700 px-4 py-3 font-black text-white">
                      영상상담 잡기
                    </Link>
                    <Link href={`/admin/trade-offers?assetId=${topAsset.id}`} className="bg-green-700 px-4 py-3 font-black text-white">
                      제안서 작성
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center font-black text-gray-500">등록된 농산물이 없습니다.</div>
              )}
            </div>
          </div>

          <div className="border border-black bg-white">
            <div className="border-b border-black bg-gray-100 px-4 py-3 font-black">
              📞 오늘 해야 할 일
            </div>
            <div className="space-y-2 p-4 font-bold">
              <Todo text="홍산마늘 170톤 추천 거상 3곳 연락" />
              <Todo text="삼성웰스토리 상담 일정 확인" />
              <Todo text="농민 영상상담 가능 시간 확인" />
              <Todo text="거래제안서 초안 작성" />
              <Todo text="계약 가능 조건 확인" />
            </div>
          </div>

          <div className="border border-black bg-white">
            <div className="border-b border-black bg-yellow-50 px-4 py-3 font-black text-yellow-800">
              ⚠️ 병목 현황
            </div>
            <div className="grid grid-cols-2 text-sm font-black">
              <Bottleneck title="바이어 없는 물량" value={`${rows.length}건`} />
              <Bottleneck title="상담 미진행" value={`${rows.length}건`} />
              <Bottleneck title="제안서 미작성" value={`${rows.length}건`} />
              <Bottleneck title="계약 대기" value="0건" />
              <Bottleneck title="정산 대기" value="0건" />
              <Bottleneck title="위험 물량" value="0건" />
            </div>
          </div>
        </section>

        <section className="border border-black bg-white">
          <div className="flex items-center justify-between border-b border-black bg-gray-100 px-3 py-3">
            <h2 className="text-xl font-black">거래 지휘표</h2>
            <div className="font-black">총 {rows.length}건</div>
          </div>

          <div className="max-h-[65vh] overflow-auto">
            <table className="w-full min-w-[2500px] border-collapse text-[12px]">
              <thead className="sticky top-0 z-10 bg-gray-200">
                <tr>
                  {[
                    "NO","우선순위","품목","품종","산지","생산자","수량","단위","단가","예상금액",
                    "사진","성적서","영상","품질","AI","현재 병목",
                    "추천거상1","추천거상2","추천거상3",
                    "거상연락","상담잡기","제안서","계약","정산","자산상세"
                  ].map((h) => (
                    <th key={h} className="border border-black px-2 py-2 text-left font-black whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((r: any, i: number) => (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-green-50"}>
                    <Cell>{i + 1}</Cell>
                    <Cell bold>{i === 0 ? "최우선" : "일반"}</Cell>
                    <Cell bold>{r.product_name || "-"}</Cell>
                    <Cell>{r.variety_name || "-"}</Cell>
                    <Cell>{r.producer_region || "-"}</Cell>
                    <Cell>{r.producer_name || "-"}</Cell>
                    <Cell right bold>{Number(r.total_quantity || 0).toLocaleString("ko-KR")}</Cell>
                    <Cell>{r.unit || "-"}</Cell>
                    <Cell right>{won(r.expected_price)}</Cell>
                    <Cell right green bold>{won(r.estimated_value)}</Cell>
                    <Cell center>{r.photo_count || 0}</Cell>
                    <Cell center>{r.certificate_count || 0}</Cell>
                    <Cell center>{r.video_count || 0}</Cell>
                    <Cell center>{r.quality_score || 0}</Cell>
                    <Cell center>{r.ai_sales_score || 0}</Cell>
                    <Cell bold>거상 연락 필요</Cell>
                    <Cell>삼성웰스토리</Cell>
                    <Cell>현대그린푸드</Cell>
                    <Cell>아워홈</Cell>
                    <Action href={`/admin/buyers?assetId=${r.id}`} label="연락" blue />
                    <Action href={`/expo/agri-exchange/video-call?assetId=${r.id}`} label="상담" purple />
                    <Action href={`/admin/trade-offers?assetId=${r.id}`} label="제안" green />
                    <Action href={`/admin/contracts?assetId=${r.id}`} label="계약" orange />
                    <Action href={`/admin/settlements?assetId=${r.id}`} label="정산" black />
                    <Action href={`/admin/agri-assets/${r.id}`} label="상세" gray />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}

function Summary({ title, value }: { title: string; value: string }) {
  return <div className="border-r border-black px-3 py-3"><div className="text-xs font-black text-gray-500">{title}</div><div className="text-xl font-black">{value}</div></div>;
}

function Box({ title, value }: { title: string; value: string }) {
  return <div className="border border-black p-3"><div className="text-xs text-gray-500">{title}</div><div>{value}</div></div>;
}

function Todo({ text }: { text: string }) {
  return <label className="flex items-center gap-2 border border-black p-3"><input type="checkbox" />{text}</label>;
}

function Bottleneck({ title, value }: { title: string; value: string }) {
  return <div className="border-b border-r border-black p-4"><div className="text-gray-600">{title}</div><div className="mt-1 text-2xl">{value}</div></div>;
}

function SmallRole({ name, role }: { name: string; role: string }) {
  return <div className="border border-black bg-white p-3"><div className="font-black">{name}</div><div className="text-sm font-bold text-green-700">{role}</div></div>;
}

function Cell({ children, right, center, bold, green }: { children: React.ReactNode; right?: boolean; center?: boolean; bold?: boolean; green?: boolean }) {
  return <td className={["border border-black px-2 py-2 whitespace-nowrap", right ? "text-right" : "", center ? "text-center" : "", bold ? "font-black" : "font-bold", green ? "text-green-700" : ""].join(" ")}>{children}</td>;
}

function Action({ href, label, blue, purple, green, orange, black, gray }: { href: string; label: string; blue?: boolean; purple?: boolean; green?: boolean; orange?: boolean; black?: boolean; gray?: boolean }) {
  const color = blue ? "bg-blue-600" : purple ? "bg-purple-600" : green ? "bg-green-700" : orange ? "bg-orange-600" : black ? "bg-black" : gray ? "bg-gray-600" : "bg-white";
  return (
    <td className="border border-black px-1 py-1 text-center whitespace-nowrap">
      <Link href={href} className={`${color} inline-block px-2 py-1 text-[11px] font-black text-white`}>
        {label}
      </Link>
    </td>
  );
}
