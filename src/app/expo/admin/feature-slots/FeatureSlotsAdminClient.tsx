"use client";

import React, { useMemo, useState } from "react";

type Booth = {
  booth_id: string;
  name: string | null;
  hall_id: string | null;
};

type Deal = {
  deal_id: string;
  title: string | null;
  booth_id: string | null;
};

type Slot = {
  slot_id: string;
  slot_group: string;
  slot_order: number;

  booth_id: string | null;
  deal_id: string | null;

  title_override: string | null;
  subtitle_override: string | null;

  cover_image_url: string | null;
  logo_url: string | null;

  primary_cta_text: string | null;
  primary_target_type: string | null;
  primary_target_value: string | null;

  secondary_cta_text: string | null;
  secondary_target_type: string | null;
  secondary_target_value: string | null;

  is_active: boolean;
};

const GROUPS = [
  { key: "main_hero", label: "메인 슬라이드" },
  { key: "hall_inputs_top", label: "농자재관 TOP5" },
  { key: "hall_machine_top", label: "농기계관 TOP5" },
  { key: "hall_seed_top", label: "종자관 TOP5" },
  { key: "hall_smartfarm_top", label: "스마트팜관 TOP5" },
];

export default function FeatureSlotsAdminClient({
  booths,
  deals,
  slots,
}: {
  booths: Booth[];
  deals: Deal[];
  slots: Slot[];
}) {
  const [selectedGroup, setSelectedGroup] = useState("main_hero");
  const [items, setItems] = useState<Slot[]>(slots);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const groupItems = useMemo(() => {
    return items
      .filter((x) => x.slot_group === selectedGroup)
      .sort((a, b) => a.slot_order - b.slot_order);
  }, [items, selectedGroup]);

  async function saveSlot(formData: FormData) {
    const slotOrder = String(formData.get("slot_order") || "");
    const saveId = `${selectedGroup}-${slotOrder}`;
    setSavingKey(saveId);

    const payload = {
      slot_id: formData.get("slot_id") || null,
      slot_group: formData.get("slot_group"),
      slot_order: Number(formData.get("slot_order") || 1),

      booth_id: formData.get("booth_id") || null,
      deal_id: formData.get("deal_id") || null,

      title_override: formData.get("title_override") || null,
      subtitle_override: formData.get("subtitle_override") || null,

      cover_image_url: formData.get("cover_image_url") || null,
      logo_url: formData.get("logo_url") || null,

      primary_cta_text: formData.get("primary_cta_text") || null,
      primary_target_type: formData.get("primary_target_type") || "booth",
      primary_target_value: formData.get("primary_target_value") || null,

      secondary_cta_text: formData.get("secondary_cta_text") || null,
      secondary_target_type: formData.get("secondary_target_type") || null,
      secondary_target_value: formData.get("secondary_target_value") || null,

      is_active: formData.get("is_active") === "on",
    };

    const res = await fetch("/api/expo/admin/feature-slots", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    setSavingKey(null);

    if (!json.ok) {
      alert(json.error || "저장 실패");
      return;
    }

    const saved = json.item as Slot;

    setItems((prev) => {
      const exists = prev.some((x) => x.slot_id === saved.slot_id);
      if (exists) {
        return prev.map((x) => (x.slot_id === saved.slot_id ? saved : x));
      }
      return [...prev, saved];
    });

    alert("저장되었습니다.");
  }

  return (
    <main style={S.page}>
      <div style={S.container}>
        <header style={S.header}>
          <div>
            <div style={S.kicker}>K-Agri Expo Admin</div>
            <h1 style={S.title}>전시장 편성실</h1>
            <div style={S.sub}>
              메인 슬라이드, 관별 TOP5, 버튼 문구, 이동 경로를 직접 편성합니다.
            </div>
          </div>

          <div style={S.tabs}>
            {GROUPS.map((g) => (
              <button
                key={g.key}
                onClick={() => setSelectedGroup(g.key)}
                style={{
                  ...S.tab,
                  ...(selectedGroup === g.key ? S.tabActive : {}),
                }}
              >
                {g.label}
              </button>
            ))}
          </div>
        </header>

        <section style={S.grid}>
          {[1, 2, 3, 4, 5].map((order) => {
            const slot = groupItems.find((x) => x.slot_order === order);
            const saveId = `${selectedGroup}-${order}`;

            return (
              <form key={saveId} action={saveSlot} style={S.card}>
                <input type="hidden" name="slot_id" defaultValue={slot?.slot_id ?? ""} />
                <input type="hidden" name="slot_group" value={selectedGroup} />
                <input type="hidden" name="slot_order" value={order} />

                <div style={S.cardTop}>
                  <div style={S.slotBadge}>SLOT {order}</div>

                  <label style={S.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked={slot?.is_active ?? true}
                    />
                    사용
                  </label>
                </div>

                <label style={S.label}>부스 선택</label>
                <select name="booth_id" defaultValue={slot?.booth_id ?? ""} style={S.input}>
                  <option value="">선택 안함</option>
                  {booths.map((b) => (
                    <option key={b.booth_id} value={b.booth_id}>
                      {b.name ?? "부스"} ({b.hall_id ?? "-"})
                    </option>
                  ))}
                </select>

                <label style={S.label}>특가 선택</label>
                <select name="deal_id" defaultValue={slot?.deal_id ?? ""} style={S.input}>
                  <option value="">선택 안함</option>
                  {deals.map((d) => (
                    <option key={d.deal_id} value={d.deal_id}>
                      {d.title ?? "딜"}
                    </option>
                  ))}
                </select>

                <label style={S.label}>제목 덮어쓰기</label>
                <input
                  name="title_override"
                  defaultValue={slot?.title_override ?? ""}
                  style={S.input}
                />

                <label style={S.label}>부제목 덮어쓰기</label>
                <textarea
                  name="subtitle_override"
                  defaultValue={slot?.subtitle_override ?? ""}
                  style={S.textarea}
                />

                <label style={S.label}>커버 이미지 URL</label>
                <input
                  name="cover_image_url"
                  defaultValue={slot?.cover_image_url ?? ""}
                  style={S.input}
                />

                <label style={S.label}>로고 URL</label>
                <input
                  name="logo_url"
                  defaultValue={slot?.logo_url ?? ""}
                  style={S.input}
                />

                <hr style={S.hr} />

                <label style={S.label}>기본 버튼 문구</label>
                <input
                  name="primary_cta_text"
                  defaultValue={slot?.primary_cta_text ?? ""}
                  style={S.input}
                />

                <label style={S.label}>기본 이동 타입</label>
                <select
                  name="primary_target_type"
                  defaultValue={slot?.primary_target_type ?? "booth"}
                  style={S.input}
                >
                  <option value="booth">booth</option>
                  <option value="deal">deal</option>
                  <option value="hall">hall</option>
                  <option value="custom">custom</option>
                  <option value="none">none</option>
                </select>

                <label style={S.label}>기본 이동 값</label>
                <input
                  name="primary_target_value"
                  defaultValue={slot?.primary_target_value ?? ""}
                  style={S.input}
                  placeholder="booth_id / deal_id / hallId / https://..."
                />

                <label style={S.label}>보조 버튼 문구</label>
                <input
                  name="secondary_cta_text"
                  defaultValue={slot?.secondary_cta_text ?? ""}
                  style={S.input}
                />

                <label style={S.label}>보조 이동 타입</label>
                <select
                  name="secondary_target_type"
                  defaultValue={slot?.secondary_target_type ?? ""}
                  style={S.input}
                >
                  <option value="">선택 안함</option>
                  <option value="booth">booth</option>
                  <option value="deal">deal</option>
                  <option value="hall">hall</option>
                  <option value="custom">custom</option>
                  <option value="none">none</option>
                </select>

                <label style={S.label}>보조 이동 값</label>
                <input
                  name="secondary_target_value"
                  defaultValue={slot?.secondary_target_value ?? ""}
                  style={S.input}
                  placeholder="booth_id / deal_id / hallId / https://..."
                />

                <button type="submit" style={S.saveBtn} disabled={savingKey === saveId}>
                  {savingKey === saveId ? "저장 중..." : "저장"}
                </button>
              </form>
            );
          })}
        </section>
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: 24,
  },
  container: {
    maxWidth: 1440,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
    flexWrap: "wrap",
  },
  kicker: {
    fontSize: 12,
    fontWeight: 900,
    color: "#ef4444",
  },
  title: {
    margin: "6px 0 0",
    fontSize: 34,
    fontWeight: 950,
  },
  sub: {
    marginTop: 8,
    color: "#64748b",
    lineHeight: 1.7,
  },
  tabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  tab: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 900,
  },
  tabActive: {
    background: "#111",
    color: "#fff",
    border: "1px solid #111",
  },
  grid: {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(360px,1fr))",
    gap: 14,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 16,
    boxShadow: "0 8px 24px rgba(15,23,42,0.05)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  slotBadge: {
    fontSize: 12,
    fontWeight: 950,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#111",
    color: "#fff",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 800,
  },
  label: {
    display: "block",
    marginTop: 10,
    marginBottom: 6,
    fontSize: 12,
    fontWeight: 900,
    color: "#475569",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 84,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    resize: "vertical",
  },
  hr: {
    marginTop: 14,
    marginBottom: 4,
    border: "none",
    borderTop: "1px solid #eef2f7",
  },
  saveBtn: {
    marginTop: 16,
    width: "100%",
    padding: "12px 14px",
    borderRadius: 14,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
};