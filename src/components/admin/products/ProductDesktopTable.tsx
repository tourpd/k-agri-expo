"use client";

import Link from "next/link";

export type ProductRow = {
  product_id: string;
  name?: string | null;
  slug?: string | null;
  company_name?: string | null;
  product_group?: string | null;
  source_type?: string | null;
  price_krw?: number | null;
  volume_text?: string | null;
  crop_tags?: string[] | null;
  issue_tags?: string[] | null;
  channel_tags?: string[] | null;
  is_photodoctor_recommended?: boolean | null;
  is_featured?: boolean | null;
  active?: boolean | null;
  image_url?: string | null;
  updated_at?: string | null;
};

type Props = {
  products: ProductRow[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onTogglePageSelect: () => void;
};

function won(v?: number | null) {
  return `${Number(v || 0).toLocaleString("ko-KR")}원`;
}

function labelGroup(v?: string | null) {
  if (v === "material") return "농자재";
  if (v === "booth_product") return "업체 판매";
  if (v === "booth_plan") return "입점";
  if (v === "event") return "프로모션";
  if (v === "consulting") return "상담";
  return v || "-";
}

function labelSource(v?: string | null) {
  if (v === "vendor") return "업체";
  if (v === "admin") return "관리자";
  if (v === "system") return "시스템";
  return v || "-";
}

function shortTags(row: ProductRow) {
  const all = [
    ...(row.crop_tags || []),
    ...(row.issue_tags || []),
    ...(row.channel_tags || []),
  ];

  if (all.length === 0) return "-";

  return all.slice(0, 5).join(", ");
}

export default function ProductDesktopTable({
  products,
  selectedIds,
  onToggleSelect,
  onTogglePageSelect,
}: Props) {
  return (
    <div className="hidden overflow-auto rounded-3xl border border-slate-300 xl:block">
      <table className="min-w-[1900px] w-full border-collapse bg-white">
        <thead>
          <tr className="bg-slate-900 text-white">
            <Th>
              <input
                type="checkbox"
                checked={
                  products.length > 0 &&
                  products.every((p) => selectedIds.includes(p.product_id))
                }
                onChange={onTogglePageSelect}
                className="h-5 w-5"
              />
            </Th>

            <Th>이미지</Th>
            <Th>상품명</Th>
            <Th>업체</Th>
            <Th>구분</Th>
            <Th>출처</Th>
            <Th>판매가</Th>
            <Th>용량</Th>
            <Th>AI 태그</Th>
            <Th>포토닥터</Th>
            <Th>대표</Th>
            <Th>상태</Th>
            <Th>수정일</Th>
            <Th>관리</Th>
          </tr>
        </thead>

        <tbody>
          {products.length === 0 ? (
            <tr>
              <td
                colSpan={14}
                className="p-16 text-center text-2xl font-black text-slate-500"
              >
                표시할 상품이 없습니다.
              </td>
            </tr>
          ) : (
            products.map((row) => (
              <tr
                key={row.product_id}
                className={`border-b border-slate-200 hover:bg-yellow-50 ${
                  selectedIds.includes(row.product_id) ? "bg-blue-50" : ""
                }`}
              >
                <td className="p-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.product_id)}
                    onChange={() => onToggleSelect(row.product_id)}
                    className="h-5 w-5"
                  />
                </td>

                <td className="p-4">
                  {row.image_url ? (
                    <img
                      src={row.image_url}
                      alt={row.name || ""}
                      className="h-24 w-24 rounded-2xl border bg-white object-contain"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-200 text-xs font-black text-slate-500">
                      NO IMAGE
                    </div>
                  )}
                </td>

                <td className="p-4">
                  <div className="text-lg font-black text-slate-950">
                    {row.name || "-"}
                  </div>

                  <div className="mt-1 text-sm font-bold text-slate-500">
                    {row.slug || "-"}
                  </div>
                </td>

                <td className="p-4 text-base font-black">
                  {row.company_name || "-"}
                </td>

                <td className="p-4 font-black">
                  {labelGroup(row.product_group)}
                </td>

                <td className="p-4">
                  <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
                    {labelSource(row.source_type)}
                  </span>
                </td>

                <td className="p-4 text-lg font-black text-red-700">
                  {won(row.price_krw)}
                </td>

                <td className="p-4 font-bold">
                  {row.volume_text || "-"}
                </td>

                <td className="max-w-[340px] p-4 text-sm font-bold text-slate-700">
                  {shortTags(row)}
                </td>

                <td className="p-4 text-center text-xl">
                  {row.is_photodoctor_recommended ? "✅" : "-"}
                </td>

                <td className="p-4 text-center text-xl">
                  {row.is_featured ? "⭐" : "-"}
                </td>

                <td className="p-4">
                  <span
                    className={`rounded-full px-4 py-2 text-sm font-black ${
                      row.active
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {row.active ? "노출중" : "숨김"}
                  </span>
                </td>

                <td className="p-4 text-sm font-bold text-slate-500">
                  {row.updated_at
                    ? new Date(row.updated_at).toLocaleString("ko-KR")
                    : "-"}
                </td>

                <td className="p-4">
                  <Link
                    href={`/admin/products/${row.product_id}`}
                    className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
                  >
                    검수/수정
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="border-r border-slate-700 p-4 text-left text-base font-black">
      {children}
    </th>
  );
}