"use client";

import Link from "next/link";
import type { ProductRow } from "./ProductDesktopTable";

type Props = {
  products: ProductRow[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
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

  return all.slice(0, 4).join(", ");
}

export default function ProductMobileCardList({
  products,
  selectedIds,
  onToggleSelect,
}: Props) {
  return (
    <div className="grid gap-4 xl:hidden">
      {products.length === 0 ? (
        <div className="rounded-3xl bg-white p-10 text-center text-xl font-black text-slate-500">
          표시할 상품이 없습니다.
        </div>
      ) : (
        products.map((row) => {
          const checked = selectedIds.includes(row.product_id);

          return (
            <div
              key={row.product_id}
              className={`rounded-3xl border-2 bg-white p-4 shadow-sm ${
                checked ? "border-blue-500 bg-blue-50" : "border-slate-200"
              }`}
            >
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => onToggleSelect(row.product_id)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 text-xl font-black ${
                    checked
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300 bg-white text-slate-400"
                  }`}
                >
                  {checked ? "✓" : ""}
                </button>

                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border bg-white">
                  {row.image_url ? (
                    <img
                      src={row.image_url}
                      alt={row.name || ""}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-200 text-xs font-black text-slate-500">
                      NO IMAGE
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="line-clamp-2 text-xl font-black leading-tight text-slate-950">
                    {row.name || "-"}
                  </div>

                  <div className="mt-2 text-base font-black text-slate-700">
                    {row.company_name || "업체명 없음"}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
                      {labelGroup(row.product_group)}
                    </span>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black text-slate-700">
                      {labelSource(row.source_type)}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-sm font-black ${
                        row.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {row.active ? "노출중" : "숨김"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <InfoBox label="판매가" value={won(row.price_krw)} strong />
                <InfoBox label="용량" value={row.volume_text || "-"} />
                <InfoBox
                  label="포토닥터"
                  value={row.is_photodoctor_recommended ? "추천" : "-"}
                />
                <InfoBox label="대표" value={row.is_featured ? "대표" : "-"} />
              </div>

              <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-700">
                <div className="font-black text-slate-900">AI/태그</div>
                <div className="mt-1">{shortTags(row)}</div>
              </div>

              <Link
                href={`/admin/products/${row.product_id}`}
                className="mt-4 block rounded-2xl bg-slate-950 px-5 py-4 text-center text-lg font-black text-white"
              >
                검수/수정
              </Link>
            </div>
          );
        })
      )}
    </div>
  );
}
function InfoBox({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-slate-100 p-3">
      <div className="text-xs font-black text-slate-500">{label}</div>
      <div
        className={`mt-1 text-base font-black ${
          strong ? "text-red-700" : "text-slate-900"
        }`}
      >
        {value}
      </div>
    </div>
  );
}