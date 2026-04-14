"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 안정화 원칙
 * - HallClient 내부에서 fetch/useEffect로 데이터를 다시 가져오지 않음
 * - 서버 페이지에서 booths / slots / deals props만 받아 렌더링
 * - hallId 별칭 처리
 * - booth_id / id 혼용 대응
 */

export type BoothRow = {
  booth_id?: string | null;
  id?: string | null;
  name?: string | null;
  title?: string | null;
  region?: string | null;
  category_primary?: string | null;
  intro?: string | null;
  hall_id?: string | null;
  hall_code?: string | null;
  phone?: string | null;
  email?: string | null;
  is_active?: boolean | null;
  is_visible?: boolean | null;
  status?: string | null;
};

export type SlotRow = {
  hall_id?: string | null;
  slot_id?: string | null;
  booth_id?: string | null;
  x?: number | null;
  y?: number | null;
  w?: number | null;
  h?: number | null;
};

export type DealRow = {
  deal_id: string;
  booth_id: string;
  title?: string | null;
  image_url?: string | null;
  stock?: number | null;
  start_at?: string | null;
  end_at?: string | null;
  expo_price?: number | null;
  normal_price?: number | null;
};

type Props = {
  hallId: string;
  booths: BoothRow[];
  slots: SlotRow[];
  deals?: DealRow[];
};

function normalizeHallId(value: string | null | undefined) {
  const v = (value ?? "").trim();
  if (!v) return "";

  switch (v) {
    case "agri-inputs":
    case "agri_inputs":
      return "agri_inputs";

    case "machines":
    case "machinery":
      return "machinery";

    case "seeds":
    case "seeds_seedlings":
      return "seeds_seedlings";

    case "smartfarm":
    case "smart_farm":
      return "smart_farm";

    case "eco-friendly":
    case "eco_friendly":
      return "eco_friendly";

    case "future-insect":
    case "future_insect":
      return "future_insect";

    default:
      return v;
  }
}

function hallRouteId(value: string | null | undefined) {
  const v = normalizeHallId(value);
  switch (v) {
    case "agri_inputs":
      return "agri-inputs";
    case "machinery":
      return "machines";
    case "seeds_seedlings":
      return "seeds";
    case "smart_farm":
      return "smartfarm";
    case "eco_friendly":
      return "eco-friendly";
    case "future_insect":
      return "future-insect";
    default:
      return v;
  }
}

function resolveBoothId(row: BoothRow | null | undefined) {
  return String(row?.booth_id ?? row?.id ?? "").trim();
}

function resolveBoothName(row: BoothRow | null | undefined) {
  return row?.name ?? row?.title ?? null;
}

function normalizeSlotId(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/-/g, "");
}

function safeNum(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

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

function isVisibleBooth(b: BoothRow) {
  const activeOk = b.is_active == null || b.is_active === true;
  const visibleOk = b.is_visible == null || b.is_visible === true;
  const statusOk = !b.status || b.status === "live" || b.status === "published";
  return activeOk && visibleOk && statusOk;
}

export default function HallClient({
  hallId,
  booths,
  slots,
  deals = [],
}: Props) {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!deals || deals.length === 0) return;
    const t = setInterval(() => setTick((v) => (v + 1) % 1_000_000), 1000);
    return () => clearInterval(t);
  }, [deals]);

  const normalizedHallId = useMemo(() => normalizeHallId(hallId), [hallId]);

  const hallBooths = useMemo(() => {
    return booths.filter((b) => {
      const boothHall = normalizeHallId(b.hall_id ?? b.hall_code ?? "");
      return boothHall === normalizedHallId && isVisibleBooth(b);
    });
  }, [booths, normalizedHallId]);

  const hallSlots = useMemo(() => {
    return slots.filter((s) => normalizeHallId(s.hall_id ?? "") === normalizedHallId);
  }, [slots, normalizedHallId]);

  const boothById = useMemo(() => {
    const m: Record<string, BoothRow> = {};
    for (const b of hallBooths) {
      const boothId = resolveBoothId(b);
      if (boothId) m[boothId] = b;
    }
    return m;
  }, [hallBooths]);

  const sortedSlots = useMemo(() => {
    return [...hallSlots].sort((a, b) => {
      const ay = safeNum(a.y, 0);
      const by = safeNum(b.y, 0);
      const ax = safeNum(a.x, 0);
      const bx = safeNum(b.x, 0);
      const as = normalizeSlotId(a.slot_id);
      const bs = normalizeSlotId(b.slot_id);

      return ay - by || ax - bx || as.localeCompare(bs);
    });
  }, [hallSlots]);

  const dealByBoothId = useMemo(() => {
    const m: Record<string, DealRow> = {};
    for (const d of deals) {
      if (!d?.booth_id) continue;
      const key = String(d.booth_id).trim();
      if (!key) continue;

      const prev = m[key];
      if (!prev) {
        m[key] = d;
        continue;
      }

      const p = prev.start_at ? Date.parse(prev.start_at) : 0;
      const n = d.start_at ? Date.parse(d.start_at) : 0;
      if (n >= p) m[key] = d;
    }
    return m;
  }, [deals]);

  const qNorm = q.trim().toLowerCase();

  const visibleBooths = useMemo(() => {
    if (!qNorm) return hallBooths;
    return hallBooths.filter((b) => {
      const s = `${resolveBoothName(b) ?? ""} ${b.region ?? ""} ${b.category_primary ?? ""}`.toLowerCase();
      return s.includes(qNorm);
    });
  }, [hallBooths, qNorm]);

  const assignedBoothIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of hallSlots) {
      const boothId = String(s.booth_id ?? "").trim();
      if (boothId) set.add(boothId);
    }
    return set;
  }, [hallSlots]);

  const unassignedBooths = useMemo(() => {
    return visibleBooths.filter((b) => {
      const boothId = resolveBoothId(b);
      return boothId ? !assignedBoothIds.has(boothId) : true;
    });
  }, [visibleBooths, assignedBoothIds]);

  const UNIT = 110;

  const mapBounds = useMemo(() => {
    if (hallSlots.length === 0) {
      return { width: 1200, height: 700, minX: 0, minY: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const s of hallSlots) {
      const x = safeNum(s.x, 0);
      const y = safeNum(s.y, 0);
      const w = safeNum(s.w, 1);
      const h = safeNum(s.h, 1);

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w);
      maxY = Math.max(maxY, y + h);
    }

    const width = Math.max(900, (maxX - minX) * UNIT + 80);
    const height = Math.max(520, (maxY - minY) * UNIT + 80);

    return { width, height, minX, minY };
  }, [hallSlots]);

  const zoomIn = useCallback(() => {
    setZoom((z) => clamp(Number((z + 0.15).toFixed(2)), 0.6, 2.4));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => clamp(Number((z - 0.15).toFixed(2)), 0.6, 2.4));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    const delta = e.deltaY;
    setZoom((z) =>
      clamp(Number((z + (delta > 0 ? -0.08 : 0.08)).toFixed(2)), 0.6, 2.4)
    );
  }, []);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      dragging.current = true;
      dragStart.current = { x: e.clientX, y: e.clientY };
      panStart.current = { ...pan };
    },
    [pan]
  );

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  }, []);

  const onMouseUp = useCallback(() => {
    dragging.current = false;
  }, []);

  const goBooth = useCallback(
    (boothId: string) => {
      if (!boothId) return;
      router.push(`/expo/booths/${encodeURIComponent(boothId)}`);
    },
    [router]
  );

  const headerTabs = useMemo(() => {
    return [
      { id: "agri-inputs", label: "농자재관" },
      { id: "machines", label: "농기계관" },
      { id: "seeds", label: "종자관" },
      { id: "smartfarm", label: "스마트팜" },
    ];
  }, []);

  return (
    <main style={wrap}>
      <header style={topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontWeight: 950, fontSize: 18 }}>K-Agri Expo</div>
          <span style={chip}>전시장</span>
        </div>

        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {headerTabs.map((t) => {
            const active = normalizeHallId(t.id) === normalizedHallId;
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
          <span style={{ marginLeft: 8, ...mono }}>
            hall: {hallRouteId(normalizedHallId)}
          </span>
        </div>
      </section>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: 14,
          marginTop: 14,
        }}
      >
        <aside style={panel}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div style={{ fontWeight: 950, fontSize: 16 }}>미배정 업체</div>
            <div style={{ fontSize: 12, color: "#666" }}>
              {unassignedBooths.length}개
            </div>
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
                  운영자 배정 페이지에서 슬롯 배정이 완료된 상태일 수 있습니다.
                </div>
              </div>
            ) : (
              unassignedBooths.map((b) => {
                const boothId = resolveBoothId(b);
                return (
                  <div key={boothId || Math.random()} style={boothCard}>
                    <div
                      style={{
                        fontWeight: 950,
                        fontSize: 15,
                        color: "#111",
                      }}
                    >
                      {resolveBoothName(b) ?? "(업체명 없음)"}
                    </div>

                    <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                      {b.region ?? "-"} · {b.category_primary ?? "-"}
                    </div>

                    {boothId && dealByBoothId[boothId] ? (
                      <DealBadge deal={dealByBoothId[boothId]} tick={tick} />
                    ) : null}

                    <div
                      style={{
                        marginTop: 10,
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => boothId && goBooth(boothId)}
                        style={btnPrimary}
                        type="button"
                        disabled={!boothId}
                      >
                        부스로 이동
                      </button>

                      <button
                        onClick={() => boothId && navigator.clipboard?.writeText(boothId)}
                        style={btnGhost}
                        type="button"
                        disabled={!boothId}
                      >
                        booth_id 복사
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        <section style={panel}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontWeight: 950, fontSize: 16 }}>
                전시장 지도 (확대/이동 가능)
              </div>
              <div style={{ marginTop: 4, fontSize: 12, color: "#666" }}>
                Shift+휠 = 확대/축소 · 드래그 = 이동 · 슬롯 클릭 = 업체 상세
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <button type="button" onClick={zoomOut} style={btnGhost}>
                -
              </button>
              <div style={{ ...mono, fontSize: 12 }}>
                zoom {Math.round(zoom * 100)}%
              </div>
              <button type="button" onClick={zoomIn} style={btnGhost}>
                +
              </button>
              <button type="button" onClick={resetView} style={btnGhost}>
                초기화
              </button>
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
              <div style={hallBanner}>
                <div style={{ fontWeight: 950 }}>
                  K-Agri Expo · {hallRouteId(normalizedHallId)}
                </div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>
                  Tap a booth slot to enter
                </div>
              </div>

              {sortedSlots.map((s) => {
                const slotBoothId = String(s.booth_id ?? "").trim();
                const booth = slotBoothId ? boothById[slotBoothId] : null;
                const title = resolveBoothName(booth) ?? "빈 부스";
                const isEmpty = !slotBoothId;

                const left =
                  (safeNum(s.x, 0) - mapBounds.minX) * UNIT + 30;
                const top =
                  (safeNum(s.y, 0) - mapBounds.minY) * UNIT + 60;
                const width = Math.max(90, safeNum(s.w, 1) * UNIT - 14);
                const height = Math.max(90, safeNum(s.h, 1) * UNIT - 14);

                const deal = slotBoothId ? dealByBoothId[slotBoothId] : null;

                return (
                  <button
                    key={`${s.hall_id ?? ""}:${normalizeSlotId(s.slot_id)}`}
                    type="button"
                    onClick={() => {
                      if (slotBoothId) goBooth(slotBoothId);
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
                      boxShadow: isEmpty
                        ? "none"
                        : "0 12px 28px rgba(0,0,0,0.18)",
                    }}
                    disabled={isEmpty}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ fontWeight: 950 }}>
                        {normalizeSlotId(s.slot_id)}
                      </div>
                      {!isEmpty && deal ? <span style={badgeHot}>특가</span> : null}
                    </div>

                    <div
                      style={{
                        fontWeight: 950,
                        fontSize: 13,
                        lineHeight: 1.2,
                      }}
                    >
                      {title}
                    </div>

                    {!isEmpty && deal ? (
                      <div style={{ marginTop: 6 }}>
                        <CountdownInline deal={deal} tick={tick} />
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: 12,
                          opacity: isEmpty ? 0.7 : 0.85,
                        }}
                      >
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
        안정화 버전: HallClient 내부 fetch 없음, hallId alias 대응, booth_id/id 혼용 대응.
      </footer>
    </main>
  );
}

function DealBadge({ deal, tick }: { deal: DealRow; tick: number }) {
  const end = deal.end_at ? Date.parse(deal.end_at) : 0;
  const left = end ? Math.max(0, end - Date.now()) : 0;
  void tick;

  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span style={badgeHot}>EXPO 특가</span>
      <span style={{ ...mono, fontSize: 12, color: "#111" }}>
        {fmtLeft(left)}
      </span>
    </div>
  );
}

function CountdownInline({ deal, tick }: { deal: DealRow; tick: number }) {
  const end = deal.end_at ? Date.parse(deal.end_at) : 0;
  const left = end ? Math.max(0, end - Date.now()) : 0;
  void tick;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
      }}
    >
      <span style={badgeMini}>⏳ {fmtLeft(left)}</span>
      {typeof deal.stock === "number" ? (
        <span style={badgeMini}>남은수량: {deal.stock}</span>
      ) : null}
    </div>
  );
}

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