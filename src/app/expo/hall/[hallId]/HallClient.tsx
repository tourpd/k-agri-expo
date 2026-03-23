"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";

type BoothRow = {
  booth_id: string;
  name: string | null;
  region: string | null;
  category_primary: string | null;
  hall_id: string;
  // 선택 컬럼(있으면 사용)
  intro?: string | null;
};

type SlotRow = {
  hall_id: string;
  slot_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  booth_id: string | null;
};

export default function HallClient({
  hallId,
  booths,
  slots,
}: {
  hallId: string;
  booths: BoothRow[];
  slots: SlotRow[];
}) {
  // ✅ “전시장 지도 확대” (가볍고 안정적인 방식)
  const [zoom, setZoom] = useState(1);
  const [selectedBoothId, setSelectedBoothId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const boothById = useMemo(() => {
    const m: Record<string, BoothRow> = {};
    booths.forEach((b) => (m[b.booth_id] = b));
    return m;
  }, [booths]);

  const hallSlots = useMemo(() => {
    return slots
      .filter((s) => s.hall_id === hallId)
      .sort((a, b) => a.y - b.y || a.x - b.x);
  }, [slots, hallId]);

  const selectedBooth = selectedBoothId ? boothById[selectedBoothId] : null;

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  function onWheel(e: React.WheelEvent) {
    // trackpad/wheel 확대
    if (!e.ctrlKey) return; // 실수 확대 방지: ctrl+wheel일 때만
    e.preventDefault();
    const delta = -e.deltaY;
    const next = clamp(zoom + (delta > 0 ? 0.08 : -0.08), 0.6, 2.2);
    setZoom(next);
  }

  return (
    <main style={S.page}>
      {/* 상단 바 */}
      <header style={S.header}>
        <div>
          <div style={S.kicker}>K-Agri Expo</div>
          <h1 style={S.title}>전시장 홀: {hallId}</h1>
          <div style={S.sub}>
            확대/축소로 돌아보시고, 부스를 클릭하면 상세 페이지로 이동합니다.
          </div>
        </div>

        <div style={S.toolbar}>
          <button
            onClick={() =>
              setZoom((z) => clamp(Number((z - 0.15).toFixed(2)), 0.6, 2.2))
            }
            style={S.btn}
          >
            −
          </button>
          <div style={S.zoomLabel}>{Math.round(zoom * 100)}%</div>
          <button
            onClick={() =>
              setZoom((z) => clamp(Number((z + 0.15).toFixed(2)), 0.6, 2.2))
            }
            style={S.btn}
          >
            +
          </button>
          <button
            onClick={() => {
              setZoom(1);
              wrapRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
            }}
            style={S.btnGhost}
          >
            리셋
          </button>
          <Link href="/expo" style={S.btnGhost}>
            엑스포 홈
          </Link>
        </div>
      </header>

      {/* 본문 2열 */}
      <section style={S.grid}>
        {/* 좌측: 지도 */}
        <div style={S.mapCard}>
          <div style={S.cardHead}>
            <div style={S.cardTitle}>전시장 지도</div>
            <div style={S.cardHint}>* ctrl + 휠로 확대/축소</div>
          </div>

          <div ref={wrapRef} style={S.mapViewport} onWheel={onWheel}>
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: 1100,
                padding: 14,
              }}
            >
              <div style={S.slotGrid}>
                {hallSlots.map((s) => {
                  const booth = s.booth_id ? boothById[s.booth_id] : null;
                  const isSelected = !!booth && booth.booth_id === selectedBoothId;

                  return (
                    <button
                      key={`${s.hall_id}:${s.slot_id}`}
                      onClick={() => setSelectedBoothId(booth?.booth_id ?? null)}
                      style={{
                        ...S.slot,
                        background: booth ? "#111" : "#f3f4f6",
                        color: booth ? "#fff" : "#111",
                        outline: isSelected ? "3px solid #fb923c" : "none",
                      }}
                      title={booth ? booth.name ?? "부스" : "빈 부스"}
                    >
                      <div style={S.slotTop}>
                        <div style={S.slotId}>{s.slot_id}</div>
                      </div>

                      <div style={S.slotName}>
                        {booth ? booth.name ?? "부스" : "빈 부스"}
                      </div>

                      <div style={S.slotMeta}>
                        {booth
                          ? `${booth.region ?? "-"} · ${booth.category_primary ?? "-"}`
                          : "입점 가능"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 선택 부스 미리보기 */}
        <aside style={S.sideCard}>
          <div style={S.cardHead}>
            <div style={S.cardTitle}>부스 정보</div>
          </div>

          {!selectedBooth ? (
            <div style={S.empty}>
              지도에서 부스를 클릭하시면
              <br />
              업체 정보가 표시됩니다.
            </div>
          ) : (
            <div>
              <div style={S.boothName}>{selectedBooth.name ?? "부스"}</div>
              <div style={S.boothMeta}>
                {selectedBooth.region ?? "지역 미입력"} ·{" "}
                {selectedBooth.category_primary ?? "카테고리 미입력"}
              </div>

              <div style={S.boothIntro}>
                {selectedBooth.intro ?? "한 줄 소개가 아직 없습니다."}
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                {/* ✅ 부스 상세 페이지로 이동: /expo/booths/[id] */}
                <Link
                  href={`/expo/booths/${selectedBooth.booth_id}`}
                  style={S.primaryLink}
                >
                  부스 상세 보기
                </Link>

                <button onClick={() => setSelectedBoothId(null)} style={S.btnGhost}>
                  선택 해제
                </button>
              </div>

              <div style={S.note}>
                다음 단계(원하시면): 상담 버튼/라이브(유튜브)/특가 딜까지 여기 패널에 붙이면
                “진짜 서비스” 느낌이 확 납니다.
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

/** styles */
const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    color: "#111",
    padding: "22px 16px",
  },
  header: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  kicker: { fontSize: 12, fontWeight: 900, color: "#666" },
  title: { margin: "6px 0 0", fontSize: 26, fontWeight: 950, letterSpacing: -0.2 },
  sub: { marginTop: 8, color: "#666", fontSize: 13, lineHeight: 1.6 },

  toolbar: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  btn: {
    border: "1px solid #ddd",
    background: "#fff",
    color: "#111",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
  },
  btnGhost: {
    border: "1px solid #eee",
    background: "#f9fafb",
    color: "#111",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    cursor: "pointer",
    textDecoration: "none",
  },
  zoomLabel: { fontSize: 12, fontWeight: 900, color: "#666", minWidth: 60, textAlign: "center" },

  grid: {
    maxWidth: 1200,
    margin: "16px auto 0",
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: 14,
  },

  mapCard: { border: "1px solid #eee", borderRadius: 18, overflow: "hidden", background: "#fff" },
  sideCard: { border: "1px solid #eee", borderRadius: 18, overflow: "hidden", background: "#fff" },

  cardHead: {
    padding: 12,
    borderBottom: "1px solid #eee",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 10,
  },
  cardTitle: { fontWeight: 950 },
  cardHint: { fontSize: 12, color: "#777", fontWeight: 800 },

  mapViewport: {
    height: 620,
    overflow: "auto",
    background: "#fafafa",
  },
  slotGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(10, 92px)",
    gap: 10,
  },
  slot: {
    width: 92,
    height: 92,
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    padding: 10,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    textAlign: "left",
    cursor: "pointer",
  },
  slotTop: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 },
  slotId: { fontWeight: 950, fontSize: 12, opacity: 0.9 },
  slotName: { fontWeight: 950, fontSize: 13, lineHeight: 1.2 },
  slotMeta: { fontSize: 11, opacity: 0.8 },

  empty: { padding: 16, color: "#666", lineHeight: 1.7 },
  boothName: { padding: "14px 16px 0", fontSize: 20, fontWeight: 950, color: "#111" },
  boothMeta: { padding: "6px 16px 0", fontSize: 13, color: "#666", fontWeight: 800 },
  boothIntro: {
    margin: "12px 16px 0",
    padding: 12,
    borderRadius: 14,
    border: "1px solid #eee",
    background: "#fafafa",
    color: "#111",
    lineHeight: 1.7,
    fontSize: 13,
  },
  primaryLink: {
    marginLeft: 16,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 950,
    textDecoration: "none",
    display: "inline-block",
  },
  note: {
    margin: "12px 16px 16px",
    fontSize: 12,
    color: "#666",
    lineHeight: 1.7,
  },
};