"use client";

import { useEffect, useMemo, useState } from "react";
import type { BoxPrize } from "./page";

type Winner = {
  id: string;
  draw_number: number;
  winner_name?: string | null;
  winner_phone?: string | null;
};

function pad(n: number) {
  return String(n || 0).padStart(4, "0");
}

function getCurrentEventId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("current_event_id");
}

export default function BoxDrawClient({ prizes }: { prizes: BoxPrize[] }) {
  const [selectedPrizeId, setSelectedPrizeId] = useState(prizes[0]?.id || "");
  const [eventId, setEventId] = useState<string | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [opened, setOpened] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("추첨할 경품을 선택하세요.");

  const prize = useMemo(
    () => prizes.find((p) => p.id === selectedPrizeId) || null,
    [prizes, selectedPrizeId]
  );

  useEffect(() => {
    const id = getCurrentEventId();
    setEventId(id);

    if (!id) {
      setMessage("현재 선택된 이벤트가 없습니다. /admin/live-events 에서 이벤트를 먼저 선택하세요.");
    }
  }, []);

  async function startDraw() {
    if (!prize || loading) return;

    const currentEventId = getCurrentEventId();

    if (!currentEventId) {
      setMessage("현재 선택된 이벤트가 없습니다. 먼저 이벤트를 선택하세요.");
      return;
    }

    setEventId(currentEventId);
    setLoading(true);
    setWinners([]);
    setOpened(Array.from({ length: prize.quantity || 1 }, () => false));
    setMessage("추첨 중입니다...");

    try {
      const res = await fetch("/api/admin/live-draw/box-pick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: currentEventId,
          prize_id: prize.id,
          count: prize.quantity || 1,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "추첨에 실패했습니다.");
      }

      const result = data.winners || [];
      setWinners(result);
      setOpened(Array.from({ length: result.length }, () => false));
      setMessage("당첨번호를 공개합니다.");

      result.forEach((_: Winner, index: number) => {
        setTimeout(() => {
          setOpened((prev) => {
            const next = [...prev];
            next[index] = true;
            return next;
          });
        }, 700 * (index + 1));
      });

      setTimeout(() => {
        setMessage("추첨 완료! 당첨자 배송정보 수집 단계로 이동하세요.");
      }, 700 * result.length + 700);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "추첨 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.kicker}>K-AGRI LIVE DRAW</p>
        <h1 style={styles.title}>경품추첨</h1>
        <p style={styles.desc}>박스가 하나씩 열리며 당첨번호가 공개됩니다.</p>
        <p style={styles.eventId}>현재 이벤트 ID: {eventId || "선택 안 됨"}</p>
      </section>

      <section style={styles.topPanel}>
        <select
          value={selectedPrizeId}
          onChange={(e) => {
            setSelectedPrizeId(e.target.value);
            setWinners([]);
            setOpened([]);
            setMessage("추첨할 경품을 선택하세요.");
          }}
          style={styles.select}
        >
          {prizes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} / {p.quantity || 1}명
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={startDraw}
          disabled={loading || !prize}
          style={{
            ...styles.drawButton,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "추첨 중..." : "박스추첨 시작"}
        </button>
      </section>

      {message && <div style={styles.message}>{message}</div>}

      {prize && (
        <section style={styles.prizeStage}>
          <div style={styles.productImageBox}>
            {prize.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prize.image_url} alt={prize.title} style={styles.productImage} />
            ) : (
              <div style={styles.noImage}>이미지 없음</div>
            )}
          </div>

          <div style={styles.productInfo}>
            <p style={styles.sponsor}>{prize.sponsor || "K-Agri Expo"}</p>
            <h2 style={styles.productTitle}>{prize.title}</h2>
            <p style={styles.quantity}>당첨 수량 {prize.quantity || 1}명</p>
            <p style={styles.productDesc}>{prize.description || "라이브 경품 추첨"}</p>
          </div>
        </section>
      )}

      <section style={styles.boxArea}>
        {Array.from({ length: winners.length || prize?.quantity || 0 }).map((_, i) => {
          const winner = winners[i];
          const isOpen = opened[i];

          return (
            <div key={i} style={styles.flipScene}>
              <div
                style={{
                  ...styles.flipCard,
                  transform: isOpen ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
              >
                <div style={{ ...styles.face, ...styles.front }}>
                  <div style={styles.giftIcon}>🎁</div>
                  <div style={styles.boxLabel}>{i + 1}번 박스</div>
                </div>

                <div style={{ ...styles.face, ...styles.back }}>
                  <div style={styles.winnerLabel}>당첨번호</div>
                  <div style={styles.number}>
                    {winner ? pad(Number(winner.draw_number)) : "----"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #172554 0%, #020617 48%, #000 100%)",
    color: "white",
    padding: "34px 34px 60px",
    overflowX: "hidden",
  },
  hero: {
    maxWidth: 1180,
    margin: "0 auto 22px",
    textAlign: "center",
  },
  kicker: {
    margin: 0,
    color: "#86efac",
    fontWeight: 950,
    letterSpacing: "0.16em",
    fontSize: 18,
  },
  title: {
    margin: "10px 0",
    fontSize: 72,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-0.05em",
  },
  desc: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: 22,
    fontWeight: 800,
  },
  eventId: {
    margin: "12px 0 0",
    color: "#93c5fd",
    fontSize: 14,
    fontWeight: 900,
  },
  topPanel: {
    maxWidth: 820,
    margin: "0 auto 18px",
    display: "grid",
    gridTemplateColumns: "1fr 260px",
    gap: 14,
  },
  select: {
    width: "100%",
    borderRadius: 20,
    border: "1px solid rgba(255,255,255,0.18)",
    padding: "18px 20px",
    fontSize: 21,
    fontWeight: 900,
    color: "white",
    background: "#0f172a",
    outline: "none",
  },
  drawButton: {
    border: 0,
    borderRadius: 20,
    padding: "18px 22px",
    background: "linear-gradient(180deg, #ef4444, #b91c1c)",
    color: "white",
    fontSize: 22,
    fontWeight: 950,
    cursor: "pointer",
    boxShadow: "0 18px 38px rgba(239,68,68,0.35)",
  },
  message: {
    maxWidth: 980,
    margin: "0 auto 22px",
    padding: "18px 20px",
    borderRadius: 18,
    background: "rgba(255,255,255,0.12)",
    textAlign: "center",
    fontWeight: 950,
    fontSize: 20,
    color: "#fef3c7",
  },
  prizeStage: {
    maxWidth: 980,
    margin: "0 auto 34px",
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: 28,
    alignItems: "center",
    background: "rgba(255,255,255,0.09)",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: 34,
    padding: 24,
    boxShadow: "0 25px 70px rgba(0,0,0,0.35)",
  },
  productImageBox: {
    width: "100%",
    height: 300,
    borderRadius: 28,
    background: "rgba(255,255,255,0.12)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 12,
    boxSizing: "border-box",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  noImage: {
    color: "#cbd5e1",
    fontSize: 22,
    fontWeight: 900,
  },
  productInfo: {
    minWidth: 0,
  },
  sponsor: {
    margin: 0,
    color: "#86efac",
    fontSize: 22,
    fontWeight: 950,
  },
  productTitle: {
    margin: "8px 0 12px",
    fontSize: 56,
    lineHeight: 1.05,
    fontWeight: 950,
    letterSpacing: "-0.05em",
  },
  quantity: {
    margin: "0 0 10px",
    fontSize: 26,
    color: "#fef3c7",
    fontWeight: 950,
  },
  productDesc: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: 20,
    lineHeight: 1.5,
    fontWeight: 700,
  },
  boxArea: {
    maxWidth: 1180,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 20,
  },
  flipScene: {
    perspective: "1000px",
    height: 170,
  },
  flipCard: {
    position: "relative",
    width: "100%",
    height: "100%",
    transformStyle: "preserve-3d",
    transition: "transform 0.8s cubic-bezier(.2,.8,.2,1)",
  },
  face: {
    position: "absolute",
    inset: 0,
    borderRadius: 28,
    backfaceVisibility: "hidden",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid #fde68a",
    boxShadow: "0 22px 45px rgba(250,204,21,0.28)",
  },
  front: {
    background: "linear-gradient(180deg, #fef3c7, #f59e0b)",
    color: "#111827",
  },
  back: {
    transform: "rotateY(180deg)",
    background: "linear-gradient(180deg, #fff7ed, #facc15)",
    color: "#111827",
  },
  giftIcon: {
    fontSize: 58,
  },
  boxLabel: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: 950,
  },
  winnerLabel: {
    fontSize: 19,
    fontWeight: 950,
  },
  number: {
    marginTop: 4,
    fontSize: 54,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-0.06em",
  },
};