"use client";

import { useEffect, useMemo, useState } from "react";

type ApplicationRow = {
  application_id: string;
  company_name: string;
  representative_name: string;
  email: string;
  phone: string;
  tax_email: string;
  business_number: string;
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
  status: string;
  admin_note: string | null;
  rejection_reason: string | null;
  payment_confirmed: boolean;
  payment_confirmed_at: string | null;
  payment_confirmed_by_email: string | null;
  approved_at: string | null;
  approved_by_email: string | null;
  rejected_at: string | null;
  rejected_by_email: string | null;
  provision_status: string | null;
  provision_result: unknown;
  provisioned_vendor_id: string | null;
  provisioned_booth_id: string | null;
  created_at: string;
  updated_at: string;
};

type ListResponse = {
  success: boolean;
  items?: ApplicationRow[];
  error?: string;
};

function formatKrw(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

function getBoothLabel(v: string) {
  if (v === "free") return "무료 체험";
  if (v === "basic") return "일반 부스";
  if (v === "premium") return "프리미엄 부스";
  return v || "-";
}

function getDurationLabel(v: string) {
  if (v === "1m") return "1개월";
  if (v === "3m") return "3개월";
  return v || "-";
}

function getStatusMeta(status: string) {
  if (status === "approved") {
    return { label: "승인 완료", className: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  }
  if (status === "rejected") {
    return { label: "반려", className: "bg-red-100 text-red-800 border-red-200" };
  }
  return { label: "검토 중", className: "bg-amber-100 text-amber-800 border-amber-200" };
}

export default function AdminVendorApplicationsPage() {
  const [items, setItems] = useState<ApplicationRow[]>([]);
  const [selected, setSelected] = useState<ApplicationRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  async function fetchList() {
    setLoading(true);
    setErrorMessage("");

    try {
      const qs = new URLSearchParams();
      if (statusFilter !== "all") qs.set("status", statusFilter);
      if (paymentFilter !== "all") qs.set("payment", paymentFilter);
      if (search.trim()) qs.set("q", search.trim());

      const res = await fetch(`/api/admin/vendor-applications?${qs.toString()}`, {
        cache: "no-store",
      });
      const json: ListResponse = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "목록 조회에 실패했습니다.");
      }

      const next = json.items || [];
      setItems(next);

      if (selected) {
        const found = next.find((v) => v.application_id === selected.application_id) || null;
        setSelected(found);
        setAdminNote(found?.admin_note || "");
        setRejectionReason(found?.rejection_reason || "");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, paymentFilter]);

  async function runAction(action: string) {
    if (!selected) return;

    setActionLoading(action);

    try {
      const res = await fetch(`/api/admin/vendor-applications/${selected.application_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          admin_note: adminNote,
          rejection_reason: rejectionReason,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "처리에 실패했습니다.");
      }

      await fetchList();
      alert("처리되었습니다.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "처리 중 오류");
    } finally {
      setActionLoading(null);
    }
  }

  const countText = useMemo(() => `조회 ${items.length}건`, [items.length]);

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl bg-slate-950 p-8 text-white shadow-2xl">
          <div className="text-sm font-black text-slate-300">ADMIN</div>
          <h1 className="mt-3 text-4xl font-black">벤더 입점 운영 시스템</h1>
          <p className="mt-4 text-base leading-8 text-slate-200">
            신청 검토, 입금 확인, 승인/반려, 운영 메모를 여기서 처리합니다.
          </p>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {["all", "pending", "approved", "rejected"].map((v) => (
                <button
                  key={v}
                  onClick={() => setStatusFilter(v)}
                  className={`rounded-2xl px-4 py-2 text-sm font-black ${
                    statusFilter === v ? "bg-slate-950 text-white" : "border border-slate-300 bg-white"
                  }`}
                >
                  {v === "all" ? "전체" : v === "pending" ? "검토중" : v === "approved" ? "승인" : "반려"}
                </button>
              ))}

              {["all", "paid", "unpaid"].map((v) => (
                <button
                  key={v}
                  onClick={() => setPaymentFilter(v)}
                  className={`rounded-2xl px-4 py-2 text-sm font-black ${
                    paymentFilter === v ? "bg-emerald-700 text-white" : "border border-slate-300 bg-white"
                  }`}
                >
                  {v === "all" ? "전체결제" : v === "paid" ? "입금확인" : "미입금"}
                </button>
              ))}
            </div>

            <div className="flex w-full max-w-xl gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="회사명 / 대표자명 / 연락처 / 사업자번호 검색"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950"
              />
              <button
                onClick={fetchList}
                className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
              >
                검색
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between text-sm">
            <div className="font-bold text-slate-700">{countText}</div>
            <button
              onClick={fetchList}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold"
            >
              새로고침
            </button>
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4 text-lg font-black">신청 목록</div>
              <div className="max-h-[760px] overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-sm text-slate-500">불러오는 중...</div>
                ) : items.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">신청이 없습니다.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const meta = getStatusMeta(item.status);
                      const active = selected?.application_id === item.application_id;
                      return (
                        <button
                          key={item.application_id}
                          onClick={() => {
                            setSelected(item);
                            setAdminNote(item.admin_note || "");
                            setRejectionReason(item.rejection_reason || "");
                          }}
                          className={`block w-full px-5 py-4 text-left ${active ? "bg-slate-50" : "hover:bg-slate-50"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-lg font-black">{item.company_name || "-"}</div>
                              <div className="mt-1 text-sm text-slate-500">
                                {item.representative_name || "-"} · {item.phone || "-"}
                              </div>
                              <div className="mt-2 text-sm text-slate-700">
                                {getBoothLabel(item.booth_type)} · {getDurationLabel(item.duration_key)} · {formatKrw(item.amount_krw || 0)}
                              </div>
                              <div className="mt-1 text-xs text-slate-400">
                                신청일 {formatDate(item.created_at)}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <div className={`rounded-full border px-3 py-1 text-xs font-black ${meta.className}`}>
                                {meta.label}
                              </div>
                              <div className={`rounded-full px-3 py-1 text-xs font-black ${item.payment_confirmed ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                {item.amount_krw > 0 ? (item.payment_confirmed ? "입금확인" : "미입금") : "무료"}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-5 py-4 text-lg font-black">상세 / 운영 처리</div>
              {!selected ? (
                <div className="p-6 text-sm text-slate-500">왼쪽 신청을 선택해 주세요.</div>
              ) : (
                <div className="space-y-5 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xl font-black">{selected.company_name || "-"}</div>
                      <div className="mt-1 text-sm text-slate-500">신청번호 {selected.application_id}</div>
                    </div>
                    <div className={`rounded-full border px-3 py-1 text-xs font-black ${getStatusMeta(selected.status).className}`}>
                      {getStatusMeta(selected.status).label}
                    </div>
                  </div>

                  <DetailTable rows={[
                    ["대표자명", selected.representative_name || "-"],
                    ["연락처", selected.phone || "-"],
                    ["이메일", selected.email || "-"],
                    ["세금계산서 이메일", selected.tax_email || "-"],
                    ["사업자번호", selected.business_number || "-"],
                    ["부스", getBoothLabel(selected.booth_type)],
                    ["기간", getDurationLabel(selected.duration_key)],
                    ["금액", formatKrw(selected.amount_krw || 0)],
                    ["상품코드", selected.product_code || "-"],
                    ["카테고리", selected.category_primary || "-"],
                    ["신청일", formatDate(selected.created_at)],
                    ["최종변경", formatDate(selected.updated_at)],
                    ["입금확인", selected.amount_krw > 0 ? (selected.payment_confirmed ? "예" : "아니오") : "무료"],
                    ["입금확인시각", formatDate(selected.payment_confirmed_at)],
                    ["입금확인자", selected.payment_confirmed_by_email || "-"],
                    ["승인시각", formatDate(selected.approved_at)],
                    ["승인자", selected.approved_by_email || "-"],
                    ["반려시각", formatDate(selected.rejected_at)],
                    ["반려자", selected.rejected_by_email || "-"],
                    ["프로비저닝", selected.provision_status || "-"],
                  ]} />

                  <LongField title="회사 소개" value={selected.company_intro || "-"} />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="운영 메모"
                      className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950"
                    />
                    <button
                      onClick={() => runAction("save_note")}
                      disabled={actionLoading !== null}
                      className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black"
                    >
                      메모 저장
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      onClick={() => runAction(selected.payment_confirmed ? "unconfirm_payment" : "confirm_payment")}
                      disabled={actionLoading !== null || selected.amount_krw === 0}
                      className="rounded-2xl bg-blue-600 px-5 py-3 font-black text-white disabled:opacity-50"
                    >
                      {selected.amount_krw === 0 ? "무료 신청" : selected.payment_confirmed ? "입금확인 취소" : "입금확인 처리"}
                    </button>

                    <button
                      onClick={() => runAction("approve")}
                      disabled={actionLoading !== null}
                      className="rounded-2xl bg-emerald-600 px-5 py-3 font-black text-white disabled:opacity-50"
                    >
                      승인 처리
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <input
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="반려 사유"
                      className="rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950"
                    />
                    <button
                      onClick={() => runAction("reject")}
                      disabled={actionLoading !== null}
                      className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white disabled:opacity-50"
                    >
                      반려 처리
                    </button>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                    <div><b>유료 신청 승인 규칙:</b> 입금확인 전에는 승인 불가</div>
                    <div><b>무료 신청 승인 규칙:</b> 바로 승인 가능</div>
                    <div><b>프로비저닝:</b> 현재는 승인 이후 결과 기록만 남기고 후속 연결 단계로 분리</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DetailTable({ rows }: { rows: [string, string][] }) {
  return (
    <div className="rounded-2xl border border-slate-200">
      {rows.map(([k, v], idx) => (
        <div
          key={`${k}-${idx}`}
          className={`grid grid-cols-[130px_1fr] gap-4 px-4 py-3 text-sm ${idx !== rows.length - 1 ? "border-b border-slate-100" : ""}`}
        >
          <div className="font-bold text-slate-500">{k}</div>
          <div className="break-words font-medium text-slate-900">{v}</div>
        </div>
      ))}
    </div>
  );
}

function LongField({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="mb-2 text-sm font-bold text-slate-500">{title}</div>
      <div className="whitespace-pre-wrap text-sm leading-7 text-slate-800">{value}</div>
    </div>
  );
}