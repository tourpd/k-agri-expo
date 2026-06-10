"use client";

type FilterValue =
  | "all"
  | "자동승인 가능"
  | "확인필요"
  | "서류누락"
  | "입금대기"
  | "승인완료";

function Stat({
  title,
  value,
  tone = "neutral",
  active,
  onClick,
}: {
  title: string;
  value: number | string;
  tone?: "neutral" | "red" | "amber" | "green" | "blue";
  active?: boolean;
  onClick: () => void;
}) {
  const cls =
    tone === "red"
      ? "border-red-300 bg-red-50 text-red-700"
      : tone === "amber"
      ? "border-amber-300 bg-amber-50 text-amber-700"
      : tone === "green"
      ? "border-green-300 bg-green-50 text-green-700"
      : tone === "blue"
      ? "border-blue-300 bg-blue-50 text-blue-700"
      : "border-neutral-300 bg-white text-neutral-900";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`border p-3 text-center ${cls} ${
        active ? "ring-2 ring-neutral-900" : ""
      }`}
    >
      <div className="text-xs font-black">{title}</div>
      <div className="mt-1 text-lg font-black">{value}</div>
    </button>
  );
}

export default function VendorApplicationStats({
  stats,
  aiFilter,
  setAiFilter,
  resetPage,
}: {
  stats: {
    total: number;
    auto: number;
    need: number;
    missing: number;
    waiting: number;
    approved: number;
  };
  aiFilter: string;
  setAiFilter: (v: string) => void;
  resetPage: () => void;
}) {
  function applyFilter(value: FilterValue) {
    setAiFilter(value);
    resetPage();
  }

  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
      <Stat
        title="전체"
        value={`${stats.total}건`}
        active={aiFilter === "all"}
        onClick={() => applyFilter("all")}
      />
      <Stat
        title="자동승인"
        value={`${stats.auto}건`}
        tone="green"
        active={aiFilter === "자동승인 가능"}
        onClick={() => applyFilter("자동승인 가능")}
      />
      <Stat
        title="확인필요"
        value={`${stats.need}건`}
        tone="blue"
        active={aiFilter === "확인필요"}
        onClick={() => applyFilter("확인필요")}
      />
      <Stat
        title="서류누락"
        value={`${stats.missing}건`}
        tone="red"
        active={aiFilter === "서류누락"}
        onClick={() => applyFilter("서류누락")}
      />
      <Stat
        title="입금대기"
        value={`${stats.waiting}건`}
        tone="amber"
        active={aiFilter === "입금대기"}
        onClick={() => applyFilter("입금대기")}
      />
      <Stat
        title="승인완료"
        value={`${stats.approved}건`}
        tone="green"
        active={aiFilter === "승인완료"}
        onClick={() => applyFilter("승인완료")}
      />
    </div>
  );
}