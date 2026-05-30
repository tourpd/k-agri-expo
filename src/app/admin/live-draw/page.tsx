"use client";

import { useEffect, useMemo, useState } from "react";

type Participant = {
  id: string;
  name?: string | null;
  phone?: string | null;
  phone_display?: string | null;
  region?: string | null;
  crop?: string | null;
  farm_size?: string | null;
  is_drawn?: boolean | null;
  confirmed_winner?: boolean | null;
  call_status?: string | null;
  drawn_at?: string | null;
  confirmed_at?: string | null;
  note?: string | null;
  draw_number?: number | null;
  locked_candidate_no?: number | null;
};

function getCurrentEventId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("current_event_id");
}

function safe(v?: string | null, fallback = "-") {
  const s = String(v || "").trim();
  return s ? s : fallback;
}

function formatPhone(v?: string | null) {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return safe(v);
}

function statusText(v?: string | null) {
  switch (v) {
    case "calling":
      return "전화 중";
    case "answered":
      return "당첨 확정";
    case "missed":
      return "미응답";
    case "not_called":
      return "미추첨";
    default:
      return v || "미추첨";
  }
}

function getDrawNumber(p?: Participant | null) {
  if (!p) return null;
  if (p.draw_number) return Number(p.draw_number);
  if (p.locked_candidate_no) return Number(p.locked_candidate_no);

  const compact = String(p.id || "").replace(/\D/g, "").slice(-4);
  return compact ? Number(compact) : null;
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function updateBroadcastState({
  eventId,
  phase,
  participant,
  message,
}: {
  eventId: string | null;
  phase:
    | "idle"
    | "ready"
    | "countdown"
    | "spinning"
    | "calling"
    | "call_check"
    | "winner_reveal"
    | "confirmed"
    | "missed"
    | "next_ready";
  participant?: Participant | null;
  message?: string;
}) {
  if (!eventId) return;

  await fetch("/api/admin/live-broadcast/state", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_id: eventId,
      broadcast_phase: phase,
      current_participant_id: participant?.id || null,
      draw_number: getDrawNumber(participant),
      winner_name: participant?.name || null,
      display_message: message || null,
    }),
  }).catch(() => null);
}

export default function LiveDrawAdminPage() {
  const [candidate, setCandidate] = useState<Participant | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [note, setNote] = useState("");

  const phoneText = useMemo(() => {
    return formatPhone(candidate?.phone);
  }, [candidate?.phone]);

  useEffect(() => {
    const id = getCurrentEventId();
    setEventId(id);
    setMessage(
      id
        ? "전화추첨 관리자 화면이 준비되었습니다."
        : "현재 선택된 이벤트가 없습니다. 먼저 관제센터에서 이벤트를 선택하세요."
    );

    if (id) {
      updateBroadcastState({
        eventId: id,
        phase: "ready",
        message: "전화추첨 준비 중",
      });
    }
  }, []);

  async function pickCandidate() {
    const currentEventId = getCurrentEventId();

    if (!currentEventId) {
      setMessage("현재 선택된 이벤트가 없습니다. 먼저 이벤트를 선택하세요.");
      return;
    }

    setEventId(currentEventId);
    setLoading(true);
    setMessage("");
    setCopied(false);
    setNote("");

    await updateBroadcastState({
      eventId: currentEventId,
      phase: "spinning",
      message: "전화추첨 후보를 뽑는 중입니다",
    });

    try {
      const res = await fetch("/api/admin/live-draw/pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: currentEventId }),
      });

      const data = await readJsonSafe(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.message || "후보 추첨에 실패했습니다.");
      }

      const picked =
        data?.participant || data?.winner || data?.data || data?.candidate || data;

      if (!picked?.id) {
        throw new Error("추첨된 후보 정보를 찾을 수 없습니다. API 응답 구조를 확인하세요.");
      }

      setCandidate(picked);

      await updateBroadcastState({
        eventId: currentEventId,
        phase: "call_check",
        participant: picked,
        message: "후보자에게 전화 연결 중입니다",
      });

      setMessage("후보가 추첨되었습니다. 화면의 전화번호로 직접 전화하세요.");
    } catch (err) {
      setCandidate(null);

      await updateBroadcastState({
        eventId: currentEventId,
        phase: "ready",
        message: "전화추첨을 다시 준비해주세요",
      });

      setMessage(err instanceof Error ? err.message : "후보 추첨 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmWinner() {
    if (!candidate?.id) return;

    const currentEventId = getCurrentEventId();

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-draw/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: candidate.id,
          event_id: currentEventId,
          note,
        }),
      });

      const data = await readJsonSafe(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.message || "당첨 확정 처리에 실패했습니다.");
      }

      const updated =
        data?.participant || data?.winner || data?.data || data?.candidate || data;

      const finalCandidate = updated?.id
        ? updated
        : { ...candidate, call_status: "answered", confirmed_winner: true };

      setCandidate(finalCandidate);

      await updateBroadcastState({
        eventId: currentEventId,
        phase: "confirmed",
        participant: finalCandidate,
        message: "전화 연결 성공! 최종 당첨 확정",
      });

      setMessage("전화 연결 성공. 당첨 확정 처리되었습니다.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "당첨 확정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function markMissed() {
    if (!candidate?.id) return;

    const currentEventId = getCurrentEventId();

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-draw/miss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: candidate.id,
          event_id: currentEventId,
          note: note || "전화 미응답",
        }),
      });

      const data = await readJsonSafe(res);

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || data?.message || "미응답 처리에 실패했습니다.");
      }

      await updateBroadcastState({
        eventId: currentEventId,
        phase: "missed",
        participant: candidate,
        message: "전화 미응답. 다음 후보를 준비합니다",
      });

      setCandidate(null);
      setNote("");
      setMessage("미응답 처리되었습니다. 다음 후보를 추첨하세요.");

      setTimeout(() => {
        updateBroadcastState({
          eventId: currentEventId,
          phase: "next_ready",
          message: "다음 후보 추첨 준비",
        });
      }, 2500);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "미응답 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPhone() {
    if (!candidate?.phone) return;

    try {
      await navigator.clipboard.writeText(String(candidate.phone));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setMessage("전화번호 복사에 실패했습니다.");
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.kicker}>K-Agri Expo LIVE EVENT</p>
          <h1 style={styles.title}>라이브 전화 추첨 관리자</h1>
          <p style={styles.desc}>
            후보 추첨 → 전화 연결 → 받으면 당첨 확정, 안 받으면 미응답 처리 후 다음 후보를 뽑습니다.
          </p>
          <p style={styles.eventId}>현재 이벤트 ID: {eventId || "선택 안 됨"}</p>
        </div>

        <button
          type="button"
          onClick={pickCandidate}
          disabled={loading}
          style={{
            ...styles.pickButton,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "처리 중..." : "랜덤 후보 추첨"}
        </button>
      </section>

      {message && <div style={styles.message}>{message}</div>}

      <section style={styles.card}>
        {!candidate ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>☎️</div>
            <h2 style={styles.emptyTitle}>아직 추첨된 후보가 없습니다</h2>
            <p style={styles.emptyText}>
              “랜덤 후보 추첨”을 누르면 방송화면에 추첨 중 상태가 먼저 뜹니다.
            </p>
          </div>
        ) : (
          <>
            <div style={styles.statusRow}>
              <span style={styles.badge}>{statusText(candidate.call_status)}</span>
              {candidate.confirmed_winner ? (
                <span style={styles.winnerBadge}>최종 당첨자</span>
              ) : null}
            </div>

            <div style={styles.candidateBox}>
              <p style={styles.label}>후보자 이름</p>
              <h2 style={styles.name}>{safe(candidate.name, "이름 없음")}</h2>

              <p style={styles.label}>전화번호</p>
              <div style={styles.phoneRow}>
                <a href={`tel:${candidate.phone || ""}`} style={styles.phone}>
                  {phoneText}
                </a>
                <button type="button" onClick={copyPhone} style={styles.copyButton}>
                  {copied ? "복사됨" : "복사"}
                </button>
              </div>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <span>지역</span>
                  <strong>{safe(candidate.region)}</strong>
                </div>
                <div style={styles.infoItem}>
                  <span>작물</span>
                  <strong>{safe(candidate.crop)}</strong>
                </div>
                <div style={styles.infoItem}>
                  <span>농장 규모</span>
                  <strong>{safe(candidate.farm_size)}</strong>
                </div>
                <div style={styles.infoItem}>
                  <span>참여 ID</span>
                  <strong>{candidate.id}</strong>
                </div>
              </div>
            </div>

            <div style={styles.noteBox}>
              <label style={styles.noteLabel}>운영 메모</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="예: 전화 연결됨 / 10번 울렸으나 미응답 / 가족이 받음 등"
                style={styles.textarea}
              />
            </div>

            <div style={styles.actionRow}>
              <button
                type="button"
                onClick={confirmWinner}
                disabled={loading || candidate.confirmed_winner === true}
                style={{
                  ...styles.confirmButton,
                  opacity: loading || candidate.confirmed_winner ? 0.55 : 1,
                }}
              >
                전화 받음 · 당첨 확정
              </button>

              <button
                type="button"
                onClick={markMissed}
                disabled={loading || candidate.confirmed_winner === true}
                style={{
                  ...styles.missButton,
                  opacity: loading || candidate.confirmed_winner ? 0.55 : 1,
                }}
              >
                10번 울림 · 미응답 처리
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f6f7fb",
    padding: "32px 20px",
    color: "#111827",
  },
  header: {
    maxWidth: 980,
    margin: "0 auto 20px",
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "center",
    flexWrap: "wrap",
  },
  kicker: {
    margin: 0,
    fontSize: 13,
    fontWeight: 800,
    color: "#2563eb",
    letterSpacing: "0.08em",
  },
  title: {
    margin: "8px 0",
    fontSize: 34,
    lineHeight: 1.15,
    fontWeight: 900,
  },
  desc: {
    margin: 0,
    maxWidth: 680,
    fontSize: 16,
    lineHeight: 1.6,
    color: "#4b5563",
  },
  eventId: {
    margin: "10px 0 0",
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 800,
  },
  pickButton: {
    border: 0,
    borderRadius: 18,
    padding: "18px 26px",
    background: "#111827",
    color: "white",
    fontSize: 20,
    fontWeight: 900,
    cursor: "pointer",
    boxShadow: "0 14px 30px rgba(17,24,39,0.22)",
  },
  message: {
    maxWidth: 980,
    margin: "0 auto 18px",
    padding: "14px 16px",
    borderRadius: 14,
    background: "#eef2ff",
    color: "#1e3a8a",
    fontSize: 15,
    fontWeight: 700,
  },
  card: {
    maxWidth: 980,
    margin: "0 auto",
    background: "white",
    borderRadius: 28,
    padding: 26,
    boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
    border: "1px solid #e5e7eb",
  },
  empty: {
    textAlign: "center",
    padding: "70px 20px",
  },
  emptyIcon: {
    fontSize: 58,
  },
  emptyTitle: {
    margin: "18px 0 8px",
    fontSize: 28,
    fontWeight: 900,
  },
  emptyText: {
    margin: 0,
    fontSize: 17,
    color: "#6b7280",
  },
  statusRow: {
    display: "flex",
    gap: 10,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  badge: {
    display: "inline-flex",
    padding: "9px 14px",
    borderRadius: 999,
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 900,
  },
  winnerBadge: {
    display: "inline-flex",
    padding: "9px 14px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#166534",
    fontWeight: 900,
  },
  candidateBox: {
    borderRadius: 24,
    border: "2px solid #111827",
    padding: 24,
    background: "#fff",
  },
  label: {
    margin: "0 0 6px",
    fontSize: 14,
    color: "#6b7280",
    fontWeight: 800,
  },
  name: {
    margin: "0 0 20px",
    fontSize: 42,
    fontWeight: 950,
  },
  phoneRow: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 22,
  },
  phone: {
    fontSize: 46,
    fontWeight: 950,
    color: "#dc2626",
    textDecoration: "none",
    letterSpacing: "-0.03em",
  },
  copyButton: {
    border: "1px solid #d1d5db",
    background: "#f9fafb",
    borderRadius: 14,
    padding: "12px 16px",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  infoItem: {
    borderRadius: 16,
    background: "#f3f4f6",
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    overflow: "hidden",
  },
  noteBox: {
    marginTop: 18,
  },
  noteLabel: {
    display: "block",
    marginBottom: 8,
    fontWeight: 900,
  },
  textarea: {
    width: "100%",
    minHeight: 92,
    borderRadius: 16,
    border: "1px solid #d1d5db",
    padding: 14,
    fontSize: 16,
    resize: "vertical",
    boxSizing: "border-box",
  },
  actionRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
    marginTop: 18,
  },
  confirmButton: {
    border: 0,
    borderRadius: 18,
    padding: "20px 18px",
    background: "#16a34a",
    color: "white",
    fontSize: 21,
    fontWeight: 950,
    cursor: "pointer",
  },
  missButton: {
    border: 0,
    borderRadius: 18,
    padding: "20px 18px",
    background: "#dc2626",
    color: "white",
    fontSize: 21,
    fontWeight: 950,
    cursor: "pointer",
  },
};