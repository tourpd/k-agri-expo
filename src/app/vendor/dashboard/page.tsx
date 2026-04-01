"use client";

import { useEffect, useMemo, useState } from "react";

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
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    case "low":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
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
      return "bg-blue-100 text-blue-700";
    case "contacted":
      return "bg-emerald-100 text-emerald-700";
    case "quoted":
      return "bg-violet-100 text-violet-700";
    case "won":
      return "bg-green-100 text-green-700";
    case "lost":
      return "bg-rose-100 text-rose-700";
    case "closed":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function VendorDashboardPage() {
  const [items, setItems] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [q, setQ] = useState("");
  const [busyLeadId, setBusyLeadId] = useState<string>("");
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
    };
  }, [items]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-sm font-black text-emerald-700">VENDOR DASHBOARD</div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            업체 상담 리드 관리
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            수락 전에는 농민 정보가 가려지고, 상담을 수락하면 연락처가 공개됩니다.
          </p>
        </div>

        <button
          type="button"
          onClick={loadItems}
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-black text-slate-800"
        >
          새로고침
        </button>
      </div>

      <section className="mt-6 grid gap-4 md:grid-cols-5">
        <SummaryBox title="전체 리드" value={String(summary.total)} />
        <SummaryBox title="신규" value={String(summary.newCount)} />
        <SummaryBox title="연락완료" value={String(summary.contactedCount)} />
        <SummaryBox title="연락처 공개" value={String(summary.unlockedCount)} />
        <SummaryBox title="거래성사" value={String(summary.wonCount)} />
      </section>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <div className="mb-2 text-sm font-black text-slate-800">상태</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-black"
            >
              <option value="all">전체</option>
              <option value="new">new</option>
              <option value="contacted">contacted</option>
              <option value="quoted">quoted</option>
              <option value="won">won</option>
              <option value="lost">lost</option>
              <option value="closed">closed</option>
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
      </section>

      {message ? (
        <div className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {message}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-black text-slate-800">농민</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">작물/문제</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">상태</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">우선순위</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">연락공개</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">접수일</th>
                <th className="px-4 py-3 text-left font-black text-slate-800">관리</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    불러오는 중...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
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
                          {item.farmer_name || "-"}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.farmer_phone || "-"}
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
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${statusClass(
                            item.status
                          )}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${priorityClass(
                            item.priority
                          )}`}
                        >
                          {priorityLabel(item.priority)}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {unlocked ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">
                            공개됨
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-600">
                            가림
                          </span>
                        )}
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
                              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-black text-white"
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
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-black text-slate-800"
                          >
                            상세
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
      </section>

      {selected ? (
        <div className="fixed inset-0 z-50 bg-black/40 p-4">
          <div className="mx-auto mt-8 max-w-4xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">리드 상세</h2>
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
                  ["이름", selected.farmer_name || "-"],
                  ["전화번호", selected.farmer_phone || "-"],
                  ["이메일", selected.farmer_email || "-"],
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

            <div className="mt-6 rounded-3xl border border-slate-200 p-5">
              <div className="mb-2 text-lg font-black text-slate-900">문의 내용</div>
              <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                {selected.message || "내용 없음"}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="text-sm font-semibold text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
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
    <div className="rounded-3xl border border-slate-200 p-5">
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