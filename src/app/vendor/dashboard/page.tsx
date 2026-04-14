"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type LeadItem = {
  lead_id: string;
  booth_id: string | null;
  vendor_id: string | null;
  hall_id: string | null;
  slot_code: string | null;

  crop_name: string | null;
  area_text: string | null;
  issue_type: string | null;
  message: string | null;

  source_type: string | null;
  source_ref_id: string | null;

  status: string | null;
  priority: string | null;

  estimated_amount_krw: number | null;
  final_amount_krw: number | null;
  commission_rate: number | null;
  commission_amount_krw: number | null;

  created_at: string | null;
  updated_at: string | null;

  masked_farmer_name: string | null;
  masked_farmer_phone: string | null;
  farmer_name: string | null;
  farmer_phone: string | null;
  farmer_email: string | null;

  contact_unlocked: boolean | null;
  accepted_at: string | null;
  accepted_by_vendor_id: string | null;
};

function fmtDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("ko-KR");
}

function fmtKrw(value?: number | null) {
  return `${Number(value || 0).toLocaleString("ko-KR")}원`;
}

function priorityLabel(priority?: string | null) {
  switch (priority) {
    case "high":
      return "높음";
    case "medium":
      return "중간";
    case "low":
      return "낮음";
    default:
      return priority || "-";
  }
}

function priorityClass(priority?: string | null) {
  switch (priority) {
    case "high":
      return "bg-red-100 text-red-700 border border-red-200";
    case "medium":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "low":
      return "bg-slate-100 text-slate-700 border border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

function statusLabel(status?: string | null) {
  switch (status) {
    case "new":
      return "신규";
    case "contacted":
      return "연락완료";
    case "quoted":
      return "견적완료";
    case "won":
      return "거래성사";
    case "lost":
      return "실패";
    case "closed":
      return "종결";
    default:
      return status || "-";
  }
}

function statusClass(status?: string | null) {
  switch (status) {
    case "new":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "contacted":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "quoted":
      return "bg-violet-100 text-violet-700 border border-violet-200";
    case "won":
      return "bg-green-100 text-green-700 border border-green-200";
    case "lost":
      return "bg-rose-100 text-rose-700 border border-rose-200";
    case "closed":
      return "bg-slate-200 text-slate-700 border border-slate-300";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

export default function VendorDashboardPage() {
  const [items, setItems] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [busyLeadId, setBusyLeadId] = useState("");
  const [selected, setSelected] = useState<LeadItem | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (q.trim()) params.set("q", q.trim());
    return params.toString();
  }, [statusFilter, q]);

  async function loadItems() {
    setLoading(true);
    setMessage("");

    try {
      const url = queryString
        ? `/api/vendor/leads?${queryString}`
        : "/api/vendor/leads";

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "리드 목록을 불러오지 못했습니다.");
      }

      setItems(json.items || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "리드 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, [queryString]);

  async function acceptLead(leadId: string) {
    try {
      setBusyLeadId(leadId);
      setMessage("");

      const res = await fetch("/api/vendor/leads/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lead_id: leadId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "상담 수락에 실패했습니다.");
      }

      await loadItems();

      if (selected?.lead_id === leadId) {
        const refreshed = (json.item || {}) as Partial<LeadItem>;
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                farmer_name: refreshed.farmer_name ?? prev.farmer_name,
                farmer_phone: refreshed.farmer_phone ?? prev.farmer_phone,
                farmer_email: refreshed.farmer_email ?? prev.farmer_email,
                contact_unlocked:
                  refreshed.contact_unlocked ?? prev.contact_unlocked,
                accepted_at: refreshed.accepted_at ?? prev.accepted_at,
              }
            : prev
        );
      }
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "상담 수락에 실패했습니다."
      );
    } finally {
      setBusyLeadId("");
    }
  }

  const summary = useMemo(() => {
    return {
      total: items.length,
      newCount: items.filter((x) => x.status === "new").length,
      contactedCount: items.filter((x) => x.status === "contacted").length,
      unlockedCount: items.filter((x) => !!x.contact_unlocked).length,
      wonCount: items.filter((x) => x.status === "won").length,
      totalExpected: items.reduce(
        (sum, item) => sum + Number(item.estimated_amount_krw || 0),
        0
      ),
      totalCommission: items.reduce(
        (sum, item) => sum + Number(item.commission_amount_krw || 0),
        0
      ),
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[28px] bg-slate-900 px-6 py-7 text-white shadow-xl md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-black tracking-wide text-emerald-300">
                VENDOR DASHBOARD
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">
                업체 운영 대시보드
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                내 상담 리드, 연락 공개 여부, 예상 매출 흐름을 한 화면에서 관리합니다.
                상담을 수락하면 농민 연락처가 공개되고, 이후 견적과 거래 상태를
                단계별로 관리할 수 있습니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/vendor/apply"
                className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-900"
              >
                추가 입점 신청
              </Link>
              <Link
                href="/vendor/order-status"
                className="rounded-2xl border border-slate-600 px-4 py-3 text-sm font-black text-white"
              >
                신청 상태 확인
              </Link>
              <button
                type="button"
                onClick={loadItems}
                className="rounded-2xl border border-emerald-400 bg-emerald-500 px-4 py-3 text-sm font-black text-white"
              >
                리드 새로고침
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <SummaryBox title="전체 리드" value={String(summary.total)} />
          <SummaryBox title="신규" value={String(summary.newCount)} />
          <SummaryBox title="연락완료" value={String(summary.contactedCount)} />
          <SummaryBox title="연락처 공개" value={String(summary.unlockedCount)} />
          <SummaryBox title="거래성사" value={String(summary.wonCount)} />
          <SummaryBox title="예상 매출" value={fmtKrw(summary.totalExpected)} />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <QuickCard
            title="내가 지금 해야 할 일"
            items={[
              "신규 리드를 먼저 확인하고 상담 수락 여부를 결정합니다.",
              "수락된 리드는 바로 연락해 상담 지연을 줄입니다.",
              "거래 가능성이 높은 건은 견적 상태로 빠르게 전환합니다.",
            ]}
          />
          <QuickCard
            title="운영 포인트"
            items={[
              "연락처는 상담 수락 후 공개됩니다.",
              "예상금액과 수수료는 정산 흐름 확인용입니다.",
              "상세 버튼에서 문의 내용과 고객 정보를 함께 확인합니다.",
            ]}
          />
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-black text-emerald-700">LEAD FILTER</div>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                상담 리드 목록
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <label className="block">
              <div className="mb-2 text-sm font-black text-slate-800">상태</div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-black"
              >
                <option value="all">전체</option>
                <option value="new">신규</option>
                <option value="contacted">연락완료</option>
                <option value="quoted">견적완료</option>
                <option value="won">거래성사</option>
                <option value="lost">실패</option>
                <option value="closed">종결</option>
              </select>
            </label>

            <label className="block md:col-span-3">
              <div className="mb-2 text-sm font-black text-slate-800">검색</div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="작물 / 문제 / 문의내용 / 농민명"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-black"
              />
            </label>
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
              {message}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-black text-slate-800">
                      농민
                    </th>
                    <th className="px-4 py-3 text-left font-black text-slate-800">
                      작물/문제
                    </th>
                    <th className="px-4 py-3 text-left font-black text-slate-800">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left font-black text-slate-800">
                      우선순위
                    </th>
                    <th className="px-4 py-3 text-left font-black text-slate-800">
                      연락공개
                    </th>
                    <th className="px-4 py-3 text-left font-black text-slate-800">
                      예상금액
                    </th>
                    <th className="px-4 py-3 text-left font-black text-slate-800">
                      접수일
                    </th>
                    <th className="px-4 py-3 text-left font-black text-slate-800">
                      관리
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        불러오는 중...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        리드가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => {
                      const unlocked = !!item.contact_unlocked;

                      return (
                        <tr
                          key={item.lead_id}
                          className="border-t border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3">
                            <div className="font-black text-slate-900">
                              {unlocked
                                ? item.farmer_name || "-"
                                : item.masked_farmer_name || "비공개"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {unlocked
                                ? item.farmer_phone || "-"
                                : item.masked_farmer_phone || "상담 수락 후 공개"}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">
                              {item.crop_name || "-"}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {item.issue_type || "일반 상담"}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${statusClass(
                                item.status
                              )}`}
                            >
                              {statusLabel(item.status)}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${priorityClass(
                                item.priority
                              )}`}
                            >
                              {priorityLabel(item.priority)}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            {unlocked ? (
                              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-700">
                                공개됨
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                                가림
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {fmtKrw(item.estimated_amount_krw)}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {fmtDateTime(item.created_at)}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {!unlocked ? (
                                <button
                                  type="button"
                                  onClick={() => acceptLead(item.lead_id)}
                                  disabled={busyLeadId === item.lead_id}
                                  className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                                >
                                  {busyLeadId === item.lead_id
                                    ? "수락 중..."
                                    : "상담 수락"}
                                </button>
                              ) : (
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                                  연락 가능
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelected(item)}
                                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-800"
                              >
                                상세 보기
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto mt-6 max-w-5xl rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-black text-emerald-700">
                  LEAD DETAIL
                </div>
                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  리드 상세 정보
                </h2>
                <div className="mt-2 text-sm text-slate-600">
                  {selected.crop_name || "-"} / {selected.issue_type || "일반 상담"}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-black text-slate-800"
              >
                닫기
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <DetailCard
                title="농민 정보"
                rows={[
                  [
                    "이름",
                    selected.contact_unlocked
                      ? selected.farmer_name || "-"
                      : selected.masked_farmer_name || "비공개",
                  ],
                  [
                    "전화번호",
                    selected.contact_unlocked
                      ? selected.farmer_phone || "-"
                      : selected.masked_farmer_phone || "상담 수락 후 공개",
                  ],
                  [
                    "이메일",
                    selected.contact_unlocked
                      ? selected.farmer_email || "-"
                      : "상담 수락 후 공개",
                  ],
                  ["연락 공개", selected.contact_unlocked ? "예" : "아니오"],
                  ["수락 시각", fmtDateTime(selected.accepted_at)],
                ]}
              />

              <DetailCard
                title="상담 정보"
                rows={[
                  ["작물", selected.crop_name || "-"],
                  ["문제", selected.issue_type || "-"],
                  ["면적", selected.area_text || "-"],
                  ["유입", selected.source_type || "-"],
                  ["우선순위", priorityLabel(selected.priority)],
                ]}
              />

              <DetailCard
                title="정산 정보"
                rows={[
                  ["예상금액", fmtKrw(selected.estimated_amount_krw)],
                  ["최종금액", fmtKrw(selected.final_amount_krw)],
                  ["수수료율", `${Number(selected.commission_rate || 0) * 100}%`],
                  ["수수료", fmtKrw(selected.commission_amount_krw)],
                  ["상태", statusLabel(selected.status)],
                ]}
              />

              <DetailCard
                title="시스템 정보"
                rows={[
                  ["lead_id", selected.lead_id || "-"],
                  ["booth_id", selected.booth_id || "-"],
                  ["hall_id", selected.hall_id || "-"],
                  ["slot_code", selected.slot_code || "-"],
                  ["접수일", fmtDateTime(selected.created_at)],
                ]}
              />
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 p-5">
              <div className="mb-2 text-lg font-black text-slate-900">
                문의 내용
              </div>
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {selected.message || "내용 없음"}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              {!selected.contact_unlocked ? (
                <button
                  type="button"
                  onClick={() => acceptLead(selected.lead_id)}
                  disabled={busyLeadId === selected.lead_id}
                  className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                >
                  {busyLeadId === selected.lead_id ? "수락 중..." : "상담 수락"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-black text-slate-800"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SummaryBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function QuickCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-lg font-black text-slate-900">{title}</div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-700"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
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
    <div className="rounded-[24px] border border-slate-200 p-5">
      <div className="mb-4 text-lg font-black text-slate-900">{title}</div>
      <div className="space-y-3">
        {rows.map(([k, v]) => (
          <div
            key={`${title}-${k}-${v}`}
            className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3 text-sm"
          >
            <div className="text-slate-500">{k}</div>
            <div className="max-w-[70%] break-words text-right font-semibold text-slate-900">
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}