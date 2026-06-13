import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function won(v: unknown) {
  const n = Number(v ?? 0);
  return `${n.toLocaleString("ko-KR")}원`;
}

export default async function AgriExchangeControlPage() {
  const supabase = createSupabaseAdminClient();

  const { data } = await supabase
    .from("agri_assets")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = data ?? [];
  const totalValue = rows.reduce((s: number, r: any) => s + Number(r.estimated_value ?? 0), 0);

  return (
    <main className="min-h-screen bg-[#eef3ee] p-4 text-black">
      <div className="mx-auto max-w-[1900px]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="font-black text-red-600">운영자 전용 화면</p>
            <h1 className="text-4xl font-black">K-Agri 농산물거래소 운영 관제센터</h1>
            <p className="mt-2 font-bold text-gray-700">
              농민과 바이어가 보는 화면이 아닙니다. 운영자가 등록 농산물을 검수하고,
              바이어 매칭 · 영상상담 배정 · 거래제안 · 계약 · 정산을 처리하는 내부 업무 화면입니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/expo/agri-exchange/market" className="bg-blue-700 px-4 py-3 font-black text-white">
              바이어 화면 보기
            </Link>
            <Link href="/expo/agri-exchange/register" className="bg-green-700 px-4 py-3 font-black text-white">
              농민 등록 화면
            </Link>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-6 border border-black bg-white text-sm">
          <Summary title="등록 농산물" value={`${rows.length}건`} />
          <Summary title="총 자산가치" value={won(totalValue)} />
          <Summary title="운영 검수대상" value={`${rows.length}건`} />
          <Summary title="사진 보유" value={`${rows.filter((r:any)=>Number(r.photo_count)>0).length}건`} />
          <Summary title="성적서 보유" value={`${rows.filter((r:any)=>Number(r.certificate_count)>0).length}건`} />
          <Summary title="영상 보유" value={`${rows.filter((r:any)=>Number(r.video_count)>0).length}건`} />
        </div>

        <div className="mb-3 grid grid-cols-3 gap-3">
          <Guide title="농민 역할" desc="농산물 등록, 사진·성적서·영상 제출, 창고상태 설명" />
          <Guide title="바이어 역할" desc="전국 농산물 검색, 거래문의, 영상상담 신청, 거래제안 검토" />
          <Guide title="운영자 역할" desc="자산 검수, 바이어 매칭, 상담 배정, 제안서 작성, 계약·정산 관리" />
        </div>

        <div className="border border-black bg-white">
          <div className="flex items-center justify-between border-b border-black bg-gray-100 px-3 py-2">
            <h2 className="text-lg font-black">운영자 업무 처리표</h2>
            <div className="text-sm font-black">총 {rows.length}건</div>
          </div>

          <div className="max-h-[72vh] overflow-auto">
            <table className="w-full min-w-[2400px] border-collapse text-[12px]">
              <thead className="sticky top-0 z-10 bg-gray-200">
                <tr>
                  {[
                    "선택","NO","운영상태","품목","품종","산지","생산자","규격","수량","단위","희망단가","예상금액",
                    "보관위치","저장방식","사진","성적서","영상","품질","AI","농민화면","바이어화면",
                    "1 검수","2 바이어매칭","3 상담배정","4 제안서작성","5 계약관리","6 정산관리"
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
                    <Cell><input type="checkbox" /></Cell>
                    <Cell>{i + 1}</Cell>
                    <Cell bold>{r.status || "검수대기"}</Cell>
                    <Cell bold>{r.product_name || "-"}</Cell>
                    <Cell>{r.variety_name || "-"}</Cell>
                    <Cell>{r.producer_region || "-"}</Cell>
                    <Cell>{r.producer_name || "-"}</Cell>
                    <Cell>{r.size_spec || "-"}</Cell>
                    <Cell right bold>{Number(r.total_quantity || 0).toLocaleString("ko-KR")}</Cell>
                    <Cell>{r.unit || "-"}</Cell>
                    <Cell right>{won(r.expected_price)}</Cell>
                    <Cell right green bold>{won(r.estimated_value)}</Cell>
                    <Cell>{r.storage_location || "-"}</Cell>
                    <Cell>{r.storage_method || "-"}</Cell>
                    <Cell center>{r.photo_count || 0}</Cell>
                    <Cell center>{r.certificate_count || 0}</Cell>
                    <Cell center>{r.video_count || 0}</Cell>
                    <Cell center>{r.quality_score || 0}</Cell>
                    <Cell center>{r.ai_sales_score || 0}</Cell>
                    <Action href={`/expo/agri-exchange/register`} label="등록폼" gray />
                    <Action href={`/expo/agri-exchange/market`} label="거래소" blue />
                    <Action href={`/admin/agri-assets/${r.id}`} label="자산 검수" black />
                    <Action href={`/admin/buyers?assetId=${r.id}`} label="바이어 매칭" blue />
                    <Action href={`/expo/agri-exchange/video-call?assetId=${r.id}`} label="상담 배정" purple />
                    <Action href={`/admin/trade-offers?assetId=${r.id}`} label="제안서 작성" green />
                    <Action href={`/admin/contracts?assetId=${r.id}`} label="계약 관리" orange />
                    <Action href={`/admin/settlements?assetId=${r.id}`} label="정산 관리" black />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}

function Summary({ title, value }: { title: string; value: string }) {
  return (
    <div className="border-r border-black px-3 py-2">
      <div className="text-xs font-black text-gray-500">{title}</div>
      <div className="text-lg font-black">{value}</div>
    </div>
  );
}

function Guide({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-black bg-white p-3">
      <div className="font-black text-green-700">{title}</div>
      <div className="mt-1 text-sm font-bold text-gray-700">{desc}</div>
    </div>
  );
}

function Cell({
  children,
  right,
  center,
  bold,
  green,
}: {
  children: React.ReactNode;
  right?: boolean;
  center?: boolean;
  bold?: boolean;
  green?: boolean;
}) {
  return (
    <td
      className={[
        "border border-black px-2 py-2 whitespace-nowrap",
        right ? "text-right" : "",
        center ? "text-center" : "",
        bold ? "font-black" : "font-bold",
        green ? "text-green-700" : "",
      ].join(" ")}
    >
      {children}
    </td>
  );
}

function Action({
  href,
  label,
  blue,
  purple,
  green,
  orange,
  black,
  gray,
}: {
  href: string;
  label: string;
  blue?: boolean;
  purple?: boolean;
  green?: boolean;
  orange?: boolean;
  black?: boolean;
  gray?: boolean;
}) {
  const color = blue
    ? "bg-blue-600 text-white"
    : purple
      ? "bg-purple-600 text-white"
      : green
        ? "bg-green-700 text-white"
        : orange
          ? "bg-orange-600 text-white"
          : black
            ? "bg-black text-white"
            : gray
              ? "bg-gray-600 text-white"
              : "bg-white text-black";

  return (
    <td className="border border-black px-1 py-1 text-center whitespace-nowrap">
      <Link href={href} className={`${color} inline-block px-2 py-1 text-[11px] font-black`}>
        {label}
      </Link>
    </td>
  );
}
