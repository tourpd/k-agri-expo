"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  aiBadgeClass,
  aiReview,
  categoryLabel,
  formatAmount,
  formatDate,
  hallLabel,
  HALL_LABELS,
  statusLabel,
  type VendorApplicationItem,
} from "@/lib/admin/vendor-applications";

type SourceExtractedJson = {
  plan_type?: string;
  plan_name?: string;
  billing_cycle?: string;
  billing_label?: string;
  product_limit?: string;
  [key: string]: unknown;
};

type DetailItem = VendorApplicationItem & {
  preferred_hall_2?: string;
  promotion_preference?: string;
  booth_type?: string;
  duration_months?: number | null;
  assigned_hall?: string;
  assigned_slot_code?: string;
  assigned_booth_id?: string;
  company_intro?: string;
  intro?: string;
  business_address?: string;
  address?: string;
  biz_type?: string;
  business_type?: string;
  biz_item?: string;
  business_item?: string;
  source_file_mime?: string;
  reviewed_at?: string | null;
  rejected_at?: string | null;
  payment_confirmed_at?: string | null;
  updated_at?: string | null;
  source_extracted_json?: SourceExtractedJson | null;
};

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function isPdfFile(mime?: string, fileName?: string) {
  const m = safe(mime).toLowerCase();
  const f = safe(fileName).toLowerCase();
  return m.includes("pdf") || f.endsWith(".pdf");
}

function getPlanTypeLabel(planType?: string | null) {
  switch (planType) {
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
      return "";
  }
}

function getBoothLabel(boothType?: string | null) {
  switch (boothType) {
    case "free":
      return "무료 체험";
    case "basic":
      return "일반 부스";
    case "premium":
      return "프리미엄 부스";
    default:
      return "-";
  }
}

function getDisplayPlan(item?: DetailItem | null) {
  if (!item) {
    return {
      planType: "",
      planName: "-",
      billingLabel: "-",
      productLimit: "",
      productLabel: "-",
      amountLabel: "-",
      isEnterprise: false,
      isFree: false,
    };
  }

  const source = item.source_extracted_json || {};
  const planType = safe(source.plan_type);
  const planName =
    safe(source.plan_name) ||
    getPlanTypeLabel(planType) ||
    getBoothLabel(item.booth_type);

  const billingLabel =
    safe(source.billing_label) ||
    (item.duration_months ? `${item.duration_months}개월` : "-");

  const productLimit = safe(source.product_limit);
  const isEnterprise = planType === "enterprise" || planName === "엔터프라이즈";
  const amount = Number(item.amount_krw || item.amount || 0);
  const isFree = !isEnterprise && (planType === "free" || amount === 0);

  return {
    planType,
    planName,
    billingLabel: isEnterprise ? "별도 협의" : billingLabel,
    productLimit,
    productLabel: `${planName}${billingLabel !== "-" ? ` · ${billingLabel}` : ""}${
      productLimit ? ` · ${productLimit}` : ""
    }`,
    amountLabel: isEnterprise ? "별도 협의" : formatAmount(amount),
    isEnterprise,
    isFree,
  };
}

export default function VendorApplicationDetailPage() {
  const params = useParams<{ applicationId: string }>();
  const router = useRouter();
  const applicationId = params?.applicationId || "";

  const [item, setItem] = useState<DetailItem | null>(null);
  const [licenseUrl, setLicenseUrl] = useState("");
  const [licenseMime, setLicenseMime] = useState("");
  const [licenseFileName, setLicenseFileName] = useState("");

  const [assignedHall, setAssignedHall] = useState("");
  const [assignedSlotCode, setAssignedSlotCode] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  const ai = useMemo(() => aiReview(item || ({} as VendorApplicationItem)), [item]);
  const display = useMemo(() => getDisplayPlan(item), [item]);

  const amount = Number(item?.amount_krw || item?.amount || 0);
  const canApprove =
    !!item &&
    item.application_status !== "approved" &&
    (display.isEnterprise || amount === 0 || item.payment_status === "confirmed");

  const displayedLicenseMime = licenseMime || item?.source_file_mime || "";
  const displayedLicenseName = licenseFileName || item?.source_file_name || "";

  async function fetchDetail() {
    if (!applicationId) return;

    setLoading(true);
    setErrorNotice("");

    try {
      const res = await fetch(`/api/admin/vendor-applications/${applicationId}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!json?.ok) {
        throw new Error(json?.error || "상세 조회 실패");
      }

      const nextItem: DetailItem = json.item;
      setItem(nextItem);
      setAssignedHall(nextItem.assigned_hall || nextItem.preferred_hall_1 || "");
      setAssignedSlotCode(nextItem.assigned_slot_code || "");
      setRejectionReason(nextItem.rejection_reason || "");
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "상세 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLicense() {
    if (!applicationId) return;

    try {
      const res = await fetch(
        `/api/admin/vendor-applications/${applicationId}/business-license`,
        { cache: "no-store" }
      );
      const json = await res.json();

      if (json?.ok && json?.signedUrl) {
        setLicenseUrl(json.signedUrl);
        setLicenseMime(json.source_file_mime || "");
        setLicenseFileName(json.source_file_name || "");
      } else {
        setLicenseUrl("");
        setLicenseMime("");
        setLicenseFileName("");
      }
    } catch {
      setLicenseUrl("");
      setLicenseMime("");
      setLicenseFileName("");
    }
  }

  useEffect(() => {
    fetchDetail();
    fetchLicense();
  }, [applicationId]);

  async function runAction(
    action: string,
    extra?: Record<string, unknown>,
    successMessage?: string
  ) {
    if (!applicationId) return;

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
        throw new Error(json?.error || "처리 실패");
      }

      setNotice(successMessage || json?.message || "처리되었습니다.");
      await fetchDetail();
      await fetchLicense();
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "처리 실패");
    } finally {
      setActing(false);
    }
  }

  async function approveAndCreateBrand() {
    if (!applicationId) return;

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

      await fetchDetail();
      await fetchLicense();
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "승인 및 브랜드관 생성 실패"
      );
    } finally {
      setActing(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-3 md:p-5">
      <section className="mb-3 rounded-3xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/vendor-applications")}
            className="rounded-2xl border bg-white px-4 py-2 text-sm font-black"
          >
            ← 승인목록
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border bg-white px-4 py-2 text-sm font-black"
          >
            ← 이전
          </button>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-xs font-black text-green-700">
              VENDOR APPLICATION DETAIL
            </div>
            <h1 className="mt-1 text-3xl font-black">
              {item?.company_name || "입점 신청 상세"}
            </h1>
            <p className="mt-2 text-sm font-bold text-neutral-600">
              신청 플랜, 사업자등록증, 입금 상태, 브랜드관 생성 전 최종 확인 화면입니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <MiniStat title="AI판정" value={ai.label} tone={ai.tone as any} />
            <MiniStat title="신청상태" value={statusLabel(item?.application_status)} />
            <MiniStat title="입금상태" value={statusLabel(item?.payment_status)} />
            <MiniStat title="금액" value={display.amountLabel} tone={display.isEnterprise ? "blue" : "red"} />
          </div>
        </div>
      </section>

      {(notice || errorNotice) && (
        <section className="mb-3 space-y-2">
          {notice ? (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-4 font-black text-green-700">
              {notice}
            </div>
          ) : null}

          {errorNotice ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-black text-red-700">
              {errorNotice}
            </div>
          ) : null}
        </section>
      )}

      {loading ? (
        <section className="rounded-3xl border bg-white p-8 text-center text-lg font-black">
          상세 정보를 불러오는 중입니다.
        </section>
      ) : null}

      {!loading && !item ? (
        <section className="rounded-3xl border bg-white p-8 text-center text-lg font-black text-red-700">
          신청 정보를 찾지 못했습니다.
        </section>
      ) : null}

      {item ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_460px]">
          <section className="space-y-4">
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-2xl font-black">AI 1차 검토</h2>

              <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                <div className={`rounded-2xl p-5 text-center font-black ${aiBadgeClass(ai.tone)}`}>
                  <div className="text-sm">AI 판정</div>
                  <div className="mt-2 text-2xl">{ai.label}</div>
                </div>

                <div className="rounded-2xl bg-neutral-50 p-5">
                  <div className="text-sm font-black text-neutral-500">
                    위험 사유 / 확인 사유
                  </div>
                  <div className="mt-2 text-lg font-black text-neutral-900">
                    {ai.reason}
                  </div>
                </div>
              </div>
            </div>

            <InfoGrid
              title="신청 플랜 정보"
              rows={[
                ["신청 플랜", display.planName],
                ["결제 방식", display.billingLabel],
                ["제품 등록 수", display.productLimit || "-"],
                ["신청 상품", display.productLabel],
                ["신청 금액", display.amountLabel],
                ["기존 부스 유형값", item.booth_type || "-"],
                ["기존 기간값", item.duration_months ? `${item.duration_months}개월` : "-"],
              ]}
            />

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-2xl font-black">관리자 최종 액션</h2>

              <div className="grid gap-2 md:grid-cols-4">
                <ActionButton
                  label="검토 시작"
                  onClick={() => runAction("start_review", {}, "검토 시작 처리되었습니다.")}
                  disabled={acting}
                  variant="secondary"
                />
                <ActionButton
                  label="입금 확인"
                  onClick={() => runAction("confirm_payment", {}, "입금 확인 처리되었습니다.")}
                  disabled={acting || item.payment_status === "confirmed" || display.isEnterprise}
                  variant="blue"
                />
                <ActionButton
                  label="승인 + 브랜드관 생성"
                  onClick={approveAndCreateBrand}
                  disabled={acting || !canApprove}
                />
                <ActionButton
                  label="반려"
                  onClick={() =>
                    runAction(
                      "reject",
                      { rejection_reason: rejectionReason },
                      "반려 처리되었습니다."
                    )
                  }
                  disabled={acting}
                  variant="danger"
                />
                <ActionButton
                  label="슬롯 저장"
                  onClick={() =>
                    runAction(
                      "assign_slot",
                      { assigned_hall: assignedHall, assigned_slot_code: assignedSlotCode },
                      "슬롯 배정이 저장되었습니다."
                    )
                  }
                  disabled={acting || !assignedHall || !assignedSlotCode}
                  variant="secondary"
                />
                <ActionButton
                  label="브랜드관 생성"
                  onClick={() =>
                    runAction(
                      "create_booth",
                      {
                        assigned_hall: assignedHall || item.assigned_hall || item.preferred_hall_1,
                        assigned_slot_code: assignedSlotCode || item.assigned_slot_code || null,
                      },
                      "브랜드관 생성 요청이 처리되었습니다."
                    )
                  }
                  disabled={acting || item.application_status !== "approved"}
                  variant="secondary"
                />
                <ActionButton
                  label="신제품 승격"
                  onClick={() =>
                    runAction("promote_new_product", {}, "이달의 신제품으로 승격되었습니다.")
                  }
                  disabled={acting || !item.assigned_booth_id}
                />
                <ActionButton
                  label="반려사유 저장"
                  onClick={() =>
                    runAction(
                      "save_rejection_reason",
                      { rejection_reason: rejectionReason },
                      "반려사유가 저장되었습니다."
                    )
                  }
                  disabled={acting}
                  variant="secondary"
                />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label>
                  <div className="mb-2 text-sm font-black">배정 관</div>
                  <select
                    value={assignedHall}
                    onChange={(e) => setAssignedHall(e.target.value)}
                    className="h-12 w-full rounded-2xl border px-4 font-bold"
                  >
                    <option value="">선택</option>
                    {Object.entries(HALL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <div className="mb-2 text-sm font-black">배정 슬롯 코드</div>
                  <input
                    value={assignedSlotCode}
                    onChange={(e) => setAssignedSlotCode(e.target.value)}
                    placeholder="예: A-03"
                    className="h-12 w-full rounded-2xl border px-4 font-bold"
                  />
                </label>
              </div>

              <label className="mt-5 block">
                <div className="mb-2 text-sm font-black">반려 사유</div>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border px-4 py-3 font-bold"
                  placeholder="예: 사업자등록증이 누락되었습니다."
                />
              </label>
            </div>

            <InfoGrid
              title="업체 기본 정보"
              rows={[
                ["회사명", item.company_name || "-"],
                ["대표자명", item.representative_name || item.ceo_name || "-"],
                ["담당자명", item.contact_name || "-"],
                ["담당자 이메일", item.contact_email || item.email || "-"],
                ["담당자 연락처", item.contact_phone || item.phone || "-"],
                ["사업자등록번호", item.business_number || "-"],
                ["사업장 주소", item.business_address || item.address || "-"],
                ["업태", item.biz_type || item.business_type || "-"],
                ["종목", item.biz_item || item.business_item || "-"],
              ]}
            />

            <InfoGrid
              title="희망관 / 브랜드관 정보"
              rows={[
                ["신청코드", item.application_code || item.order_code || item.application_id || item.id || "-"],
                ["희망 관 1순위", hallLabel(item.preferred_hall_1)],
                ["희망 관 2순위", hallLabel(item.preferred_hall_2)],
                ["희망 카테고리", categoryLabel(item.preferred_category)],
                ["배정 관", hallLabel(item.assigned_hall)],
                ["배정 슬롯", item.assigned_slot_code || "-"],
                ["배정 브랜드관 ID", item.assigned_booth_id || "-"],
              ]}
            />

            <InfoGrid
              title="진행 기록"
              rows={[
                ["신청일", formatDate(item.created_at)],
                ["검토 시작일", formatDate(item.reviewed_at)],
                ["입금 확인일", formatDate(item.payment_confirmed_at)],
                ["승인일", formatDate(item.approved_at)],
                ["반려일", formatDate(item.rejected_at)],
                ["최근 수정일", formatDate(item.updated_at)],
              ]}
            />
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-2xl font-black">사업자등록증</h2>

              <div className="mb-3 text-sm font-bold text-neutral-500">
                파일명: {displayedLicenseName || "-"}
              </div>

              {licenseUrl ? (
                <div className="space-y-3">
                  <a
                    href={licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-2xl border px-4 py-2 text-sm font-black hover:bg-neutral-50"
                  >
                    새 창에서 열기
                  </a>

                  <div className="overflow-hidden rounded-2xl border bg-neutral-50">
                    {isPdfFile(displayedLicenseMime, displayedLicenseName) ? (
                      <iframe
                        src={licenseUrl}
                        title="사업자등록증 PDF"
                        className="h-[680px] w-full"
                      />
                    ) : (
                      <img src={licenseUrl} alt="사업자등록증" className="h-auto w-full" />
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-red-50 p-4 font-black text-red-700">
                  등록된 사업자등록증이 없습니다.
                </div>
              )}
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-2xl font-black">승인 후 업체가 할 일</h2>

              <div className="space-y-2 text-sm font-black text-neutral-700">
                <Step n="1" text="로고 등록" />
                <Step n="2" text="대표 배너 이미지 등록" />
                <Step n="3" text="회사 소개 작성" />
                <Step n="4" text="제품 직접 등록 또는 자동입점 진행" />
                <Step n="5" text="공동구매 / 샘플 / 라이브 / 상담 등록" />
                <Step n="6" text="한국농수산TV 영상 연결" />
                <Step n="7" text="브랜드관 공개 요청" />
              </div>
            </div>

            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-2xl font-black">회사 소개</h2>
              <div className="whitespace-pre-wrap text-sm font-bold leading-7 text-neutral-700">
                {item.company_intro || item.intro || "소개 정보가 없습니다."}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function MiniStat({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: string;
  tone?: "neutral" | "red" | "amber" | "green" | "blue";
}) {
  const cls =
    tone === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : tone === "green"
      ? "border-green-200 bg-green-50 text-green-700"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-neutral-200 bg-white text-neutral-900";

  return (
    <div className={`rounded-2xl border p-3 text-center ${cls}`}>
      <div className="text-xs font-black">{title}</div>
      <div className="mt-1 text-base font-black">{value}</div>
    </div>
  );
}

function InfoGrid({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-3xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-2xl font-black">{title}</h2>
      <div className="grid gap-2 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-neutral-50 p-3">
            <div className="text-xs font-black text-neutral-500">{label}</div>
            <div className="mt-1 break-words text-sm font-black text-neutral-900">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "blue";
}) {
  const cls =
    variant === "primary"
      ? "bg-green-700 text-white"
      : variant === "danger"
      ? "bg-red-600 text-white"
      : variant === "blue"
      ? "bg-blue-600 text-white"
      : "border bg-white text-neutral-900";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl px-4 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}
    >
      {label}
    </button>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl bg-neutral-50 p-3">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-700 text-xs font-black text-white">
        {n}
      </span>
      <span>{text}</span>
    </div>
  );
}