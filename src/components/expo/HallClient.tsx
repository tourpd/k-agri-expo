"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * ✅ 안정화 원칙
 * - HallClient 내부에서 fetch/useEffect로 데이터를 다시 안 가져옵니다. (무한 요청 원천 차단)
 * - 서버 페이지에서 booths/slots를 받아 props로 내려주면 그걸 그대로 렌더링만 합니다.
 * - 지도는 zoom/pan(확대/이동)만 클라이언트 상태로 처리합니다.
 */

export type BoothRow = {
  booth_id: string;
  name: string | null;
  region: string | null;
  category_primary: string | null;
  intro: string | null;
  hall_id: string;
  phone?: string | null;
  email?: string | null;
};

export type SlotRow = {
  hall_id: string;
  slot_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  booth_id: string | null;
};

export type DealRow = {
  deal_id: string;
  booth_id: string;
  title: string | null;
  image_url: string | null;
  stock: number | null;
  start_at: string | null;
  end_at: string | null;
  expo_price: number | null;
  normal_price: number | null;
};

type Props = {
  hallId: string;
  booths: BoothRow[];
  slots: SlotRow[];
  // ✅ 있으면 “특가 카운트다운 배지”까지 동작 (없어도 정상)
  deals?: DealRow[];
};

function fmtLeft(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "마감";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (d > 0) return `${d}일 ${h}시간`;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${ss}초`;
  return `${ss}초`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function HallClient({ hallId, booths, slots, deals = [] }: Props) {
  const router = useRouter();

  // ✅ 검색/필터
  const [q, setQ] = useState("");

  // ✅ 지도 줌/팬 (서비스 느낌)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // ✅ 드래그 팬
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  // ✅ 카운트다운 tick (1초)
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // deals 없으면 굳이 tick 돌릴 필요 없음
    if (!deals || deals.length === 0) return;
    const t = setInterval(() => setTick((v) => (v + 1) % 1_000_000), 1000);
    return () => clearInterval(t);
  }, [deals]);

  // ✅ hallId로 필터 (안전)
  const hallBooths = useMemo(() => booths.filter((b) => b.hall_id === hallId), [booths, hallId]);
  const hallSlots = useMemo(() => slots.filter((s) => s.hall_id === hallId), [slots, hallId]);

  // ✅ booth lookup
  const boothById = useMemo(() => {
    const m: Record<string, BoothRow> = {};
    for (const b of hallBooths) m[b.booth_id] = b;
    return m;
  }, [hallBooths]);

  // ✅ slot 정렬(좌표 기반)
  const sortedSlots = useMemo(() => {
    return [...hallSlots].sort((a, b) => (a.y - b.y) || (a.x - b.x) || a.slot_id.localeCompare(b.slot_id));
  }, [hallSlots]);

  // ✅ deals(부스별 “가장 최근/활성” 하나만 맵핑)
  const dealByBoothId = useMemo(() => {
    const m: Record<string, DealRow> = {};
    for (const d of deals) {
      if (!d.booth_id) continue;
      // 최신이 우선 (start_at 기준)
      const prev = m[d.booth_id];
      if (!prev) m[d.booth_id] = d;
      else {
        const p = prev.start_at ? Date.parse(prev.start_at) : 0;
        const n = d.start_at ? Date.parse(d.start_at) : 0;
        if (n >= p) m[d.booth_id] = d;
      }
    }
    return m;
  }, [deals]);

  // ✅ 검색 적용
  const qNorm = q.trim().toLowerCase();
  const visibleBooths = useMemo(() => {
    if (!qNorm) return hallBooths;
    return hallBooths.filter((b) => {
      const s = `${b.name ?? ""} ${b.region ?? ""} ${b.category_primary ?? ""}`.toLowerCase();
      return s.includes(qNorm);
    });
  }, [hallBooths, qNorm]);

  // ✅ “미배정 업체”
  const assignedBoothIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of hallSlots) if (s.booth_id) set.add(s.booth_id);
    return set;
  }, [hallSlots]);

  const unassignedBooths = useMemo(() => {
    return visibleBooths.filter((b) => !assignedBoothIds.has(b.booth_id));
  }, [visibleBooths, assignedBoothIds]);

  // ✅ 지도 크기(좌표를 px로 변환해서 “박람회 맵”처럼)
  // 가정: x,y,w,h가 "그리드 단위"라면 1단위=110px 정도로 환산
  const UNIT = 110;
  const mapBounds = useMemo(() => {
    if (hallSlots.length === 0) return { width: 1200, height: 700, minX: 0, minY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of hallSlots) {
      minX = Math.min(minX, s.x);
      minY = Math.min(minY, s.y);
      maxX = Math.max(maxX, s.x + s.w);
      maxY = Math.max(maxY, s.y + s.h);
    }
    const width = Math.max(900, (maxX - minX) * UNIT + 80);
    const height = Math.max(520, (maxY - minY) * UNIT + 80);
    return { width, height, minX, minY };
  }, [hallSlots]);

  // ✅ 줌 버튼
  const zoomIn = useCallback(() => setZoom((z) => clamp(Number((z + 0.15).toFixed(2)), 0.6, 2.4)), []);
  const zoomOut = useCallback(() => setZoom((z) => clamp(Number((z - 0.15).toFixed(2)), 0.6, 2.4)), []);
  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // ✅ 휠 줌 (Ctrl/Trackpad 느낌)
  const onWheel = useCallback((e: React.WheelEvent) => {
    // 트랙패드 스크롤과 줌이 섞이므로, 옵션: Shift+휠로 줌
    if (!e.shiftKey) return;
    e.preventDefault();
    const delta = e.deltaY;
    setZoom((z) => clamp(Number((z + (delta > 0 ? -0.08 : 0.08)).toFixed(2)), 0.6, 2.4));
  }, []);

  // ✅ 드래그로 지도 이동
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // 좌클릭 드래그로 팬
    dragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    panStart.current = { ...pan };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // ✅ 슬롯 클릭 → 부스 상세로 이동
  const goBooth = useCallback((booth_id: string) => {
    router.push(`/expo/booths/${encodeURIComponent(booth_id)}`);
  }, [router]);

  const headerTabs = useMemo(() => {
    const tabs = [
      { id: "agri-inputs", label: "농자재관" },
      { id: "machinery", label: "농기계관" },
      { id: "seeds", label: "종자관" },
      { id: "smartfarm", label: "스마트팜" },
    ];
    return tabs;
  }, []);

  return (
    <main style={wrap}>
      {/* 상단 헤더 */}
      <header style={topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>K-Agri Expo</div>
          <span style={chip}>전시장</span>
        </div>

        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {headerTabs.map((t) => {
            const active = t.id === hallId;
            return (
              <a
                key={t.id}
                href={`/expo/hall/${t.id}`}
                style={active ? tabActive : tab}
              >
                {t.label}
              </a>
            );
          })}
        </nav>
      </header>

      <section style={{ marginTop: 14 }}>
        <h1 style={{ fontSize: 26, fontWeight: 950, margin: 0 }}>전시장</h1>
        <div style={{ marginTop: 6, color: "#666", lineHeight: 1.7 }}>
          부스 모형도에서 업체를 찾고, 터치하면 부스 상세로 이동합니다.
          <span style={{ marginLeft: 8, ...mono }}>hall: {hallId}</span>
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 14, marginTop: 14 }}>
        {/* 좌측: 업체 리스트 */}
        <aside style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontWeight: 950, fontSize: 16 }}>미배정 업체</div>
            <div style={{ fontSize: 12, color: "#666" }}>{unassignedBooths.length}개</div>
          </div>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="검색: 업체명/지역/카테고리"
            style={input}
          />

          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            {unassignedBooths.length === 0 ? (
              <div style={{ color: "#666", fontSize: 13, lineHeight: 1.6 }}>
                미배정 업체가 없습니다.
                <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
                  * 운영자 배정 페이지에서 슬롯 배정하면 여기서 사라집니다.
                </div>
              </div>
            ) : (
              unassignedBooths.map((b) => (
                <div key={b.booth_id} style={boothCard}>
                  <div style={{ fontWeight: 950, fontSize: 15, color: "#111" }}>{b.name ?? "(업체명 없음)"}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                    {b.region ?? "-"} · {b.category_primary ?? "-"}
                  </div>

                  {/* ✅ 특가 배지(옵션) */}
                  {dealByBoothId[b.booth_id] ? (
                    <DealBadge deal={dealByBoothId[b.booth_id]} tick={tick} />
                  ) : null}

                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => goBooth(b.booth_id)}
                      style={btnPrimary}
                      type="button"
                    >
                      부스로 이동
                    </button>
                    <button
                      onClick={() => navigator.clipboard?.writeText(b.booth_id)}
                      style={btnGhost}
                      type="button"
                    >
                      booth_id 복사
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* 우측: 전시장 지도 */}
        <section style={panel}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 950, fontSize: 16 }}>전시장 지도 (확대/이동 가능)</div>
              <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                Shift+휠 = 확대/축소 · 드래그 = 이동 · 슬롯 클릭 = 업체 상세
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <button type="button" onClick={zoomOut} style={btnGhost}>-</button>
              <div style={{ ...mono, fontSize: 12 }}>zoom {Math.round(zoom * 100)}%</div>
              <button type="button" onClick={zoomIn} style={btnGhost}>+</button>
              <button type="button" onClick={resetView} style={btnGhost}>초기화</button>
            </div>
          </div>

          <div
            style={mapOuter}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseUp}
            onMouseUp={onMouseUp}
          >
            <div
              style={{
                width: mapBounds.width,
                height: mapBounds.height,
                position: "relative",
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "0 0",
                background: "linear-gradient(#fafafa, #f7f7f7)",
                borderRadius: 18,
                border: "1px solid #eee",
                boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
              }}
            >
              {/* 가벼운 “전시장 느낌” 장식 */}
              <div style={hallBanner}>
                <div style={{ fontWeight: 950 }}>K-Agri Expo · {hallId}</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>Tap a booth slot to enter</div>
              </div>

              {sortedSlots.map((s) => {
                const b = s.booth_id ? boothById[s.booth_id] : null;
                const title = b?.name ?? "빈 부스";
                const isEmpty = !s.booth_id;

                // 위치/크기 px 환산
                const left = (s.x - mapBounds.minX) * UNIT + 30;
                const top = (s.y - mapBounds.minY) * UNIT + 60;
                const width = Math.max(90, s.w * UNIT - 14);
                const height = Math.max(90, s.h * UNIT - 14);

                const deal = s.booth_id ? dealByBoothId[s.booth_id] : null;

                return (
                  <button
                    key={`${s.hall_id}:${s.slot_id}`}
                    type="button"
                    onClick={() => {
                      if (s.booth_id) goBooth(s.booth_id);
                    }}
                    style={{
                      position: "absolute",
                      left,
                      top,
                      width,
                      height,
                      borderRadius: 18,
                      border: "1px solid #e5e7eb",
                      background: isEmpty ? "#f3f4f6" : "#111",
                      color: isEmpty ? "#111" : "#fff",
                      padding: 12,
                      boxSizing: "border-box",
                      textAlign: "left",
                      cursor: isEmpty ? "default" : "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: isEmpty ? "none" : "0 12px 28px rgba(0,0,0,0.18)",
                    }}
                    disabled={isEmpty}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <div style={{ fontWeight: 950 }}>{s.slot_id}</div>
                      {!isEmpty && deal ? (
                        <span style={badgeHot}>특가</span>
                      ) : null}
                    </div>

                    <div style={{ fontWeight: 950, fontSize: 13, lineHeight: 1.2 }}>
                      {title}
                    </div>

                    {/* ✅ 특가 카운트다운(옵션) */}
                    {!isEmpty && deal ? (
                      <div style={{ marginTop: 6 }}>
                        <CountdownInline deal={deal} tick={tick} />
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, opacity: isEmpty ? 0.7 : 0.85 }}>
                        {isEmpty ? "입점 가능" : "터치해서 상세로"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <footer style={{ marginTop: 18, color: "#666", fontSize: 12 }}>
        * 안정화 버전: HallClient 내부 fetch 없음(무한 네트워크 방지). 지도는 zoom/pan만 상태로 처리.
      </footer>
    </main>
  );
}

function DealBadge({ deal, tick }: { deal: DealRow; tick: number }) {
  const end = deal.end_at ? Date.parse(deal.end_at) : 0;
  const left = end ? Math.max(0, end - Date.now()) : 0;

  // tick 사용(리렌더 트리거)
  void tick;

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={badgeHot}>EXPO 특가</span>
      <span style={{ ...mono, fontSize: 12, color: "#111" }}>{fmtLeft(left)}</span>
    </div>
  );
}

function CountdownInline({ deal, tick }: { deal: DealRow; tick: number }) {
  const end = deal.end_at ? Date.parse(deal.end_at) : 0;
  const left = end ? Math.max(0, end - Date.now()) : 0;
  void tick;

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={badgeMini}>⏳ {fmtLeft(left)}</span>
      {typeof deal.stock === "number" ? <span style={badgeMini}>남은수량: {deal.stock}</span> : null}
    </div>
  );
}

/* =========================
   Styles
========================= */

const wrap: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  padding: "18px 16px 28px",
  background: "#fff",
  minHeight: "100vh",
};

const topBar: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const chip: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #eee",
  background: "#fafafa",
  color: "#111",
};

const tab: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 900,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #eee",
  background: "#fff",
  color: "#111",
  textDecoration: "none",
};

const tabActive: React.CSSProperties = {
  ...tab,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

const panel: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 18,
  padding: 14,
  background: "#fff",
};

const input: React.CSSProperties = {
  marginTop: 10,
  width: "100%",
  padding: "12px 12px",
  borderRadius: 14,
  border: "1px solid #eee",
  outline: "none",
  fontSize: 14,
};

const boothCard: React.CSSProperties = {
  border: "1px solid #eee",
  borderRadius: 16,
  padding: 12,
  background: "#fff",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 950,
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  color: "#111",
  fontWeight: 950,
  cursor: "pointer",
};

const badgeHot: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 950,
  padding: "6px 10px",
  borderRadius: 999,
  background: "#ff3b30",
  color: "#fff",
};

const badgeMini: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 950,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.25)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
};

const mono: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
};

const mapOuter: React.CSSProperties = {
  marginTop: 12,
  height: 560,
  borderRadius: 18,
  border: "1px solid #eee",
  background: "#fff",
  overflow: "hidden",
  position: "relative",
  cursor: "grab",
  userSelect: "none",
};

const hallBanner: React.CSSProperties = {
  position: "absolute",
  left: 18,
  top: 16,
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #eee",
  background: "rgba(255,255,255,0.88)",
  color: "#111",
  backdropFilter: "blur(8px)",
  boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
};