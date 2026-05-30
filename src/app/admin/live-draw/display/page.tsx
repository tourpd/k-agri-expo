"use client";

import { useEffect, useRef, useState } from "react";

type Winner = {
  id: string;
  name?: string | null;
  phone?: string | null;
  region?: string | null;
  crop?: string | null;
  farm_size?: string | null;
  locked_candidate_no?: number | null;
};

function onlyDigits(v?: string | null) {
  return String(v || "").replace(/\D/g, "");
}

function getCandidateNo(phone?: string | null, fallback?: number | null) {
  const d = onlyDigits(phone);
  if (d.length >= 4) return Number(d.slice(-4));
  return fallback || 0;
}

function getLen(total: number, no?: number | null) {
  return String(Math.max(total, no || 0, 9999)).length;
}

function pad(n: number | null | undefined, len: number) {
  return String(n || 0).padStart(len, "0");
}

function maskName(v?: string | null) {
  const s = String(v || "");
  if (!s) return "-";
  if (s.length === 2) return `${s[0]}O`;
  return `${s[0]}${"O".repeat(Math.max(1, s.length - 2))}${s[s.length - 1]}`;
}

function maskPhone(v?: string | null) {
  const d = onlyDigits(v);
  if (d.length !== 11) return "-";
  return `${d.slice(0, 3)}-****-${d.slice(7)}`;
}

export default function LiveDrawDisplayPage() {
  const [total, setTotal] = useState(0);
  const [digits, setDigits] = useState(["0", "0", "0", "0"]);
  const [active, setActive] = useState<number | null>(null);
  const [fixed, setFixed] = useState<number[]>([]);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");

  const spinTimer = useRef<number | null>(null);
  const drumRef = useRef<HTMLAudioElement | null>(null);
  const tickRef = useRef<HTMLAudioElement | null>(null);
  const winRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    drumRef.current = new Audio("/sounds/drum.mp3");
    tickRef.current = new Audio("/sounds/tick.wav");
    winRef.current = new Audio("/sounds/win.mp3");

    if (drumRef.current) {
      drumRef.current.loop = true;
      drumRef.current.volume = 0.55;
      drumRef.current.preload = "auto";
    }

    if (tickRef.current) {
      tickRef.current.volume = 1;
      tickRef.current.preload = "auto";
    }

    if (winRef.current) {
      winRef.current.volume = 1;
      winRef.current.preload = "auto";
    }

    loadTotal();

    return () => {
      stopSpin();
      stopAllSounds();
    };
  }, []);

  async function unlockSound() {
    if (!tickRef.current) return;

    try {
      await tickRef.current.play();
      tickRef.current.pause();
      tickRef.current.currentTime = 0;
    } catch {}
  }

  function playShort(sound: HTMLAudioElement | null, ms = 120) {
    if (!sound) return;

    sound.pause();
    sound.currentTime = 0;

    sound.play().catch((err) => {
      console.log("🔇 audio play blocked:", sound.src, err);
    });

    window.setTimeout(() => {
      sound.pause();
      sound.currentTime = 0;
    }, ms);
  }

  function stopAllSounds() {
    [drumRef.current, tickRef.current, winRef.current].forEach((sound) => {
      if (!sound) return;
      sound.pause();
      sound.currentTime = 0;
    });
  }

  function startDrum() {
    const s = drumRef.current;
    if (!s) return;

    s.pause();
    s.currentTime = 0;
    s.play().catch((err) => {
      console.log("🔇 drum blocked:", err);
    });
  }

  async function loadTotal() {
    try {
      const res = await fetch("/api/live/count", {
        cache: "no-store",
      });

      const json = await res.json();

      if (json.ok) {
        const count = Number(json.eligible || json.count || 0);
        setTotal(count);
        setDigits(Array.from({ length: 4 }, () => "0"));
      }
    } catch {}
  }

  function stopSpin() {
    if (spinTimer.current) {
      clearInterval(spinTimer.current);
      spinTimer.current = null;
    }
  }

  function spinDigit(index: number) {
    stopSpin();

    spinTimer.current = window.setInterval(() => {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = String(Math.floor(Math.random() * 10));
        return next;
      });
    }, 45);
  }

  function flashScreen() {
    const el = document.createElement("div");

    Object.assign(el.style, {
      position: "fixed",
      inset: "0",
      background: "#ffffff",
      opacity: "0.9",
      zIndex: "99999",
      transition: "opacity 0.55s ease",
      pointerEvents: "none",
    });

    document.body.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
    }, 80);

    setTimeout(() => {
      if (document.body.contains(el)) {
        document.body.removeChild(el);
      }
    }, 700);
  }

  async function draw() {
    await unlockSound();

    setError("");
    setWinner(null);
    setFinished(false);
    setSpinning(true);
    setFixed([]);
    setActive(null);

    startDrum();

    try {
      const res = await fetch("/api/live/admin/draw", {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "추첨 실패");
      }

      const picked: Winner = json.winner;
      const candidateNo = getCandidateNo(
        picked?.phone,
        picked?.locked_candidate_no
      );

      const final = pad(candidateNo, 4).slice(-4).split("");

      setDigits(["0", "0", "0", "0"]);

      for (let i = 0; i < final.length; i++) {
        setActive(i);
        spinDigit(i);

        const isLast = i === final.length - 1;

        const wait =
          i === 0
            ? 1000
            : i === 1
              ? 2000
              : i === 2
                ? 3000
                : isLast
                  ? 9000
                  : 3000;

        await new Promise((r) => setTimeout(r, wait));

        stopSpin();

        setDigits((prev) => {
          const next = [...prev];
          next[i] = final[i];
          return next;
        });

        playShort(tickRef.current, 120);
        setFixed((prev) => [...prev, i]);

        await new Promise((r) => setTimeout(r, isLast ? 900 : 500));
      }

      stopAllSounds();
      flashScreen();
      playShort(winRef.current, 1000);

      setActive(null);
      setWinner({
        ...picked,
        locked_candidate_no: candidateNo,
      });
      setSpinning(false);
      setFinished(true);

      setTotal((prev) => Math.max(prev - 1, 0));
    } catch (e) {
      stopSpin();
      stopAllSounds();
      setSpinning(false);
      setActive(null);
      setError(e instanceof Error ? e.message : "추첨 실패");
    }
  }

  return (
    <main style={S.page}>
      <div style={S.glow1} />
      <div style={S.glow2} />
      {finished && <Confetti />}

      <div style={S.kicker}>K-AGRI MONTHLY LIVE DRAW</div>

      <h1 style={S.title}>K-Agri 라이브 1등 추첨</h1>

      <div style={S.total}>
        총 추첨 대상: <strong>{total.toLocaleString()}</strong>명
      </div>

      <div style={S.status}>
        {spinning
          ? active === digits.length - 1
            ? "🔥 마지막 숫자에 주목하세요..."
            : `${(active ?? 0) + 1}번째 숫자 추첨 중...`
          : total === 0
            ? "추첨 대상을 먼저 확정하세요"
            : "🎯 추첨 준비 완료"}
      </div>

      <section style={S.machine}>
        {digits.map((d, i) => {
          const isActive = active === i;
          const isFixed = fixed.includes(i);

          return (
            <div key={i} style={S.reelWrap}>
              <div
                style={{
                  ...S.reel,
                  ...(isActive ? S.reelActive : {}),
                  ...(isFixed ? S.reelFixed : {}),
                  ...(finished ? S.reelFinished : {}),
                }}
              >
                <div style={S.reelTop}>{Math.floor(Math.random() * 10)}</div>
                <div style={S.digit}>{d}</div>
                <div style={S.reelBottom}>{Math.floor(Math.random() * 10)}</div>
              </div>

              <div style={S.reelLabel}>
                <span style={S.circle}>{i + 1}</span>
                {i === digits.length - 1 ? "마지막 숫자" : `${i + 1}번째 숫자`}
              </div>

              <div style={S.reelState}>
                {isFixed ? "확정!" : isActive ? "추첨 중..." : "대기 중"}
              </div>
            </div>
          );
        })}
      </section>

      {winner && (
        <section style={S.winnerBox}>
          <div style={S.winnerLabel}>🎉 최종 당첨 후보</div>

          <div style={S.winnerNo}>
            {pad(winner.locked_candidate_no, 4).slice(-4)}
          </div>

          <div style={S.winnerName}>{maskName(winner.name)}</div>

          <div style={S.winnerMeta}>
            {winner.region || "-"} / {winner.crop || "-"} /{" "}
            {maskPhone(winner.phone)}
          </div>

          <div style={S.callBox}>
            📞 지금 전화 연결 중
            <br />
            10번 벨 안에 받지 않으면 재추첨입니다
          </div>
        </section>
      )}

      {error && <div style={S.error}>{error}</div>}

      <button
        onClick={draw}
        disabled={spinning || total === 0}
        style={{
          ...S.button,
          opacity: spinning || total === 0 ? 0.5 : 1,
        }}
      >
        {spinning ? "추첨 중..." : "추첨 시작"}
      </button>
    </main>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 180 });

  return (
    <div style={S.confettiLayer}>
      {pieces.map((_, i) => (
        <span
          key={i}
          style={{
            ...S.confetti,
            left: `${Math.random() * 100}%`,
            width: 7 + Math.random() * 11,
            height: 5 + Math.random() * 8,
            animationDelay: `${Math.random() * 0.7}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            background:
              i % 5 === 0
                ? "#facc15"
                : i % 5 === 1
                  ? "#22c55e"
                  : i % 5 === 2
                    ? "#38bdf8"
                    : i % 5 === 3
                      ? "#ef4444"
                      : "#ffffff",
          }}
        />
      ))}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #0f2f65 0%, #06111f 45%, #020617 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    overflow: "hidden",
    position: "relative",
    fontWeight: 900,
  },
  glow1: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: "50%",
    background: "rgba(59,130,246,0.25)",
    filter: "blur(90px)",
    top: 120,
    left: 80,
  },
  glow2: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: "50%",
    background: "rgba(250,204,21,0.18)",
    filter: "blur(90px)",
    right: 80,
    bottom: 80,
  },
  kicker: {
    color: "#86efac",
    letterSpacing: 2,
    fontSize: 20,
    zIndex: 2,
  },
  title: {
    margin: "16px 0 0",
    fontSize: "clamp(54px, 7vw, 104px)",
    lineHeight: 1,
    letterSpacing: -4,
    zIndex: 2,
  },
  total: {
    marginTop: 30,
    fontSize: 38,
    zIndex: 2,
  },
  status: {
    marginTop: 22,
    color: "#60a5fa",
    fontSize: 32,
    zIndex: 2,
  },
  machine: {
    marginTop: 40,
    display: "flex",
    gap: 28,
    justifyContent: "center",
    flexWrap: "wrap",
    zIndex: 2,
  },
  reelWrap: {
    textAlign: "center",
  },
  reel: {
    width: 170,
    height: 235,
    borderRadius: 26,
    background:
      "linear-gradient(180deg,#111827 0%,#f8fafc 12%,#ffffff 42%,#dbeafe 50%,#ffffff 58%,#111827 100%)",
    border: "4px solid rgba(255,255,255,0.4)",
    boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    position: "relative",
    transition: "all .25s ease",
  },
  reelActive: {
    transform: "scale(1.08)",
    border: "5px solid #60a5fa",
    boxShadow: "0 0 70px rgba(59,130,246,1)",
  },
  reelFixed: {
    border: "5px solid #facc15",
    boxShadow: "0 0 80px rgba(250,204,21,0.85)",
  },
  reelFinished: {
    boxShadow: "0 0 100px rgba(250,204,21,0.95)",
  },
  reelTop: {
    position: "absolute",
    top: 12,
    fontSize: 58,
    color: "rgba(0,0,0,0.18)",
    filter: "blur(2px)",
  },
  digit: {
    fontSize: 132,
    lineHeight: 1,
    color: "#020617",
    fontWeight: 950,
  },
  reelBottom: {
    position: "absolute",
    bottom: 8,
    fontSize: 58,
    color: "rgba(0,0,0,0.18)",
    filter: "blur(2px)",
  },
  reelLabel: {
    marginTop: 16,
    fontSize: 20,
    color: "#bfdbfe",
  },
  circle: {
    display: "inline-flex",
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "2px solid #60a5fa",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    color: "#60a5fa",
  },
  reelState: {
    marginTop: 8,
    fontSize: 24,
    color: "#60a5fa",
  },
  winnerBox: {
    marginTop: 28,
    padding: 24,
    borderRadius: 24,
    background: "rgba(255,255,255,0.12)",
    border: "2px solid rgba(255,255,255,0.24)",
    textAlign: "center",
    zIndex: 2,
    minWidth: 480,
    boxShadow: "0 0 70px rgba(250,204,21,0.28)",
  },
  winnerLabel: {
    color: "#facc15",
    fontSize: 20,
  },
  winnerNo: {
    fontSize: 64,
  },
  winnerName: {
    fontSize: 46,
  },
  winnerMeta: {
    marginTop: 8,
    fontSize: 28,
  },
  callBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    background: "#7f1d1d",
    fontSize: 24,
    lineHeight: 1.5,
  },
  error: {
    marginTop: 24,
    padding: "16px 24px",
    borderRadius: 14,
    background: "#7f1d1d",
    color: "#fff",
    fontSize: 24,
    zIndex: 2,
  },
  button: {
    marginTop: 34,
    padding: "24px 70px",
    borderRadius: 20,
    border: "none",
    background: "linear-gradient(180deg,#ef4444,#b91c1c)",
    color: "#fff",
    fontSize: 40,
    fontWeight: 950,
    cursor: "pointer",
    zIndex: 2,
    boxShadow: "0 16px 40px rgba(239,68,68,0.35)",
  },
  confettiLayer: {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
    zIndex: 1,
  },
  confetti: {
    position: "absolute",
    top: -30,
    borderRadius: 2,
    animationName: "fall",
    animationTimingFunction: "linear",
    animationFillMode: "forwards",
  },
};