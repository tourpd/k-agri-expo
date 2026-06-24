"use client";

import { useEffect, useMemo, useState } from "react";

type EventStatus = "ready" | "live" | "ended";

type EventRow = {
  id: string;
  title: string;
  status: EventStatus;
  created_at: string;
  locked_at?: string | null;
  ended_at?: string | null;
  current_prize_id?: string | null;
};

type PrizeRow = {
  id: string;
  title: string;
  sponsor?: string | null;
  image_url?: string | null;
  media_mode?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
};

type Summary = {
  prizeCount: number;
  activePrizeCount: number;
  winnerCount: number;
  addressDoneCount: number;
  addressNeedCount: number;
};

function statusLabel(status?: string) {
  if (status === "ready") return "준비중";
  if (status === "live") return "방송중";
  if (status === "ended") return "종료";
  return "-";
}

function statusColor(status?: string) {
  if (status === "live") return { bg: "#dcfce7", color: "#166534" };
  if (status === "ended") return { bg: "#e5e7eb", color: "#374151" };
  return { bg: "#fef3c7", color: "#92400e" };
}

export default function LiveControlPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventId, setEventId] = useState<string | null>(null);
  const [prizes, setPrizes] = useState<PrizeRow[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState<Summary>({
    prizeCount: 0,
    activePrizeCount: 0,
    winnerCount: 0,
    addressDoneCount: 0,
    addressNeedCount: 0,
  });

  const currentEvent = useMemo(
    () => events.find((e) => e.id === eventId) || null,
    [events, eventId]
  );

  const currentPrize = useMemo(
    () => prizes.find((p) => p.id === selectedPrizeId) || null,
    [prizes, selectedPrizeId]
  );

  const warnings = useMemo(() => {
    const list: string[] = [];

    if (!currentEvent) list.push("현재 선택된 이벤트가 없습니다.");
    if (currentEvent?.status === "ended") list.push("이미 종료된 이벤트입니다.");
    if (summary.prizeCount === 0) list.push("등록된 경품이 없습니다.");
    if (summary.activePrizeCount === 0) list.push("사용 중인 경품이 없습니다.");
    if (summary.activePrizeCount > 0 && !selectedPrizeId) {
      list.push("현재 방송에 띄울 경품이 선택되지 않았습니다.");
    }

    return list;
  }, [currentEvent, summary, selectedPrizeId]);

  async function loadEvents(preferredEventId?: string) {
    const res = await fetch("/api/admin/live-events", { cache: "no-store" });
    const data = await res.json().catch(() => ({}));

    if (!data?.ok) return;

    const list: EventRow[] = data.events || [];
    setEvents(list);

    const saved = localStorage.getItem("current_event_id");
    const nextEventId =
      preferredEventId ||
      (saved && list.some((e) => e.id === saved) ? saved : "") ||
      list[0]?.id ||
      "";

    if (nextEventId) {
      localStorage.setItem("current_event_id", nextEventId);
      setEventId(nextEventId);
    }
  }

  async function loadSummaryAndPrizes(id: string) {
    try {
      const [prizeRes, winnerRes, broadcastRes] = await Promise.allSettled([
        fetch(`/api/admin/live-prizes?event_id=${id}`, { cache: "no-store" }),
        fetch(`/api/admin/live-winners?event_id=${id}`, { cache: "no-store" }),
        fetch(`/api/admin/live-broadcast?event_id=${id}`, { cache: "no-store" }),
      ]);

      let prizeList: PrizeRow[] = [];
      let winners: any[] = [];
      let currentPrizeIdFromServer = "";

      if (prizeRes.status === "fulfilled" && prizeRes.value.ok) {
        const prizeData = await prizeRes.value.json().catch(() => ({}));
        prizeList = prizeData.items || prizeData.prizes || [];
      }

      if (winnerRes.status === "fulfilled" && winnerRes.value.ok) {
        const winnerData = await winnerRes.value.json().catch(() => ({}));
        winners = winnerData.items || winnerData.winners || [];
      }

      if (broadcastRes.status === "fulfilled" && broadcastRes.value.ok) {
        const broadcastData = await broadcastRes.value.json().catch(() => ({}));
        currentPrizeIdFromServer =
          broadcastData?.current_prize?.id ||
          broadcastData?.event?.current_prize_id ||
          "";
      }

      const activePrizes = prizeList.filter((p) => p.is_active !== false);
      setPrizes(activePrizes);

      const savedPrizeId = localStorage.getItem(`current_prize_id_${id}`);
      const nextPrizeId =
        currentPrizeIdFromServer ||
        savedPrizeId ||
        activePrizes[0]?.id ||
        "";

      setSelectedPrizeId(nextPrizeId);

      setSummary({
        prizeCount: prizeList.length,
        activePrizeCount: activePrizes.length,
        winnerCount: winners.length,
        addressDoneCount: winners.filter(
          (w) => w.shipping_status === "address_submitted"
        ).length,
        addressNeedCount: winners.filter(
          (w) => w.shipping_status !== "address_submitted"
        ).length,
      });
    } catch {
      setPrizes([]);
      setSelectedPrizeId("");
      setSummary({
        prizeCount: 0,
        activePrizeCount: 0,
        winnerCount: 0,
        addressDoneCount: 0,
        addressNeedCount: 0,
      });
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (eventId) loadSummaryAndPrizes(eventId);
  }, [eventId]);

  function selectEvent(id: string) {
    localStorage.setItem("current_event_id", id);
    setEventId(id);
    setMessage("현재 운영 이벤트가 변경되었습니다.");
  }

  async function setCurrentPrize() {
    if (!currentEvent) {
      setMessage("먼저 이벤트를 선택하세요.");
      return;
    }

    if (!selectedPrizeId) {
      setMessage("방송에 띄울 경품을 선택하세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-events/current-prize", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: currentEvent.id,
          prize_id: selectedPrizeId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "현재 경품 변경 실패");
      }

      localStorage.setItem(`current_prize_id_${currentEvent.id}`, selectedPrizeId);
      setMessage("✅ 현재 경품이 방송화면에 반영되었습니다.");

      await loadEvents(currentEvent.id);
      await loadSummaryAndPrizes(currentEvent.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "현재 경품 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function selectNextPrize() {
    if (!currentEvent) {
      setMessage("먼저 이벤트를 선택하세요.");
      return;
    }

    if (!prizes.length) {
      setMessage("다음 경품이 없습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-events/next-prize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: currentEvent.id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "다음 경품 변경 실패");
      }

      const nextPrizeId = String(data.current_prize_id || data?.prize?.id || "");
      const nextPrizeTitle = String(data?.prize?.title || "경품");

      setSelectedPrizeId(nextPrizeId);
      localStorage.setItem(`current_prize_id_${currentEvent.id}`, nextPrizeId);
      setMessage(`➡️ 다음 경품으로 방송 전환: ${nextPrizeTitle}`);

      await loadEvents(currentEvent.id);
      await loadSummaryAndPrizes(currentEvent.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "다음 경품 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function startLive() {
    if (!currentEvent) {
      setMessage("먼저 이벤트를 선택하세요.");
      return;
    }

    if (summary.activePrizeCount === 0) {
      setMessage("사용 중인 경품이 없습니다. 먼저 경품을 편성하세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (selectedPrizeId) {
        const currentPrizeRes = await fetch("/api/admin/live-events/current-prize", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: currentEvent.id,
            prize_id: selectedPrizeId,
          }),
        });

        const currentPrizeData = await currentPrizeRes.json().catch(() => ({}));

        if (!currentPrizeRes.ok || !currentPrizeData?.ok) {
          throw new Error(currentPrizeData?.error || "현재 경품 설정 실패");
        }
      }

      const res = await fetch("/api/admin/live-events/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: currentEvent.id }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "방송 시작 실패");
      }

      localStorage.setItem("current_event_id", currentEvent.id);

      if (selectedPrizeId) {
        localStorage.setItem(`current_prize_id_${currentEvent.id}`, selectedPrizeId);
      }

      setMessage("🚀 방송이 시작되었습니다. 방송화면이 열립니다.");

      await loadEvents(currentEvent.id);
      await loadSummaryAndPrizes(currentEvent.id);

      window.open(`/admin/live-broadcast?event_id=${currentEvent.id}`, "_blank");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "방송 시작 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function endLive() {
    if (!currentEvent) {
      setMessage("먼저 이벤트를 선택하세요.");
      return;
    }

    const ok = window.confirm("방송 추첨 운영을 종료할까요?");
    if (!ok) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-events/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: currentEvent.id,
          status: "ended",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "종료 실패");
      }

      setMessage("방송 추첨 운영이 종료되었습니다.");
      await loadEvents(currentEvent.id);
      await loadSummaryAndPrizes(currentEvent.id);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "종료 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function open(path: string) {
    if (!currentEvent) {
      setMessage("먼저 이벤트를 선택하세요.");
      return;
    }

    if (path.includes("?")) {
      window.open(`${path}&event_id=${currentEvent.id}`, "_blank");
    } else {
      window.open(`${path}?event_id=${currentEvent.id}`, "_blank");
    }
  }

  function openPrizeManager() {
    if (!currentEvent) {
      setMessage("먼저 이벤트를 선택하세요.");
      return;
    }

    window.open(`/admin/live/events/${currentEvent.id}/prizes`, "_blank");
  }

  const color = statusColor(currentEvent?.status);

  return (
    <main style={S.page}>
      <section style={S.header}>
        <p style={S.kicker}>K-Agri Expo LIVE CONTROL</p>
        <h1 style={S.title}>라이브 통합 관제센터</h1>
        <p style={S.desc}>
          이벤트와 현재 경품을 선택한 뒤 방송 화면과 추첨을 운영합니다.
        </p>
      </section>

      {message && <div style={S.message}>{message}</div>}

      <section style={S.controlCard}>
        <div style={S.eventTop}>
          <div>
            <p style={S.label}>현재 운영 이벤트</p>
            <h2 style={S.eventTitle}>
              {currentEvent ? currentEvent.title : "선택된 이벤트가 없습니다"}
            </h2>
            <p style={S.eventId}>{currentEvent?.id || "이벤트를 먼저 선택하세요."}</p>
          </div>

          <span style={{ ...S.statusBadge, background: color.bg, color: color.color }}>
            {statusLabel(currentEvent?.status)}
          </span>
        </div>

        <div style={S.eventSelectRow}>
          <select
            value={eventId || ""}
            onChange={(e) => selectEvent(e.target.value)}
            style={S.select}
          >
            <option value="">이벤트 선택</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} / {statusLabel(e.status)}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => window.open("/admin/live/events", "_blank")}
            style={S.grayButton}
          >
            이벤트 관리
          </button>
        </div>

        <div style={S.prizeControlBox}>
          <div>
            <p style={S.label}>현재 방송 경품</p>
            <h2 style={S.currentPrizeTitle}>
              {currentPrize ? currentPrize.title : "선택된 경품 없음"}
            </h2>
          </div>

          <div style={S.prizeSelectRow}>
            <select
              value={selectedPrizeId}
              onChange={(e) => setSelectedPrizeId(e.target.value)}
              style={S.select}
            >
              <option value="">경품 선택</option>
              {prizes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sort_order || "-"}번 / {p.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={setCurrentPrize}
              disabled={loading || !selectedPrizeId}
              style={{
                ...S.onAirButton,
                opacity: loading || !selectedPrizeId ? 0.55 : 1,
              }}
            >
              방송에 띄우기
            </button>

            <button
              type="button"
              onClick={selectNextPrize}
              disabled={loading || !currentEvent || prizes.length === 0}
              style={{
                ...S.nextButton,
                opacity: loading || !currentEvent || prizes.length === 0 ? 0.55 : 1,
              }}
            >
              다음 경품
            </button>
          </div>
        </div>

        <div style={S.mainButtonRow}>
          <button
            type="button"
            onClick={startLive}
            disabled={loading || !currentEvent}
            style={{
              ...S.startButton,
              opacity: loading || !currentEvent ? 0.55 : 1,
            }}
          >
            🚀 방송 시작
          </button>

          <button
            type="button"
            onClick={endLive}
            disabled={loading || !currentEvent || currentEvent?.status === "ended"}
            style={{
              ...S.endButton,
              opacity:
                loading || !currentEvent || currentEvent?.status === "ended" ? 0.55 : 1,
            }}
          >
            방송 종료
          </button>
        </div>
      </section>

      <section style={S.stats}>
        <Stat label="등록 경품" value={`${summary.prizeCount}개`} />
        <Stat label="사용 중 경품" value={`${summary.activePrizeCount}개`} />
        <Stat label="당첨자" value={`${summary.winnerCount}명`} />
        <Stat label="주소입력 완료" value={`${summary.addressDoneCount}명`} />
        <Stat label="주소입력 필요" value={`${summary.addressNeedCount}명`} />
      </section>

      <section style={S.warningBox}>
        <h2 style={S.warningTitle}>운영 체크</h2>
        {warnings.length === 0 ? (
          <div style={S.safeText}>현재 이벤트는 바로 방송 운영 가능합니다.</div>
        ) : (
          <ul style={S.warningList}>
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </section>

      <section style={S.opsGrid}>
        <ActionCard
          title="① 경품 편성"
          desc="방송에 나갈 경품을 등록하고 이미지와 수량을 확인합니다."
          button="경품 편성 열기"
          onClick={openPrizeManager}
          color="#111827"
        />

        <ActionCard
          title="② 방송 화면"
          desc="OBS에 넣을 실제 방송용 화면입니다."
          button="방송 화면 열기"
          onClick={() => open("/admin/live-broadcast")}
          color="#2563eb"
        />

        <ActionCard
          title="③ 박스추첨"
          desc="일반 경품을 박스가 뒤집히는 방식으로 추첨합니다."
          button="박스추첨 실행"
          onClick={() => open("/admin/live-draw/box")}
          color="#dc2626"
        />

        <ActionCard
          title="④ 1등 전화추첨"
          desc="후보자를 뽑고 직접 전화해 받으면 최종 당첨으로 확정합니다."
          button="전화추첨 열기"
          onClick={() => open("/admin/live-draw")}
          color="#7c3aed"
        />

        <ActionCard
          title="⑤ 당첨자 배송관리"
          desc="당첨자 주소입력 상태를 보고 협찬사별 배송명단을 다운로드합니다."
          button="배송관리 열기"
          onClick={() => open("/admin/live-winners")}
          color="#16a34a"
        />

        <ActionCard
          title="⑥ 고객 참여 페이지"
          desc="고객들이 참여번호를 발급받는 페이지입니다."
          button="참여 페이지 열기"
          onClick={() => open("/expo/live/join")}
          color="#ea580c"
        />
      </section>

      <section style={S.guide}>
        <h2 style={S.guideTitle}>운영 순서</h2>
        <ol style={S.steps}>
          <li>이벤트를 선택합니다.</li>
          <li>경품 편성에서 상품과 이미지를 확인합니다.</li>
          <li>현재 방송 경품을 선택하고 <b>방송에 띄우기</b>를 누릅니다.</li>
          <li><b>방송 시작</b> 버튼을 눌러 방송 화면을 엽니다.</li>
          <li>박스추첨 또는 전화추첨을 진행합니다.</li>
          <li>방송 종료 후 배송관리에서 협찬사별 명단을 내려받습니다.</li>
        </ol>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={S.stat}>
      <p style={S.statLabel}>{label}</p>
      <strong style={S.statValue}>{value}</strong>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  button,
  onClick,
  color,
}: {
  title: string;
  desc: string;
  button: string;
  onClick: () => void;
  color: string;
}) {
  return (
    <article style={S.actionCard}>
      <h2 style={S.actionTitle}>{title}</h2>
      <p style={S.actionDesc}>{desc}</p>
      <button type="button" onClick={onClick} style={{ ...S.actionButton, background: color }}>
        {button}
      </button>
    </article>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 30,
    color: "#111827",
  },
  header: {
    maxWidth: 1320,
    margin: "0 auto 20px",
  },
  kicker: {
    margin: 0,
    color: "#2563eb",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  title: {
    margin: "8px 0",
    fontSize: 42,
    fontWeight: 950,
  },
  desc: {
    margin: 0,
    color: "#4b5563",
    fontSize: 17,
    lineHeight: 1.6,
  },
  message: {
    maxWidth: 1320,
    margin: "0 auto 18px",
    padding: 15,
    borderRadius: 14,
    background: "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 900,
  },
  controlCard: {
    maxWidth: 1320,
    margin: "0 auto 18px",
    background: "white",
    borderRadius: 28,
    padding: 24,
    boxShadow: "0 18px 42px rgba(15,23,42,0.08)",
  },
  eventTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  label: {
    margin: 0,
    color: "#6b7280",
    fontWeight: 900,
  },
  eventTitle: {
    margin: "8px 0",
    fontSize: 31,
    fontWeight: 950,
  },
  eventId: {
    margin: 0,
    color: "#6b7280",
    fontWeight: 800,
    wordBreak: "break-all",
  },
  statusBadge: {
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  eventSelectRow: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "1fr 160px",
    gap: 12,
  },
  select: {
    width: "100%",
    border: "1px solid #d1d5db",
    borderRadius: 16,
    padding: "15px 16px",
    fontSize: 17,
    fontWeight: 900,
    background: "white",
    color: "#111827",
  },
  grayButton: {
    border: 0,
    borderRadius: 16,
    background: "#6b7280",
    color: "white",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  prizeControlBox: {
    marginTop: 18,
    padding: 18,
    borderRadius: 22,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  currentPrizeTitle: {
    margin: "8px 0 14px",
    fontSize: 26,
    fontWeight: 950,
  },
  prizeSelectRow: {
    display: "grid",
    gridTemplateColumns: "1fr 180px 140px",
    gap: 12,
  },
  onAirButton: {
    border: 0,
    borderRadius: 16,
    background: "#16a34a",
    color: "white",
    fontSize: 17,
    fontWeight: 950,
    cursor: "pointer",
  },
  nextButton: {
    border: 0,
    borderRadius: 16,
    background: "#111827",
    color: "white",
    fontSize: 17,
    fontWeight: 950,
    cursor: "pointer",
  },
  mainButtonRow: {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 12,
  },
  startButton: {
    border: 0,
    borderRadius: 18,
    padding: "18px 20px",
    background: "#16a34a",
    color: "white",
    fontSize: 22,
    fontWeight: 950,
    cursor: "pointer",
  },
  endButton: {
    border: 0,
    borderRadius: 18,
    padding: "18px 20px",
    background: "#dc2626",
    color: "white",
    fontSize: 20,
    fontWeight: 950,
    cursor: "pointer",
  },
  stats: {
    maxWidth: 1320,
    margin: "0 auto 18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 12,
  },
  stat: {
    background: "white",
    borderRadius: 22,
    padding: 18,
    boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
  },
  statLabel: {
    margin: 0,
    color: "#6b7280",
    fontWeight: 900,
  },
  statValue: {
    display: "block",
    marginTop: 8,
    fontSize: 29,
    fontWeight: 950,
  },
  warningBox: {
    maxWidth: 1320,
    margin: "0 auto 18px",
    background: "white",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 16px 36px rgba(15,23,42,0.08)",
  },
  warningTitle: {
    margin: "0 0 12px",
    fontSize: 24,
    fontWeight: 950,
  },
  safeText: {
    padding: 16,
    borderRadius: 16,
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 950,
  },
  warningList: {
    margin: 0,
    padding: "16px 16px 16px 34px",
    borderRadius: 16,
    background: "#fef2f2",
    color: "#991b1b",
    fontWeight: 900,
    lineHeight: 1.9,
  },
  opsGrid: {
    maxWidth: 1320,
    margin: "0 auto 18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(330px, 1fr))",
    gap: 14,
  },
  actionCard: {
    background: "white",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 16px 36px rgba(15,23,42,0.08)",
    border: "1px solid #e5e7eb",
  },
  actionTitle: {
    margin: 0,
    fontSize: 24,
    fontWeight: 950,
  },
  actionDesc: {
    minHeight: 54,
    color: "#4b5563",
    lineHeight: 1.6,
    fontWeight: 750,
  },
  actionButton: {
    width: "100%",
    border: 0,
    borderRadius: 16,
    padding: "15px 16px",
    color: "white",
    fontSize: 17,
    fontWeight: 950,
    cursor: "pointer",
  },
  guide: {
    maxWidth: 1320,
    margin: "0 auto",
    background: "white",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 36px rgba(15,23,42,0.08)",
  },
  guideTitle: {
    margin: "0 0 12px",
    fontSize: 25,
    fontWeight: 950,
  },
  steps: {
    margin: 0,
    paddingLeft: 22,
    color: "#374151",
    fontSize: 17,
    lineHeight: 1.9,
    fontWeight: 800,
  },
};