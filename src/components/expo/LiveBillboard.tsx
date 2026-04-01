"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type RankItem = {
  name: string;
  score?: number;
};

const agriInputsSeed: RankItem[] = [
  { name: "싹쓰리충", score: 98 },
  { name: "멸규니", score: 96 },
  { name: "멀티피드", score: 95 },
  { name: "켈팍", score: 93 },
  { name: "메가파워칼", score: 92 },
  { name: "싹쓰리충 골드", score: 91 },
  { name: "파워폴리인산", score: 89 },
  { name: "육묘짱", score: 88 },
  { name: "기비왕건", score: 87 },
  { name: "시에스타", score: 86 },
];

const machinesSeed: RankItem[] = [
  { name: "산악형 돌분쇄기", score: 97 },
  { name: "양파 정식기", score: 95 },
  { name: "트랙터 부착 장비", score: 93 },
  { name: "로타리", score: 92 },
  { name: "관리기", score: 90 },
  { name: "파종기", score: 88 },
  { name: "이식기", score: 87 },
  { name: "비닐피복기", score: 85 },
  { name: "동력 운반차", score: 84 },
  { name: "퇴비 살포기", score: 83 },
];

const seedsSeed: RankItem[] = [
  { name: "고추 종자", score: 97 },
  { name: "오이 종자", score: 95 },
  { name: "토마토 종자", score: 93 },
];

function rotateRanks(items: RankItem[], tick: number): RankItem[] {
  if (items.length <= 1) return items;
  const cloned = [...items];

  const a = tick % items.length;
  const b = (tick + 3) % items.length;

  const temp = cloned[a];
  cloned[a] = cloned[b];
  cloned[b] = temp;

  return cloned.map((item, idx) => ({
    ...item,
    score: (item.score ?? 100) - idx,
  }));
}

function BoardSection({
  title,
  icon,
  items,
  compact = false,
}: {
  title: string;
  icon: string;
  items: RankItem[];
  compact?: boolean;
}) {
  return (
    <section style={compact ? styles.sectionCompact : styles.section}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionIcon}>{icon}</span>
        <span style={styles.sectionTitle}>{title}</span>
      </div>

      <div style={styles.table}>
        {items.map((item, idx) => (
          <div key={`${title}-${item.name}-${idx}`} style={styles.row}>
            <div style={styles.rank}>{idx + 1}</div>
            <div style={styles.nameCell}>{item.name}</div>
            <div style={styles.scoreCell}>{item.score ?? 0}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function LiveBillboard() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick((prev) => prev + 1);
    }, 2600);

    return () => window.clearInterval(timer);
  }, []);

  const agriInputs = useMemo(() => rotateRanks(agriInputsSeed, tick), [tick]);
  const machines = useMemo(() => rotateRanks(machinesSeed, tick + 1), [tick]);
  const seeds = useMemo(() => rotateRanks(seedsSeed, tick + 2), [tick]);

  return (
    <div style={styles.wrap}>
      <div style={styles.topBar}>
        <div>
          <div style={styles.eyebrow}>K-AGRI LIVE BOARD</div>
          <h2 style={styles.title}>실시간 박람회 전광판</h2>
          <p style={styles.desc}>
            농민 선택 농자재, 인기 농기계, 인기 종자를 실시간 순위처럼 보여주는 라이브 보드입니다.
          </p>
        </div>

        <Link href="/posts/billboard" style={styles.moreLink}>
          전체 보기 →
        </Link>
      </div>

      <div style={styles.grid}>
        <BoardSection
          title="농민 선택 농자재 TOP10"
          icon="🌿"
          items={agriInputs}
        />

        <BoardSection
          title="인기 농기계 TOP10"
          icon="🚜"
          items={machines}
        />

        <BoardSection
          title="인기 종자 TOP3"
          icon="🌱"
          items={seeds}
          compact
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    borderRadius: 32,
    padding: 24,
    background: "linear-gradient(180deg, #0b1220 0%, #172033 100%)",
    color: "#ffffff",
    boxShadow: "0 20px 50px rgba(15,23,42,0.16)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: 900,
    color: "#86efac",
    letterSpacing: 0.5,
  },
  title: {
    margin: "8px 0 0",
    fontSize: 34,
    lineHeight: 1.1,
    fontWeight: 950,
    letterSpacing: -0.8,
  },
  desc: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.78)",
    maxWidth: 860,
  },
  moreLink: {
    textDecoration: "none",
    color: "#ffffff",
    fontWeight: 900,
    fontSize: 14,
    whiteSpace: "nowrap",
    border: "1px solid rgba(255,255,255,0.12)",
    padding: "12px 16px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 0.9fr",
    gap: 18,
  },
  section: {
    borderRadius: 24,
    padding: 18,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  sectionCompact: {
    borderRadius: 24,
    padding: 18,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    alignSelf: "start",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 950,
    color: "#fde68a",
  },
  table: {
    display: "grid",
    gap: 8,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "48px 1fr 64px",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    background: "rgba(255,255,255,0.08)",
    padding: "10px 12px",
    transition: "all 180ms ease",
  },
  rank: {
    fontSize: 14,
    fontWeight: 950,
    color: "#ffffff",
    textAlign: "center",
  },
  nameCell: {
    fontSize: 14,
    fontWeight: 900,
    color: "#ffffff",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  scoreCell: {
    fontSize: 12,
    fontWeight: 900,
    color: "#93c5fd",
    textAlign: "right",
  },
};