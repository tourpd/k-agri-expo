"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type BoothRow = {
  booth_id: string;
  vendor_id: string | null;
  name: string | null;
  intro: string | null;
  description: string | null;
  website_url: string | null;
  youtube_url: string | null;
  hero_image_url: string | null;
  logo_url: string | null;
  is_public: boolean | null;
  status: string | null;
  updated_at?: string | null;
};

type StatusFilter = "all" | "draft" | "live" | "closed";
type VisibilityFilter = "all" | "public" | "private";

function statusLabel(v?: string | null) {
  switch (v) {
    case "draft":
      return "초안";
    case "live":
      return "운영중";
    case "closed":
      return "종료";
    default:
      return v || "-";
  }
}

function statusBadge(v?: string | null) {
  switch (v) {
    case "draft":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "live":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "closed":
      return "bg-slate-200 text-slate-700 border-slate-300";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function AdminBoothsPage() {
  const [booths, setBooths] = useState<BoothRow[]>([]);
  const [selected, setSelected] = useState<BoothRow | null>(null);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (keyword.trim()) p.set("keyword", keyword.trim());
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (visibilityFilter !== "all") p.set("visibility", visibilityFilter);
    return p.toString();
  }, [keyword, statusFilter, visibilityFilter]);

  const loadBooths = async () => {
    setLoading(true);
    setErrorText("");

    try {
      const res = await fetch(`/api/admin/booths?${queryString}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "부스 목록을 불러오지 못했습니다.");
        return;
      }

      setBooths(data.booths || []);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooths();
  }, [queryString]);

  const stats = useMemo(() => {
    return {
      total: booths.length,
      live: booths.filter((b) => b.status === "live").length,
      draft: booths.filter((b) => b.status === "draft").length,
      publicCount: booths.filter((b) => b.is_public).length,
    };
  }, [booths]);

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/vendor/upload-image", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "업로드 실패");
    }

    return data.url as string;
  };

  const handleImageUpload = async (
    type: "hero_image_url" | "logo_url",
    file?: File | null
  ) => {
    if (!selected || !file) return;

    try {
      setSaving(true);
      setErrorText("");
      setMessage("");

      const url = await uploadImage(file);

      setSelected((prev) =>
        prev
          ? {
              ...prev,
              [type]: url,
            }
          : prev
      );

      setMessage(
        type === "logo_url" ? "로고 업로드 완료" : "대표 이미지 업로드 완료"
      );
    } catch (e: any) {
      setErrorText(e?.message || "이미지 업로드 실패");
    } finally {
      setSaving(false);
    }
  };

  const saveBooth = async () => {
    if (!selected) return;

    setSaving(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/booths/${selected.booth_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selected),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "부스 저장에 실패했습니다.");
        return;
      }

      setMessage(data.message || "저장되었습니다.");
      setSelected(data.booth || selected);
      await loadBooths();
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const toggleVisibility = async (row: BoothRow) => {
    setSaving(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/booths/${row.booth_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_public: !row.is_public,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "공개 상태 변경에 실패했습니다.");
        return;
      }

      setMessage("공개 상태가 변경되었습니다.");
      if (selected?.booth_id === row.booth_id) {
        setSelected(data.booth);
      }
      await loadBooths();
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
            <div className="text-sm font-black text-emerald-700">BOOTHS</div>
            <h1 className="mt-2 text-3xl font-black">업체/부스 관리</h1>
            <p className="mt-2 text-slate-600">
              카드형으로 부스를 관리하고, 공개/비공개 및 운영 상태를 빠르게 바꿀 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            onClick={loadBooths}
            className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
          >
            새로고침
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="전체 부스" value={`${stats.total}개`} tone="slate" />
          <StatCard label="운영중" value={`${stats.live}개`} tone="green" />
          <StatCard label="초안" value={`${stats.draft}개`} tone="yellow" />
          <StatCard label="공개중" value={`${stats.publicCount}개`} tone="blue" />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-2 block text-sm font-bold">검색</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="부스명, 소개, 설명"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="all">전체</option>
              <option value="draft">초안</option>
              <option value="live">운영중</option>
              <option value="closed">종료</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-bold">공개 여부</label>
            <select
              value={visibilityFilter}
              onChange={(e) =>
                setVisibilityFilter(e.target.value as VisibilityFilter)
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            >
              <option value="all">전체</option>
              <option value="public">공개</option>
              <option value="private">비공개</option>
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
            <h2 className="text-2xl font-black">부스 카드 목록</h2>
            <div className="text-sm font-bold text-slate-500">
              {loading ? "불러오는 중..." : `표시 ${booths.length.toLocaleString()}개`}
            </div>
          </div>

          {booths.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-6 text-slate-500">
              부스가 없습니다.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {booths.map((row) => (
                <div
                  key={row.booth_id}
                  className={`rounded-2xl border p-4 ${
                    selected?.booth_id === row.booth_id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-black">
                        {row.name || "이름 없음"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        booth_id: {row.booth_id}
                      </div>
                    </div>

                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusBadge(
                        row.status
                      )}`}
                    >
                      {statusLabel(row.status)}
                    </span>
                  </div>

                  <div className="mt-3 text-sm leading-7 text-slate-600">
                    {row.intro || "소개가 없습니다."}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        row.is_public
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {row.is_public ? "공개" : "비공개"}
                    </span>

                    {row.website_url ? (
                      <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                        홈페이지
                      </span>
                    ) : null}

                    {row.youtube_url ? (
                      <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                        유튜브
                      </span>
                    ) : null}
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
                      onClick={() => toggleVisibility(row)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900"
                      disabled={saving}
                    >
                      {row.is_public ? "비공개로 전환" : "공개로 전환"}
                    </button>

                    <Link
                      href={`/expo/booths/${row.booth_id}`}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-900"
                    >
                      부스 보기
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-black">부스 편집</h2>

          {!selected ? (
            <div className="rounded-xl bg-slate-50 p-4 text-slate-500">
              왼쪽에서 부스를 선택해 주세요.
            </div>
          ) : (
            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-bold">부스명</label>
                <input
                  value={selected.name || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">한줄 소개</label>
                <input
                  value={selected.intro || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, intro: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">상세 설명</label>
                <textarea
                  value={selected.description || ""}
                  onChange={(e) =>
                    setSelected({ ...selected, description: e.target.value })
                  }
                  className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">운영 상태</label>
                <select
                  value={selected.status || "draft"}
                  onChange={(e) =>
                    setSelected({ ...selected, status: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="draft">초안</option>
                  <option value="live">운영중</option>
                  <option value="closed">종료</option>
                </select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">홈페이지 URL</label>
                  <input
                    value={selected.website_url || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, website_url: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">유튜브 URL</label>
                  <input
                    value={selected.youtube_url || ""}
                    onChange={(e) =>
                      setSelected({ ...selected, youtube_url: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold">대표 이미지 업로드</label>

                  {selected.hero_image_url ? (
                    <img
                      src={selected.hero_image_url}
                      alt="대표 이미지"
                      className="mb-3 h-36 w-full rounded-xl border object-cover"
                    />
                  ) : (
                    <div className="mb-3 flex h-36 w-full items-center justify-center rounded-xl border bg-slate-50 text-sm text-slate-500">
                      대표 이미지 없음
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(
                        "hero_image_url",
                        e.target.files?.[0] || null
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold">로고 업로드</label>

                  {selected.logo_url ? (
                    <img
                      src={selected.logo_url}
                      alt="로고"
                      className="mb-3 h-36 w-full rounded-xl border bg-white object-contain"
                    />
                  ) : (
                    <div className="mb-3 flex h-36 w-full items-center justify-center rounded-xl border bg-slate-50 text-sm text-slate-500">
                      로고 없음
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(
                        "logo_url",
                        e.target.files?.[0] || null
                      )
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-3"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="is_public"
                  type="checkbox"
                  checked={!!selected.is_public}
                  onChange={(e) =>
                    setSelected({ ...selected, is_public: e.target.checked })
                  }
                />
                <label htmlFor="is_public" className="text-sm font-bold">
                  공개 상태로 운영
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveBooth}
                  disabled={saving}
                  className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-60"
                >
                  {saving ? "저장 중..." : "부스 저장"}
                </button>

                <Link
                  href={`/expo/booths/${selected.booth_id}`}
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-900"
                >
                  공개 부스 보기
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "slate" | "yellow" | "green" | "blue";
}) {
  const map = {
    slate: "bg-slate-900 text-white",
    yellow: "bg-yellow-500 text-white",
    green: "bg-emerald-600 text-white",
    blue: "bg-blue-600 text-white",
  };

  return (
    <div className={`rounded-2xl p-5 ${map[tone]}`}>
      <div className="text-sm font-bold opacity-90">{label}</div>
      <div className="mt-2 text-3xl font-black">{value}</div>
    </div>
  );
}