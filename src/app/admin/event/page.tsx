"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type EventRow = {
  id: number;
  title: string;
  status: string | null;
};

type WinnerRow = {
  id: number;
  event_id: number;
  entry_id: number;
  entry_code: string;
  name: string;
  phone: string;
  prize_rank: number;
  confirmed: boolean;
  drawn_at: string;
};

const COUNTDOWN_SECONDS = 120;

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export default function AdminEventPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | "">("");
  const [selectedEventStatus, setSelectedEventStatus] = useState<string>("open");

  const [loading, setLoading] = useState(false);
  const [winner, setWinner] = useState<WinnerRow | null>(null);
  const [errorText, setErrorText] = useState("");
  const [history, setHistory] = useState<WinnerRow[]>([]);

  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === Number(selectedEventId)) || null,
    [events, selectedEventId]
  );

  const loadHistory = useCallback(async (eventId: number) => {
    const res = await fetch(`/api/admin/winners?event_id=${eventId}`, {
      cache: "no-store",
    });
    const data = await safeJson(res);

    if (data?.success) {
      setHistory(data.winners || []);
    } else {
      setHistory([]);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    const res = await fetch("/api/admin/events", { cache: "no-store" });
    const data = await safeJson(res);

    if (!data?.success) {
      setEvents([]);
      setSelectedEventId("");
      setSelectedEventStatus("open");
      return;
    }

    const nextEvents: EventRow[] = data.events || [];
    setEvents(nextEvents);

    if (nextEvents.length === 0) {
      setSelectedEventId("");
      setSelectedEventStatus("open");
      setHistory([]);
      return;
    }

    const nextSelectedId =
      selectedEventId === "" ||
      !nextEvents.some((e) => e.id === Number(selectedEventId))
        ? nextEvents[0].id
        : Number(selectedEventId);

    setSelectedEventId(nextSelectedId);

    const current =
      nextEvents.find((e) => e.id === nextSelectedId) || nextEvents[0];

    setSelectedEventStatus(current.status || "open");
  }, [selectedEventId]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (!selectedEventId) {
      setHistory([]);
      return;
    }

    const current = events.find((e) => e.id === Number(selectedEventId));
    setSelectedEventStatus(current?.status || "open");
    void loadHistory(Number(selectedEventId));
  }, [selectedEventId, events, loadHistory]);

  useEffect(() => {
    if (!timerRunning) return;

    if (secondsLeft <= 0) {
      setTimerRunning(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [timerRunning, secondsLeft]);

  const changeEventStatus = async (status: "open" | "closed" | "done") => {
    if (!selectedEventId) {
      setErrorText("이벤트를 먼저 선택해 주세요.");
      return;
    }

    setLoading(true);
    setErrorText("");

    try {
      const res = await fetch("/api/admin/event-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: Number(selectedEventId),
          status,
        }),
      });

      const data = await safeJson(res);

      if (!data?.success) {
        setErrorText(data?.error || "이벤트 상태 변경 중 오류가 발생했습니다.");
        return;
      }

      setSelectedEventStatus(status);
      await loadEvents();
      await loadHistory(Number(selectedEventId));
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const drawWinner = async (prizeRank: number) => {
    if (!selectedEventId) {
      setErrorText("이벤트를 먼저 선택해 주세요.");
      return;
    }

    if (selectedEventStatus === "open") {
      setErrorText("먼저 응모를 마감해 주세요.");
      return;
    }

    setLoading(true);
    setErrorText("");
    setWinner(null);
    setTimerRunning(false);
    setSecondsLeft(COUNTDOWN_SECONDS);

    try {
      const res = await fetch("/api/admin/draw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: Number(selectedEventId),
          prize_rank: prizeRank,
        }),
      });

      const data = await safeJson(res);

      if (!data?.success) {
        setErrorText(data?.error || "추첨 중 오류가 발생했습니다.");
        return;
      }

      setWinner(data.winner || null);
      setSecondsLeft(COUNTDOWN_SECONDS);
      setTimerRunning(true);
      await loadHistory(Number(selectedEventId));
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const redrawWinner = async () => {
    if (!winner) {
      setErrorText("재추첨할 당첨 후보가 없습니다.");
      return;
    }

    await drawWinner(winner.prize_rank);
  };

  const confirmWinner = async () => {
    if (!winner) {
      setErrorText("확정할 당첨 후보가 없습니다.");
      return;
    }

    setLoading(true);
    setErrorText("");

    try {
      const res = await fetch("/api/admin/confirm-winner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          winner_id: winner.id,
        }),
      });

      const data = await safeJson(res);

      if (!data?.success) {
        setErrorText(data?.error || "당첨 확정 중 오류가 발생했습니다.");
        return;
      }

      setWinner((prev) => (prev ? { ...prev, confirmed: true } : prev));
      setTimerRunning(false);
      await loadHistory(Number(selectedEventId));
      await loadEvents();
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const drawDisabled =
    loading || !selectedEventId || selectedEventStatus === "open";

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-white p-5 shadow-lg sm:p-6">
          <h1 className="text-3xl font-black">라이브 이벤트 추첨 관리자</h1>
          <p className="mt-2 text-slate-600">
            응모를 마감한 뒤 등수별 추첨을 진행하고, 2분 안에 전화 연결이 되면
            당첨 확정합니다.
          </p>

          <div className="mt-6">
            <label className="mb-2 block text-sm font-bold">이벤트 선택</label>
            <select
              value={selectedEventId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedEventId(value ? Number(value) : "");
                setWinner(null);
                setTimerRunning(false);
                setSecondsLeft(COUNTDOWN_SECONDS);
                setErrorText("");
              }}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              {events.length === 0 ? (
                <option value="">이벤트가 없습니다</option>
              ) : null}

              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  [{event.id}] {event.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">
              현재 상태: {selectedEventStatus || "open"}
            </div>

            {selectedEvent ? (
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700">
                선택 이벤트: {selectedEvent.title}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => changeEventStatus("closed")}
              disabled={loading || !selectedEventId}
              className="rounded-2xl bg-red-600 px-4 py-3 font-black text-white disabled:opacity-60"
            >
              응모 마감
            </button>

            <button
              type="button"
              onClick={() => changeEventStatus("open")}
              disabled={loading || !selectedEventId}
              className="rounded-2xl bg-emerald-700 px-4 py-3 font-black text-white disabled:opacity-60"
            >
              응모 재개
            </button>

            <button
              type="button"
              onClick={() => changeEventStatus("done")}
              disabled={loading || !selectedEventId}
              className="rounded-2xl bg-slate-800 px-4 py-3 font-black text-white disabled:opacity-60"
            >
              이벤트 종료
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => drawWinner(1)}
              disabled={drawDisabled}
              className="rounded-2xl bg-yellow-400 px-5 py-3 font-black text-slate-900 disabled:opacity-60"
            >
              {loading ? "처리 중..." : "1등 추첨"}
            </button>

            <button
              type="button"
              onClick={() => drawWinner(2)}
              disabled={drawDisabled}
              className="rounded-2xl bg-slate-800 px-5 py-3 font-black text-white disabled:opacity-60"
            >
              {loading ? "처리 중..." : "2등 추첨"}
            </button>

            <button
              type="button"
              onClick={() => drawWinner(3)}
              disabled={drawDisabled}
              className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white disabled:opacity-60"
            >
              {loading ? "처리 중..." : "3등 추첨"}
            </button>
          </div>

          {selectedEventStatus === "open" ? (
            <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
              추첨 전에 먼저 <b>응모 마감</b>을 눌러 주세요.
            </div>
          ) : null}

          {errorText ? (
            <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700">
              {errorText}
            </div>
          ) : null}
        </section>

        {winner ? (
          <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-2xl sm:p-8">
            <div className="text-sm font-bold text-emerald-300">현재 당첨 후보</div>
            <div className="mt-3 text-4xl font-black sm:text-5xl">
              {winner.prize_rank}등
            </div>

            <div className="mt-6 rounded-2xl bg-white/10 p-5 sm:p-6">
              <div className="text-sm text-slate-300">참가번호</div>
              <div className="mt-2 break-all text-4xl font-black tracking-wide text-yellow-300 sm:text-5xl">
                {winner.entry_code}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm text-slate-300">이름</div>
                  <div className="mt-1 text-xl font-bold">{winner.name}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-300">전화번호</div>
                  <div className="mt-1 text-xl font-bold">{winner.phone}</div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-black/20 p-5 text-center">
                <div className="text-sm font-bold text-slate-300">
                  전화 대기 시간
                </div>
                <div className="mt-2 text-5xl font-black text-orange-300 sm:text-6xl">
                  {formatTime(secondsLeft)}
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  발표 후 2분 안에 전화 연결이 되어야 최종 확정됩니다.
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={confirmWinner}
                  disabled={loading || winner.confirmed}
                  className="rounded-2xl bg-yellow-400 px-5 py-3 font-black text-slate-900 disabled:opacity-60"
                >
                  {winner.confirmed ? "당첨 확정 완료" : "당첨 확정"}
                </button>

                <button
                  type="button"
                  onClick={redrawWinner}
                  disabled={loading}
                  className="rounded-2xl bg-red-600 px-5 py-3 font-black text-white disabled:opacity-60"
                >
                  재추첨
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl bg-white p-5 shadow-lg sm:p-6">
          <h2 className="text-2xl font-black">추첨 기록</h2>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="px-3 py-3">등수</th>
                  <th className="px-3 py-3">참가번호</th>
                  <th className="px-3 py-3">이름</th>
                  <th className="px-3 py-3">전화번호</th>
                  <th className="px-3 py-3">확정 여부</th>
                  <th className="px-3 py-3">추첨시각</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      아직 추첨 기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  history.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="px-3 py-3 font-bold">{row.prize_rank}등</td>
                      <td className="px-3 py-3">{row.entry_code}</td>
                      <td className="px-3 py-3">{row.name}</td>
                      <td className="px-3 py-3">{row.phone}</td>
                      <td className="px-3 py-3">
                        {row.confirmed ? "확정" : "대기"}
                      </td>
                      <td className="px-3 py-3">
                        {new Date(row.drawn_at).toLocaleString("ko-KR")}
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