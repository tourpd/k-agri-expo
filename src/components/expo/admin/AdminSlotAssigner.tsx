"use client";

import React, { useMemo, useState } from "react";

export type AdminBoothRow = {
  booth_id: string;
  name: string;
  region: string | null;
  category_primary: string | null;
  intro: string | null;
  hall_id: string;
  phone?: string | null;
};

export type AdminSlotRow = {
  hall_id: string;
  slot_id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  booth_id: string | null;
};

type Props = {
  hallId: string;
  booths: AdminBoothRow[];
  slots: AdminSlotRow[];
};

type AssignPayload = {
  hallId: string;
  slotId: string;
  boothId: string | null;
};

async function postAssign(payload: AssignPayload) {
  const res = await fetch("/api/admin/slots/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json && (json.error || json.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export default function AdminSlotAssigner({ hallId, booths, slots }: Props) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ✅ 슬롯 상태를 로컬에서 관리(드롭 즉시 반영)
  const [slotState, setSlotState] = useState<AdminSlotRow[]>(slots);

  const boothById = useMemo(() => {
    const m = new Map<string, AdminBoothRow>();
    for (const b of booths) m.set(b.booth_id, b);
    return m;
  }, [booths]);

  const assignedBoothIds = useMemo(() => {
    const s = new Set<string>();
    for (const r of slotState) if (r.booth_id) s.add(r.booth_id);
    return s;
  }, [slotState]);

  const unassignedBooths = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = booths.filter((b) => !assignedBoothIds.has(b.booth_id));
    if (!needle) return base;
    return base.filter((b) => {
      const t = `${b.name} ${b.region ?? ""} ${b.category_primary ?? ""} ${b.intro ?? ""}`.toLowerCase();
      return t.includes(needle);
    });
  }, [booths, assignedBoothIds, q]);

  // ✅ 슬롯을 y,x 기준으로 정렬해서 그리드 구성
  const sortedSlots = useMemo(() => {
    return [...slotState].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  }, [slotState]);

  // ✅ 드래그: booth_id를 dataTransfer에 넣는다
  function onDragStartBooth(e: React.DragEvent, boothId: string) {
    e.dataTransfer.setData("text/plain", boothId);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOverSlot(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function assignToSlot(slotId: string, boothId: string | null) {
    setErr(null);
    setBusy(true);

    // optimistic update
    const prev = slotState;
    const next = prev.map((s) =>
      s.hall_id === hallId && s.slot_id === slotId ? { ...s, booth_id: boothId } : s
    );
    setSlotState(next);

    try {
      await postAssign({ hallId, slotId, boothId });
    } catch (e: any) {
      // rollback
      setSlotState(prev);
      setErr(e?.message ?? "저장 실패");
    } finally {
      setBusy(false);
    }
  }

  async function onDropSlot(e: React.DragEvent, slotId: string) {
    e.preventDefault();
    const boothId = e.dataTransfer.getData("text/plain");
    if (!boothId) return;
    await assignToSlot(slotId, boothId);
  }

  const gridCols = useMemo(() => {
    const maxX = sortedSlots.reduce((m, s) => Math.max(m, s.x + (s.w ?? 1) - 1), 1);
    return Math.max(3, maxX);
  }, [sortedSlots]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 16 }}>
      {/* 좌측: 미배정 업체 */}
      <div
        style={{
          border: "1px solid #e6e6e6",
          borderRadius: 16,
          padding: 14,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>미배정 업체</div>
          <div style={{ color: "#666", fontSize: 12 }}>{unassignedBooths.length}개</div>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="검색: 업체명/지역/카테고리"
          style={{
            width: "100%",
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: 12,
            border: "1px solid #ddd",
            outline: "none",
          }}
        />

        {err && (
          <div
            style={{
              marginTop: 10,
              padding: 10,
              borderRadius: 12,
              background: "#fff3f3",
              color: "#b00020",
              border: "1px solid #ffd0d0",
              whiteSpace: "pre-wrap",
            }}
          >
            {err}
          </div>
        )}

        <div style={{ marginTop: 10, maxHeight: 520, overflow: "auto", paddingRight: 6 }}>
          {unassignedBooths.map((b) => (
            <div
              key={b.booth_id}
              draggable
              onDragStart={(e) => onDragStartBooth(e, b.booth_id)}
              style={{
                border: "1px solid #eee",
                borderRadius: 14,
                padding: 12,
                marginBottom: 10,
                cursor: "grab",
                background: "#fafafa",
              }}
              title="드래그해서 슬롯에 드롭"
            >
              <div style={{ fontWeight: 900, fontSize: 14 }}>{b.name}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#666", lineHeight: 1.4 }}>
                {(b.region ?? "지역 미입력") + " · " + (b.category_primary ?? "카테고리 미입력")}
              </div>
              {b.intro ? (
                <div style={{ marginTop: 6, fontSize: 12, color: "#888", lineHeight: 1.4 }}>
                  {b.intro.length > 80 ? b.intro.slice(0, 80) + "…" : b.intro}
                </div>
              ) : null}
            </div>
          ))}

          {unassignedBooths.length === 0 && (
            <div style={{ marginTop: 16, color: "#888", fontSize: 13 }}>
              미배정 업체가 없습니다.
            </div>
          )}
        </div>

        <div style={{ marginTop: 10, color: "#888", fontSize: 12, lineHeight: 1.4 }}>
          팁) “비우기”는 슬롯 배정 해제입니다. <br />
          팁) 같은 업체를 두 슬롯에 넣으려 하면 DB에서 막고 에러가 뜹니다(정상).
        </div>
      </div>

      {/* 우측: 슬롯 그리드 */}
      <div
        style={{
          border: "1px solid #e6e6e6",
          borderRadius: 16,
          padding: 14,
          background: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 18, fontWeight: 900 }}>슬롯 지도 (드롭해서 배정)</div>
          <div style={{ color: "#666", fontSize: 12 }}>
            {busy ? "저장 중…" : "준비됨"} · hall: {hallId}
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            display: "grid",
            gridTemplateColumns: `repeat(${gridCols}, minmax(140px, 1fr))`,
            gap: 12,
            alignItems: "stretch",
          }}
        >
          {sortedSlots.map((s) => {
            const booth = s.booth_id ? boothById.get(s.booth_id) : null;
            return (
              <div
                key={`${s.hall_id}:${s.slot_id}`}
                onDragOver={onDragOverSlot}
                onDrop={(e) => onDropSlot(e, s.slot_id)}
                style={{
                  border: "1px solid #eee",
                  borderRadius: 16,
                  padding: 12,
                  minHeight: 110,
                  background: booth ? "#f7fffb" : "#fafafa",
                }}
                title="여기에 업체를 드롭"
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 900, fontSize: 14 }}>{s.slot_id}</div>
                  <button
                    onClick={() => assignToSlot(s.slot_id, null)}
                    disabled={busy || !s.booth_id}
                    style={{
                      border: "1px solid #ddd",
                      borderRadius: 12,
                      padding: "6px 10px",
                      background: s.booth_id ? "#fff" : "#f4f4f4",
                      cursor: s.booth_id ? "pointer" : "not-allowed",
                      fontSize: 12,
                    }}
                  >
                    비우기
                  </button>
                </div>

                {booth ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 900, fontSize: 13 }}>{booth.name}</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>
                      {(booth.region ?? "지역 미입력") + " · " + (booth.category_primary ?? "카테고리 미입력")}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 18, color: "#999", fontSize: 13 }}>빈 슬롯</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}