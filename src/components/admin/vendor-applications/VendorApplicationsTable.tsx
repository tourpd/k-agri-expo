"use client";

import { type ReactNode } from "react";

import {
  aiReview,
  categoryLabel,
  formatAmount,
  formatDate,
  getRowId,
  hallLabel,
  statusLabel,
  type VendorApplicationItem,
} from "@/lib/admin/vendor-applications";

type SourceJson = {
  plan_type?: string;
  plan_name?: string;
  billing_label?: string;
  billing_cycle?: string;
  product_limit?: string;
};

function sourceJson(item: VendorApplicationItem): SourceJson {
  const raw = (item as any)?.source_extracted_json;
  if (raw && typeof raw === "object") return raw as SourceJson;
  return {};
}

function planKey(item: VendorApplicationItem) {
  const source = sourceJson(item);
  if (source.plan_type) return source.plan_type;

  const booth = (item as any)?.booth_type;
  if (booth === "free") return "free";
  if (booth === "basic") return "bronze";
  if (booth === "premium") return "gold";

  return "unknown";
}

function planLabel(item: VendorApplicationItem) {
  const source = sourceJson(item);
  if (source.plan_name) return String(source.plan_name);

  switch (planKey(item)) {
    case "enterprise":
      return "엔터프라이즈";
    case "gold":
      return "골드";
    case "silver":
      return "실버";
    case "bronze":
      return "브론즈";
    case "free":
      return "무료";
    default:
      return "-";
  }
}

function productLimit(item: VendorApplicationItem) {
  const source = sourceJson(item);
  if (source.product_limit) return String(source.product_limit);
  if (planKey(item) === "enterprise") return "제품 무제한";
  if (planKey(item) === "free") return "제품 1개";
  return "-";
}

function billingLabel(item: VendorApplicationItem) {
  const source = sourceJson(item);

  if (source.billing_label) return String(source.billing_label);
  if (planKey(item) === "enterprise") return "별도 협의";
  if (planKey(item) === "free") return "30일 무료";
  if (source.billing_cycle === "yearly") return "1년 계약";
  if (source.billing_cycle === "monthly") return "월결제";

  return (item as any)?.duration_key || "-";
}

function amountText(item: VendorApplicationItem) {
  if (planKey(item) === "enterprise") return "별도 협의";
  return formatAmount(item.amount_krw || item.amount || 0);
}

function sortItems(items: VendorApplicationItem[]) {
  const order = ["enterprise", "gold", "silver", "bronze", "free", "unknown"];

  return [...items].sort((a, b) => {
    const aIndex = order.indexOf(planKey(a));
    const bIndex = order.indexOf(planKey(b));
    return aIndex - bIndex;
  });
}

function aiTextClass(label: string) {
  if (label === "자동승인 가능" || label === "승인완료") return "text-green-700";
  if (label === "입금대기") return "text-amber-700";
  if (label === "서류누락") return "text-red-700";
  return "text-blue-700";
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap border border-neutral-400 bg-neutral-200 px-2 py-2 text-left text-xs font-black text-black">
      {children}
    </th>
  );
}

function Td({
  children,
  strong = false,
  center = false,
}: {
  children: ReactNode;
  strong?: boolean;
  center?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap border border-neutral-300 px-2 py-1.5 align-middle text-xs ${
        strong ? "font-black text-black" : "font-bold text-neutral-700"
      } ${center ? "text-center" : "text-left"}`}
    >
      {children}
    </td>
  );
}

function ActionLink({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-black text-neutral-900 underline underline-offset-2 disabled:cursor-not-allowed disabled:text-neutral-300"
    >
      {label}
    </button>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="border border-neutral-400 bg-white px-3 py-1 text-xs font-black disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export default function VendorApplicationsTable({
  items,
  total,
  page,
  totalPages,
  pageSize,
  setPage,
  setPageSize,
  onDetail,
}: {
  items: VendorApplicationItem[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
  setPage: (v: number | ((p: number) => number)) => void;
  setPageSize: (v: number) => void;
  acting: boolean;
  onDetail: (item: VendorApplicationItem) => void;
  onConfirmPayment: (item: VendorApplicationItem) => void;
  onApprove: (item: VendorApplicationItem) => void;
  onReject: (item: VendorApplicationItem) => void;
  canApproveItem: (item: VendorApplicationItem) => boolean;
}) {
  const sortedItems = sortItems(items);

  return (
    <section className="border border-neutral-400 bg-white p-2">
      <div className="mb-2 flex items-center justify-between">
        <b className="text-sm">입점 신청 목록 - 엑셀형 v3</b>
        <span className="text-xs font-black text-neutral-600">
          표시 {items.length.toLocaleString()}건 / 전체 {total.toLocaleString()}건
        </span>
      </div>

      <div className="overflow-x-auto border border-neutral-400">
        <table className="w-full min-w-[2100px] border-collapse text-xs">
          <thead className="sticky top-0 z-10">
            <tr>
              <Th>관리</Th>
              <Th>상태</Th>
              <Th>입금</Th>
              <Th>업체명</Th>
              <Th>플랜</Th>
              <Th>금액</Th>
              <Th>희망관</Th>
              <Th>AI판정</Th>
              <Th>위험사유</Th>
              <Th>담당자</Th>
              <Th>전화</Th>
              <Th>사업자번호</Th>
              <Th>카테고리</Th>
              <Th>제품수</Th>
              <Th>결제방식</Th>
              <Th>서류</Th>
              <Th>신청일</Th>
            </tr>
          </thead>

          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={17}
                  className="border p-10 text-center font-black text-neutral-500"
                >
                  조건에 맞는 입점 신청이 없습니다.
                </td>
              </tr>
            ) : (
              sortedItems.map((item) => {
                const id = getRowId(item);
                const ai = aiReview(item);

                return (
                  <tr
                    key={id || item.application_code || item.order_code}
                    className="hover:bg-yellow-50"
                  >
                    <Td center>
                      <ActionLink label="상세" onClick={() => onDetail(item)} />
                    </Td>

                    <Td center>{statusLabel(item.application_status)}</Td>
                    <Td center>{statusLabel(item.payment_status)}</Td>
                    <Td strong>{item.company_name || "-"}</Td>
                    <Td strong>{planLabel(item)}</Td>
                    <Td strong>{amountText(item)}</Td>
                    <Td>{hallLabel(item.preferred_hall_1)}</Td>

                    <Td center>
                      <span className={`font-black ${aiTextClass(ai.label)}`}>
                        {ai.label}
                      </span>
                    </Td>

                    <Td>
                      <span className="font-black text-red-700">{ai.reason}</span>
                    </Td>

                    <Td>
                      {item.contact_name ||
                        item.representative_name ||
                        item.ceo_name ||
                        "-"}
                    </Td>

                    <Td strong>{item.contact_phone || item.phone || "-"}</Td>
                    <Td>{item.business_number || "-"}</Td>
                    <Td>{categoryLabel(item.preferred_category)}</Td>
                    <Td>{productLimit(item)}</Td>
                    <Td>{billingLabel(item)}</Td>

                    <Td center>
                      <button
                        type="button"
                        onClick={() => onDetail(item)}
                        className="text-xs font-black underline"
                      >
                        {item.source_file_name ? "보기" : "없음"}
                      </button>
                    </Td>

                    <Td>{formatDate(item.created_at)}</Td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-col gap-2 border-t pt-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black text-neutral-600">
          <span>
            전체 {total.toLocaleString()}건 / {page.toLocaleString()}페이지 / 총{" "}
            {totalPages.toLocaleString()}페이지
          </span>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 border border-neutral-400 px-2 text-xs font-black"
          >
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={50}>50개씩</option>
            <option value={100}>100개씩</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1">
          <PageButton label="처음" disabled={page <= 1} onClick={() => setPage(1)} />
          <PageButton
            label="이전"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          />
          <span className="border border-neutral-400 bg-white px-3 py-1 text-xs font-black">
            {page} / {totalPages}
          </span>
          <PageButton
            label="다음"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
          <PageButton
            label="마지막"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
          />
        </div>
      </div>
    </section>
  );
}