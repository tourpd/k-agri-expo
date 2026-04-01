"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

type OrderStatusItem = {
  application_id: string;
  application_code: string | null;
  company_name: string | null;
  representative_name: string | null;
  phone: string | null;
  email: string | null;
  booth_type: string | null;
  duration_key: string | null;
  amount_krw: number | null;
  status: string | null;
  payment_confirmed: boolean | null;
  payment_confirmed_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  provision_status: string | null;
  provision_result: string | null;
  provisioned_booth_id: string | null;
  created_at: string | null;
};

const OPERATIONS = {
  phone: "010-8216-1253",
  email: "tourpd70@gmail.com",
};

function formatKrw(value?: number | null) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("ko-KR");
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

function getDurationLabel(durationKey?: string | null) {
  switch (durationKey) {
    case "1m":
      return "1개월";
    case "3m":
      return "3개월";
    default:
      return "-";
  }
}

function getProductLabel(boothType?: string | null, durationKey?: string | null) {
  const booth = getBoothLabel(boothType);
  const duration = getDurationLabel(durationKey);
  if (booth === "-" || duration === "-") return "-";
  return `${booth} · ${duration}`;
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "pending":
      return "운영 검토 중";
    case "approved":
      return "승인 완료";
    case "rejected":
      return "반려";
    default:
      return status || "-";
  }
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "approved":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "rejected":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-amber-100 text-amber-800 border-amber-200";
  }
}

function getPaymentLabel(paymentConfirmed?: boolean | null, amountKrw?: number | null) {
  if (Number(amountKrw || 0) === 0) return "결제 없음";
  return paymentConfirmed ? "입금 확인 완료" : "입금 대기";
}

function getPaymentClass(paymentConfirmed?: boolean | null, amountKrw?: number | null) {
  if (Number(amountKrw || 0) === 0) {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }
  return paymentConfirmed
    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
    : "bg-amber-100 text-amber-800 border-amber-200";
}

function getProvisionLabel(
  provisionStatus?: string | null,
  status?: string | null
) {
  if (status === "rejected") return "진행 중단";

  switch (provisionStatus) {
    case "completed":
      return "부스 생성 완료";
    case "processing":
      return "부스 생성 중";
    case "failed":
      return "부스 생성 실패";
    case "ready":
      return "생성 대기";
    case "not_started":
      return "검토 대기";
    default:
      return provisionStatus || "-";
  }
}

function VendorOrderStatusInner() {
  const params = useSearchParams();

  const initialApplicationCode = params.get("application_code") || "";
  const initialApplicationId = params.get("application_id") || "";
  const initialPhone = params.get("phone") || "";

  const [applicationCode, setApplicationCode] = useState(initialApplicationCode);
  const [applicationId, setApplicationId] = useState(initialApplicationId);
  const [phone, setPhone] = useState(initialPhone);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<OrderStatusItem | null>(null);

  async function handleSearch() {
    setLoading(true);
    setMessage("");
    setResult(null);

    try {
      const query = new URLSearchParams();

      if (applicationCode.trim()) {
        query.set("application_code", applicationCode.trim());
      } else if (applicationId.trim()) {
        query.set("application_id", applicationId.trim());
      }

      if (phone.trim()) {
        query.set("phone", phone.trim());
      }

      const qs = query.toString();
      const res = await fetch(
        qs ? `/api/vendor/order-status?${qs}` : "/api/vendor/order-status",
        { cache: "no-store" }
      );
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "신청 상태 조회에 실패했습니다.");
      }

      setResult(json.item || null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "신청 상태 조회에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  const isFree = Number(result?.amount_krw || 0) === 0;
  const canGoToBooth =
    result?.status === "approved" &&
    result?.provision_status === "completed" &&
    !!result?.provisioned_booth_id;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-8">
        <section className="rounded-3xl bg-slate-900 p-8 text-white shadow-2xl">
          <div className="text-sm font-black text-slate-300">APPLICATION STATUS</div>
          <h1 className="mt-3 text-4xl font-black">신청 상태 확인</h1>
          <p className="mt-4 text-base leading-8 text-slate-200">
            신청번호와 연락처를 입력하면 현재 진행 상태를 확인할 수 있습니다.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">SEARCH</div>
          <h2 className="mt-2 text-2xl font-black">조회 정보 입력</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="block">
              <div className="mb-2 text-sm font-bold text-slate-700">신청번호</div>
              <input
                value={applicationCode}
                onChange={(e) => setApplicationCode(e.target.value)}
                placeholder="예: V260330-0001"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              />
              <div className="mt-2 text-xs text-slate-500">
                짧은 신청번호가 없으면 아래 연락처와 함께 내부 신청번호로도 조회 가능합니다.
              </div>
            </label>

            <label className="block">
              <div className="mb-2 text-sm font-bold text-slate-700">연락처</div>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="예: 010-8216-1253"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              />
            </label>
          </div>

          {!applicationCode && (
            <div className="mt-4">
              <label className="block">
                <div className="mb-2 text-sm font-bold text-slate-700">
                  내부 신청번호(선택)
                </div>
                <input
                  value={applicationId}
                  onChange={(e) => setApplicationId(e.target.value)}
                  placeholder="application_id가 있는 경우만 입력"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
                />
              </label>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "조회 중..." : "상태 조회"}
            </button>

            <Link
              href="/vendor/apply"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900 hover:bg-slate-50"
            >
              새로 신청하기
            </Link>
          </div>

          {message && (
            <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
              {message}
            </div>
          )}
        </section>

        {result && (
          <>
            <section className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="text-sm font-black text-emerald-700">STATUS RESULT</div>
              <h2 className="mt-2 text-2xl font-black">현재 신청 상태</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-500">신청번호</div>
                  <div className="mt-1 break-all text-xl font-black">
                    {result.application_code || result.application_id || "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-500">회사명</div>
                  <div className="mt-1 text-xl font-black">
                    {result.company_name || "-"}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-500">신청 상품</div>
                  <div className="mt-1 text-xl font-black">
                    {getProductLabel(result.booth_type, result.duration_key)}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-500">신청 금액</div>
                  <div className="mt-1 text-2xl font-black text-emerald-700">
                    {formatKrw(result.amount_krw)}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-sm font-bold text-slate-500">신청 상태</div>
                  <div className="mt-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-2 text-sm font-black ${getStatusClass(
                        result.status
                      )}`}
                    >
                      {getStatusLabel(result.status)}
                    </span>
                  </div>
                  <div className="mt-4 text-sm leading-7 text-slate-600">
                    {result.status === "approved"
                      ? "신청이 승인되었고, 부스 생성 절차가 진행되었거나 완료되었습니다."
                      : result.status === "rejected"
                      ? "신청이 반려되었습니다. 반려 사유를 확인해 주세요."
                      : "현재 운영팀이 신청 내용을 검토 중입니다."}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-sm font-bold text-slate-500">입금 상태</div>
                  <div className="mt-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-2 text-sm font-black ${getPaymentClass(
                        result.payment_confirmed,
                        result.amount_krw
                      )}`}
                    >
                      {getPaymentLabel(result.payment_confirmed, result.amount_krw)}
                    </span>
                  </div>
                  <div className="mt-4 text-sm leading-7 text-slate-600">
                    {isFree
                      ? "무료 체험은 별도 입금 절차 없이 운영 검토 후 진행됩니다."
                      : "유료 부스는 입금 확인 후 승인 절차가 진행됩니다."}
                  </div>
                </div>
              </div>

              {canGoToBooth && (
                <div className="mt-5">
                  <Link
                    href={`/expo/booths/${result.provisioned_booth_id}`}
                    className="inline-flex rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white hover:bg-emerald-700"
                  >
                    내 부스로 이동
                  </Link>
                </div>
              )}
            </section>

            <section className="rounded-3xl bg-white p-6 shadow-lg">
              <div className="text-sm font-black text-emerald-700">DETAIL</div>
              <h2 className="mt-2 text-2xl font-black">상세 진행 정보</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <DetailCard
                  title="기본 정보"
                  rows={[
                    ["회사명", result.company_name || "-"],
                    ["대표자명", result.representative_name || "-"],
                    ["담당자 이메일", result.email || "-"],
                    ["담당자 연락처", result.phone || "-"],
                    ["신청일", formatDateTime(result.created_at)],
                  ]}
                />

                <DetailCard
                  title="진행 정보"
                  rows={[
                    ["입금 확인 일시", formatDateTime(result.payment_confirmed_at)],
                    ["승인 일시", formatDateTime(result.approved_at)],
                    ["반려 일시", formatDateTime(result.rejected_at)],
                    ["부스 진행 상태", getProvisionLabel(result.provision_status, result.status)],
                    ["진행 결과", result.provision_result || "-"],
                  ]}
                />
              </div>

              {result.status === "rejected" && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
                  <div className="text-sm font-black text-red-700">REJECTION</div>
                  <div className="mt-2 text-lg font-black text-red-900">반려 사유</div>
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-red-800">
                    {result.rejection_reason || "반려 사유가 등록되지 않았습니다."}
                  </div>
                </div>
              )}
            </section>

            <section
              className={`rounded-3xl p-6 shadow-lg ${
                isFree
                  ? "border border-emerald-200 bg-emerald-50"
                  : "border border-amber-200 bg-amber-50"
              }`}
            >
              <div
                className={`text-sm font-black ${
                  isFree ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                GUIDE
              </div>
              <h2 className="mt-2 text-2xl font-black">
                {isFree ? "무료 체험 진행 안내" : "유료 신청 진행 안내"}
              </h2>

              <div className="mt-5 rounded-2xl bg-white p-5 text-sm leading-8 text-slate-700">
                {isFree ? (
                  <>
                    <div>
                      <b>1.</b> 운영팀이 신청 내용을 확인합니다.
                    </div>
                    <div>
                      <b>2.</b> 검토 후 벤더 부스 진행 절차가 시작됩니다.
                    </div>
                    <div>
                      <b>3.</b> 추가 확인이 필요하면 등록하신 연락처로 안내드립니다.
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <b>1.</b> 입금 확인이 완료되면 승인 절차가 진행됩니다.
                    </div>
                    <div>
                      <b>2.</b> 승인 후 벤더 부스 생성 또는 연결이 진행됩니다.
                    </div>
                    <div>
                      <b>3.</b> 반영이 늦으면 아래 문의처로 연락해 주세요.
                    </div>
                  </>
                )}
              </div>
            </section>
          </>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">SUPPORT</div>
          <h2 className="mt-2 text-2xl font-black">문의 안내</h2>

          <div className="mt-4 space-y-2 text-base leading-8 text-slate-700">
            <div>
              <b>문의 전화:</b> {OPERATIONS.phone}
            </div>
            <div>
              <b>문의 이메일:</b> {OPERATIONS.email}
            </div>
            <div>
              신청 상태 반영이 늦거나 수정이 필요하면 위 연락처로 문의해 주세요.
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {canGoToBooth && (
              <Link
                href={`/expo/booths/${result?.provisioned_booth_id}`}
                className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white hover:bg-emerald-700"
              >
                내 부스로 이동
              </Link>
            )}

            <button
              type="button"
              onClick={handleSearch}
              disabled={loading}
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            >
              다시 조회
            </button>

            <Link
              href="/vendor/apply"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900 hover:bg-slate-50"
            >
              새로 신청하기
            </Link>

            <Link
              href="/expo"
              className="rounded-2xl px-5 py-3 font-medium text-slate-500 hover:text-slate-800"
            >
              엑스포 메인으로 →
            </Link>
          </div>
        </section>
      </div>
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

export default function VendorOrderStatusPage() {
  return (
    <Suspense fallback={<div className="p-10">불러오는 중...</div>}>
      <VendorOrderStatusInner />
    </Suspense>
  );
}