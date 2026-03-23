"use client";

import { useEffect, useMemo, useState } from "react";

type EventRow = {
  id: number;
  title: string;
  description: string | null;
  status: string | null;
  video_url: string | null;
  price_text: string | null;
  notice_lines: string | null;
};

type EventListRow = {
  id: number;
  title: string;
  status: string | null;
};

export default function AdminEventEditPage() {
  const [events, setEvents] = useState<EventListRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "open",
    video_url: "",
    price_text: "",
    notice_lines: "",
  });

  const currentEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId),
    [events, selectedEventId]
  );

  const loadEvents = async () => {
    const res = await fetch("/api/admin/events", { cache: "no-store" });
    const data = await res.json();

    if (data.success) {
      const list = data.events || [];
      setEvents(list);

      if (list.length > 0 && !list.find((e: EventListRow) => e.id === selectedEventId)) {
        setSelectedEventId(list[0].id);
      }
    }
  };

  const loadEventDetail = async (eventId: number) => {
    setErrorText("");
    setMessage("");

    const res = await fetch(`/api/admin/events/${eventId}`, {
      cache: "no-store",
    });
    const data = await res.json();

    if (!data.success) {
      setErrorText(data.error || "이벤트 정보를 불러오지 못했습니다.");
      return;
    }

    const event: EventRow = data.event;

    setForm({
      title: event.title || "",
      description: event.description || "",
      status: (event.status as "open" | "closed" | "done") || "open",
      video_url: event.video_url || "",
      price_text: event.price_text || "",
      notice_lines: event.notice_lines || "",
    });
  };

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventDetail(selectedEventId);
    }
  }, [selectedEventId]);

  const onSave = async () => {
    setLoading(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch(`/api/admin/events/${selectedEventId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "저장에 실패했습니다.");
        return;
      }

      setMessage("저장되었습니다.");
      await loadEvents();
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-sm font-black text-emerald-700">CMS</div>
              <h1 className="mt-2 text-3xl font-black">이벤트 내용 관리</h1>
              <p className="mt-2 text-slate-600">
                이벤트 제목, 설명, 영상 링크, 가격 문구, 안내사항을 직접 수정합니다.
              </p>
            </div>

            <div className="w-full md:w-80">
              <label className="mb-2 block text-sm font-bold">이벤트 선택</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    [{event.id}] {event.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorText ? (
            <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700">
              {errorText}
            </div>
          ) : null}

          {message ? (
            <div className="mt-4 rounded-xl bg-emerald-100 px-4 py-3 font-bold text-emerald-700">
              {message}
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-bold">이벤트 제목</label>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="예: 영진로타리 산악형 돌분쇄기 1대 추첨 증정"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">가격 문구</label>
              <input
                value={form.price_text}
                onChange={(e) => setForm((p) => ({ ...p, price_text: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="예: 1500만원 상당"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">이벤트 상태</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    status: e.target.value as "open" | "closed" | "done",
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              >
                <option value="open">open (응모 가능)</option>
                <option value="closed">closed (응모 마감)</option>
                <option value="done">done (이벤트 종료)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">유튜브 영상 링크</label>
              <input
                value={form.video_url}
                onChange={(e) => setForm((p) => ({ ...p, video_url: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="예: https://www.youtube.com/watch?v=abcdefg"
              />
              <div className="mt-2 text-sm text-slate-500">
                watch?v= 형태 주소를 넣어도 되고, embed 주소를 넣어도 됩니다.
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">이벤트 설명</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="min-h-[180px] w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="이벤트 설명 입력"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">안내사항</label>
              <textarea
                value={form.notice_lines}
                onChange={(e) => setForm((p) => ({ ...p, notice_lines: e.target.value }))}
                className="min-h-[220px] w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="한 줄에 하나씩 입력하면 관리하기 쉽습니다."
              />
              <div className="mt-2 text-sm text-slate-500">
                여러 줄 입력하면 나중에 이벤트 페이지에서 줄별 안내사항으로 출력하기 좋습니다.
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSave}
                disabled={loading}
                className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-60"
              >
                {loading ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">PREVIEW INFO</div>
          <h2 className="mt-2 text-2xl font-black">현재 선택 이벤트</h2>

          <div className="mt-4 grid gap-3 text-sm text-slate-700">
            <div>
              <span className="font-black">이벤트:</span>{" "}
              {currentEvent ? `[${currentEvent.id}] ${currentEvent.title}` : "-"}
            </div>
            <div>
              <span className="font-black">상태:</span> {form.status}
            </div>
            <div>
              <span className="font-black">영상 링크:</span>{" "}
              {form.video_url ? form.video_url : "없음"}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}