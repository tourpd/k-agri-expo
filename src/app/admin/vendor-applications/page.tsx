"use client";

import { useEffect, useMemo, useState } from "react";

type ApplicationStatus = "pending" | "under_review" | "approved" | "rejected";
type PaymentStatus = "not_required" | "waiting" | "confirmed";
type BoothProgressStatus =
  | "not_started"
  | "assigned"
  | "building"
  | "completed"
  | "failed";

type VendorApplicationItem = {
  application_id?: string;
  id?: string;
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

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function getRowId(item?: VendorApplicationItem | null) {
  return safe(item?.application_id || item?.id);
}

function formatAmount(v?: number | null) {
  const n = Number(v || 0);
  if (!n) return "-";
  return `${n.toLocaleString()}원`;
}

function formatDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 16);
  return d.toLocaleString("ko-KR").slice(0, 20);
}

function hallLabel(v?: string | null) {
  if (!v) return "-";
  return HALL_LABELS[v] || v;
}

function categoryLabel(v?: string | null) {
  if (!v) return "-";
  return CATEGORY_LABELS[v] || v;
}

function statusLabel(v?: string | null) {
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
      return safe(v) || "-";
  }
}

function badgeClass(value?: string | null) {
  if (value === "approved" || value === "confirmed" || value === "completed") {
    return "bg-green-100 text-green-800";
  }
  if (value === "pending" || value === "waiting") {
    return "bg-amber-100 text-amber-800";
  }
  if (value === "under_review" || value === "building" || value === "assigned") {
    return "bg-blue-100 text-blue-800";
  }
  if (value === "rejected" || value === "failed") {
    return "bg-red-100 text-red-800";
  }
  return "bg-neutral-100 text-neutral-700";
}

export default function Page() {
  const [items, setItems] = useState<VendorApplicationItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedItem, setSelectedItem] = useState<VendorApplicationItem | null>(null);

  const [approveTarget, setApproveTarget] = useState<VendorApplicationItem | null>(null);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hallFilter, setHallFilter] = useState("all");

  const [licenseUrl, setLicenseUrl] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [assignedHall, setAssignedHall] = useState("");
  const [assignedSlotCode, setAssignedSlotCode] = useState("");

  const [rejectModal, setRejectModal] = useState(false);
  const [boothModal, setBoothModal] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const [acting, setActing] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  async function fetchList() {
    setLoadingList(true);
    setErrorNotice("");

    try {
      const res = await fetch("/api/admin/vendor-applications", { cache: "no-store" });
      const json: ListResponse = await res.json();

      if (!json?.ok) throw new Error(json?.error || "목록 조회 실패");

      const nextItems = json.items || [];
      setItems(nextItems);

      if (!selectedId && nextItems.length > 0) {
        setSelectedId(getRowId(nextItems[0]));
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

      if (!json?.ok) throw new Error(json?.error || "상세 조회 실패");

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
      setLicenseUrl(json?.ok && json?.signedUrl ? json.signedUrl : "");
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

      if (!json?.ok) throw new Error(json?.error || "처리에 실패했습니다.");

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

      if (!json?.success) {
        throw new Error(json?.error || "승인 및 브랜드관 생성 실패");
      }

      setSelectedId(applicationId);
      setNotice(
        json?.brand_url
          ? `승인 완료. 브랜드관 생성: ${json.brand_url}`
          : "승인 및 브랜드관 생성 완료"
      );

      await fetchDetail(applicationId);
      await fetchList();
      await fetchLicense(applicationId);
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
      if (statusFilter !== "all" && x.application_status !== statusFilter) return false;
      if (hallFilter !== "all" && x.preferred_hall_1 !== hallFilter) return false;
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
        x.assigned_slot_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return hay.includes(keyword);
    });
  }, [items, q, statusFilter, hallFilter]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((x) => x.application_status === "pending").length,
      approved: items.filter((x) => x.application_status === "approved").length,
      waiting: items.filter((x) => x.payment_status === "waiting").length,
      confirmed: items.filter((x) => x.payment_status === "confirmed").length,
      amount: items.reduce((sum, x) => sum + Number(x.amount_krw || x.amount || 0), 0),
    };
  }, [items]);

  const canApproveSelected = useMemo(() => {
    if (!selectedItem) return false;
    if (selectedItem.application_status === "approved") return false;

    const amount = Number(selectedItem.amount_krw || selectedItem.amount || 0);
    if (amount === 0) return true;

    return selectedItem.payment_status === "confirmed";
  }, [selectedItem]);

  const canPromoteNewProduct = useMemo(() => {
    if (!selectedItem) return false;
    if (!selectedItem.assigned_booth_id) return false;
    if (selectedItem.promotion_preference === "new_product") return false;
    return true;
  }, [selectedItem]);

  function canApproveItem(item: VendorApplicationItem) {
    if (item.application_status === "approved") return false;
    const amount = Number(item.amount_krw || item.amount || 0);
    if (amount === 0) return true;
    return item.payment_status === "confirmed";
  }

  function selectRow(item: VendorApplicationItem) {
    const id = getRowId(item);
    if (!id) return;
    setSelectedId(id);
    setDetailOpen(true);
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-3 md:p-5">
      <section className="mb-3 rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI VENDOR ADMIN
            </div>
            <h1 className="mt-1 text-3xl font-black">입점 승인센터</h1>
            <p className="mt-2 text-sm font-bold text-neutral-600">
              관리자 전용 화면입니다. 입점 신청, 입금확인, 승인, 브랜드관 생성,
              부스 배정을 엑셀형으로 관리합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            <Stat title="전체" value={`${stats.total}건`} />
            <Stat title="대기" value={`${stats.pending}건`} tone="amber" />
            <Stat title="승인" value={`${stats.approved}건`} tone="green" />
            <Stat title="입금대기" value={`${stats.waiting}건`} tone="red" />
            <Stat title="입금확인" value={`${stats.confirmed}건`} tone="blue" />
            <Stat title="신청금액" value={formatAmount(stats.amount)} tone="red" />
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

      <section className="mb-3 rounded-3xl border bg-white p-4 shadow-sm">
        <div className="grid gap-2 md:grid-cols-[1fr_180px_180px_120px]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="업체명·담당자·전화·이메일·사업자번호 통합검색"
            className="h-12 rounded-2xl border px-4 text-base font-bold"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 rounded-2xl border px-4 text-base font-bold"
          >
            <option value="all">전체 상태</option>
            <option value="pending">대기</option>
            <option value="under_review">검토중</option>
            <option value="approved">승인</option>
            <option value="rejected">반려</option>
          </select>

          <select
            value={hallFilter}
            onChange={(e) => setHallFilter(e.target.value)}
            className="h-12 rounded-2xl border px-4 text-base font-bold"
          >
            <option value="all">전체 관</option>
            {Object.entries(HALL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchList}
            disabled={loadingList}
            className="h-12 rounded-2xl bg-green-700 px-5 font-black text-white disabled:opacity-50"
          >
            {loadingList ? "조회중" : "새로고침"}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <FilterButton label="전체" active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <FilterButton label="대기" active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} />
          <FilterButton label="검토중" active={statusFilter === "under_review"} onClick={() => setStatusFilter("under_review")} />
          <FilterButton label="승인" active={statusFilter === "approved"} onClick={() => setStatusFilter("approved")} />
          <FilterButton label="반려" active={statusFilter === "rejected"} onClick={() => setStatusFilter("rejected")} />
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between px-2">
          <b className="text-lg">입점 신청 목록</b>
          <span className="text-sm font-black text-neutral-500">
            표시 {filtered.length.toLocaleString()}건
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[2200px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-neutral-50">
              <tr>
                <Th>상태</Th>
                <Th>입금</Th>
                <Th>부스</Th>
                <Th>업체명</Th>
                <Th>대표자</Th>
                <Th>담당자</Th>
                <Th>전화</Th>
                <Th>이메일</Th>
                <Th>사업자번호</Th>
                <Th>희망관</Th>
                <Th>카테고리</Th>
                <Th>금액</Th>
                <Th>배정관</Th>
                <Th>슬롯</Th>
                <Th>신청일</Th>
                <Th>승인일</Th>
                <Th>관리</Th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={17} className="p-10 text-center font-black text-neutral-500">
                    조건에 맞는 입점 신청이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const id = getRowId(item);

                  return (
                    <tr
                      key={id || item.application_code || item.order_code}
                      className={`hover:bg-green-50 ${selectedId === id ? "bg-green-50" : ""}`}
                    >
                      <Td><StatusPill value={item.application_status} /></Td>
                      <Td><StatusPill value={item.payment_status} /></Td>
                      <Td><StatusPill value={item.booth_progress_status} /></Td>
                      <Td strong>{item.company_name || "-"}</Td>
                      <Td>{item.representative_name || item.ceo_name || "-"}</Td>
                      <Td>{item.contact_name || "-"}</Td>
                      <Td strong>{item.contact_phone || item.phone || "-"}</Td>
                      <Td>{item.contact_email || item.email || "-"}</Td>
                      <Td>{item.business_number || "-"}</Td>
                      <Td>{hallLabel(item.preferred_hall_1)}</Td>
                      <Td>{categoryLabel(item.preferred_category)}</Td>
                      <Td strong>{formatAmount(item.amount_krw || item.amount || 0)}</Td>
                      <Td>{hallLabel(item.assigned_hall)}</Td>
                      <Td>{item.assigned_slot_code || "-"}</Td>
                      <Td>{formatDate(item.created_at)}</Td>
                      <Td>{formatDate(item.approved_at)}</Td>
                      <Td>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => selectRow(item)}
                            className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-black text-white"
                          >
                            상세
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(id);
                              setApproveTarget(item);
                            }}
                            disabled={!canApproveItem(item) || acting}
                            className="rounded-xl bg-green-700 px-3 py-2 text-xs font-black text-white disabled:opacity-40"
                          >
                            승인
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedId(id);
                              runAction("confirm_payment", {}, "입금 확인 처리되었습니다.");
                            }}
                            disabled={item.payment_status === "confirmed" || acting}
                            className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-black text-white disabled:opacity-40"
                          >
                            입금
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {detailOpen && selectedItem ? (
        <section className="mt-3 rounded-3xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-xs font-black text-green-700">SELECTED VENDOR</div>
              <h2 className="mt-1 text-2xl font-black">{selectedItem.company_name || "-"}</h2>
              <div className="mt-2 text-sm font-bold text-neutral-500">
                신청코드:{" "}
                {selectedItem.application_code ||
                  selectedItem.order_code ||
                  getRowId(selectedItem) ||
                  "-"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDetailOpen(false)}
              className="rounded-2xl border bg-white px-4 py-3 font-black"
            >
              닫기
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
            <div className="space-y-4">
              <InfoGrid
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

              <InfoGrid
                title="신청 / 배정 정보"
                rows={[
                  ["부스 유형", selectedItem.booth_type || "-"],
                  ["기간", selectedItem.duration_months ? `${selectedItem.duration_months}개월` : "-"],
                  ["금액", formatAmount(selectedItem.amount_krw || selectedItem.amount || 0)],
                  ["희망 관 1순위", hallLabel(selectedItem.preferred_hall_1)],
                  ["희망 관 2순위", hallLabel(selectedItem.preferred_hall_2)],
                  ["희망 카테고리", categoryLabel(selectedItem.preferred_category)],
                  ["배정 관", hallLabel(selectedItem.assigned_hall)],
                  ["배정 슬롯", selectedItem.assigned_slot_code || "-"],
                  ["배정 부스 ID", selectedItem.assigned_booth_id || "-"],
                ]}
              />

              <div className="rounded-3xl border p-5">
                <h3 className="mb-4 text-xl font-black">운영 액션</h3>

                <div className="grid gap-2 md:grid-cols-4">
                  <ActionButton label="검토 시작" onClick={() => runAction("start_review", {}, "검토 시작 처리되었습니다.")} disabled={acting} />
                  <ActionButton label="입금 확인" onClick={() => runAction("confirm_payment", {}, "입금 확인 처리되었습니다.")} disabled={acting} variant="secondary" />
                  <ActionButton label="승인 + 브랜드관 생성" onClick={() => setApproveTarget(selectedItem)} disabled={acting || !canApproveSelected} />
                  <ActionButton label="반려" onClick={() => setRejectModal(true)} disabled={acting} variant="danger" />
                  <ActionButton label="부스 생성" onClick={() => setBoothModal(true)} disabled={acting || selectedItem.application_status !== "approved"} variant="secondary" />
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
                  <ActionButton label="신제품 승격" onClick={() => runAction("promote_new_product", {}, "이달의 신제품으로 승격되었습니다.")} disabled={acting || !canPromoteNewProduct} />
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

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label>
                    <div className="mb-2 text-sm font-black">배정 관</div>
                    <select
                      value={assignedHall}
                      onChange={(e) => setAssignedHall(e.target.value)}
                      className="h-12 w-full rounded-2xl border px-4 font-bold"
                    >
                      <option value="">선택</option>
                      {Object.entries(HALL_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
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

                <label className="mt-4 block">
                  <div className="mb-2 text-sm font-black">반려 사유</div>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border px-4 py-3 font-bold"
                    placeholder="예: 제출 자료 보완이 필요합니다."
                  />
                </label>
              </div>

              <InfoGrid
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

            <div className="space-y-4">
              <div className="rounded-3xl border p-5">
                <h3 className="mb-3 text-xl font-black">사업자등록증</h3>
                <div className="mb-3 text-sm font-bold text-neutral-500">
                  파일명: {selectedItem.source_file_name || "-"}
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
                      {selectedItem.source_file_mime === "application/pdf" ? (
                        <iframe src={licenseUrl} title="사업자등록증 PDF" className="h-[640px] w-full" />
                      ) : (
                        <img src={licenseUrl} alt="사업자등록증" className="h-auto w-full" />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-neutral-50 p-4 font-bold text-neutral-500">
                    등록된 사업자등록증이 없습니다.
                  </div>
                )}
              </div>

              <div className="rounded-3xl border p-5">
                <h3 className="mb-3 text-xl font-black">회사 소개</h3>
                <div className="whitespace-pre-wrap text-sm font-bold leading-7 text-neutral-700">
                  {selectedItem.company_intro || selectedItem.intro || "소개 정보가 없습니다."}
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <ConfirmModal
        open={!!approveTarget}
        title="승인하고 브랜드관을 자동 생성하시겠습니까?"
        description={`승인 후 업체 상태가 승인으로 바뀌고, expo_brands에 브랜드관이 자동 생성됩니다.\n\n업체명: ${
          approveTarget?.company_name || "-"
        }`}
        confirmText="승인 + 브랜드관 생성"
        onCancel={() => setApproveTarget(null)}
        onConfirm={() => approveAndCreateBrand(approveTarget)}
      />

      <ConfirmModal
        open={rejectModal}
        title="반려 처리하시겠습니까?"
        description={`반려 사유:\n${rejectionReason || "(입력 없음)"}`}
        confirmText="반려"
        danger
        onCancel={() => setRejectModal(false)}
        onConfirm={() => {
          setRejectModal(false);
          runAction("reject", { rejection_reason: rejectionReason }, "반려 처리되었습니다.");
        }}
      />

      <ConfirmModal
        open={boothModal}
        title="부스를 생성하시겠습니까?"
        description={`배정 관: ${hallLabel(
          assignedHall || selectedItem?.assigned_hall || selectedItem?.preferred_hall_1
        )}\n배정 슬롯: ${assignedSlotCode || selectedItem?.assigned_slot_code || "-"}`}
        confirmText="부스 생성"
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
              assigned_slot_code: assignedSlotCode || selectedItem?.assigned_slot_code || null,
            },
            "부스가 생성되었습니다."
          );
        }}
      />
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap border-b px-3 py-3 text-left text-xs font-black text-neutral-700">{children}</th>;
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <td className={`whitespace-nowrap border-b px-3 py-3 align-middle ${strong ? "font-black text-neutral-950" : "font-bold text-neutral-700"}`}>
      {children}
    </td>
  );
}

function StatusPill({ value }: { value?: string | null }) {
  return (
    <span className={`inline-flex min-w-16 justify-center rounded-full px-2 py-1 text-xs font-black ${badgeClass(value)}`}>
      {statusLabel(value)}
    </span>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`h-10 rounded-2xl px-4 text-sm font-black ${active ? "bg-green-700 text-white" : "border bg-white text-neutral-900"}`}>
      {label}
    </button>
  );
}

function Stat({ title, value, tone = "neutral" }: { title: string; value: number | string; tone?: "neutral" | "red" | "amber" | "green" | "blue" }) {
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
      <div className="mt-1 text-lg font-black">{value}</div>
    </div>
  );
}

function InfoGrid({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-3xl border p-5">
      <h3 className="mb-4 text-xl font-black">{title}</h3>
      <div className="grid gap-2 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-neutral-50 p-3">
            <div className="text-xs font-black text-neutral-500">{label}</div>
            <div className="mt-1 break-words text-sm font-black text-neutral-900">{value}</div>
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
  const cls =
    variant === "primary"
      ? "bg-green-700 text-white"
      : variant === "danger"
      ? "bg-red-600 text-white"
      : "border bg-white text-neutral-900";

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`rounded-2xl px-4 py-3 text-sm font-black disabled:cursor-not-allowed disabled:opacity-40 ${cls}`}>
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
        <div className="text-xl font-black">{title}</div>

        {description ? (
          <div className="mt-3 whitespace-pre-line text-sm font-bold leading-6 text-neutral-600">
            {description}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-xl border px-4 py-2 text-sm font-black">
            {cancelText}
          </button>

          <button type="button" onClick={onConfirm} className={`rounded-xl px-4 py-2 text-sm font-black text-white ${danger ? "bg-red-600" : "bg-green-700"}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}