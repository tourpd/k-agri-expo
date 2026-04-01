"use client";

import React, { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { uploadExpoImage } from "@/lib/expoUpload";

type SlotRow = {
  id: string;
  section_key: string;
  slot_order: number;
  title: string | null;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  video_url: string | null;
  badge_text: string | null;
  button_text: string | null;
  link_type: string;
  link_value: string | null;
  price_text: string | null;
  stock_text: string | null;
  event_text: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export default function HomeSlotsAdminClient({
  slots,
}: {
  slots: SlotRow[];
}) {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<SlotRow[]>(slots);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function updateRow(id: string, patch: Partial<SlotRow>) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  async function saveRow(row: SlotRow) {
    try {
      setSavingId(row.id);

      const { error } = await supabase
        .from("expo_home_slots")
        .update({
          section_key: row.section_key,
          slot_order: row.slot_order,
          title: row.title,
          subtitle: row.subtitle,
          description: row.description,
          image_url: row.image_url,
          video_url: row.video_url,
          badge_text: row.badge_text,
          button_text: row.button_text,
          link_type: row.link_type,
          link_value: row.link_value,
          price_text: row.price_text,
          stock_text: row.stock_text,
          event_text: row.event_text,
          is_active: row.is_active,
          starts_at: row.starts_at,
          ends_at: row.ends_at,
        })
        .eq("id", row.id);

      if (error) {
        alert(`저장 실패: ${error.message}`);
        return;
      }

      alert("저장 완료");
    } finally {
      setSavingId(null);
    }
  }

  async function handleImageUpload(rowId: string, file: File | null) {
    if (!file) return;

    try {
      setUploadingId(rowId);
      const imageUrl = await uploadExpoImage(file, "home-slots");
      updateRow(rowId, { image_url: imageUrl });
      alert("이미지 업로드 완료. 저장 버튼을 눌러 반영하세요.");
    } catch (e: any) {
      alert(`업로드 실패: ${e?.message ?? "unknown error"}`);
    } finally {
      setUploadingId(null);
    }
  }

  const grouped = rows.reduce<Record<string, SlotRow[]>>((acc, row) => {
    if (!acc[row.section_key]) acc[row.section_key] = [];
    acc[row.section_key].push(row);
    return acc;
  }, {});

  return (
    <main style={S.page}>
      <div style={S.wrap}>
        <div style={S.header}>
          <div>
            <div style={S.kicker}>K-Agri Expo Admin</div>
            <h1 style={S.title}>메인페이지 편성실</h1>
            <div style={S.desc}>
              사진 업로드, 외부 이미지 링크, 유튜브 링크를 바로 넣을 수 있습니다.
            </div>
          </div>
        </div>

        {Object.entries(grouped).map(([sectionKey, list]) => (
          <section key={sectionKey} style={S.section}>
            <h2 style={S.sectionTitle}>{sectionKey}</h2>

            <div style={S.grid}>
              {list.map((row) => (
                <div key={row.id} style={S.card}>
                  <div style={S.topRow}>
                    <strong>slot #{row.slot_order}</strong>
                    <label style={S.switchWrap}>
                      <input
                        type="checkbox"
                        checked={row.is_active}
                        onChange={(e) =>
                          updateRow(row.id, { is_active: e.target.checked })
                        }
                      />
                      사용
                    </label>
                  </div>

                  <label style={S.label}>제목</label>
                  <input
                    style={S.input}
                    value={row.title ?? ""}
                    onChange={(e) => updateRow(row.id, { title: e.target.value })}
                  />

                  <label style={S.label}>부제목</label>
                  <input
                    style={S.input}
                    value={row.subtitle ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { subtitle: e.target.value })
                    }
                  />

                  <label style={S.label}>설명</label>
                  <textarea
                    style={S.textarea}
                    value={row.description ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { description: e.target.value })
                    }
                  />

                  <label style={S.label}>배지 문구</label>
                  <input
                    style={S.input}
                    value={row.badge_text ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { badge_text: e.target.value })
                    }
                  />

                  <label style={S.label}>이미지 업로드</label>
                  <input
                    type="file"
                    accept="image/*"
                    style={S.input}
                    onChange={(e) =>
                      handleImageUpload(row.id, e.target.files?.[0] ?? null)
                    }
                  />

                  <div style={S.helperText}>
                    {uploadingId === row.id
                      ? "이미지 업로드 중..."
                      : "사진 파일을 바로 올릴 수 있습니다."}
                  </div>

                  <label style={S.label}>이미지 URL</label>
                  <input
                    style={S.input}
                    value={row.image_url ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { image_url: e.target.value })
                    }
                    placeholder="직접 붙여넣기 가능"
                  />

                  {row.image_url ? (
                    <div style={S.previewBox}>
                      <img
                        src={row.image_url}
                        alt="preview"
                        style={S.previewImg}
                      />
                    </div>
                  ) : null}

                  <label style={S.label}>유튜브/영상 링크</label>
                  <input
                    style={S.input}
                    value={row.video_url ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { video_url: e.target.value })
                    }
                    placeholder="https://youtube.com/..."
                  />

                  <label style={S.label}>버튼 문구</label>
                  <input
                    style={S.input}
                    value={row.button_text ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { button_text: e.target.value })
                    }
                  />

                  <label style={S.label}>링크 타입</label>
                  <select
                    style={S.input}
                    value={row.link_type}
                    onChange={(e) =>
                      updateRow(row.id, { link_type: e.target.value })
                    }
                  >
                    <option value="booth">booth</option>
                    <option value="deal">deal</option>
                    <option value="hall">hall</option>
                    <option value="event">event</option>
                    <option value="live">live</option>
                    <option value="custom">custom</option>
                    <option value="external">external</option>
                  </select>

                  <label style={S.label}>링크 값</label>
                  <input
                    style={S.input}
                    value={row.link_value ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { link_value: e.target.value })
                    }
                    placeholder="booth_id / deal_id / hall id / url"
                  />

                  <label style={S.label}>가격 문구</label>
                  <input
                    style={S.input}
                    value={row.price_text ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { price_text: e.target.value })
                    }
                  />

                  <label style={S.label}>수량 문구</label>
                  <input
                    style={S.input}
                    value={row.stock_text ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { stock_text: e.target.value })
                    }
                  />

                  <label style={S.label}>이벤트 문구</label>
                  <input
                    style={S.input}
                    value={row.event_text ?? ""}
                    onChange={(e) =>
                      updateRow(row.id, { event_text: e.target.value })
                    }
                  />

                  <button
                    style={S.saveBtn}
                    onClick={() => saveRow(row)}
                    disabled={savingId === row.id}
                  >
                    {savingId === row.id ? "저장 중..." : "저장"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f8fafc",
    padding: "24px 18px 60px",
  },
  wrap: {
    maxWidth: 1400,
    margin: "0 auto",
  },
  header: {
    marginBottom: 18,
  },
  kicker: {
    fontSize: 12,
    fontWeight: 950,
    color: "#16a34a",
  },
  title: {
    margin: "8px 0 0",
    fontSize: 32,
    fontWeight: 950,
  },
  desc: {
    marginTop: 10,
    color: "#64748b",
    lineHeight: 1.7,
  },
  section: {
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 950,
    marginBottom: 14,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  switchWrap: {
    fontSize: 13,
    display: "flex",
    gap: 6,
    alignItems: "center",
  },
  label: {
    display: "block",
    marginTop: 10,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 900,
  },
  input: {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    padding: "11px 12px",
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    boxSizing: "border-box",
    resize: "vertical",
  },
  helperText: {
    marginTop: 6,
    fontSize: 12,
    color: "#64748b",
  },
  previewBox: {
    marginTop: 10,
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #e5e7eb",
    background: "#f8fafc",
  },
  previewImg: {
    width: "100%",
    height: 220,
    objectFit: "cover",
    display: "block",
  },
  saveBtn: {
    marginTop: 16,
    width: "100%",
    padding: "13px 14px",
    borderRadius: 14,
    border: "1px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 950,
    cursor: "pointer",
  },
};