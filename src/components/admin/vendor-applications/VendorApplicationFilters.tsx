"use client";

import { HALL_LABELS } from "@/lib/admin/vendor-applications";

const AI_FILTERS = [
  { value: "all", label: "AI 전체" },
  { value: "자동승인 가능", label: "자동승인" },
  { value: "확인필요", label: "확인필요" },
  { value: "서류누락", label: "서류누락" },
  { value: "입금대기", label: "입금대기" },
  { value: "승인완료", label: "승인완료" },
];

const STATUS_FILTERS = [
  { value: "all", label: "상태 전체" },
  { value: "pending", label: "대기" },
  { value: "under_review", label: "검토중" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "반려" },
];

const PLAN_FILTERS = [
  { value: "", label: "플랜 전체" },
  { value: "free", label: "무료" },
  { value: "bronze", label: "브론즈" },
  { value: "silver", label: "실버" },
  { value: "gold", label: "골드" },
  { value: "enterprise", label: "엔터프라이즈" },
];

export default function VendorApplicationFilters({
  q,
  setQ,
  aiFilter,
  setAiFilter,
  statusFilter,
  setStatusFilter,
  hallFilter,
  setHallFilter,
  onRefresh,
  loading,
  resetPage,
}: {
  q: string;
  setQ: (v: string) => void;
  aiFilter: string;
  setAiFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  hallFilter: string;
  setHallFilter: (v: string) => void;
  onRefresh: () => void;
  loading: boolean;
  resetPage: () => void;
}) {
  function update(fn: () => void) {
    fn();
    resetPage();
  }

  return (
    <section className="mb-2 border border-neutral-300 bg-white p-2">
      <div className="mb-2 text-xs font-black text-neutral-700">
        신청 검색 · 필터
      </div>

      <div className="grid gap-1 md:grid-cols-[1fr_120px_120px_150px_150px_80px]">
        <input
          value={q}
          onChange={(e) => update(() => setQ(e.target.value))}
          placeholder="업체명 / 전화 / 사업자번호 / 플랜 검색"
          className="h-8 border border-neutral-400 px-2 text-xs font-bold outline-none"
        />

        <select
          value={q}
          onChange={(e) => update(() => setQ(e.target.value))}
          className="h-8 border border-neutral-400 px-2 text-xs font-bold outline-none"
        >
          {PLAN_FILTERS.map((x) => (
            <option key={x.label} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>

        <select
          value={aiFilter}
          onChange={(e) => update(() => setAiFilter(e.target.value))}
          className="h-8 border border-neutral-400 px-2 text-xs font-bold outline-none"
        >
          {AI_FILTERS.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => update(() => setStatusFilter(e.target.value))}
          className="h-8 border border-neutral-400 px-2 text-xs font-bold outline-none"
        >
          {STATUS_FILTERS.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>

        <select
          value={hallFilter}
          onChange={(e) => update(() => setHallFilter(e.target.value))}
          className="h-8 border border-neutral-400 px-2 text-xs font-bold outline-none"
        >
          <option value="all">관 전체</option>
          {Object.entries(HALL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 border border-neutral-900 bg-neutral-900 px-2 text-xs font-black text-white disabled:opacity-50"
        >
          {loading ? "조회중" : "새로고침"}
        </button>
      </div>
    </section>
  );
}