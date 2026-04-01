"use client";

import { useEffect, useMemo, useState } from "react";

function getRemain(deadline: string) {
  const end = new Date(deadline).getTime();
  const now = Date.now();
  const diff = end - now;

  if (!Number.isFinite(end) || diff <= 0) {
    return null;
  }

  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  return { days, hours, mins, secs };
}

export default function DealCountdown({
  deadline,
  compact = false,
}: {
  deadline?: string | null;
  compact?: boolean;
}) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!deadline) return;

    const timer = setInterval(() => {
      setTick((v) => v + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [deadline]);

  const remain = useMemo(() => {
    if (!deadline) return null;
    return getRemain(deadline);
  }, [deadline, tick]);

  if (!deadline) return null;

  if (!remain) {
    return (
      <div style={compact ? endedCompact : endedBox}>
        ⏰ 특가 마감
      </div>
    );
  }

  const text =
    remain.days > 0
      ? `${remain.days}일 ${String(remain.hours).padStart(2, "0")}:${String(
          remain.mins
        ).padStart(2, "0")}:${String(remain.secs).padStart(2, "0")}`
      : `${String(remain.hours).padStart(2, "0")}:${String(remain.mins).padStart(
          2,
          "0"
        )}:${String(remain.secs).padStart(2, "0")}`;

  return (
    <div style={compact ? compactBox : box}>
      <span style={label}>남은시간</span>
      <span style={time}>{text}</span>
    </div>
  );
}

const box: React.CSSProperties = {
  marginTop: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 12,
  background: "#111827",
  color: "#fff",
  fontWeight: 900,
  fontSize: 14,
};

const compactBox: React.CSSProperties = {
  marginTop: 10,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 10px",
  borderRadius: 10,
  background: "#111827",
  color: "#fff",
  fontWeight: 900,
  fontSize: 12,
};

const endedBox: React.CSSProperties = {
  marginTop: 10,
  display: "inline-flex",
  alignItems: "center",
  padding: "10px 12px",
  borderRadius: 12,
  background: "#991b1b",
  color: "#fff",
  fontWeight: 900,
  fontSize: 14,
};

const endedCompact: React.CSSProperties = {
  marginTop: 10,
  display: "inline-flex",
  alignItems: "center",
  padding: "7px 10px",
  borderRadius: 10,
  background: "#991b1b",
  color: "#fff",
  fontWeight: 900,
  fontSize: 12,
};

const label: React.CSSProperties = {
  opacity: 0.8,
};

const time: React.CSSProperties = {
  letterSpacing: 0.4,
};