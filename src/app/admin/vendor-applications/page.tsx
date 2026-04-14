"use client";

import { useEffect, useMemo, useState } from "react";

/* =========================
   타입 정의
========================= */

type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected";
type PaymentStatus = "not_required" | "waiting" | "confirmed";
type BoothProgressStatus =
  | "not_started"
  | "assigned"
  | "building"
  | "completed"
  | "failed";

type VendorApplicationItem = {
  application_id?: string; // DB 실제 PK
  id?: string; // 과거 호환용 fallback

  application_code?: string;
  order_code?: string;

  company_name?: string;
  representative_name?: string;
  ceo_name?: string;
  contact_name?: string;
  contact_email?: string;
  email?: string;
  contact_phone?: string;
  phone?: string;
  business_number?: string;

  amount_krw?: number;
  amount?: number;

  preferred_hall_1?: string;
  preferred_hall_2?: string;
  preferred_category?: string;
  placement_preference?: string;
  promotion_preference?: string;

  booth_type?: string;
  duration_months?: number | null;

  application_status?: ApplicationStatus;
  payment_status?: PaymentStatus;
  booth_progress_status?: BoothProgressStatus;

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

  source_file_name?: string;
  source_file_mime?: string;
  rejection_reason?: string;

  created_at?: string | null;
  reviewed_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  payment_confirmed_at?: string | null;
  updated_at?: string | null;
};

type ListResponse = {
  ok: boolean;
  items: VendorApplicationItem[];
  error?: string;
};

/* =========================
   헬퍼
========================= */

const HALL_LABELS: Record<string, string> = {
  agri_inputs: "농자재관",
  machinery: "농기계관",
  seeds_seedlings: "종자·묘종관",
  smart_farm: "스마트팜관",
  eco_friendly: "친환경관",
  future_insect: "미래 곤충관",
};

const CATEGORY_LABELS: Record<string, string> = {
  fertilizer: "비료·영양제",
  pesticide: "병해충·방제자재",
  soil_conditioner: "토양개량·활력제",
  seed: "종자",
  seedling: "묘종",
  machinery: "농기계",
  facility: "시설·하우스 자재",
  smart_farm: "스마트농업·센서·AI",
  eco_friendly: "친환경·유기농자재",
  insect_food: "식용곤충·곤충소재 식품",
  insect_bio: "곤충기반 바이오소재",
  other: "기타",
};

function getRowId(item?: VendorApplicationItem | null) {
  return item?.application_id || item?.id || "";
}

function formatAmount(v?: number | null) {
  return `${Number(v || 0).toLocaleString()}원`;
}

function formatDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function hallLabel(v?: string | null) {
  if (!v) return "-";
  return HALL_LABELS[v] || v;
}

function categoryLabel(v?: string | null) {
  if (!v) return "-";
  return CATEGORY_LABELS[v] || v;
}

function statusLabel(v?: string) {
  switch (v) {
    case "pending":
      return "대기";
    case "under_review":
      return "검토중";
    case "approved":
      return "승인";
    case "rejected":
      return "반려";
    case "not_required":
      return "입금불필요";
    case "waiting":
      return "입금대기";
    case "confirmed":
      return "입금확인";
    case "not_started":
      return "미시작";
    case "assigned":
      return "배정완료";
    case "building":
      return "구성중";
    case "completed":
      return "완료";
    case "failed":
      return "실패";
    default:
      return v || "-";
  }
}

function badgeClass(type: "application" | "payment" | "booth", value?: string) {
  if (type === "application") {
    if (value === "pending") return "bg-amber-100 text-amber-800";
    if (value === "under_review") return "bg-blue-100 text-blue-800";
    if (value === "approved") return "bg-emerald-100 text-emerald-800";
    if (value === "rejected") return "bg-red-100 text-red-800";
  }

  if (type === "payment") {
    if (value === "not_required") return "bg-neutral-100 text-neutral-700";
    if (value === "waiting") return "bg-amber-100 text-amber-800";
    if (value === "confirmed") return "bg-emerald-100 text-emerald-800";
  }

  if (type === "booth") {
    if (value === "not_started") return "bg-neutral-100 text-neutral-700";
    if (value === "assigned") return "bg-blue-100 text-blue-800";
    if (value === "building") return "bg-violet-100 text-violet-800";
    if (value === "completed") return "bg-emerald-100 text-emerald-800";
    if (value === "failed") return "bg-red-100 text-red-800";
  }

  return "bg-neutral-100 text-neutral-700";
}

/* =========================
   페이지
========================= */

export default function Page() {
  const [items, setItems] = useState<VendorApplicationItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedItem, setSelectedItem] = useState<VendorApplicationItem | null>(null);

  const [licenseUrl, setLicenseUrl] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignedHall, setAssignedHall] = useState("");
  const [assignedSlotCode, setAssignedSlotCode] = useState("");

  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [boothModal, setBoothModal] = useState(false);

  const [acting, setActing] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  async function fetchList() {
    setLoadingList(true);
    setErrorNotice("");

    try {
      const res = await fetch("/api/admin/vendor-applications", {
        cache: "no-store",
      });
      const json: ListResponse = await res.json();

      if (!json?.ok) {
        throw new Error(json?.error || "목록 조회 실패");
      }

      const nextItems = json.items || [];
      setItems(nextItems);

      if (!selectedId && nextItems.length > 0) {
        setSelectedId(getRowId(nextItems[0]));
      } else if (selectedId) {
        const stillExists = nextItems.some((x) => getRowId(x) === selectedId);
        if (!stillExists) {
          setSelectedId(nextItems.length > 0 ? getRowId(nextItems[0]) : "");
        }
      }
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "목록 조회 실패");
    } finally {
      setLoadingList(false);
    }
  }

  async function fetchDetail(applicationId: string) {
    if (!applicationId) {
      setSelectedItem(null);
      return;
    }

    setLoadingDetail(true);
    setErrorNotice("");

    try {
      const res = await fetch(`/api/admin/vendor-applications/${applicationId}`, {
        cache: "no-store",
      });
      const json = await res.json();

      if (!json?.ok) {
        throw new Error(json?.error || "상세 조회 실패");
      }

      const item: VendorApplicationItem = json.item;
      setSelectedItem(item);
      setRejectionReason(item?.rejection_reason || "");
      setAssignedHall(item?.assigned_hall || item?.preferred_hall_1 || "");
      setAssignedSlotCode(item?.assigned_slot_code || "");
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "상세 조회 실패");
    } finally {
      setLoadingDetail(false);
    }
  }

  async function fetchLicense(applicationId: string) {
    if (!applicationId) {
      setLicenseUrl("");
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/vendor-applications/${applicationId}/business-license`,
        { cache: "no-store" }
      );
      const json = await res.json();

      if (json?.ok && json?.signedUrl) {
        setLicenseUrl(json.signedUrl);
      } else {
        setLicenseUrl("");
      }
    } catch {
      setLicenseUrl("");
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    fetchDetail(selectedId);
    fetchLicense(selectedId);
  }, [selectedId]);

  async function runAction(
    action: string,
    extra?: Record<string, unknown>,
    successMessage?: string
  ) {
    if (!selectedId) return;

    setActing(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch(`/api/admin/vendor-applications/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(extra || {}) }),
      });

      const json = await res.json();

      if (!json?.ok) {
        throw new Error(json?.error || "처리에 실패했습니다.");
      }

      setNotice(successMessage || json?.message || "정상 처리되었습니다.");

      await fetchDetail(selectedId);
      await fetchList();
      await fetchLicense(selectedId);
    } catch (error) {
      setErrorNotice(error instanceof Error ? error.message : "에러가 발생했습니다.");
    } finally {
      setActing(false);
    }
  }

  const canApprove = useMemo(() => {
    if (!selectedItem) return false;
    if (selectedItem.application_status === "approved") return false;

    const amount =
      typeof selectedItem.amount_krw === "number"
        ? selectedItem.amount_krw
        : typeof selectedItem.amount === "number"
        ? selectedItem.amount
        : 0;

    if (amount === 0) return true;
    return selectedItem.payment_status === "confirmed";
  }, [selectedItem]);

  const canPromoteNewProduct = useMemo(() => {
    if (!selectedItem) return false;
    if (!selectedItem.assigned_booth_id) return false;
    if (selectedItem.promotion_preference === "new_product") return false;
    return true;
  }, [selectedItem]);

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">입점 승인센터 A안</h1>
        <p className="mt-1 text-sm text-neutral-600">
          업체 신청 검토, 입금 확인, 승인/반려, 부스 생성, 신제품 승격을 한 화면에서 관리합니다.
        </p>
      </div>

      {(notice || errorNotice) && (
        <div className="mb-4 space-y-2">
          {notice && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          )}
          {errorNotice && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorNotice}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">신청 목록</div>
              <div className="mt-1 text-sm text-neutral-500">
                신청 업체를 선택해 상세를 확인하세요.
              </div>
            </div>
            <button
              type="button"
              onClick={fetchList}
              disabled={loadingList}
              className="rounded-2xl border border-neutral-300 px-3 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              {loadingList ? "새로고침 중..." : "새로고침"}
            </button>
          </div>

          <div className="max-h-[75vh] space-y-3 overflow-y-auto pr-1">
            {items.map((item) => {
              const rowId = getRowId(item);
              const selected = rowId === selectedId;

              return (
                <button
                  key={rowId || item.application_code || item.order_code}
                  type="button"
                  onClick={() => setSelectedId(rowId)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    selected
                      ? "border-black bg-black text-white"
                      : "border-neutral-200 bg-white hover:border-neutral-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold">{item.company_name || "-"}</div>
                      <div className={`mt-1 text-xs ${selected ? "text-neutral-300" : "text-neutral-500"}`}>
                        {item.application_code || item.order_code || rowId || "-"}
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatAmount(item.amount_krw || item.amount || 0)}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass("application", item.application_status)}`}>
                      {statusLabel(item.application_status)}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass("payment", item.payment_status)}`}>
                      {statusLabel(item.payment_status)}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass("booth", item.booth_progress_status)}`}>
                      {statusLabel(item.booth_progress_status)}
                    </span>
                  </div>

                  <div className={`mt-3 space-y-1 text-sm ${selected ? "text-neutral-200" : "text-neutral-600"}`}>
                    <div>대표자: {item.representative_name || item.ceo_name || "-"}</div>
                    <div>희망관: {hallLabel(item.preferred_hall_1)}</div>
                    <div>카테고리: {categoryLabel(item.preferred_category)}</div>
                    <div>배정슬롯: {item.assigned_slot_code || "-"}</div>
                  </div>
                </button>
              );
            })}

            {!loadingList && items.length === 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                조회된 신청이 없습니다.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          {!selectedItem && (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
              {loadingDetail ? "상세 정보를 불러오는 중입니다..." : "좌측에서 업체를 선택해주세요."}
            </div>
          )}

          {selectedItem && (
            <div className="space-y-6">
              <div className="border-b border-neutral-200 pb-5">
                <h2 className="text-2xl font-bold">{selectedItem.company_name || "-"}</h2>
                <div className="mt-2 text-sm text-neutral-500">
                  신청코드: {selectedItem.application_code || selectedItem.order_code || getRowId(selectedItem) || "-"}
                </div>
                <div className="mt-1 text-sm text-neutral-500">
                  신청일: {formatDate(selectedItem.created_at)}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${badgeClass("application", selectedItem.application_status)}`}>
                    신청상태 · {statusLabel(selectedItem.application_status)}
                  </span>
                  <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${badgeClass("payment", selectedItem.payment_status)}`}>
                    입금상태 · {statusLabel(selectedItem.payment_status)}
                  </span>
                  <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${badgeClass("booth", selectedItem.booth_progress_status)}`}>
                    부스진행 · {statusLabel(selectedItem.booth_progress_status)}
                  </span>
                </div>
              </div>

              <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="space-y-6">
                  <InfoCard
                    title="기본 정보"
                    rows={[
                      ["회사명", selectedItem.company_name || "-"],
                      ["대표자명", selectedItem.representative_name || selectedItem.ceo_name || "-"],
                      ["담당자명", selectedItem.contact_name || "-"],
                      ["담당자 이메일", selectedItem.contact_email || selectedItem.email || "-"],
                      ["담당자 연락처", selectedItem.contact_phone || selectedItem.phone || "-"],
                      ["사업자등록번호", selectedItem.business_number || "-"],
                      ["사업장 주소", selectedItem.business_address || selectedItem.address || "-"],
                      ["업태", selectedItem.biz_type || selectedItem.business_type || "-"],
                      ["종목", selectedItem.biz_item || selectedItem.business_item || "-"],
                    ]}
                  />

                  <InfoCard
                    title="신청 / 희망 정보"
                    rows={[
                      ["부스 유형", selectedItem.booth_type || "-"],
                      ["기간", selectedItem.duration_months ? `${selectedItem.duration_months}개월` : "-"],
                      ["금액", formatAmount(selectedItem.amount_krw || selectedItem.amount || 0)],
                      ["희망 관 1순위", hallLabel(selectedItem.preferred_hall_1)],
                      ["희망 관 2순위", hallLabel(selectedItem.preferred_hall_2)],
                      ["희망 카테고리", categoryLabel(selectedItem.preferred_category)],
                      ["위치 성향", selectedItem.placement_preference || "-"],
                      ["홍보 선호", selectedItem.promotion_preference || "-"],
                    ]}
                  />

                  <InfoCard
                    title="배정 상태"
                    rows={[
                      ["배정 관", hallLabel(selectedItem.assigned_hall)],
                      ["배정 슬롯", selectedItem.assigned_slot_code || "-"],
                      ["배정 부스 ID", selectedItem.assigned_booth_id || "-"],
                      ["반려 사유", selectedItem.rejection_reason || "-"],
                    ]}
                  />

                  <div className="rounded-3xl border border-neutral-200 p-5">
                    <div className="mb-4 text-lg font-semibold">운영 액션</div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      <ActionButton
                        label="검토 시작"
                        onClick={() => runAction("start_review", {}, "검토 시작 처리되었습니다.")}
                        disabled={acting}
                      />

                      <ActionButton
                        label="입금 확인"
                        onClick={() => runAction("confirm_payment", {}, "입금 확인 처리되었습니다.")}
                        disabled={acting}
                        variant="secondary"
                      />

                      <ActionButton
                        label="승인"
                        onClick={() => setApproveModal(true)}
                        disabled={acting || !canApprove}
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

                      <ActionButton
                        label="반려"
                        onClick={() => setRejectModal(true)}
                        disabled={acting}
                        variant="danger"
                      />

                      <ActionButton
                        label="부스 생성"
                        onClick={() => setBoothModal(true)}
                        disabled={acting || selectedItem.application_status !== "approved"}
                        variant="secondary"
                      />

                      <ActionButton
                        label="슬롯 배정 저장"
                        onClick={() =>
                          runAction(
                            "assign_slot",
                            {
                              assigned_hall: assignedHall,
                              assigned_slot_code: assignedSlotCode,
                            },
                            "슬롯 배정이 저장되었습니다."
                          )
                        }
                        disabled={acting || !assignedHall || !assignedSlotCode}
                        variant="secondary"
                      />

                      <ActionButton
                        label="🔥 이달의 신제품 승격"
                        onClick={() =>
                          runAction(
                            "promote_new_product",
                            {},
                            "이달의 신제품으로 승격되었습니다."
                          )
                        }
                        disabled={acting || !canPromoteNewProduct}
                      />
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <div className="mb-2 text-sm font-medium">배정 관</div>
                        <select
                          value={assignedHall}
                          onChange={(e) => setAssignedHall(e.target.value)}
                          className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                        >
                          <option value="">선택</option>
                          {Object.entries(HALL_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <div className="mb-2 text-sm font-medium">배정 슬롯 코드</div>
                        <input
                          value={assignedSlotCode}
                          onChange={(e) => setAssignedSlotCode(e.target.value)}
                          placeholder="예: A-03"
                          className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                        />
                      </label>
                    </div>

                    <div className="mt-4">
                      <label className="mb-2 block text-sm font-medium">반려 사유</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                        placeholder="예: 제출 자료 보완이 필요합니다."
                      />
                    </div>
                  </div>

                  <InfoCard
                    title="진행 기록"
                    rows={[
                      ["검토 시작일", formatDate(selectedItem.reviewed_at)],
                      ["입금 확인일", formatDate(selectedItem.payment_confirmed_at)],
                      ["승인일", formatDate(selectedItem.approved_at)],
                      ["반려일", formatDate(selectedItem.rejected_at)],
                      ["최근 수정일", formatDate(selectedItem.updated_at)],
                    ]}
                  />
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-neutral-200 p-5">
                    <div className="mb-4 text-lg font-semibold">사업자등록증</div>

                    <div className="mb-3 text-sm text-neutral-500">
                      파일명: {selectedItem.source_file_name || "-"}
                    </div>

                    {licenseUrl ? (
                      <div className="space-y-3">
                        <a
                          href={licenseUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                        >
                          새 창에서 열기
                        </a>

                        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50">
                          {selectedItem.source_file_mime === "application/pdf" ? (
                            <iframe
                              src={licenseUrl}
                              title="사업자등록증 PDF"
                              className="h-[720px] w-full"
                            />
                          ) : (
                            <img
                              src={licenseUrl}
                              alt="사업자등록증"
                              className="h-auto w-full"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                        등록된 사업자등록증이 없습니다.
                      </div>
                    )}
                  </div>

                  <div className="rounded-3xl border border-neutral-200 p-5">
                    <div className="mb-4 text-lg font-semibold">회사 소개</div>
                    <div className="whitespace-pre-wrap text-sm leading-7 text-neutral-700">
                      {selectedItem.company_intro || selectedItem.intro || "소개 정보가 없습니다."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <ConfirmModal
        open={approveModal}
        title="승인하시겠습니까?"
        description={`승인 후에는 승인 상태로 전환됩니다.\n유료 신청은 입금확인 후 승인해야 합니다.`}
        confirmText="승인"
        onCancel={() => setApproveModal(false)}
        onConfirm={() => {
          setApproveModal(false);
          runAction("approve", {}, "승인 처리되었습니다.");
        }}
      />

      <ConfirmModal
        open={rejectModal}
        title="반려 처리하시겠습니까?"
        description={`이 작업은 되돌리기 어렵습니다.\n\n반려 사유:\n${rejectionReason || "(입력 없음)"}`}
        confirmText="반려"
        danger
        onCancel={() => setRejectModal(false)}
        onConfirm={() => {
          setRejectModal(false);
          runAction(
            "reject",
            { rejection_reason: rejectionReason },
            "반려 처리되었습니다."
          );
        }}
      />

      <ConfirmModal
        open={boothModal}
        title="부스를 생성하시겠습니까?"
        description={`승인된 업체에 대해 실제 부스를 생성합니다.\n\n배정 관: ${hallLabel(
          assignedHall || selectedItem?.assigned_hall || selectedItem?.preferred_hall_1
        )}\n배정 슬롯: ${assignedSlotCode || selectedItem?.assigned_slot_code || "-"}`}
        confirmText="생성"
        onCancel={() => setBoothModal(false)}
        onConfirm={() => {
          setBoothModal(false);
          runAction(
            "create_booth",
            {
              assigned_hall:
                assignedHall ||
                selectedItem?.assigned_hall ||
                selectedItem?.preferred_hall_1,
              assigned_slot_code:
                assignedSlotCode || selectedItem?.assigned_slot_code || null,
            },
            "부스가 생성되었습니다."
          );
        }}
      />
    </div>
  );
}

/* =========================
   하위 컴포넌트
========================= */

function InfoCard({
  title,
  rows,
}: {
  title: string;
  rows: [string, string][];
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 p-5">
      <div className="mb-4 text-lg font-semibold">{title}</div>
      <div className="space-y-3">
        {rows.map(([label, value], idx) => (
          <div
            key={`${label}-${idx}`}
            className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 text-sm"
          >
            <div className="w-40 shrink-0 text-neutral-500">{label}</div>
            <div className="flex-1 whitespace-pre-wrap break-words text-right font-medium text-neutral-900">
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
  variant?: "primary" | "secondary" | "danger";
}) {
  const className =
    variant === "primary"
      ? "bg-black text-white hover:opacity-90"
      : variant === "danger"
      ? "bg-red-600 text-white hover:opacity-90"
      : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {label}
    </button>
  );
}

function ConfirmModal({
  open,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  onConfirm,
  onCancel,
  danger = false,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <div className="text-lg font-bold">{title}</div>

        {description && (
          <div className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-600">
            {description}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              danger ? "bg-red-600" : "bg-black"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}