"use client";

import { useEffect, useMemo, useState } from "react";

type VendorApplication = {
  application_id: string;
  application_code: string;
  company_name: string;
  representative_name: string;
  email: string;
  phone: string;
  tax_email: string;
  business_number: string;
  open_date: string;
  business_address: string;
  biz_type: string;
  biz_item: string;
  booth_type: string;
  duration_key: string;
  duration_months: number;
  amount_krw: number;
  product_code: string;
  category_primary: string;
  company_intro: string;
  website_url: string;
  youtube_url: string;
  brochure_url: string;
  source_file_name: string;
  source_file_mime: string;
  business_license_bucket: string | null;
  business_license_path: string | null;
  status: string;
  admin_note?: string | null;
  rejection_reason?: string | null;
  payment_confirmed?: boolean | null;
  payment_confirmed_at?: string | null;
  payment_confirmed_by_email?: string | null;
  approved_at?: string | null;
  approved_by_email?: string | null;
  rejected_at?: string | null;
  rejected_by_email?: string | null;
  provision_status?: string | null;
  provision_result?: string | null;
  provisioned_vendor_id?: string | null;
  provisioned_booth_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR");
}

function formatKrw(value?: number | null) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function getStatusBadgeClass(status?: string | null) {
  if (status === "approved") return "bg-emerald-100 text-emerald-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

export default function VendorManagePage() {
  const [items, setItems] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [selected, setSelected] = useState<VendorApplication | null>(null);
  const [openingLicenseId, setOpeningLicenseId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (paymentFilter) params.set("payment", paymentFilter);
    if (searchText.trim()) params.set("q", searchText.trim());
    return params.toString();
  }, [statusFilter, paymentFilter, searchText]);

  async function loadItems() {
    setLoading(true);
    setMessage("");

    try {
      const url = queryString
        ? `/api/admin/vendor-applications?${queryString}`
        : "/api/admin/vendor-applications";

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "신청 목록을 불러오지 못했습니다.");
      }

      setItems(json.items || []);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "신청 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [queryString]);

  async function openBusinessLicense(applicationId: string) {
    try {
      setOpeningLicenseId(applicationId);

      const res = await fetch(
        `/api/admin/vendor-applications/${applicationId}/business-license`,
        { cache: "no-store" }
      );
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "사업자등록증 열람에 실패했습니다.");
      }

      window.open(json.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "사업자등록증 열람에 실패했습니다."
      );
    } finally {
      setOpeningLicenseId(null);
    }
  }

  async function runAction(
    applicationId: string,
    action: "confirm_payment" | "approve" | "reject"
  ) {
    try {
      let rejectionReason = "";
      let adminNote = "";

      if (action === "reject") {
        rejectionReason = window.prompt("반려 사유를 입력해주세요.", "") || "";
        if (!rejectionReason.trim()) {
          return;
        }
      }

      if (action === "confirm_payment") {
        adminNote = window.prompt("입금 확인 메모 (선택)", "") || "";
      }

      if (action === "approve") {
        adminNote = window.prompt("승인 메모 (선택)", "") || "";
      }

      setActionLoadingId(applicationId);

      const res = await fetch(
        `/api/admin/vendor-applications/${applicationId}/action`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            rejection_reason: rejectionReason,
            admin_note: adminNote,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "관리자 처리에 실패했습니다.");
      }

      await loadItems();

      if (selected?.application_id === applicationId) {
        const refreshed = json.item;
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                ...refreshed,
              }
            : prev
        );
      }

      if (action === "confirm_payment") {
        alert("입금 확인 처리되었습니다.");
      } else if (action === "approve") {
        alert("승인 처리되었습니다.");
      } else if (action === "reject") {
        alert("반려 처리되었습니다.");
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "관리자 처리에 실패했습니다."
      );
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">벤더 신청 관리</h1>
          <p className="mt-2 text-sm text-neutral-600">
            벤더 신청 내역을 조회하고 사업자등록증 열람, 입금 확인, 승인, 반려 처리를 할 수 있습니다.
          </p>
        </div>

        <button
          type="button"
          onClick={loadItems}
          className="rounded-2xl border border-neutral-300 px-4 py-2 text-sm font-medium"
        >
          새로고침
        </button>
      </div>

      <section className="mt-8 rounded-3xl border border-neutral-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <div className="mb-2 text-sm font-medium">상태</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            >
              <option value="">전체</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </select>
          </label>

          <label className="block">
            <div className="mb-2 text-sm font-medium">입금 상태</div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            >
              <option value="">전체</option>
              <option value="paid">paid</option>
              <option value="unpaid">unpaid</option>
            </select>
          </label>

          <label className="block md:col-span-2">
            <div className="mb-2 text-sm font-medium">검색</div>
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="신청번호 / 회사명 / 대표자 / 이메일 / 연락처 / 사업자번호 / 주소"
              className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
            />
          </label>
        </div>
      </section>

      {message && (
        <div className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-3xl border border-neutral-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">신청번호</th>
                <th className="px-4 py-3 text-left font-semibold">회사명</th>
                <th className="px-4 py-3 text-left font-semibold">대표자</th>
                <th className="px-4 py-3 text-left font-semibold">사업자번호</th>
                <th className="px-4 py-3 text-left font-semibold">연락처</th>
                <th className="px-4 py-3 text-left font-semibold">상태</th>
                <th className="px-4 py-3 text-left font-semibold">입금</th>
                <th className="px-4 py-3 text-left font-semibold">신청일</th>
                <th className="px-4 py-3 text-left font-semibold">관리</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-neutral-500"
                  >
                    불러오는 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-neutral-500"
                  >
                    신청 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.application_id}
                    className="border-t border-neutral-100 hover:bg-neutral-50"
                  >
                    <td className="px-4 py-3 font-medium">
                      {item.application_code || "-"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium">{item.company_name || "-"}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {item.email || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-3">{item.representative_name || "-"}</td>
                    <td className="px-4 py-3">{item.business_number || "-"}</td>
                    <td className="px-4 py-3">{item.phone || "-"}</td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {item.payment_confirmed ? "paid" : "unpaid"}
                    </td>

                    <td className="px-4 py-3">
                      {formatDateTime(item.created_at)}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="rounded-xl border border-neutral-300 px-3 py-2"
                        >
                          상세
                        </button>

                        {item.business_license_bucket && item.business_license_path ? (
                          <button
                            type="button"
                            onClick={() => openBusinessLicense(item.application_id)}
                            disabled={openingLicenseId === item.application_id}
                            className="rounded-xl bg-black px-3 py-2 text-white disabled:opacity-50"
                          >
                            {openingLicenseId === item.application_id
                              ? "여는 중..."
                              : "사업자등록증 보기"}
                          </button>
                        ) : (
                          <span className="self-center text-xs text-neutral-400">
                            등록증 없음
                          </span>
                        )}

                        {!item.payment_confirmed && item.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() =>
                              runAction(item.application_id, "confirm_payment")
                            }
                            disabled={actionLoadingId === item.application_id}
                            className="rounded-xl bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
                          >
                            {actionLoadingId === item.application_id
                              ? "처리 중..."
                              : "입금 확인"}
                          </button>
                        )}

                        {item.status !== "approved" && item.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => runAction(item.application_id, "approve")}
                            disabled={actionLoadingId === item.application_id}
                            className="rounded-xl bg-emerald-600 px-3 py-2 text-white disabled:opacity-50"
                          >
                            {actionLoadingId === item.application_id
                              ? "처리 중..."
                              : "승인"}
                          </button>
                        )}

                        {item.status !== "rejected" && (
                          <button
                            type="button"
                            onClick={() => runAction(item.application_id, "reject")}
                            disabled={actionLoadingId === item.application_id}
                            className="rounded-xl bg-red-600 px-3 py-2 text-white disabled:opacity-50"
                          >
                            {actionLoadingId === item.application_id
                              ? "처리 중..."
                              : "반려"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto mt-8 max-w-5xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">신청 상세</h2>
                <div className="mt-2 text-sm text-neutral-600">
                  {selected.application_code || "-"} / {selected.company_name} /{" "}
                  {selected.representative_name}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <DetailCard
                title="기본 정보"
                rows={[
                  ["신청번호", selected.application_code || "-"],
                  ["회사명", selected.company_name || "-"],
                  ["대표자명", selected.representative_name || "-"],
                  ["사업자등록번호", selected.business_number || "-"],
                  ["개업연월일", selected.open_date || "-"],
                  ["업태", selected.biz_type || "-"],
                  ["종목", selected.biz_item || "-"],
                  ["사업장 주소", selected.business_address || "-"],
                ]}
              />

              <DetailCard
                title="연락 / 제출 정보"
                rows={[
                  ["담당자 이메일", selected.email || "-"],
                  ["담당자 연락처", selected.phone || "-"],
                  ["세금계산서 이메일", selected.tax_email || "-"],
                  ["카테고리", selected.category_primary || "-"],
                  ["웹사이트", selected.website_url || "-"],
                  ["유튜브", selected.youtube_url || "-"],
                  ["브로슈어", selected.brochure_url || "-"],
                ]}
              />

              <DetailCard
                title="상품 / 상태"
                rows={[
                  ["부스 유형", selected.booth_type || "-"],
                  ["기간 키", selected.duration_key || "-"],
                  ["개월 수", String(selected.duration_months || 0)],
                  ["상품 코드", selected.product_code || "-"],
                  ["결제 금액", formatKrw(selected.amount_krw)],
                  ["상태", selected.status || "-"],
                  ["입금 확인", selected.payment_confirmed ? "paid" : "unpaid"],
                  ["입금 확인 일시", formatDateTime(selected.payment_confirmed_at)],
                  ["입금 확인자", selected.payment_confirmed_by_email || "-"],
                  ["승인 일시", formatDateTime(selected.approved_at)],
                  ["승인자", selected.approved_by_email || "-"],
                  ["반려 일시", formatDateTime(selected.rejected_at)],
                  ["반려자", selected.rejected_by_email || "-"],
                ]}
              />

              <DetailCard
                title="운영 / 시스템"
                rows={[
                  ["사업자등록증 파일명", selected.source_file_name || "-"],
                  ["사업자등록증 MIME", selected.source_file_mime || "-"],
                  ["Storage Bucket", selected.business_license_bucket || "-"],
                  ["Storage Path", selected.business_license_path || "-"],
                  ["Provision 상태", selected.provision_status || "-"],
                  ["Provision 결과", selected.provision_result || "-"],
                  ["반려 사유", selected.rejection_reason || "-"],
                  ["관리자 메모", selected.admin_note || "-"],
                  ["생성일", formatDateTime(selected.created_at)],
                  ["수정일", formatDateTime(selected.updated_at)],
                ]}
              />
            </div>

            {selected.company_intro && (
              <div className="mt-6 rounded-3xl border border-neutral-200 p-5">
                <div className="mb-2 text-lg font-semibold">회사 소개</div>
                <div className="whitespace-pre-wrap text-sm leading-7 text-neutral-700">
                  {selected.company_intro}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              {selected.business_license_bucket && selected.business_license_path && (
                <button
                  type="button"
                  onClick={() => openBusinessLicense(selected.application_id)}
                  disabled={openingLicenseId === selected.application_id}
                  className="rounded-2xl bg-black px-5 py-3 text-white disabled:opacity-50"
                >
                  {openingLicenseId === selected.application_id
                    ? "여는 중..."
                    : "사업자등록증 보기"}
                </button>
              )}

              {!selected.payment_confirmed && selected.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => runAction(selected.application_id, "confirm_payment")}
                  disabled={actionLoadingId === selected.application_id}
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-white disabled:opacity-50"
                >
                  {actionLoadingId === selected.application_id
                    ? "처리 중..."
                    : "입금 확인"}
                </button>
              )}

              {selected.status !== "approved" && selected.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => runAction(selected.application_id, "approve")}
                  disabled={actionLoadingId === selected.application_id}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-white disabled:opacity-50"
                >
                  {actionLoadingId === selected.application_id
                    ? "처리 중..."
                    : "승인"}
                </button>
              )}

              {selected.status !== "rejected" && (
                <button
                  type="button"
                  onClick={() => runAction(selected.application_id, "reject")}
                  disabled={actionLoadingId === selected.application_id}
                  className="rounded-2xl bg-red-600 px-5 py-3 text-white disabled:opacity-50"
                >
                  {actionLoadingId === selected.application_id
                    ? "처리 중..."
                    : "반려"}
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-2xl border border-neutral-300 px-5 py-3"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function DetailCard({
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
        {rows.map(([k, v]) => (
          <div
            key={`${title}-${k}-${v}`}
            className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-3 text-sm"
          >
            <div className="text-neutral-500">{k}</div>
            <div className="max-w-[70%] break-words text-right font-medium">
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}