"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DealRow = {
  id: string;
  booth_id: string | null;
  title: string | null;
  description: string | null;
  deal_url: string | null;
  is_active: boolean | null;
  sponsor_weight: number | null;
  manual_boost: number | null;
  is_featured: boolean | null;
  campaign_tag: string | null;
  crop_tags?: string[] | null;
  issue_tags?: string[] | null;
  category_tags?: string[] | null;
  updated_at?: string | null;
};

type ActiveFilter = "all" | "active" | "inactive";

export default function AdminDealsPage() {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [selected, setSelected] = useState<DealRow | null>(null);
  const [keyword, setKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (keyword.trim()) p.set("keyword", keyword.trim());
    if (activeFilter !== "all") p.set("active", activeFilter);
    return p.toString();
  }, [keyword, activeFilter]);

  const loadDeals = async () => {
    setLoading(true);
    setErrorText("");

    try {
      const res = await fetch(`/api/admin/deals?${queryString}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "딜 목록을 불러오지 못했습니다.");
        return;
      }

      setDeals(data.deals || []);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, [queryString]);

  const stats = useMemo(() => {
    return {
      total: deals.length,
      active: deals.filter((d) => d.is_active).length,
      featured: deals.filter((d) => d.is_featured).length,
      sponsored: deals.filter((d) => (d.sponsor_weight ?? 0) > 0).length,
    };
  }, [deals]);

  const saveDeal = async () => {
    if (!selected) return;

    setSaving(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/deals/${selected.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...selected,
          sponsor_weight: Number(selected.sponsor_weight ?? 0),
          manual_boost: Number(selected.manual_boost ?? 0),
          is_featured: !!selected.is_featured,
          is_active: !!selected.is_active,
          campaign_tag: (selected.campaign_tag || "").trim() || null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "딜 저장에 실패했습니다.");
        return;
      }

      setMessage(data.message || "저장되었습니다.");
      setSelected(data.deal || selected);
      await loadDeals();
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (row: DealRow) => {
    setSaving(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/deals/${row.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !row.is_active,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "활성 상태 변경에 실패했습니다.");
        return;
      }

      setMessage("활성 상태가 변경되었습니다.");
      if (selected?.id === row.id) {
        setSelected(data.deal);
      }
      await loadDeals();
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6 text-slate-900">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-black text-emerald-700">DEALS</div>
            <h1 className="mt-2 text-3xl font-black">딜 운영 관리</h1>
            <p className="mt-2 text-slate-600">
              협찬 특가, 캠페인 딜, 대표 노출 딜을 한 번에 관리합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDeals}
            className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
          >
            새로고침
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="전체 딜" value={`${stats.total}개`} tone="slate" />
          <StatCard label="활성 딜" value={`${stats.active}개`} tone="green" />
          <StatCard label="대표 노출" value={`${stats.featured}개`} tone="purple" />
          <StatCard label="협찬 적용" value={`${stats.sponsored}개`} tone="amber" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <label className="mb-2 block text-sm font-bold">검색</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="딜 제목, 설명, 부스 ID"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">활성 여부</label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="all">전체</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
            </select>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl bg-emerald-100 px-4 py-3 font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorText ? (
          <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700">
            {errorText}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">딜 목록</h2>
            <div className="text-sm font-bold text-slate-500">
              {loading ? "불러오는 중..." : `표시 ${deals.length.toLocaleString()}개`}
            </div>
          </div>

          {deals.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-6 text-slate-500">
              딜이 없습니다.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {deals.map((row) => (
                <div
                  key={row.id}
                  className={`rounded-2xl border p-4 ${
                    selected?.id === row.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black">
                        {row.title || "제목 없음"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        deal_id: {row.id}
                      </div>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        row.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {row.is_active ? "활성" : "비활성"}
                    </span>
                  </div>

                  <div className="mt-3 text-sm leading-7 text-slate-600">
                    {row.description || "설명이 없습니다."}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {row.is_featured ? (
                      <span className="inline-flex rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-700">
                        대표노출
                      </span>
                    ) : null}

                    {(row.sponsor_weight ?? 0) > 0 ? (
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                        협찬 {row.sponsor_weight}
                      </span>
                    ) : null}

                    {(row.manual_boost ?? 0) > 0 ? (
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                        부스트 {row.manual_boost}
                      </span>
                    ) : null}

                    {row.campaign_tag ? (
                      <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                        {row.campaign_tag}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 text-xs leading-6 text-slate-500">
                    <div>crop: {formatTags(row.crop_tags)}</div>
                    <div>issue: {formatTags(row.issue_tags)}</div>
                    <div>category: {formatTags(row.category_tags)}</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelected(row)}
                      className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                    >
                      편집
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleActive(row)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900"
                      disabled={saving}
                    >
                      {row.is_active ? "비활성화" : "활성화"}
                    </button>

                    <Link
                      href={row.deal_url || `/expo/booths/${row.booth_id ?? ""}`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900"
                    >
                      보기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-black">딜 편집</h2>

          {!selected ? (
            <div className="rounded-xl bg-slate-50 p-4 text-slate-500">
              왼쪽에서 딜을 선택해 주세요.
            </div>
          ) : (
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold">딜 제목</label>
                <input
                  value={selected.title || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, title: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">설명</label>
                <textarea
                  value={selected.description || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, description: e.target.value })
                  }
                  className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">딜 URL</label>
                <input
                  value={selected.deal_url || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, deal_url: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-base font-black text-slate-900">
                  노출 제어 설정
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold">협찬 점수</label>
                    <input
                      type="number"
                      value={selected.sponsor_weight ?? 0}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          sponsor_weight: Number(e.target.value || 0),
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold">수동 부스트</label>
                    <input
                      type="number"
                      value={selected.manual_boost ?? 0}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          manual_boost: Number(e.target.value || 0),
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-4 py-3"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-bold">캠페인 태그</label>
                  <input
                    value={selected.campaign_tag || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, campaign_tag: e.target.value })
                    }
                    placeholder="예: spring_push"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <input
                    id="deal_is_featured"
                    type="checkbox"
                    checked={!!selected.is_featured}
                    onChange={(e) =>
                      setSelected({ ...selected, is_featured: e.target.checked })
                    }
                  />
                  <label htmlFor="deal_is_featured" className="text-sm font-bold">
                    대표 노출 딜로 운영
                  </label>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <input
                    id="deal_is_active"
                    type="checkbox"
                    checked={!!selected.is_active}
                    onChange={(e) =>
                      setSelected({ ...selected, is_active: e.target.checked })
                    }
                  />
                  <label htmlFor="deal_is_active" className="text-sm font-bold">
                    활성 상태로 운영
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveDeal}
                  disabled={saving}
                  className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-60"
                >
                  {saving ? "저장 중..." : "딜 저장"}
                </button>

                <Link
                  href={selected.deal_url || `/expo/booths/${selected.booth_id ?? ""}`}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900"
                >
                  딜 보기
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function formatTags(tags?: string[] | null) {
  if (!tags || tags.length === 0) return "-";
  return tags.join(", ");
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "slate" | "green" | "purple" | "amber";
}) {
  const map = {
    slate: "bg-slate-900 text-white",
    green: "bg-emerald-600 text-white",
    purple: "bg-purple-600 text-white",
    amber: "bg-amber-500 text-white",
  };

  return (
    <div className={`rounded-2xl p-5 ${map[tone]}`}>
      <div className="text-sm font-bold opacity-90">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}