"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import VendorApplicationFilters from "@/components/admin/vendor-applications/VendorApplicationFilters";
import VendorApplicationModal from "@/components/admin/vendor-applications/VendorApplicationModal";
import VendorApplicationStats from "@/components/admin/vendor-applications/VendorApplicationStats";
import VendorApplicationsTable from "@/components/admin/vendor-applications/VendorApplicationsTable";

import {
  aiReview,
  getRowId,
  type VendorApplicationItem,
} from "@/lib/admin/vendor-applications";

type ListResponse = {
  ok: boolean;
  items: VendorApplicationItem[];
  total?: number;
  totalPages?: number;
  error?: string;
};

type SourceJson = {
  plan_type?: string;
  plan_name?: string;
  billing_cycle?: string;
  billing_label?: string;
  product_limit?: string;
  [key: string]: unknown;
};

type PlanFilter =
  | "all"
  | "free"
  | "bronze"
  | "silver"
  | "gold"
  | "enterprise";

function sourceJson(item?: VendorApplicationItem | null): SourceJson {
  const raw = (item as any)?.source_extracted_json;
  if (raw && typeof raw === "object") return raw as SourceJson;
  return {};
}

function planType(item?: VendorApplicationItem | null): PlanFilter | "legacy" {
  const source = sourceJson(item);
  const value = String(source.plan_type || "").trim();

  if (
    value === "free" ||
    value === "bronze" ||
    value === "silver" ||
    value === "gold" ||
    value === "enterprise"
  ) {
    return value;
  }

  const boothType = String((item as any)?.booth_type || "").trim();

  if (boothType === "free") return "free";
  if (boothType === "basic") return "bronze";
  if (boothType === "premium") return "gold";

  return "legacy";
}

function planLabel(item?: VendorApplicationItem | null) {
  const source = sourceJson(item);

  if (source.plan_name) return String(source.plan_name);

  switch (planType(item)) {
    case "free":
      return "무료 체험";
    case "bronze":
      return "브론즈";
    case "silver":
      return "실버";
    case "gold":
      return "골드";
    case "enterprise":
      return "엔터프라이즈";
    default:
      return "-";
  }
}

function billingLabel(item?: VendorApplicationItem | null) {
  const source = sourceJson(item);

  if (source.billing_label) return String(source.billing_label);

  if (planType(item) === "enterprise") return "별도 협의";
  if (planType(item) === "free") return "30일 무료체험";

  switch (source.billing_cycle) {
    case "yearly":
      return "1년 계약 일시불 · 20% 할인";
    case "monthly":
      return "월결제";
    default:
      break;
  }

  switch ((item as any)?.duration_key) {
    case "1m":
      return "1개월";
    case "3m":
      return "3개월";
    default:
      return "-";
  }
}

function productLimitLabel(item?: VendorApplicationItem | null) {
  const source = sourceJson(item);
  if (source.product_limit) return String(source.product_limit);

  if (planType(item) === "enterprise") return "제품 무제한";
  if (planType(item) === "free") return "제품 1개";

  return "-";
}

function amountLabel(item?: VendorApplicationItem | null) {
  if (planType(item) === "enterprise") return "별도 협의";

  const amount = Number((item as any)?.amount_krw || (item as any)?.amount || 0);
  return `${amount.toLocaleString("ko-KR")}원`;
}

const PLAN_FILTERS: { key: PlanFilter; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "free", label: "무료체험" },
  { key: "bronze", label: "브론즈" },
  { key: "silver", label: "실버" },
  { key: "gold", label: "골드" },
  { key: "enterprise", label: "엔터프라이즈" },
];

export default function Page() {
  const router = useRouter();

  const [items, setItems] = useState<VendorApplicationItem[]>([]);
  const [approveTarget, setApproveTarget] =
    useState<VendorApplicationItem | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<VendorApplicationItem | null>(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hallFilter, setHallFilter] = useState("all");
  const [aiFilter, setAiFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState<PlanFilter>("all");
  const [rejectionReason, setRejectionReason] = useState("");

  const [acting, setActing] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchList() {
    setLoadingList(true);
    setErrorNotice("");

    try {
      const res = await fetch(
        `/api/admin/vendor-applications?page=${page}&pageSize=${pageSize}`,
        { cache: "no-store" }
      );

      const json: ListResponse = await res.json();

      if (!json?.ok) {
        throw new Error(json?.error || "목록 조회 실패");
      }

      const nextItems = json.items || [];

      setItems(nextItems);
      setTotal(Number(json.total || nextItems.length || 0));
      setTotalPages(Number(json.totalPages || 1));
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "목록 조회 실패");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, [page, pageSize]);

  async function runAction(
    action: string,
    extra?: Record<string, unknown>,
    successMessage?: string,
    targetId?: string
  ) {
    const applicationId = targetId;

    if (!applicationId) {
      setErrorNotice("처리할 신청 ID가 없습니다.");
      return;
    }

    setActing(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch(`/api/admin/vendor-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(extra || {}) }),
      });

      const json = await res.json();

      if (!json?.ok) {
        throw new Error(json?.error || "처리에 실패했습니다.");
      }

      setNotice(successMessage || json?.message || "정상 처리되었습니다.");
      await fetchList();
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "에러가 발생했습니다.");
    } finally {
      setActing(false);
    }
  }

  async function approveAndCreateBrand(target: VendorApplicationItem | null) {
    const applicationId = getRowId(target);

    if (!applicationId) {
      setErrorNotice("승인할 신청 ID가 없습니다.");
      return;
    }

    setActing(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch("/api/admin/vendor-applications/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: applicationId }),
      });

      const json = await res.json();
      const isOk = json?.success === true || json?.ok === true;

      if (!isOk) {
        throw new Error(json?.error || "승인 및 브랜드관 생성 실패");
      }

      setNotice(
        json?.brand_url
          ? `승인 완료. 브랜드관 생성: ${json.brand_url}`
          : "승인 및 브랜드관 생성 완료"
      );

      await fetchList();
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "승인 및 브랜드관 생성 실패"
      );
    } finally {
      setActing(false);
      setApproveTarget(null);
    }
  }

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    return items.filter((x) => {
      const ai = aiReview(x);
      const source = sourceJson(x);

      if (planFilter !== "all" && planType(x) !== planFilter) return false;

      if (statusFilter !== "all" && x.application_status !== statusFilter) {
        return false;
      }

      if (hallFilter !== "all" && x.preferred_hall_1 !== hallFilter) {
        return false;
      }

      if (aiFilter !== "all" && ai.label !== aiFilter) {
        return false;
      }

      if (!keyword) return true;

      const hay = [
        x.company_name,
        x.representative_name,
        x.ceo_name,
        x.contact_name,
        x.contact_email,
        x.email,
        x.contact_phone,
        x.phone,
        x.business_number,
        x.application_code,
        x.order_code,
        x.preferred_hall_1,
        x.preferred_category,
        source.plan_type,
        source.plan_name,
        source.billing_label,
        source.product_limit,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(keyword);
    });
  }, [items, q, statusFilter, hallFilter, aiFilter, planFilter]);

  const stats = useMemo(() => {
    return {
      total,
      auto: items.filter((x) => aiReview(x).label === "자동승인 가능").length,
      need: items.filter((x) => aiReview(x).label === "확인필요").length,
      missing: items.filter((x) => aiReview(x).label === "서류누락").length,
      waiting: items.filter((x) => x.payment_status === "waiting").length,
      approved: items.filter((x) => x.application_status === "approved").length,
    };
  }, [items, total]);

  const planCounts = useMemo(() => {
    const counts: Record<PlanFilter, number> = {
      all: items.length,
      free: 0,
      bronze: 0,
      silver: 0,
      gold: 0,
      enterprise: 0,
    };

    items.forEach((item) => {
      const p = planType(item);
      if (p !== "legacy") counts[p] += 1;
    });

    return counts;
  }, [items]);

  function canApproveItem(item: VendorApplicationItem) {
    if (item.application_status === "approved") return false;

    if (planType(item) === "enterprise") return true;

    const amount = Number(item.amount_krw || item.amount || 0);
    if (amount === 0) return true;

    return item.payment_status === "confirmed";
  }

  function openDetail(item: VendorApplicationItem) {
    const id = getRowId(item);
    if (!id) return;
    router.push(`/admin/vendor-applications/${id}`);
  }

  function resetPage() {
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-3 md:p-5">
      <section className="mb-3 border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI VENDOR ADMIN
            </div>
            <h1 className="mt-1 text-3xl font-black">입점 승인센터</h1>
            <p className="mt-2 text-sm font-bold text-neutral-600">
              엑셀형 목록 기준으로 입금확인, 승인, 반려를 처리합니다.
            </p>
          </div>

          <VendorApplicationStats
  stats={stats}
  aiFilter={aiFilter}
  setAiFilter={setAiFilter}
  resetPage={resetPage}
/>
        </div>
      </section>

      {(notice || errorNotice) && (
        <section className="mb-3 space-y-2">
          {notice ? (
            <div className="border border-green-200 bg-green-50 p-3 font-black text-green-700">
              {notice}
            </div>
          ) : null}

          {errorNotice ? (
            <div className="border border-red-200 bg-red-50 p-3 font-black text-red-700">
              {errorNotice}
            </div>
          ) : null}
        </section>
      )}

      <section className="mb-3 border bg-white p-3">
        <div className="mb-2 text-sm font-black">플랜별 분류</div>
        <div className="flex flex-wrap gap-2">
          {PLAN_FILTERS.map((item) => {
            const active = planFilter === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setPlanFilter(item.key);
                  setPage(1);
                }}
                className={`border px-4 py-2 text-sm font-black ${
                  active
                    ? "bg-green-700 text-white"
                    : "bg-white text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {item.label} {planCounts[item.key]}건
              </button>
            );
          })}
        </div>
      </section>

      <VendorApplicationFilters
        q={q}
        setQ={setQ}
        aiFilter={aiFilter}
        setAiFilter={setAiFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        hallFilter={hallFilter}
        setHallFilter={setHallFilter}
        onRefresh={fetchList}
        loading={loadingList}
        resetPage={resetPage}
      />

      <VendorApplicationsTable
        items={filtered}
        total={total}
        page={page}
        totalPages={totalPages}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
        acting={acting}
        onDetail={openDetail}
        onConfirmPayment={(item) =>
          runAction(
            "confirm_payment",
            {},
            "입금 확인 처리되었습니다.",
            getRowId(item)
          )
        }
        onApprove={(item) => setApproveTarget(item)}
        onReject={(item) => {
          setRejectTarget(item);
          setRejectionReason(item.rejection_reason || "");
        }}
        canApproveItem={canApproveItem}
      />

      <VendorApplicationModal
        open={!!approveTarget}
        title="승인하고 브랜드관을 자동 생성하시겠습니까?"
        description={`업체명: ${approveTarget?.company_name || "-"}

신청 플랜: ${planLabel(approveTarget)}
상품 수: ${productLimitLabel(approveTarget)}
결제 방식: ${billingLabel(approveTarget)}
신청 금액: ${amountLabel(approveTarget)}

승인 후 expo_brands에 브랜드관이 자동 생성됩니다.`}
        confirmText="승인 + 브랜드관 생성"
        onCancel={() => setApproveTarget(null)}
        onConfirm={() => approveAndCreateBrand(approveTarget)}
      />

      <VendorApplicationModal
        open={!!rejectTarget}
        title="반려 처리하시겠습니까?"
        description={`업체명: ${rejectTarget?.company_name || "-"}

신청 플랜: ${planLabel(rejectTarget)}

반려 사유:
${rejectionReason || "(입력 없음)"}`}
        confirmText="반려"
        danger
        onCancel={() => setRejectTarget(null)}
        onConfirm={() => {
          const id = getRowId(rejectTarget);
          setRejectTarget(null);
          runAction(
            "reject",
            { rejection_reason: rejectionReason },
            "반려 처리되었습니다.",
            id
          );
        }}
      />
    </main>
  );
}