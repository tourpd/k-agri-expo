"use client";

import { useEffect, useMemo, useState } from "react";

type EventStatus = "ready" | "live" | "ended";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  status: EventStatus;
  created_at: string;
  locked_at?: string | null;
  ended_at?: string | null;
};

function statusLabel(status: string) {
  if (status === "ready") return "준비중";
  if (status === "live") return "방송중";
  if (status === "ended") return "종료";
  return status || "-";
}

function statusColor(status: string) {
  if (status === "ready") return { bg: "#fef3c7", color: "#92400e" };
  if (status === "live") return { bg: "#dcfce7", color: "#166534" };
  if (status === "ended") return { bg: "#e5e7eb", color: "#374151" };
  return { bg: "#e5e7eb", color: "#374151" };
}

function dateText(v?: string | null) {
  if (!v) return "-";
  return new Date(v).toLocaleString("ko-KR");
}

export default function LiveEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [title, setTitle] = useState("");
  const [currentEventId, setCurrentEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const currentEvent = useMemo(
    () => events.find((e) => e.id === currentEventId) || null,
    [events, currentEventId]
  );

  async function loadEvents() {
    const res = await fetch("/api/admin/live-events", { cache: "no-store" });
    const data = await res.json();

    if (data?.ok) {
      setEvents(data.events || []);
    }
  }

  useEffect(() => {
    setCurrentEventId(localStorage.getItem("current_event_id"));
    loadEvents();
  }, []);

  async function createEvent() {
    if (!title.trim()) {
      setMessage("이벤트 이름을 입력하세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });

      const data = await res.json();

      if (!data?.ok) {
        throw new Error(data?.error || "이벤트 생성 실패");
      }

      setTitle("");
      setMessage("이벤트가 생성되었습니다.");
      await loadEvents();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이벤트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function selectEvent(event: Event) {
    localStorage.setItem("current_event_id", event.id);
    setCurrentEventId(event.id);
    setMessage(`현재 이벤트가 [${event.title}]로 선택되었습니다.`);
  }

  async function changeStatus(id: string, status: EventStatus) {
    const ok = window.confirm(
      status === "live"
        ? "이 이벤트를 방송중 상태로 전환할까요? 이제 추첨이 가능해집니다."
        : status === "ended"
        ? "이 이벤트를 종료할까요? 종료 후에는 추첨이 잠깁니다."
        : "이 이벤트를 준비중으로 변경할까요?"
    );

    if (!ok) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-events/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });

      const data = await res.json();

      if (!data?.ok) {
        throw new Error(data?.error || "상태 변경 실패");
      }

      setMessage(data.message || "이벤트 상태가 변경되었습니다.");
      await loadEvents();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "상태 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function openPage(path: string) {
    window.open(path, "_blank");
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.kicker}>K-Agri Expo LIVE PLATFORM</p>
          <h1 style={styles.title}>라이브 이벤트 운영센터</h1>
          <p style={styles.desc}>
            이벤트를 만들고, 현재 운영 이벤트를 선택한 뒤 경품·추첨·배송관리를 진행합니다.
          </p>
        </div>
      </section>

      {message && <div style={styles.message}>{message}</div>}

      <section style={styles.currentBox}>
        <div>
          <p style={styles.boxLabel}>현재 선택된 이벤트</p>
          <h2 style={styles.currentTitle}>
            {currentEvent ? currentEvent.title : "선택된 이벤트가 없습니다"}
          </h2>
          <p style={styles.currentId}>
            {currentEvent ? currentEvent.id : "먼저 아래 목록에서 이벤트를 선택하세요."}
          </p>
        </div>

        <div style={styles.quickButtons}>
          <button type="button" onClick={() => openPage("/admin/live-prizes")} style={styles.darkButton}>
            경품 편성
          </button>
          <button type="button" onClick={() => openPage("/admin/live-draw/box")} style={styles.redButton}>
            박스추첨
          </button>
          <button type="button" onClick={() => openPage("/admin/live-winners")} style={styles.greenButton}>
            배송관리
          </button>
        </div>
      </section>

      <section style={styles.createBox}>
        <h2 style={styles.sectionTitle}>새 이벤트 만들기</h2>
        <div style={styles.createRow}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 2026 6월 K-Agri 라이브 이벤트"
            style={styles.input}
          />
          <button type="button" onClick={createEvent} disabled={loading} style={styles.createButton}>
            {loading ? "처리 중..." : "이벤트 생성"}
          </button>
        </div>
      </section>

      <section style={styles.listBox}>
        <h2 style={styles.sectionTitle}>이벤트 목록</h2>

        {events.length === 0 ? (
          <div style={styles.empty}>등록된 이벤트가 없습니다.</div>
        ) : (
          <div style={styles.cards}>
            {events.map((event) => {
              const color = statusColor(event.status);
              const selected = currentEventId === event.id;

              return (
                <article
                  key={event.id}
                  style={{
                    ...styles.card,
                    border: selected ? "3px solid #2563eb" : "1px solid #e5e7eb",
                  }}
                >
                  <div style={styles.cardTop}>
                    <div>
                      <h3 style={styles.eventTitle}>{event.title}</h3>
                      <p style={styles.eventId}>{event.id}</p>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        background: color.bg,
                        color: color.color,
                      }}
                    >
                      {statusLabel(event.status)}
                    </span>
                  </div>

                  <div style={styles.metaGrid}>
                    <div style={styles.metaItem}>
                      <span>생성일</span>
                      <strong>{dateText(event.created_at)}</strong>
                    </div>
                    <div style={styles.metaItem}>
                      <span>방송 시작</span>
                      <strong>{dateText(event.locked_at)}</strong>
                    </div>
                    <div style={styles.metaItem}>
                      <span>종료일</span>
                      <strong>{dateText(event.ended_at)}</strong>
                    </div>
                  </div>

                  <div style={styles.actionRow}>
                    <button type="button" onClick={() => selectEvent(event)} style={styles.smallDarkButton}>
                      이 이벤트 사용
                    </button>

                    <button
                      type="button"
                      onClick={() => changeStatus(event.id, "ready")}
                      disabled={loading || event.status === "ended"}
                      style={styles.smallGrayButton}
                    >
                      준비중
                    </button>

                    <button
                      type="button"
                      onClick={() => changeStatus(event.id, "live")}
                      disabled={loading || event.status === "ended"}
                      style={styles.smallGreenButton}
                    >
                      방송중 시작
                    </button>

                    <button
                      type="button"
                      onClick={() => changeStatus(event.id, "ended")}
                      disabled={loading || event.status === "ended"}
                      style={styles.smallRedButton}
                    >
                      이벤트 종료
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 30,
    color: "#111827",
  },
  header: {
    maxWidth: 1280,
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
    fontSize: 40,
    fontWeight: 950,
  },
  desc: {
    margin: 0,
    color: "#4b5563",
    fontSize: 17,
  },
  message: {
    maxWidth: 1280,
    margin: "0 auto 18px",
    padding: 15,
    borderRadius: 14,
    background: "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 900,
  },
  currentBox: {
    maxWidth: 1280,
    margin: "0 auto 20px",
    background: "white",
    borderRadius: 24,
    padding: 22,
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "center",
    flexWrap: "wrap",
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
  },
  boxLabel: {
    margin: 0,
    color: "#6b7280",
    fontWeight: 900,
  },
  currentTitle: {
    margin: "8px 0",
    fontSize: 28,
    fontWeight: 950,
  },
  currentId: {
    margin: 0,
    color: "#6b7280",
    fontWeight: 800,
  },
  quickButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  darkButton: {
    border: 0,
    borderRadius: 14,
    padding: "14px 16px",
    background: "#111827",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  redButton: {
    border: 0,
    borderRadius: 14,
    padding: "14px 16px",
    background: "#dc2626",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  greenButton: {
    border: 0,
    borderRadius: 14,
    padding: "14px 16px",
    background: "#16a34a",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  createBox: {
    maxWidth: 1280,
    margin: "0 auto 20px",
    background: "white",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
  },
  sectionTitle: {
    margin: "0 0 14px",
    fontSize: 26,
    fontWeight: 950,
  },
  createRow: {
    display: "grid",
    gridTemplateColumns: "1fr 180px",
    gap: 12,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 16,
    padding: "15px 16px",
    fontSize: 17,
    fontWeight: 800,
  },
  createButton: {
    border: 0,
    borderRadius: 16,
    background: "#2563eb",
    color: "white",
    fontSize: 17,
    fontWeight: 950,
    cursor: "pointer",
  },
  listBox: {
    maxWidth: 1280,
    margin: "0 auto",
    background: "white",
    borderRadius: 24,
    padding: 22,
    boxShadow: "0 16px 40px rgba(15,23,42,0.08)",
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#6b7280",
    fontWeight: 900,
    background: "#f9fafb",
    borderRadius: 18,
  },
  cards: {
    display: "grid",
    gap: 14,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    background: "#fff",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  eventTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 950,
  },
  eventId: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 800,
    wordBreak: "break-all",
  },
  statusBadge: {
    borderRadius: 999,
    padding: "8px 12px",
    fontWeight: 950,
    whiteSpace: "nowrap",
  },
  metaGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
  },
  metaItem: {
    background: "#f9fafb",
    borderRadius: 14,
    padding: 12,
    display: "grid",
    gap: 5,
  },
  actionRow: {
    marginTop: 16,
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  smallDarkButton: {
    border: 0,
    borderRadius: 12,
    padding: "11px 13px",
    background: "#111827",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  smallGrayButton: {
    border: 0,
    borderRadius: 12,
    padding: "11px 13px",
    background: "#6b7280",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  smallGreenButton: {
    border: 0,
    borderRadius: 12,
    padding: "11px 13px",
    background: "#16a34a",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  smallRedButton: {
    border: 0,
    borderRadius: 12,
    padding: "11px 13px",
    background: "#dc2626",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
};