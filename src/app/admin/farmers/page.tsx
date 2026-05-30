"use client";

import { useEffect, useMemo, useState } from "react";

type FarmerItem = {
  id: string;
  name?: string | null;
  phone?: string | null;
  province?: string | null;
  city?: string | null;
  region?: string | null;
  main_crop?: string | null;
  last_crop?: string | null;
  last_issue?: string | null;
  farm_size_text?: string | null;
  farm_size_pyeong?: number | null;
  tractor_hp?: number | null;
  tractor_brand?: string | null;
  tractor_model?: string | null;
  equipment_interests?: string[] | null;
  last_product_interest?: string | null;
  total_consults?: number | null;
  total_orders?: number | null;
  total_order_amount_krw?: number | null;
  source?: string | null;
  memo?: string | null;
  vip?: boolean | null;
  vip_score?: number | null;
  vip_grade?: string | null;
  vip_reason?: string | null;
  first_seen_at?: string | null;
  last_seen_at?: string | null;
  created_at?: string | null;
};

type QuickFilter =
  | "all"
  | "vip"
  | "order"
  | "consult"
  | "no_order"
  | "large_area";

function safe(v: unknown) {
  return String(v ?? "").trim();
}

function shortDate(v?: string | null) {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 16);
  return d.toLocaleString("ko-KR").slice(0, 20);
}

function won(v?: number | null) {
  const n = Number(v || 0);
  if (!n) return "-";
  return `${n.toLocaleString()}원`;
}

function area(x: FarmerItem) {
  if (x.farm_size_text) return x.farm_size_text;
  const n = Number(x.farm_size_pyeong || 0);
  return n > 0 ? `${n.toLocaleString()}평` : "-";
}

function autoGrade(x: FarmerItem) {
  const amount = Number(x.total_order_amount_krw || 0);
  const orders = Number(x.total_orders || 0);
  const consults = Number(x.total_consults || 0);

  if (safe(x.vip_grade)) return safe(x.vip_grade).toUpperCase();
  if (amount >= 1_000_000 || orders >= 10) return "S";
  if (amount >= 500_000 || orders >= 5) return "A";
  if (amount >= 200_000 || orders >= 2 || consults >= 3) return "B";
  return "-";
}

function isVip(x: FarmerItem) {
  return Boolean(x.vip) || ["S", "A"].includes(autoGrade(x));
}

function gradeClass(grade?: string | null) {
  const g = safe(grade).toUpperCase();
  if (g === "S") return "bg-red-600 text-white";
  if (g === "A") return "bg-orange-500 text-white";
  if (g === "B") return "bg-amber-100 text-amber-800";
  return "bg-neutral-100 text-neutral-700";
}

export default function FarmersAdminPage() {
  const [items, setItems] = useState<FarmerItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [cropFilter, setCropFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [issueFilter, setIssueFilter] = useState("");
  const [minArea, setMinArea] = useState("");
  const [quick, setQuick] = useState<QuickFilter>("all");

  async function fetchFarmers() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/farmers", { cache: "no-store" });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "농민 목록 조회 실패");
      }

      setItems(json.items || []);
      setSelectedIds([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "농민 목록 조회 실패");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFarmers();
  }, []);

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    const cropKeyword = cropFilter.trim();
    const regionKeyword = regionFilter.trim();
    const issueKeyword = issueFilter.trim();
    const min = Number(minArea || 0);

    return items.filter((x) => {
      if (quick === "vip" && !isVip(x)) return false;
      if (quick === "order" && Number(x.total_orders || 0) <= 0) return false;
      if (quick === "consult" && Number(x.total_consults || 0) <= 0) return false;
      if (quick === "no_order" && Number(x.total_orders || 0) > 0) return false;
      if (quick === "large_area" && Number(x.farm_size_pyeong || 0) < 1000) return false;

      const hay = [
        x.name,
        x.phone,
        x.region,
        x.province,
        x.city,
        x.main_crop,
        x.last_crop,
        x.last_issue,
        x.last_product_interest,
        x.tractor_brand,
        x.tractor_model,
        x.source,
        x.memo,
        x.vip_grade,
        x.vip_reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (keyword && !hay.includes(keyword)) return false;

      if (cropKeyword) {
        const cropText = `${x.main_crop || ""} ${x.last_crop || ""}`;
        if (!cropText.includes(cropKeyword)) return false;
      }

      if (regionKeyword) {
        const regionText = `${x.region || ""} ${x.province || ""} ${x.city || ""}`;
        if (!regionText.includes(regionKeyword)) return false;
      }

      if (issueKeyword && !(x.last_issue || "").includes(issueKeyword)) return false;
      if (min > 0 && Number(x.farm_size_pyeong || 0) < min) return false;

      return true;
    });
  }, [items, q, cropFilter, regionFilter, issueFilter, minArea, quick]);

  const stats = useMemo(() => {
    return {
      total: items.length,
      filtered: filtered.length,
      vip: items.filter((x) => isVip(x)).length,
      consults: items.reduce((sum, x) => sum + Number(x.total_consults || 0), 0),
      orders: items.reduce((sum, x) => sum + Number(x.total_orders || 0), 0),
      amount: items.reduce((sum, x) => sum + Number(x.total_order_amount_krw || 0), 0),
    };
  }, [items, filtered]);

  const allChecked =
    filtered.length > 0 && filtered.every((x) => selectedIds.includes(x.id));

  function toggleOne(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleAll() {
    setSelectedIds(allChecked ? [] : filtered.map((x) => x.id));
  }

  function resetFilters() {
    setQ("");
    setCropFilter("");
    setRegionFilter("");
    setIssueFilter("");
    setMinArea("");
    setQuick("all");
    setSelectedIds([]);
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-3 md:p-5">
      <section className="mb-3 rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-xs font-black text-green-700">
              K-AGRI ADMIN CRM
            </div>
            <h1 className="mt-1 text-3xl font-black">농민 회원 관리</h1>
            <p className="mt-2 text-sm font-bold text-neutral-600">
              관리자 전용 화면입니다. 농민 회원·상담·주문·작물 정보를 엑셀형으로 관리합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
            <Stat title="전체" value={`${stats.total}명`} />
            <Stat title="검색" value={`${stats.filtered}명`} tone="green" />
            <Stat title="VIP" value={`${stats.vip}명`} tone="red" />
            <Stat title="상담" value={`${stats.consults}건`} tone="blue" />
            <Stat title="주문" value={`${stats.orders}건`} tone="amber" />
            <Stat title="매출" value={won(stats.amount)} tone="red" />
          </div>
        </div>
      </section>

      {error ? (
        <section className="mb-3 rounded-2xl border border-red-200 bg-red-50 p-4 font-black text-red-700">
          {error}
        </section>
      ) : null}

      <section className="mb-3 rounded-3xl border bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <QuickButton active={quick === "all"} onClick={() => setQuick("all")}>
            전체
          </QuickButton>
          <QuickButton active={quick === "vip"} onClick={() => setQuick("vip")}>
            VIP
          </QuickButton>
          <QuickButton active={quick === "order"} onClick={() => setQuick("order")}>
            주문 있음
          </QuickButton>
          <QuickButton active={quick === "consult"} onClick={() => setQuick("consult")}>
            상담 있음
          </QuickButton>
          <QuickButton active={quick === "no_order"} onClick={() => setQuick("no_order")}>
            미구매
          </QuickButton>
          <QuickButton active={quick === "large_area"} onClick={() => setQuick("large_area")}>
            1,000평 이상
          </QuickButton>
        </div>

        <div className="grid gap-2 md:grid-cols-5">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름·전화·지역·작물 통합검색"
            className="h-12 rounded-2xl border px-4 text-base font-bold"
          />
          <input
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            placeholder="작물 예: 고추"
            className="h-12 rounded-2xl border px-4 text-base font-bold"
          />
          <input
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            placeholder="지역 예: 충남"
            className="h-12 rounded-2xl border px-4 text-base font-bold"
          />
          <input
            value={issueFilter}
            onChange={(e) => setIssueFilter(e.target.value)}
            placeholder="병해 예: 흰가루"
            className="h-12 rounded-2xl border px-4 text-base font-bold"
          />
          <input
            value={minArea}
            onChange={(e) => setMinArea(e.target.value.replace(/\D/g, ""))}
            placeholder="최소 평수"
            className="h-12 rounded-2xl border px-4 text-base font-bold"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchFarmers}
            disabled={loading}
            className="h-11 rounded-2xl bg-green-700 px-5 font-black text-white disabled:opacity-50"
          >
            {loading ? "조회 중..." : "새로고침"}
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="h-11 rounded-2xl border bg-white px-5 font-black"
          >
            필터 초기화
          </button>

          <button
            type="button"
            onClick={() => alert("선택 농민 문자발송 기능은 SMS API 연결 후 활성화됩니다.")}
            className="h-11 rounded-2xl bg-neutral-900 px-5 font-black text-white"
          >
            선택 문자발송 {selectedIds.length ? `(${selectedIds.length})` : ""}
          </button>

          <button
            type="button"
            onClick={() => alert("선택 농민을 상담 대상자로 지정하는 기능을 다음 단계에서 연결합니다.")}
            className="h-11 rounded-2xl bg-blue-700 px-5 font-black text-white"
          >
            상담대상 지정
          </button>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between px-2">
          <b className="text-lg">농민 회원 목록</b>
          <span className="text-sm font-black text-neutral-500">
            표시 {filtered.length.toLocaleString()}명 / 선택 {selectedIds.length.toLocaleString()}명
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full min-w-[2100px] border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-neutral-50">
              <tr>
                <Th>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                    className="h-5 w-5"
                  />
                </Th>
                <Th>등급</Th>
                <Th>이름</Th>
                <Th>전화</Th>
                <Th>지역</Th>
                <Th>주작물</Th>
                <Th>최근문제</Th>
                <Th>평수</Th>
                <Th>관심제품</Th>
                <Th>상담</Th>
                <Th>주문</Th>
                <Th>누적매출</Th>
                <Th>장비</Th>
                <Th>유입</Th>
                <Th>첫유입</Th>
                <Th>최근활동</Th>
                <Th>관리메모</Th>
                <Th>관리</Th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={18} className="p-10 text-center font-black text-neutral-500">
                    조건에 맞는 농민 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((x) => {
                  const grade = autoGrade(x);

                  return (
                    <tr key={x.id} className="hover:bg-green-50">
                      <Td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(x.id)}
                          onChange={() => toggleOne(x.id)}
                          className="h-5 w-5"
                        />
                      </Td>

                      <Td>
                        <span
                          className={`inline-flex min-w-10 justify-center rounded-full px-2 py-1 text-xs font-black ${gradeClass(
                            grade
                          )}`}
                        >
                          {grade}
                        </span>
                      </Td>

                      <Td strong>{safe(x.name) || "이름 없음"}</Td>
                      <Td strong>{safe(x.phone) || "-"}</Td>
                      <Td>{safe(x.region) || safe(x.province) || safe(x.city) || "-"}</Td>
                      <Td strong>{safe(x.main_crop) || safe(x.last_crop) || "-"}</Td>
                      <Td>{safe(x.last_issue) || "-"}</Td>
                      <Td strong>{area(x)}</Td>
                      <Td>{safe(x.last_product_interest) || "-"}</Td>
                      <Td strong>{Number(x.total_consults || 0).toLocaleString()}회</Td>
                      <Td strong>{Number(x.total_orders || 0).toLocaleString()}회</Td>
                      <Td strong>{won(x.total_order_amount_krw)}</Td>
                      <Td>
                        {safe(x.tractor_brand) || safe(x.tractor_model)
                          ? `${safe(x.tractor_brand)} ${safe(x.tractor_model)} ${
                              x.tractor_hp ? `${x.tractor_hp}마력` : ""
                            }`
                          : "-"}
                      </Td>
                      <Td>{safe(x.source) || "-"}</Td>
                      <Td>{shortDate(x.first_seen_at || x.created_at)}</Td>
                      <Td>{shortDate(x.last_seen_at)}</Td>
                      <Td>{safe(x.memo) || safe(x.vip_reason) || "-"}</Td>
                      <Td>
                        <div className="flex gap-1">
                          <a
                            href={x.phone ? `tel:${x.phone}` : "#"}
                            className="rounded-xl bg-green-700 px-3 py-2 text-xs font-black text-white no-underline"
                          >
                            전화
                          </a>
                          <a
                            href={`/admin/photodoctor-consults?phone=${encodeURIComponent(
                              safe(x.phone)
                            )}`}
                            className="rounded-xl bg-blue-700 px-3 py-2 text-xs font-black text-white no-underline"
                          >
                            상담
                          </a>
                          <a
                            href={`/admin/photodoctor-orders?phone=${encodeURIComponent(
                              safe(x.phone)
                            )}`}
                            className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white no-underline"
                          >
                            주문
                          </a>
                          <a
                            href={`/admin/farmer-crm/${encodeURIComponent(
                              safe(x.phone) || x.id
                            )}`}
                            className="rounded-xl bg-neutral-900 px-3 py-2 text-xs font-black text-white no-underline"
                          >
                            상세
                          </a>
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
    </main>
  );
}

function QuickButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-2xl px-4 text-sm font-black ${
        active ? "bg-green-700 text-white" : "border bg-white text-neutral-800"
      }`}
    >
      {children}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="whitespace-nowrap border-b px-3 py-3 text-left text-xs font-black text-neutral-700">
      {children}
    </th>
  );
}

function Td({
  children,
  strong = false,
}: {
  children: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <td
      className={`whitespace-nowrap border-b px-3 py-3 align-middle ${
        strong ? "font-black text-neutral-950" : "font-bold text-neutral-700"
      }`}
    >
      {children}
    </td>
  );
}

function Stat({
  title,
  value,
  tone = "neutral",
}: {
  title: string;
  value: number | string;
  tone?: "neutral" | "red" | "amber" | "green" | "blue";
}) {
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