"use client";

import { useEffect, useMemo, useState } from "react";
import NegotiationPanel from "@/components/admin/NegotiationPanel";

type LeadStage =
  | "new"
  | "screening"
  | "qualified"
  | "sent"
  | "negotiating"
  | "won"
  | "lost";

type LeadItem = {
  id: string;
  booth_id?: string | null;
  vendor_id?: string | null;
  deal_id?: string | null;
  buyer_user_id?: string | null;

  company_name?: string | null;
  contact_name?: string | null;
  phone?: string | null;
  email?: string | null;

  message?: string | null;
  translated_message?: string | null;

  source_type?: string | null;
  trade_type?: string | null;
  inquiry_language?: string | null;
  country?: string | null;
  quantity?: string | null;
  is_foreign?: boolean | null;

  lead_score?: number | null;
  priority_rank?: number | null;

  lead_stage?: LeadStage | string | null;
  status?: string | null;
  quote_status?: string | null;

  admin_memo?: string | null;
  first_contacted_at?: string | null;
  last_contacted_at?: string | null;
  closed_at?: string | null;
  vendor_notified_at?: string | null;
  vendor_notification_status?: string | null;
  vendor_notification_error?: string | null;

  created_at?: string | null;
  booth_name?: string | null;
  vendor_name?: string | null;

  latest_quote_id?: string | null;
  latest_quote_status?: string | null;
  latest_quote_pdf_url?: string | null;
  quote_pdf_url?: string | null;

  deal_amount_krw?: number | null;
  commission_rate?: number | null;
  commission_amount_krw?: number | null;
  net_revenue_krw?: number | null;
  contract_status?: string | null;
  contract_memo?: string | null;
  contracted_at?: string | null;
  paid_at?: string | null;

  negotiation_status?: string | null;
  next_action_at?: string | null;
  assigned_vendor_name?: string | null;
  assigned_booth_name?: string | null;
  vendor_last_called_at?: string | null;
  buyer_last_called_at?: string | null;
  buyer_level?: string | null;
  buyer_verification_status?: string | null;

  hot_lead?: boolean | null;
  quantity_detected?: boolean | null;
  price_detected?: boolean | null;
  detection_summary?: string | null;
  admin_alert_sent_at?: string | null;
};

type LeadListResponse = {
  ok: boolean;
  items: LeadItem[];
  error?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatWon(value?: number | null) {
  return `${Number(value || 0).toLocaleString()}원`;
}

function stageLabel(value?: string | null) {
  switch (value) {
    case "new":
      return "신규";
    case "screening":
      return "검토중";
    case "qualified":
      return "유효리드";
    case "sent":
      return "벤더전달";
    case "negotiating":
      return "협상중";
    case "won":
      return "성사";
    case "lost":
      return "실패";
    default:
      return value || "-";
  }
}

function stageClass(value?: string | null) {
  switch (value) {
    case "new":
      return "bg-amber-100 text-amber-800";
    case "screening":
      return "bg-sky-100 text-sky-800";
    case "qualified":
      return "bg-violet-100 text-violet-800";
    case "sent":
      return "bg-blue-100 text-blue-800";
    case "negotiating":
      return "bg-fuchsia-100 text-fuchsia-800";
    case "won":
      return "bg-emerald-100 text-emerald-800";
    case "lost":
      return "bg-red-100 text-red-800";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

function quoteStatusLabel(value?: string | null) {
  switch (value) {
    case "not_started":
      return "미작성";
    case "drafting":
      return "작성중";
    case "sent":
      return "발송완료";
    case "won":
      return "견적성사";
    case "lost":
      return "견적실패";
    case "draft":
      return "초안";
    default:
      return value || "-";
  }
}

function contractStatusLabel(value?: string | null) {
  switch (value) {
    case "none":
      return "미등록";
    case "verbal":
      return "구두합의";
    case "contract_sent":
      return "계약서발송";
    case "contracted":
      return "계약완료";
    case "paid":
      return "입금완료";
    case "closed":
      return "종결";
    default:
      return value || "-";
  }
}

function vendorNotificationLabel(value?: string | null) {
  switch (value) {
    case "pending":
      return "대기";
    case "sent":
      return "발송완료";
    case "failed":
      return "발송실패";
    default:
      return value || "-";
  }
}

function vendorNotificationClass(value?: string | null) {
  switch (value) {
    case "sent":
      return "bg-emerald-100 text-emerald-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

function negotiationStatusLabel(value?: string | null) {
  switch (value) {
    case "new":
      return "신규";
    case "vendor_assigned":
      return "업체배정";
    case "vendor_contacted":
      return "업체접촉";
    case "buyer_contacted":
      return "바이어접촉";
    case "pricing_review":
      return "가격검토";
    case "terms_aligned":
      return "조건조율";
    case "quote_ready":
      return "견적준비";
    case "closed":
      return "종결";
    default:
      return value || "-";
  }
}

function sourceLabel(value?: string | null) {
  switch (value) {
    case "booth_inquiry":
      return "부스문의";
    case "expo_deal":
      return "엑스포특가";
    case "global_inquiry":
      return "해외문의";
    case "buyer_demand":
      return "바이어수요";
    case "expo":
      return "일반엑스포";
    default:
      return value || "-";
  }
}

export default function AdminLeadsPage() {
  const [items, setItems] = useState<LeadItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);
  const [notifyingVendor, setNotifyingVendor] = useState(false);

  const [notice, setNotice] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [foreignFilter, setForeignFilter] = useState("");

  const [adminMemo, setAdminMemo] = useState("");
  const [dealAmount, setDealAmount] = useState("");
  const [commissionMode, setCommissionMode] = useState("matched");
  const [contractMemo, setContractMemo] = useState("");

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId]
  );

  const stats = useMemo(() => {
    const total = items.length;
    const hot = items.filter((x) => x.hot_lead).length;
    const foreign = items.filter((x) => x.is_foreign).length;
    const won = items.filter((x) => x.lead_stage === "won").length;
    const negotiating = items.filter((x) => x.lead_stage === "negotiating").length;
    const sent = items.filter((x) => x.lead_stage === "sent").length;

    return { total, hot, foreign, won, negotiating, sent };
  }, [items]);

  async function fetchLeads() {
    setLoading(true);
    setNotice("");
    setErrorNotice("");

    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (sourceFilter) params.set("source_type", sourceFilter);
      if (stageFilter) params.set("lead_stage", stageFilter);
      if (foreignFilter) params.set("is_foreign", foreignFilter);

      const res = await fetch(`/api/admin/leads?${params.toString()}`, {
        cache: "no-store",
      });

      const json: LeadListResponse = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "리드 목록 조회에 실패했습니다.");
      }

      const sorted = [...(json.items || [])].sort((a, b) => {
        const aHot = a.hot_lead ? 1 : 0;
        const bHot = b.hot_lead ? 1 : 0;
        if (bHot !== aHot) return bHot - aHot;

        const aRank = Number(a.priority_rank || 0);
        const bRank = Number(b.priority_rank || 0);
        if (bRank !== aRank) return bRank - aRank;

        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
      });

      setItems(sorted);

      if (!selectedId && sorted.length > 0) {
        setSelectedId(sorted[0].id);
      } else if (selectedId && !sorted.some((x) => x.id === selectedId)) {
        setSelectedId(sorted[0]?.id || "");
      }
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "리드 목록 조회에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  useEffect(() => {
    setAdminMemo(selectedItem?.admin_memo || "");
    setDealAmount(
      selectedItem?.deal_amount_krw ? String(selectedItem.deal_amount_krw) : ""
    );
    setContractMemo(selectedItem?.contract_memo || "");
  }, [
    selectedItem?.id,
    selectedItem?.admin_memo,
    selectedItem?.deal_amount_krw,
    selectedItem?.contract_memo,
  ]);

  async function patchLead(
    payload: Record<string, unknown>,
    successText?: string
  ) {
    if (!selectedId) return;

    setActing(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch(`/api/admin/leads/${selectedId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "리드 업데이트 실패");
      }

      setNotice(successText || "저장되었습니다.");
      await fetchLeads();
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "리드 업데이트 실패"
      );
    } finally {
      setActing(false);
    }
  }

  async function updateLeadStage(nextStage: LeadStage) {
    await patchLead(
      { lead_stage: nextStage },
      `리드 단계가 '${stageLabel(nextStage)}'로 변경되었습니다.`
    );
  }

  async function saveAdminMemo() {
    await patchLead(
      { admin_memo: adminMemo },
      "관리자 메모가 저장되었습니다."
    );
  }

  async function markContactedAndOpen(kind: "phone" | "email", value: string) {
    if (!selectedItem || !value) return;

    await patchLead(
      {
        lead_stage:
          selectedItem.lead_stage === "new"
            ? "screening"
            : selectedItem.lead_stage,
        last_contacted_at: new Date().toISOString(),
        admin_memo: adminMemo,
        log_type: kind,
        log_target: value,
        log_memo: kind === "phone" ? "관리자 전화 연결" : "관리자 이메일 연결",
        created_by: "admin",
      },
      "연락 로그를 기록했습니다."
    );

    if (kind === "phone") {
      window.location.href = `tel:${value}`;
    } else {
      window.location.href = `mailto:${value}`;
    }
  }

  async function translateMessage() {
    if (!selectedItem?.message) return;

    setActing(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: selectedItem.message,
          target_language: "Korean",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json.error || "번역 실패");
      }

      const translated = json.translated || "";

      await patchLead(
        {
          translated_message: translated,
          admin_memo: `${adminMemo || ""}\n\n[번역본]\n${translated}`.trim(),
        },
        "번역 결과를 저장했습니다."
      );
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "번역에 실패했습니다."
      );
      setActing(false);
    }
  }

  async function createQuoteDraft() {
    if (!selectedItem?.id) return;

    setActing(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch("/api/admin/export-quotes/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead_id: selectedItem.id,
          product_name: "품목 확인 필요",
          quantity: selectedItem.quantity || "",
          unit_price: "To be discussed",
          incoterm: "FOB",
          payment_terms: "T/T",
          delivery_time: "To be discussed",
          origin: "Korea",
          packaging: "Standard export packaging",
          quote_language:
            selectedItem.is_foreign || selectedItem.inquiry_language === "en"
              ? "en"
              : "ko",
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json.error || "견적 초안 생성 실패");
      }

      setNotice(`견적 초안 생성 완료`);
      await fetchLeads();
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "견적 초안 생성 실패"
      );
    } finally {
      setActing(false);
    }
  }

  async function sendQuoteEmail() {
    if (!selectedItem?.latest_quote_id) return;

    setSendingQuote(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch("/api/admin/export-quotes/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quote_id: selectedItem.latest_quote_id,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json.error || "견적 이메일 발송 실패");
      }

      setNotice(`견적서 이메일 발송 완료: ${json.sent_to || "-"}`);
      await fetchLeads();
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "견적 이메일 발송 실패"
      );
    } finally {
      setSendingQuote(false);
    }
  }

  async function notifyVendor() {
    if (!selectedItem?.id) return;

    setNotifyingVendor(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch(
        `/api/admin/leads/${selectedItem.id}/notify-vendor`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            admin_memo: adminMemo,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json.error || "벤더 알림 발송 실패");
      }

      setNotice(`벤더 알림 발송 완료: ${json.sent_to || "-"}`);
      await fetchLeads();
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "벤더 알림 발송 실패"
      );
    } finally {
      setNotifyingVendor(false);
    }
  }

  async function closeDealAsWon() {
    if (!selectedItem?.id) return;

    setActing(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch(
        `/api/admin/leads/${selectedItem.id}/close-deal`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deal_amount_krw: Number(dealAmount || 0),
            commission_mode: commissionMode,
            contract_memo: contractMemo,
            contract_status: "contracted",
          }),
        }
      );

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json.error || "성사 등록 실패");
      }

      setNotice(
        `성사 등록 완료 · 계약금액 ${Number(
          json.summary?.deal_amount_krw || 0
        ).toLocaleString()}원 / 수수료 ${Number(
          json.summary?.commission_amount_krw || 0
        ).toLocaleString()}원`
      );

      await fetchLeads();
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "성사 등록 실패"
      );
    } finally {
      setActing(false);
    }
  }

  async function markAsPaid() {
    if (!selectedItem?.id) return;

    setActing(true);
    setNotice("");
    setErrorNotice("");

    try {
      const res = await fetch(`/api/admin/leads/${selectedItem.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contract_status: "paid",
          lead_stage:
            selectedItem.lead_stage === "won"
              ? "won"
              : selectedItem.lead_stage,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json.error || "입금완료 처리 실패");
      }

      setNotice("입금완료 처리되었습니다.");
      await fetchLeads();
    } catch (error) {
      setErrorNotice(
        error instanceof Error ? error.message : "입금완료 처리 실패"
      );
    } finally {
      setActing(false);
    }
  }

  const quotePdfUrl =
    selectedItem?.latest_quote_pdf_url || selectedItem?.quote_pdf_url || "";

  return (
    <main className="min-h-screen bg-neutral-50 px-3 py-4 md:px-6 md:py-6">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-5 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                리드 CRM
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                모든 리드는 관리자 검토 후 연결합니다. 자동 벤더 전달 없이, 관리자 중심으로 통제합니다.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
              <StatCard title="전체" value={stats.total} />
              <StatCard title="HOT" value={stats.hot} accent="red" />
              <StatCard title="해외" value={stats.foreign} accent="blue" />
              <StatCard title="전달" value={stats.sent} accent="sky" />
              <StatCard title="협상중" value={stats.negotiating} accent="violet" />
              <StatCard title="성사" value={stats.won} accent="emerald" />
            </div>
          </div>
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

        <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)] 2xl:grid-cols-[430px_minmax(0,1fr)]">
          <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className="mb-4">
              <div className="text-lg font-semibold">리드 목록</div>
              <div className="mt-1 text-sm text-neutral-500">
                HOT 리드, 해외 리드, 최근 접수 리드를 우선 검토하십시오.
              </div>
            </div>

            <div className="space-y-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="회사명, 담당자, 연락처, 이메일, 메모 검색"
                className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
              />

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <select
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="">전체 단계</option>
                  <option value="new">신규</option>
                  <option value="screening">검토중</option>
                  <option value="qualified">유효리드</option>
                  <option value="sent">벤더전달</option>
                  <option value="negotiating">협상중</option>
                  <option value="won">성사</option>
                  <option value="lost">실패</option>
                </select>

                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="">전체 유입경로</option>
                  <option value="booth_inquiry">부스 문의</option>
                  <option value="expo_deal">엑스포 특가</option>
                  <option value="global_inquiry">해외 문의</option>
                  <option value="buyer_demand">바이어 수요</option>
                  <option value="expo">일반 엑스포</option>
                </select>

                <select
                  value={foreignFilter}
                  onChange={(e) => setForeignFilter(e.target.value)}
                  className="w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-black"
                >
                  <option value="">국내/해외 전체</option>
                  <option value="true">해외만</option>
                  <option value="false">국내만</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={fetchLeads}
                  disabled={loading}
                  className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {loading ? "조회 중..." : "검색 / 새로고침"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSourceFilter("");
                    setStageFilter("");
                    setForeignFilter("");
                    setTimeout(() => fetchLeads(), 0);
                  }}
                  className="rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-semibold"
                >
                  초기화
                </button>
              </div>
            </div>

            <div className="mt-5 max-h-[72vh] space-y-3 overflow-y-auto pr-1">
              {!loading && items.length === 0 && (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
                  조회된 리드가 없습니다.
                </div>
              )}

              {items.map((item) => {
                const selected = item.id === selectedId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-3xl border p-4 text-left transition ${
                      selected
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 bg-white hover:border-neutral-400"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold">
                          {item.contact_name || item.company_name || "이름 없음"}
                        </div>
                        <div
                          className={`mt-1 truncate text-xs ${
                            selected ? "text-neutral-300" : "text-neutral-500"
                          }`}
                        >
                          {item.company_name || "-"}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold">
                          {item.priority_rank ?? 0}
                        </div>
                        <div
                          className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${stageClass(
                            item.lead_stage
                          )}`}
                        >
                          {stageLabel(item.lead_stage)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.hot_lead ? (
                        <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
                          🔥 HOT
                        </span>
                      ) : null}

                      {item.is_foreign ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                          FOREIGN
                        </span>
                      ) : (
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
                          DOMESTIC
                        </span>
                      )}

                      {item.quote_status ? (
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                          견적 · {quoteStatusLabel(item.quote_status)}
                        </span>
                      ) : null}
                    </div>

                    <div
                      className={`mt-3 grid gap-1 text-sm ${
                        selected ? "text-neutral-200" : "text-neutral-600"
                      }`}
                    >
                      <div>유입: {sourceLabel(item.source_type)}</div>
                      <div>국가: {item.country || "-"}</div>
                      <div>연락처: {item.phone || "-"}</div>
                      <div>접수일: {formatDate(item.created_at)}</div>
                    </div>

                    {item.detection_summary ? (
                      <div
                        className={`mt-2 text-xs leading-5 ${
                          selected ? "text-amber-200" : "text-amber-700"
                        }`}
                      >
                        자동분석: {item.detection_summary}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm md:p-5">
            {!selectedItem && (
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
                좌측 리드 목록에서 항목을 선택해주세요.
              </div>
            )}

            {selectedItem && (
              <div className="space-y-5">
                <div className="border-b border-neutral-200 pb-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold">
                      {selectedItem.contact_name || "이름 없음"}
                    </h2>

                    {selectedItem.hot_lead ? (
                      <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-semibold text-white">
                        🔥 HOT 리드
                      </span>
                    ) : null}

                    {selectedItem.is_foreign ? (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                        FOREIGN BUYER
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-2 text-sm text-neutral-500">
                    회사명: {selectedItem.company_name || "-"}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1.5 text-sm font-semibold ${stageClass(
                        selectedItem.lead_stage
                      )}`}
                    >
                      단계 · {stageLabel(selectedItem.lead_stage)}
                    </span>

                    <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-semibold text-neutral-700">
                      유입경로 · {sourceLabel(selectedItem.source_type)}
                    </span>

                    <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-semibold text-neutral-700">
                      리드점수 · {selectedItem.lead_score ?? 0}
                    </span>

                    <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-semibold text-neutral-700">
                      우선순위 · {selectedItem.priority_rank ?? 0}
                    </span>

                    <span className="rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-semibold text-indigo-700">
                      견적 · {quoteStatusLabel(selectedItem.quote_status)}
                    </span>

                    {selectedItem.contract_status ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                        계약 · {contractStatusLabel(selectedItem.contract_status)}
                      </span>
                    ) : null}

                    {selectedItem.negotiation_status ? (
                      <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800">
                        협상 · {negotiationStatusLabel(selectedItem.negotiation_status)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="space-y-5">
                    <InfoCard
                      title="기본 정보"
                      rows={[
                        ["회사명", selectedItem.company_name || "-"],
                        ["담당자명", selectedItem.contact_name || "-"],
                        ["연락처", selectedItem.phone || "-"],
                        ["이메일", selectedItem.email || "-"],
                        [
                          "부스명",
                          selectedItem.assigned_booth_name ||
                            selectedItem.booth_name ||
                            selectedItem.booth_id ||
                            "-",
                        ],
                        [
                          "업체명",
                          selectedItem.assigned_vendor_name ||
                            selectedItem.vendor_name ||
                            selectedItem.vendor_id ||
                            "-",
                        ],
                        ["특가ID", selectedItem.deal_id || "-"],
                        ["국가", selectedItem.country || "-"],
                        ["언어", selectedItem.inquiry_language || "-"],
                        ["거래유형", selectedItem.trade_type || "-"],
                        ["예상수량", selectedItem.quantity || "-"],
                        ["바이어등급", selectedItem.buyer_level || "-"],
                        ["검증상태", selectedItem.buyer_verification_status || "-"],
                        ["HOT 여부", selectedItem.hot_lead ? "예" : "아니오"],
                        ["자동분석", selectedItem.detection_summary || "-"],
                        ["관리자알림", formatDate(selectedItem.admin_alert_sent_at)],
                        ["접수일", formatDate(selectedItem.created_at)],
                        ["최초연락", formatDate(selectedItem.first_contacted_at)],
                        ["최근연락", formatDate(selectedItem.last_contacted_at)],
                        ["다음액션", formatDate(selectedItem.next_action_at)],
                        ["종결일", formatDate(selectedItem.closed_at)],
                      ]}
                    />

                    <InfoCard
                      title="매출 / 수익 정보"
                      rows={[
                        ["계약상태", contractStatusLabel(selectedItem.contract_status)],
                        ["계약금액", formatWon(selectedItem.deal_amount_krw)],
                        [
                          "수수료율",
                          selectedItem.commission_rate != null
                            ? `${Math.round(Number(selectedItem.commission_rate) * 100)}%`
                            : "-",
                        ],
                        ["수수료금액", formatWon(selectedItem.commission_amount_krw)],
                        ["순매출", formatWon(selectedItem.net_revenue_krw)],
                        ["계약일", formatDate(selectedItem.contracted_at)],
                        ["입금일", formatDate(selectedItem.paid_at)],
                      ]}
                    />

                    <SimpleBox title="원문 문의 내용">
                      <div className="whitespace-pre-wrap rounded-2xl bg-neutral-50 p-4 text-sm leading-7 text-neutral-800">
                        {selectedItem.message || "문의 내용이 없습니다."}
                      </div>
                    </SimpleBox>

                    <SimpleBox title="번역본">
                      <div className="whitespace-pre-wrap rounded-2xl bg-neutral-50 p-4 text-sm leading-7 text-neutral-800">
                        {selectedItem.translated_message || "저장된 번역본이 없습니다."}
                      </div>

                      <div className="mt-4">
                        <ActionButton
                          label="번역 저장"
                          onClick={translateMessage}
                          disabled={acting || !selectedItem.message}
                          variant="secondary"
                        />
                      </div>
                    </SimpleBox>

                    <SimpleBox title="관리자 메모">
                      <textarea
                        value={adminMemo}
                        onChange={(e) => setAdminMemo(e.target.value)}
                        rows={6}
                        className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                        placeholder="통화 내용, 바이어 의도, 가격 조건, 후속 조치 등을 기록하세요."
                      />

                      <div className="mt-3">
                        <ActionButton
                          label="메모 저장"
                          onClick={saveAdminMemo}
                          disabled={acting}
                          variant="secondary"
                        />
                      </div>
                    </SimpleBox>

                    <NegotiationPanel leadId={selectedItem.id} onChanged={fetchLeads} />
                  </div>

                  <div className="space-y-5">
                    <SimpleBox title="빠른 액션">
                      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                        <ActionButton
                          label="📞 전화하기"
                          onClick={() => {
                            if (selectedItem.phone) {
                              markContactedAndOpen("phone", selectedItem.phone);
                            }
                          }}
                          disabled={acting || !selectedItem.phone}
                        />

                        <ActionButton
                          label="✉ 이메일 보내기"
                          onClick={() => {
                            if (selectedItem.email) {
                              markContactedAndOpen("email", selectedItem.email);
                            }
                          }}
                          disabled={acting || !selectedItem.email}
                          variant="secondary"
                        />

                        <ActionButton
                          label="견적 초안 생성"
                          onClick={createQuoteDraft}
                          disabled={acting}
                          variant="secondary"
                        />

                        <ActionButton
                          label={sendingQuote ? "견적 발송 중..." : "견적 이메일 발송"}
                          onClick={sendQuoteEmail}
                          disabled={acting || sendingQuote || !selectedItem.latest_quote_id}
                          variant="secondary"
                        />

                        <ActionButton
                          label={notifyingVendor ? "벤더 알림 중..." : "벤더 알림 발송"}
                          onClick={notifyVendor}
                          disabled={acting || notifyingVendor || !selectedItem.vendor_id}
                          variant="secondary"
                        />

                        <ActionButton
                          label="벤더 전달 준비"
                          onClick={() => updateLeadStage("sent")}
                          disabled={acting || selectedItem.lead_stage === "sent"}
                          variant="secondary"
                        />
                      </div>

                      {quotePdfUrl ? (
                        <div className="mt-4">
                          <a
                            href={quotePdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex w-full items-center justify-center rounded-2xl border border-neutral-300 px-4 py-3 text-sm font-semibold hover:bg-neutral-50"
                          >
                            견적 PDF 열기
                          </a>
                        </div>
                      ) : null}
                    </SimpleBox>

                    <SimpleBox title="성사 / 매출 등록">
                      <div className="grid gap-3">
                        <div>
                          <div className="mb-2 text-sm font-semibold">계약금액(원)</div>
                          <input
                            value={dealAmount}
                            onChange={(e) => setDealAmount(e.target.value)}
                            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                            placeholder="예: 15000000"
                          />
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-semibold">수수료 방식</div>
                          <select
                            value={commissionMode}
                            onChange={(e) => setCommissionMode(e.target.value)}
                            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                          >
                            <option value="booth_only">부스 노출만 (10%)</option>
                            <option value="matched">매칭 포함 (15%)</option>
                            <option value="negotiated">협상 포함 (20%)</option>
                            <option value="export_broker">수출 중개 (25%)</option>
                          </select>
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-semibold">계약 메모</div>
                          <textarea
                            value={contractMemo}
                            onChange={(e) => setContractMemo(e.target.value)}
                            rows={4}
                            className="w-full rounded-2xl border border-neutral-300 px-4 py-3 outline-none focus:border-black"
                            placeholder="계약 조건, 납기, 결제 방식, 특이사항"
                          />
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <ActionButton
                            label="성사 등록"
                            onClick={closeDealAsWon}
                            disabled={acting || !dealAmount}
                          />

                          <ActionButton
                            label="입금완료 처리"
                            onClick={markAsPaid}
                            disabled={acting || selectedItem?.contract_status === "paid"}
                            variant="secondary"
                          />
                        </div>
                      </div>
                    </SimpleBox>

                    <SimpleBox title="단계 변경">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <ActionButton
                          label="신규"
                          onClick={() => updateLeadStage("new")}
                          disabled={acting || selectedItem.lead_stage === "new"}
                          variant="secondary"
                        />
                        <ActionButton
                          label="검토중"
                          onClick={() => updateLeadStage("screening")}
                          disabled={acting || selectedItem.lead_stage === "screening"}
                          variant="secondary"
                        />
                        <ActionButton
                          label="유효리드"
                          onClick={() => updateLeadStage("qualified")}
                          disabled={acting || selectedItem.lead_stage === "qualified"}
                          variant="secondary"
                        />
                        <ActionButton
                          label="협상중"
                          onClick={() => updateLeadStage("negotiating")}
                          disabled={acting || selectedItem.lead_stage === "negotiating"}
                        />
                        <ActionButton
                          label="성사"
                          onClick={() => updateLeadStage("won")}
                          disabled={acting || selectedItem.lead_stage === "won"}
                        />
                        <ActionButton
                          label="실패"
                          onClick={() => updateLeadStage("lost")}
                          disabled={acting || selectedItem.lead_stage === "lost"}
                          variant="danger"
                        />
                      </div>
                    </SimpleBox>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
  accent = "neutral",
}: {
  title: string;
  value: number;
  accent?: "neutral" | "red" | "blue" | "sky" | "violet" | "emerald";
}) {
  const accentClass =
    accent === "red"
      ? "border-red-200 bg-red-50 text-red-700"
      : accent === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : accent === "sky"
      ? "border-sky-200 bg-sky-50 text-sky-700"
      : accent === "violet"
      ? "border-violet-200 bg-violet-50 text-violet-700"
      : accent === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-neutral-200 bg-neutral-50 text-neutral-800";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${accentClass}`}>
      <div className="text-xs font-semibold">{title}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

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
            className="flex flex-col gap-1 border-b border-neutral-100 pb-3 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4"
          >
            <div className="shrink-0 text-neutral-500 sm:w-40">{label}</div>
            <div className="flex-1 whitespace-pre-wrap break-words text-left font-medium text-neutral-900 sm:text-right">
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-neutral-200 p-5">
      <div className="mb-4 text-lg font-semibold">{title}</div>
      {children}
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
      className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {label}
    </button>
  );
}