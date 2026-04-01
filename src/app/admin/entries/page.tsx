"use client";

import { useEffect, useMemo, useState } from "react";

type EntryRow = {
  id: number;
  event_id: number;
  name: string;
  phone: string;
  entry_code: string;
  region: string | null;
  crop: string | null;
  created_at: string;
};

type EventRow = {
  id: number;
  title: string;
  status: string | null;
};

export default function AdminEntriesPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [eventId, setEventId] = useState<string>("1");
  const [keyword, setKeyword] = useState("");
  const [region, setRegion] = useState("");
  const [crop, setCrop] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (eventId) params.set("event_id", eventId);
    if (keyword.trim()) params.set("keyword", keyword.trim());
    if (region.trim()) params.set("region", region.trim());
    if (crop.trim()) params.set("crop", crop.trim());
    return params.toString();
  }, [eventId, keyword, region, crop]);

  const loadEvents = async () => {
    const res = await fetch("/api/admin/events", { cache: "no-store" });
    const data = await res.json();
    if (data.success) {
      setEvents(data.events || []);
      if (!eventId && data.events?.length) {
        setEventId(String(data.events[0].id));
      }
    }
  };

  const loadEntries = async () => {
    setLoading(true);
    setErrorText("");

    try {
      const res = await fetch(`/api/admin/entries?${queryString}`, {
        cache: "no-store",
      });
      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "응모자 조회에 실패했습니다.");
        return;
      }

      setEntries(data.entries || []);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    loadEntries();
  }, [queryString]);

  const exportCsv = () => {
    window.location.href = `/api/admin/entries/export?${queryString}`;
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-black text-emerald-700">ENTRIES</div>
              <h1 className="mt-2 text-3xl font-black">응모자 관리</h1>
              <p className="mt-2 text-slate-600">
                응모자 검색, 확인, 다운로드를 여기서 합니다.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={loadEntries}
                className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
              >
                새로고침
              </button>

              <button
                type="button"
                onClick={exportCsv}
                className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white"
              >
                CSV 다운로드
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-bold">이벤트</label>
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    [{event.id}] {event.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">이름/전화/참가번호 검색</label>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 홍길동, 010, 00012"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">지역</label>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 홍성군"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">작물</label>
              <input
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                placeholder="예: 마늘"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>
          </div>

          {errorText ? (
            <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700">
              {errorText}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-black">응모자 목록</h2>
            <div className="text-sm font-bold text-slate-500">
              {loading ? "불러오는 중..." : `총 ${entries.length.toLocaleString()}명`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-3 py-3">참가번호</th>
                  <th className="px-3 py-3">이름</th>
                  <th className="px-3 py-3">전화번호</th>
                  <th className="px-3 py-3">지역</th>
                  <th className="px-3 py-3">작물</th>
                  <th className="px-3 py-3">응모시각</th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                      응모자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  entries.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-black text-emerald-700">
                        {row.entry_code}
                      </td>
                      <td className="px-3 py-3">{row.name}</td>
                      <td className="px-3 py-3">{row.phone}</td>
                      <td className="px-3 py-3">{row.region || "-"}</td>
                      <td className="px-3 py-3">{row.crop || "-"}</td>
                      <td className="px-3 py-3">
                        {new Date(row.created_at).toLocaleString("ko-KR")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}