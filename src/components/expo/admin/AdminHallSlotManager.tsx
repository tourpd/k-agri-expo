"use client";

import React, { useMemo, useState } from "react";

type Booth = {
  booth_id: string;
  name: string;
  region: string | null;
  category_primary: string | null;
  hall_id: string;
};

type Slot = {
  hall_id: string;
  slot_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  booth_id: string | null;
};

function DraggableBooth({
  booth,
  assignedSlotId,
  onDragStart,
}: {
  booth: Booth;
  assignedSlotId: string | null;
  onDragStart: (boothId: string) => void;
}) {
  const style: React.CSSProperties = {
    padding: 10,
    borderRadius: 14,
    border: "1px solid #e5e7eb",
    background: "white",
    cursor: "grab",
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", booth.booth_id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(booth.booth_id);
      }}
      style={style}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontWeight: 900, lineHeight: 1.2 }}>{booth.name}</div>
        {assignedSlotId ? (
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              padding: "4px 8px",
              borderRadius: 999,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              whiteSpace: "nowrap",
            }}
          >
            {assignedSlotId}
          </span>
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 900,
              padding: "4px 8px",
              borderRadius: 999,
              border: "1px solid #f59e0b",
              background: "#fff7ed",
              color: "#9a3412",
              whiteSpace: "nowrap",
            }}
          >
            미배정
          </span>
        )}
      </div>

      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
        {booth.region ?? "-"} · {booth.category_primary ?? "-"}
      </div>

      <div style={{ fontSize: 12, opacity: 0.6, marginTop: 6 }}>
        드래그해서 슬롯(A1/A2…)에 놓으세요
      </div>
    </div>
  );
}

function DroppableSlot({
  slot,
  boothName,
  isBusy,
  isOver,
  onDragOver,
  onDragLeave,
  onDropBooth,
  onUnassign,
}: {
  slot: Slot;
  boothName: string | null;
  isBusy: boolean;
  isOver: boolean;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDropBooth: (e: React.DragEvent<HTMLDivElement>) => void;
  onUnassign: () => void;
}) {
  const style: React.CSSProperties = {
    width: slot.w * 92 + (slot.w - 1) * 10,
    height: slot.h * 92 + (slot.h - 1) * 10,
    borderRadius: 18,
    border: isOver ? "2px solid #f59e0b" : "1px solid #e5e7eb",
    background: boothName ? "#111" : "#f3f4f6",
    color: boothName ? "white" : "#111",
    padding: 10,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    outline: isBusy ? "2px solid #22c55e" : "none",
    opacity: isBusy ? 0.85 : 1,
    transition: "border 120ms ease, transform 120ms ease",
    transform: isOver ? "scale(1.02)" : "scale(1)",
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDropBooth}
      style={style}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
        <div style={{ fontWeight: 900 }}>{slot.slot_id}</div>
        {slot.booth_id ? (
          <button
            onClick={onUnassign}
            disabled={isBusy}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.35)",
              background: "transparent",
              color: "white",
              cursor: isBusy ? "not-allowed" : "pointer",
              opacity: isBusy ? 0.6 : 1,
            }}
          >
            해제
          </button>
        ) : (
          <span style={{ fontSize: 12, opacity: 0.7 }}>입점 가능</span>
        )}
      </div>

      <div style={{ fontWeight: 900, fontSize: 13, lineHeight: 1.2 }}>
        {boothName ?? "빈 부스"}
      </div>

      {isBusy ? (
        <div style={{ fontSize: 12, opacity: 0.8 }}>저장중…</div>
      ) : (
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          좌표: ({slot.x},{slot.y}) · {slot.w}×{slot.h}
        </div>
      )}

      {isOver ? (
        <div
          style={{
            position: "absolute",
            inset: 6,
            borderRadius: 14,
            border: "2px dashed rgba(245,158,11,0.9)",
            pointerEvents: "none",
          }}
        />
      ) : null}
    </div>
  );
}

export default function AdminSlotAssigner({
  hallId,
  booths,
  slots: initialSlots,
}: {
  hallId: string;
  booths: Booth[];
  slots: Slot[];
}) {
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [draggingBoothId, setDraggingBoothId] = useState<string | null>(null);
  const [overSlotKey, setOverSlotKey] = useState<string | null>(null);

  const boothById = useMemo(() => {
    const m: Record<string, Booth> = {};
    booths.forEach((b) => {
      m[b.booth_id] = b;
    });
    return m;
  }, [booths]);

  const assignedSlotByBoothId = useMemo(() => {
    const m: Record<string, string> = {};
    slots.forEach((s) => {
      if (s.booth_id) m[s.booth_id] = s.slot_id;
    });
    return m;
  }, [slots]);

  const hallBooths = useMemo(
    () => booths.filter((b) => b.hall_id === hallId),
    [booths, hallId]
  );

  const filteredBooths = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    const base = showAll
      ? hallBooths
      : hallBooths.filter((b) => !assignedSlotByBoothId[b.booth_id]);

    const searched = !keyword
      ? base
      : base.filter((b) => {
          const hay =
            `${b.name} ${b.region ?? ""} ${b.category_primary ?? ""}`.toLowerCase();
          return hay.includes(keyword);
        });

    return [...searched].sort((a, b) => {
      const aAssigned = assignedSlotByBoothId[a.booth_id] ? 1 : 0;
      const bAssigned = assignedSlotByBoothId[b.booth_id] ? 1 : 0;
      if (aAssigned !== bAssigned) return aAssigned - bAssigned;
      return a.name.localeCompare(b.name, "ko");
    });
  }, [hallBooths, q, showAll, assignedSlotByBoothId]);

  async function assignSlot(
    targetHallId: string,
    targetSlotId: string,
    booth_id: string | null
  ) {
    const key = `${targetHallId}:${targetSlotId}`;
    setBusyKey(key);

    try {
      const res = await fetch("/api/admin/slots/assign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hall_id: targetHallId,
          slot_id: targetSlotId,
          booth_id,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        const msg = json?.error ?? `HTTP ${res.status} ${res.statusText}`;
        alert(`배정 실패: ${msg}`);
        return false;
      }
      return true;
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDropToSlot(targetHallId: string, targetSlotId: string, booth_id: string) {
    if (!booth_id) return;

    if (targetHallId !== hallId) {
      alert("다른 홀로는 배정할 수 없습니다.");
      return;
    }

    const prevSlots = slots;

    const currentAssigned = prevSlots.find(
      (s) => s.hall_id === targetHallId && s.booth_id === booth_id
    );

    if (currentAssigned && currentAssigned.slot_id === targetSlotId) return;

    const targetSlot = prevSlots.find(
      (s) => s.hall_id === targetHallId && s.slot_id === targetSlotId
    );
    if (!targetSlot) return;

    if (targetSlot.booth_id && targetSlot.booth_id !== booth_id) {
      const targetName = boothById[targetSlot.booth_id]?.name ?? "(알수없음)";
      alert(
        `이미 배정된 슬롯입니다: ${targetSlotId} (${targetName})\n먼저 해제 후 배정해 주세요.`
      );
      return;
    }

    const next = prevSlots.map((s) => {
      if (
        currentAssigned &&
        s.hall_id === targetHallId &&
        s.slot_id === currentAssigned.slot_id
      ) {
        return { ...s, booth_id: null };
      }
      if (s.hall_id === targetHallId && s.slot_id === targetSlotId) {
        return { ...s, booth_id };
      }
      return s;
    });
    setSlots(next);

    if (currentAssigned) {
      const ok1 = await assignSlot(targetHallId, currentAssigned.slot_id, null);
      if (!ok1) {
        setSlots(prevSlots);
        return;
      }
    }

    const ok2 = await assignSlot(targetHallId, targetSlotId, booth_id);
    if (!ok2) {
      setSlots(prevSlots);
      return;
    }
  }

  async function unassign(slot: Slot) {
    if (!slot.booth_id) return;

    const prev = slots;
    const next = slots.map((s) =>
      s.hall_id === slot.hall_id && s.slot_id === slot.slot_id
        ? { ...s, booth_id: null }
        : s
    );
    setSlots(next);

    const ok = await assignSlot(slot.hall_id, slot.slot_id, null);
    if (!ok) setSlots(prev);
  }

  const hallSlots = useMemo(
    () => slots.filter((s) => s.hall_id === hallId),
    [slots, hallId]
  );

  const bounds = useMemo(() => {
    if (hallSlots.length === 0) return { maxX: 0, maxY: 0 };
    const maxX = Math.max(...hallSlots.map((s) => s.x + (s.w ?? 1) - 1));
    const maxY = Math.max(...hallSlots.map((s) => s.y + (s.h ?? 1) - 1));
    return { maxX, maxY };
  }, [hallSlots]);

  const CELL = 92;
  const GAP = 10;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 900 }}>운영자: 부스 배정</div>
      <div style={{ marginTop: 6, opacity: 0.8 }}>
        Hall: <b>{hallId}</b> · 드래그해서 슬롯(A1/A2…)에 놓으세요.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16, marginTop: 14 }}>
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 16,
            padding: 12,
            background: "#fff",
          }}
        >
          <div style={{ fontWeight: 900, marginBottom: 10 }}>부스 목록(드래그)</div>

          <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="검색: 업체명/지역/카테고리"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                outline: "none",
                fontSize: 13,
              }}
            />

            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
              />
              전체 부스 보기(배정된 부스 포함)
            </label>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              현재 표시: <b>{filteredBooths.length}</b>개
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {filteredBooths.map((b) => (
              <DraggableBooth
                key={b.booth_id}
                booth={b}
                assignedSlotId={assignedSlotByBoothId[b.booth_id] ?? null}
                onDragStart={setDraggingBoothId}
              />
            ))}

            {filteredBooths.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.7,
                  padding: 10,
                  border: "1px dashed #e5e7eb",
                  borderRadius: 12,
                }}
              >
                표시할 부스가 없습니다. (검색어/토글을 확인하세요)
              </div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 16,
            padding: 12,
            background: "#fff",
            overflow: "auto",
          }}
        >
          <div
            style={{
              fontWeight: 900,
              marginBottom: 10,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div>
              전시장 지도(드롭 영역)
              {busyKey ? (
                <span style={{ marginLeft: 10, fontSize: 12, opacity: 0.7 }}>
                  저장중… {busyKey}
                </span>
              ) : null}
            </div>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
              크기: {bounds.maxX}×{bounds.maxY}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              width: bounds.maxX * CELL + (bounds.maxX - 1) * GAP,
              height: bounds.maxY * CELL + (bounds.maxY - 1) * GAP,
              background:
                "linear-gradient(#fafafa, #fafafa) padding-box, repeating-linear-gradient(0deg, rgba(0,0,0,0.03), rgba(0,0,0,0.03) 1px, transparent 1px, transparent 92px) border-box",
              borderRadius: 16,
              border: "1px solid #f0f0f0",
              padding: 0,
            }}
          >
            {hallSlots.map((s) => {
              const boothName = s.booth_id
                ? boothById[s.booth_id]?.name ?? "(알수없음)"
                : null;
              const left = (s.x - 1) * (CELL + GAP);
              const top = (s.y - 1) * (CELL + GAP);
              const isBusy = busyKey === `${s.hall_id}:${s.slot_id}`;
              const slotKey = `${s.hall_id}:${s.slot_id}`;

              return (
                <div
                  key={slotKey}
                  style={{
                    position: "absolute",
                    left,
                    top,
                  }}
                >
                  <DroppableSlot
                    slot={s}
                    boothName={boothName}
                    isBusy={isBusy}
                    isOver={overSlotKey === slotKey}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setOverSlotKey(slotKey);
                    }}
                    onDragLeave={() => {
                      setOverSlotKey((prev) => (prev === slotKey ? null : prev));
                    }}
                    onDropBooth={async (e) => {
                      e.preventDefault();
                      const boothId =
                        e.dataTransfer.getData("text/plain") || draggingBoothId;
                      setOverSlotKey(null);
                      setDraggingBoothId(null);

                      if (!boothId) return;
                      await handleDropToSlot(s.hall_id, s.slot_id, boothId);
                    }}
                    onUnassign={() => unassign(s)}
                  />
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            * 같은 hall 내에서 한 부스는 한 슬롯만 배정됩니다(중복 배정은 DB에서 차단).
            <br />
            * 이미 다른 부스가 들어간 슬롯은 “덮어쓰기 금지”로 막아두었습니다(해제 후 배정).
          </div>
        </div>
      </div>
    </div>
  );
} 