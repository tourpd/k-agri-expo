"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

type Prize = {
  id: string;
  title: string;
  sponsor?: string | null;
  image_url?: string | null;
  video_url?: string | null;
  media_mode?: "image" | "video" | "both" | "none" | string | null;
  event_label?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  description?: string | null;
  preview_note?: string | null;
  quantity?: number | null;
  draw_type?: "phone" | "box" | "lotto" | "random" | "main" | string | null;
  display_group?: "big" | "general" | string | null;
  winner_note?: string | null;
  number_font_size?: number | null;
  name_font_size?: number | null;
  note_font_size?: number | null;
};

type Winner = {
  id: string;
  prize_id?: string | null;
  draw_number?: number | null;
  winner_name?: string | null;
  prize_title?: string | null;
};

type BroadcastState = {
  event_id?: string | null;
  broadcast_phase?: string | null;
  current_prize_id?: string | null;
  current_participant_id?: string | null;
  display_message?: string | null;
  draw_number?: number | null;
  winner_name?: string | null;
  updated_at?: string | null;
};

function pad(n?: number | null) {
  return String(n || 0).padStart(4, "0");
}

function maskName(name?: string | null) {
  const s = String(name || "").trim();
  if (!s) return "";
  if (s.length === 1) return s;
  if (s.length === 2) return `${s[0]}*`;
  if (s.length === 3) return `${s[0]}*${s[2]}`;
  return `${s[0]}**${s[s.length - 1]}`;
}

function toEmbedUrl(url?: string | null) {
  const v = String(url || "").trim();
  if (!v) return "";

  if (v.includes("youtu.be/")) {
    const id = v.split("youtu.be/")[1]?.split("?")[0];
    return id
      ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}`
      : "";
  }

  if (v.includes("watch?v=")) {
    const id = v.split("watch?v=")[1]?.split("&")[0];
    return id
      ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}`
      : "";
  }

  if (v.includes("/embed/")) {
    const joiner = v.includes("?") ? "&" : "?";
    return `${v}${joiner}autoplay=1&mute=1&loop=1`;
  }

  return "";
}

function getDrawLabel(item?: Prize | null) {
  if (!item) return "메인 이벤트";
  if (item.event_label) return item.event_label;
  if (item.draw_type === "lotto") return "로또식 번호 추첨";
  if (item.draw_type === "phone") return "1등 전화추첨";
  if (item.draw_type === "box") return "박스추첨";
  return "메인 이벤트";
}

function getPhaseText(phase?: string | null) {
  if (phase === "spinning") return "추첨번호를 돌리는 중입니다";
  if (phase === "call_check") return "후보자 전화 연결 중";
  if (phase === "confirmed") return "최종 당첨 확정!";
  if (phase === "missed") return "전화 미응답";
  if (phase === "next_ready") return "다음 후보 추첨 준비";
  if (phase === "ready") return "전화추첨 준비 중";
  return "";
}

function playDing() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();

    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.5);
  } catch {}
}

function LiveBroadcastPageInner() {
  const searchParams = useSearchParams();

  const eventIdFromUrl =
    searchParams.get("eventId") || searchParams.get("event_id") || "";

  const [eventId, setEventId] = useState(eventIdFromUrl);
  const [eventTitle, setEventTitle] = useState("K-Agri Expo LIVE");
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [broadcastState, setBroadcastState] = useState<BroadcastState | null>(
    null
  );
  const [winners, setWinners] = useState<Winner[]>([]);
  const [message, setMessage] = useState("방송 데이터 연결 대기 중");
  const [burst, setBurst] = useState(false);
  const [stageText, setStageText] = useState("잠시 후 경품 추첨이 시작됩니다");
  const [switching, setSwitching] = useState(false);
  const [spinTick, setSpinTick] = useState(0);

  const lastWinnerId = useRef<string | null>(null);
  const lastPrizeId = useRef<string | null>(null);
  const lastPhase = useRef<string | null>(null);

  useEffect(() => {
    if (eventIdFromUrl) {
      setEventId(eventIdFromUrl);
      return;
    }

    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("current_event_id")
        : "";

    if (saved) setEventId(saved);
  }, [eventIdFromUrl]);

  async function load() {
    if (!eventId) {
      setMessage("현재 선택된 이벤트가 없습니다.");
      return;
    }

    const [broadcastRes, stateRes] = await Promise.allSettled([
      fetch(`/api/admin/live-broadcast?event_id=${eventId}`, {
        cache: "no-store",
      }),
      fetch(`/api/admin/live-broadcast/state?event_id=${eventId}`, {
        cache: "no-store",
      }),
    ]);

    if (broadcastRes.status !== "fulfilled") {
      setMessage("방송 데이터를 불러오지 못했습니다.");
      return;
    }

    const data = await broadcastRes.value.json().catch(() => ({}));

    if (!data?.ok) {
      setMessage(data?.error || "방송 데이터를 불러오지 못했습니다.");
      return;
    }

    let state: BroadcastState | null = null;

    if (stateRes.status === "fulfilled" && stateRes.value.ok) {
      const stateData = await stateRes.value.json().catch(() => ({}));
      state = stateData?.state || null;
    }

    const nextPrize = data.current_prize || null;

    if (nextPrize?.id && lastPrizeId.current && lastPrizeId.current !== nextPrize.id) {
      setSwitching(true);
      setStageText(`📡 다음 경품 전환 중: ${nextPrize.title || "라이브 경품"}`);

      setTimeout(() => {
        setSwitching(false);
      }, 1600);
    }

    if (nextPrize?.id) {
      lastPrizeId.current = nextPrize.id;
    }

    if (state?.broadcast_phase && lastPhase.current !== state.broadcast_phase) {
      lastPhase.current = state.broadcast_phase;

      if (state.broadcast_phase === "confirmed") {
        setBurst(false);
        setTimeout(() => {
          setBurst(true);
          playDing();
        }, 80);
      }
    }

    setEventTitle(data.event?.title || "K-Agri Expo LIVE");
    setPrizes(data.prizes || []);
    setCurrentPrize(nextPrize);
    setBroadcastState(state);
    setWinners(data.winners || []);
    setMessage("실시간 방송 화면 연결 완료");
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 1000);
    return () => clearInterval(t);
  }, [eventId]);

  useEffect(() => {
    const t = setInterval(() => {
      setSpinTick((v) => (v + 731) % 10000);
    }, 70);
    return () => clearInterval(t);
  }, []);

  const latestWinner = winners[0] || null;
  const phase = broadcastState?.broadcast_phase || "idle";
  const isPhoneDrawPhase = [
    "spinning",
    "call_check",
    "confirmed",
    "missed",
    "next_ready",
  ].includes(phase);

  const mainPrize = useMemo(() => {
    if (currentPrize) return currentPrize;

    if (latestWinner?.prize_id) {
      const matched = prizes.find((p) => p.id === latestWinner.prize_id);
      if (matched) return matched;
    }

    return prizes[0] || null;
  }, [currentPrize, latestWinner?.prize_id, prizes]);

  const nextPrize = useMemo(() => {
    if (!mainPrize || prizes.length <= 1) return null;
    const idx = prizes.findIndex((p) => p.id === mainPrize.id);
    return prizes[idx + 1] || prizes[0] || null;
  }, [mainPrize, prizes]);

  const recentWinners = winners.slice(0, 8);

  const stateNumber =
    broadcastState?.draw_number !== undefined && broadcastState?.draw_number !== null
      ? pad(Number(broadcastState.draw_number))
      : null;

  const spinningNumber = pad(spinTick);
  const latestNumber = latestWinner ? pad(Number(latestWinner.draw_number)) : "----";

  const mainNumber =
    phase === "spinning" ? spinningNumber : stateNumber || latestNumber;

  const displayWinnerName =
    broadcastState?.winner_name || latestWinner?.winner_name || "";

  const mediaMode = mainPrize?.media_mode || "image";
  const embedUrl = toEmbedUrl(mainPrize?.video_url);

  const showVideo =
    mediaMode !== "none" &&
    (mediaMode === "video" || mediaMode === "both") &&
    !!embedUrl;

  const showImage =
    mediaMode !== "none" &&
    (mediaMode === "image" || mediaMode === "both") &&
    !!mainPrize?.image_url;

  const drawLabel = getDrawLabel(mainPrize);

  const productHeadline =
    mainPrize?.headline || mainPrize?.title || "오늘의 라이브 경품";

  const productSubheadline =
    mainPrize?.subheadline ||
    mainPrize?.preview_note ||
    mainPrize?.description ||
    "방송 중 참여 농민 대상 라이브 이벤트 경품입니다.";

  const winnerNote =
    broadcastState?.display_message ||
    getPhaseText(phase) ||
    mainPrize?.winner_note ||
    "방송 중 전화 확인 후 최종 당첨 확정";

  const numberSize = Math.max(140, Number(mainPrize?.number_font_size || 180));
  const nameSize = Math.max(70, Number(mainPrize?.name_font_size || 86));
  const noteSize = Math.max(40, Number(mainPrize?.note_font_size || 48));

  useEffect(() => {
    if (isPhoneDrawPhase) {
      setStageText(getPhaseText(phase) || "전화추첨 진행 중");
      return;
    }

    if (!latestWinner?.id) {
      if (!switching) {
        setStageText(`잠시 후 ${drawLabel} 추첨이 시작됩니다`);
      }
      return;
    }

    if (lastWinnerId.current !== latestWinner.id) {
      lastWinnerId.current = latestWinner.id;

      setStageText(`🎉 ${drawLabel} 당첨번호 공개!`);
      setBurst(false);

      setTimeout(() => {
        setBurst(true);
        playDing();
      }, 80);

      setTimeout(() => {
        setStageText("전화 확인 또는 다음 추첨을 준비해주세요");
      }, 5200);
    }
  }, [latestWinner?.id, drawLabel, switching, phase, isPhoneDrawPhase]);

  return (
    <main style={S.page}>
      <div style={S.canvas}>
        <div style={S.confettiLayer}>
          {burst &&
            Array.from({ length: 48 }).map((_, i) => (
              <span
                key={`${latestWinner?.id || phase}-${i}`}
                style={{
                  ...S.confetti,
                  left: `${(i * 13) % 100}%`,
                  animationDelay: `${(i % 9) * 0.06}s`,
                  transform: `rotate(${i * 31}deg)`,
                }}
              />
            ))}
        </div>

        {switching ? (
          <div style={S.switchOverlay}>
            <div style={S.switchBadge}>NEXT PRIZE</div>
            <div style={S.switchTitle}>{mainPrize?.title || "다음 경품 준비중"}</div>
            <div style={S.switchSub}>
              {mainPrize?.sponsor || "K-Agri Expo"} · 방송 화면 전환 중
            </div>
          </div>
        ) : null}

        <header style={S.top}>
          <div style={S.titleBox}>
            <p style={S.kicker}>K-AGRI EXPO LIVE EVENT</p>
            <h1 style={S.title}>{eventTitle}</h1>
          </div>

          <div style={S.liveBadge}>● LIVE</div>
        </header>

        <section style={S.mcBar}>
          <strong>실시간 추첨 안내</strong>
          <span>{stageText}</span>
        </section>

        <section style={S.stage}>
          <article style={S.productPanel}>
            <div style={S.mediaArea}>
              {mediaMode === "none" ? (
                <div style={S.productFallback}>
                  <div style={S.fallbackSponsor}>
                    {mainPrize?.sponsor || "K-Agri Expo"}
                  </div>
                  <div style={S.fallbackTitle}>{productHeadline}</div>
                  <div style={S.fallbackDesc}>{productSubheadline}</div>
                </div>
              ) : showVideo && showImage ? (
                <div style={S.bothMedia}>
                  <iframe
                    src={embedUrl}
                    style={S.video}
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                  <img
                    src={mainPrize?.image_url || ""}
                    alt={mainPrize?.title || "경품 이미지"}
                    style={S.productImageSmall}
                  />
                </div>
              ) : showVideo ? (
                <iframe
                  src={embedUrl}
                  style={S.video}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              ) : showImage ? (
                <img
                  src={mainPrize?.image_url || ""}
                  alt={mainPrize?.title || "경품 이미지"}
                  style={S.productImage}
                />
              ) : (
                <div style={S.productFallback}>
                  <div style={S.fallbackSponsor}>
                    {mainPrize?.sponsor || "K-Agri Expo"}
                  </div>
                  <div style={S.fallbackTitle}>{productHeadline}</div>
                  <div style={S.fallbackDesc}>{productSubheadline}</div>
                </div>
              )}
            </div>

            <div style={S.productInfo}>
              <p style={S.sponsor}>{mainPrize?.sponsor || "K-Agri Expo"}</p>
              <h2 style={S.prizeTitle}>{productHeadline}</h2>
              <p style={S.quantity}>{productSubheadline}</p>
            </div>
          </article>

          <article
            style={{
              ...S.drawPanel,
              outline:
                phase === "spinning"
                  ? "10px solid rgba(220,38,38,0.5)"
                  : phase === "confirmed"
                    ? "10px solid rgba(22,163,74,0.55)"
                    : "none",
            }}
          >
            <div style={S.drawTypeBadge}>
              {isPhoneDrawPhase ? "전화추첨" : drawLabel}
            </div>

            {phase === "spinning" ? (
              <div style={S.machineText}>번호 추첨 중</div>
            ) : null}

            <div
              style={{
                ...S.bigNumber,
                fontSize: `clamp(150px, ${numberSize}px, 260px)`,
                transform:
                  burst || phase === "spinning" ? "scale(1.06)" : "scale(1)",
              }}
            >
              {mainNumber}
            </div>

            <div
              style={{
                ...S.winnerName,
                fontSize: displayWinnerName
                  ? `clamp(76px, ${nameSize}px, 130px)`
                  : "clamp(64px, 5vw, 110px)",
              }}
            >
              {displayWinnerName
                ? maskName(displayWinnerName)
                : phase === "spinning"
                  ? "추첨 중"
                  : "추첨 대기중"}
            </div>

            <div
              style={{
                ...S.message,
                fontSize: `clamp(40px, ${noteSize}px, 72px)`,
              }}
            >
              {winnerNote}
            </div>

            {nextPrize ? (
              <div style={S.nextPrizeBox}>
                <span>다음 경품</span>
                <strong>{nextPrize.title}</strong>
              </div>
            ) : null}
          </article>
        </section>

        <section style={S.bottom}>
          <div style={S.recentTitle}>실시간 당첨번호</div>

          {recentWinners.length === 0 ? (
            <div style={S.empty}>아직 공개된 당첨번호가 없습니다.</div>
          ) : (
            <div style={S.numberGrid}>
              {recentWinners.map((w, idx) => (
                <div
                  key={w.id}
                  style={{
                    ...S.numberCard,
                    outline: idx === 0 ? "5px solid #facc15" : "none",
                    transform: idx === 0 && burst ? "scale(1.04)" : "scale(1)",
                  }}
                >
                  <span style={S.prizeMini}>
                    {w.prize_title || mainPrize?.title || "경품"}
                  </span>
                  <strong style={S.numberText}>{pad(Number(w.draw_number))}</strong>
                  {w.winner_name ? (
                    <span style={S.nameText}>{maskName(w.winner_name)}</span>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>

        <div style={S.connectionStatus}>{message}</div>
      </div>

      <style jsx>{`
        @keyframes fall {
          0% {
            top: -40px;
            opacity: 1;
          }
          100% {
            top: 1120px;
            opacity: 0;
          }
        }

        @keyframes pulseSwitch {
          0% {
            transform: scale(0.92);
            opacity: 0;
          }
          25% {
            transform: scale(1.02);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}

export default function LiveBroadcastPage() {
  return (
    <Suspense
      fallback={
        <main style={S.page}>
          <div style={{ padding: 24, color: "#fff", fontWeight: 900 }}>
            방송 화면을 불러오는 중입니다...
          </div>
        </main>
      }
    >
      <LiveBroadcastPageInner />
    </Suspense>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    width: "100vw",
    height: "100vh",
    background: "#000",
    overflow: "hidden",
    color: "#fff",
  },
  canvas: {
    width: "100vw",
    height: "100vh",
    background:
      "radial-gradient(circle at top left, #1e40af 0%, #020617 40%, #000 100%)",
    padding: "26px 36px",
    boxSizing: "border-box",
    display: "grid",
    gridTemplateRows: "94px 64px 1fr 144px",
    gap: 14,
    position: "relative",
    overflow: "hidden",
  },
  switchOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 30,
    background:
      "radial-gradient(circle at center, rgba(250,204,21,0.96), rgba(15,23,42,0.96) 58%, rgba(0,0,0,0.98) 100%)",
    display: "grid",
    placeItems: "center",
    textAlign: "center",
    padding: 80,
    boxSizing: "border-box",
    animation: "pulseSwitch 0.45s ease-out forwards",
  },
  switchBadge: {
    display: "inline-block",
    padding: "20px 44px",
    borderRadius: 999,
    background: "#111827",
    color: "#ffffff",
    fontSize: 46,
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "0.08em",
    boxShadow: "0 18px 45px rgba(0,0,0,0.3)",
  },
  switchTitle: {
    marginTop: 42,
    color: "#111827",
    fontSize: "clamp(82px, 7vw, 150px)",
    lineHeight: 0.96,
    fontWeight: 950,
    letterSpacing: "-0.08em",
    textShadow: "0 6px 0 rgba(255,255,255,0.35)",
    wordBreak: "keep-all",
  },
  switchSub: {
    marginTop: 30,
    color: "#111827",
    fontSize: "clamp(34px, 2.8vw, 62px)",
    lineHeight: 1.2,
    fontWeight: 950,
  },
  confettiLayer: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
    zIndex: 20,
  },
  confetti: {
    position: "absolute",
    top: -40,
    width: 16,
    height: 26,
    borderRadius: 4,
    background: "#facc15",
    animation: "fall 2.7s ease-in forwards",
  },
  top: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 24,
    overflow: "hidden",
  },
  titleBox: {
    minWidth: 0,
    overflow: "hidden",
  },
  kicker: {
    margin: 0,
    color: "#86efac",
    fontSize: 18,
    fontWeight: 950,
    letterSpacing: "0.14em",
  },
  title: {
    margin: "8px 0 0",
    fontSize: "clamp(46px, 4vw, 80px)",
    lineHeight: 1,
    fontWeight: 950,
    letterSpacing: "-0.05em",
    textShadow: "0 4px 16px rgba(0,0,0,0.45)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  liveBadge: {
    flex: "0 0 auto",
    padding: "14px 24px",
    borderRadius: 999,
    background: "#dc2626",
    fontSize: 24,
    fontWeight: 950,
    boxShadow: "0 0 30px rgba(220,38,38,0.5)",
  },
  mcBar: {
    borderRadius: 20,
    background: "linear-gradient(90deg,#facc15,#fff7ed)",
    color: "#111827",
    padding: "0 22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
    fontSize: 26,
    fontWeight: 950,
    overflow: "hidden",
    whiteSpace: "nowrap",
  },
  stage: {
    display: "grid",
    gridTemplateColumns: "62% 38%",
    gap: 20,
    overflow: "hidden",
    minHeight: 0,
  },
  productPanel: {
    borderRadius: 34,
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
    padding: 18,
    display: "grid",
    gridTemplateRows: "1fr 156px",
    gap: 14,
    overflow: "hidden",
    minHeight: 0,
  },
  mediaArea: {
    borderRadius: 30,
    background: "linear-gradient(135deg,#052e16,#0f172a)",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    minHeight: 0,
  },
  bothMedia: {
    width: "100%",
    height: "100%",
    display: "grid",
    gridTemplateRows: "1fr 38%",
    gap: 10,
    padding: 10,
    boxSizing: "border-box",
    background: "#000",
  },
  productImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    background: "#000",
  },
  productImageSmall: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    display: "block",
    background: "#111827",
    borderRadius: 20,
  },
  video: {
    width: "100%",
    height: "100%",
    border: 0,
    display: "block",
    background: "#000",
    borderRadius: 20,
  },
  productFallback: {
    width: "100%",
    height: "100%",
    padding: 60,
    boxSizing: "border-box",
    display: "grid",
    alignContent: "center",
    gap: 24,
    color: "#ffffff",
    background: "linear-gradient(135deg,#052e16,#0f172a)",
  },
  fallbackSponsor: {
    color: "#86efac",
    fontSize: 44,
    fontWeight: 950,
  },
  fallbackTitle: {
    fontSize: "clamp(70px, 5vw, 110px)",
    lineHeight: 1.02,
    fontWeight: 950,
    letterSpacing: "-0.07em",
    wordBreak: "keep-all",
  },
  fallbackDesc: {
    color: "#fef3c7",
    fontSize: "clamp(34px, 2.3vw, 54px)",
    lineHeight: 1.35,
    fontWeight: 900,
  },
  productInfo: {
    overflow: "hidden",
    display: "grid",
    alignContent: "start",
    gap: 6,
    minHeight: 0,
  },
  sponsor: {
    margin: 0,
    color: "#86efac",
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 950,
  },
  prizeTitle: {
    margin: 0,
    fontSize: "clamp(44px, 3.3vw, 72px)",
    lineHeight: 0.95,
    fontWeight: 950,
    letterSpacing: "-0.06em",
    wordBreak: "keep-all",
  },
  quantity: {
    margin: 0,
    color: "#fef3c7",
    fontSize: "clamp(22px, 1.55vw, 32px)",
    lineHeight: 1.25,
    fontWeight: 900,
  },
  drawPanel: {
    borderRadius: 34,
    background: "linear-gradient(180deg,#fff7ed 0%,#facc15 100%)",
    color: "#111827",
    padding: 34,
    display: "grid",
    gridTemplateRows: "auto auto auto auto auto auto",
    alignContent: "center",
    justifyItems: "center",
    textAlign: "center",
    overflow: "hidden",
    minHeight: 0,
    transition: "all 0.25s ease",
  },
  drawTypeBadge: {
    padding: "18px 32px",
    borderRadius: 999,
    background: "#111827",
    color: "#ffffff",
    fontSize: "clamp(28px, 2vw, 42px)",
    lineHeight: 1,
    fontWeight: 950,
  },
  machineText: {
    marginTop: 32,
    padding: "14px 26px",
    borderRadius: 999,
    background: "#dc2626",
    color: "#fff",
    fontSize: "clamp(28px, 2vw, 44px)",
    fontWeight: 950,
    boxShadow: "0 14px 30px rgba(220,38,38,0.32)",
  },
  bigNumber: {
    marginTop: 42,
    lineHeight: 0.88,
    fontWeight: 950,
    color: "#dc2626",
    letterSpacing: "-0.06em",
    textShadow: "0 12px 28px rgba(220,38,38,0.28)",
    transition: "all 0.18s ease",
  },
  winnerName: {
    marginTop: 38,
    lineHeight: 1,
    fontWeight: 950,
    color: "#111827",
    wordBreak: "keep-all",
  },
  message: {
    marginTop: 42,
    lineHeight: 1.25,
    fontWeight: 950,
    color: "#111827",
    wordBreak: "keep-all",
  },
  nextPrizeBox: {
    marginTop: 30,
    width: "100%",
    borderRadius: 20,
    background: "rgba(17,24,39,0.12)",
    border: "2px solid rgba(17,24,39,0.2)",
    padding: "16px 18px",
    display: "grid",
    gap: 6,
    boxSizing: "border-box",
  },
  bottom: {
    borderRadius: 24,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    padding: 14,
    overflow: "hidden",
    minHeight: 0,
  },
  recentTitle: {
    fontSize: 22,
    fontWeight: 950,
    marginBottom: 10,
  },
  empty: {
    textAlign: "center",
    padding: 24,
    fontSize: 20,
    color: "#cbd5e1",
    fontWeight: 900,
  },
  numberGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(8,minmax(0,1fr))",
    gap: 10,
  },
  numberCard: {
    height: 78,
    borderRadius: 16,
    background: "rgba(255,255,255,0.95)",
    color: "#111827",
    padding: "6px",
    display: "grid",
    gridTemplateRows: "14px 30px 14px",
    gap: 2,
    textAlign: "center",
    overflow: "hidden",
    boxSizing: "border-box",
  },
  prizeMini: {
    fontSize: 10,
    lineHeight: "12px",
    fontWeight: 850,
    color: "#4b5563",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  numberText: {
    fontSize: 28,
    lineHeight: "30px",
    fontWeight: 950,
    color: "#dc2626",
  },
  nameText: {
    fontSize: 11,
    lineHeight: "12px",
    fontWeight: 900,
    color: "#374151",
  },
  connectionStatus: {
    position: "absolute",
    right: 22,
    bottom: 8,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: 800,
  },
};