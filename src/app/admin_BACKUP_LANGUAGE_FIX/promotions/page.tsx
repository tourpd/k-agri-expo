"use client";

import { useEffect, useState } from "react";
import ExpoPromotionHero from "@/components/expo/ExpoPromotionHero";

type Promo = {
  id?: string;

  title: string;
  subtitle: string;
  description: string;

  promo_type: string;
  media_type: string;

  sponsor_name: string;
  partner_name: string;

  prize_label: string;
  prize_title: string;
  prize_desc: string;
  prize_image_url: string;

  feature_1: string;
  feature_2: string;
  feature_3: string;
  feature_4: string;

  live_date_label: string;
  live_datetime: string;

  participant_label: string;
  participant_count_manual: number;
  show_participant_count: boolean;

  image_url: string;
  video_url: string;

  button_text: string;
  button_link: string;

  badge: string;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
};

const EMPTY_FORM: Promo = {
  title: "2026 영진로타리 신제품 출시",
  subtitle: "역회전 로타리 1대 무료 추첨!",
  description:
    "방송 중 공개되는 암호를 입력한 농민만 최종 추첨 대상이 됩니다. 당첨 즉시 전화드리며, 10번 벨 안에 받지 않으면 재추첨됩니다.",

  promo_type: "live",
  media_type: "video",

  sponsor_name: "영진로타리",
  partner_name: "K-Agri Expo",

  prize_label: "오늘의 대표 경품",
  prize_title: "영진로타리 역회전 로타리",
  prize_desc:
    "돌 많은 밭에서도 강력한 작업이 가능한 영진로타리 역회전 로타리입니다.",
  prize_image_url: "",

  feature_1: "돌 많은 밭에서도 강력한 분쇄력",
  feature_2: "역회전 구조로 토양 깊이 파쇄",
  feature_3: "방송 중 실시간 당첨자 공개",
  feature_4: "전화 확인 후 최종 경품 확정",

  live_date_label: "5월 28일 (수) 오후 8시 LIVE",
  live_datetime: "",

  participant_label: "현재 참여 농가",
  participant_count_manual: 150,
  show_participant_count: true,

  image_url: "",
  video_url: "",

  button_text: "무료 추첨 참여하기",
  button_link: "/expo/live/join",

  badge: "MONTHLY LIVE EVENT",
  is_featured: true,
  is_active: true,
  sort_order: 1,
};

function asPromo(item: Partial<Promo>): Promo {
  return {
    ...EMPTY_FORM,
    ...item,
    title: item.title || EMPTY_FORM.title,
    subtitle: item.subtitle || EMPTY_FORM.subtitle,
    description: item.description || EMPTY_FORM.description,

    sponsor_name: item.sponsor_name || EMPTY_FORM.sponsor_name,
    partner_name: item.partner_name || EMPTY_FORM.partner_name,

    prize_label: item.prize_label || EMPTY_FORM.prize_label,
    prize_title: item.prize_title || EMPTY_FORM.prize_title,
    prize_desc: item.prize_desc || EMPTY_FORM.prize_desc,
    prize_image_url: item.prize_image_url || "",

    feature_1: item.feature_1 || EMPTY_FORM.feature_1,
    feature_2: item.feature_2 || EMPTY_FORM.feature_2,
    feature_3: item.feature_3 || EMPTY_FORM.feature_3,
    feature_4: item.feature_4 || EMPTY_FORM.feature_4,

    live_date_label: item.live_date_label || EMPTY_FORM.live_date_label,
    live_datetime: item.live_datetime || "",

    participant_label: item.participant_label || EMPTY_FORM.participant_label,
    participant_count_manual: Number(
      item.participant_count_manual ?? EMPTY_FORM.participant_count_manual
    ),
    show_participant_count: item.show_participant_count !== false,

    promo_type: item.promo_type || EMPTY_FORM.promo_type,
    media_type: item.media_type || EMPTY_FORM.media_type,

    image_url: item.image_url || "",
    video_url: item.video_url || "",

    button_text: item.button_text || EMPTY_FORM.button_text,
    button_link: item.button_link || EMPTY_FORM.button_link,

    badge: item.badge || EMPTY_FORM.badge,
    is_featured: item.is_featured === true,
    is_active: item.is_active !== false,
    sort_order: Number(item.sort_order ?? EMPTY_FORM.sort_order),
  };
}

export default function AdminPromotionsPage() {
  const [items, setItems] = useState<Promo[]>([]);
  const [form, setForm] = useState<Promo>(EMPTY_FORM);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingPrize, setUploadingPrize] = useState(false);

  function patch(next: Partial<Promo>) {
    setForm((prev) => ({ ...prev, ...next }));
  }

  function newItem() {
    setForm({
      ...EMPTY_FORM,
      id: undefined,
      sort_order: items.length + 1,
      is_featured: items.length === 0,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function load() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/promotions", { cache: "no-store" });
      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "불러오기 실패");
        return;
      }

      const nextItems = (json.items || []).map((item: Partial<Promo>) =>
        asPromo(item)
      );

      setItems(nextItems);

      if (nextItems.length > 0 && !form.id) {
        const featured =
          nextItems.find((item: Promo) => item.is_featured) || nextItems[0];
        setForm(featured);
      }
    } catch {
      alert("불러오기 실패");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setSaving(true);

    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "저장 실패");
        return;
      }

      if (json.item) setForm(asPromo(json.item));

      await load();
      alert("✅ 저장 완료. 메인 페이지에 반영됩니다.");
    } catch {
      alert("저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id?: string) {
    if (!id) return;
    if (!confirm("삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/admin/promotions?id=${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "삭제 실패");
        return;
      }

      await load();

      if (form.id === id) setForm(EMPTY_FORM);
    } catch {
      alert("삭제 실패");
    }
  }

  async function uploadImage(
    e: React.ChangeEvent<HTMLInputElement>,
    target: "image_url" | "prize_image_url"
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === "image_url") setUploadingMain(true);
    if (target === "prize_image_url") setUploadingPrize(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/promotions/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "업로드 실패");
        return;
      }

      patch({ [target]: json.url } as Partial<Promo>);
    } catch {
      alert("업로드 실패");
    } finally {
      setUploadingMain(false);
      setUploadingPrize(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewItem = {
    ...form,
    participant_count_auto: form.participant_count_manual,
  };

  return (
    <main style={S.wrap}>
      <section style={S.editor}>
        <div style={S.card}>
          <div style={S.top}>
            <div>
              <h1 style={S.title}>🎁 메인 프로모션 관리</h1>
              <p style={S.desc}>
                디자인은 고정입니다. 문구, 일정, 경품, 협찬사, 이미지, 영상만 바꿉니다.
              </p>
            </div>

            <div style={S.topBtns}>
              <button type="button" onClick={newItem} style={S.addBtn}>
                + 새 이벤트
              </button>

              <a href="/expo" target="_blank" style={S.mainViewBtn}>
                메인 보기
              </a>
            </div>
          </div>

          {form.id ? (
            <div style={S.editingBox}>현재 수정 중: {form.title}</div>
          ) : (
            <div style={S.newBox}>새 이벤트 작성 중</div>
          )}

          <BoxTitle title="① 메인 문구" />
          <Input label="큰 제목" value={form.title} onChange={(v) => patch({ title: v })} />
          <Input label="노란 혜택 문구" value={form.subtitle} onChange={(v) => patch({ subtitle: v })} />
          <TextArea label="하단 안내 문구" value={form.description} onChange={(v) => patch({ description: v })} />

          <BoxTitle title="② 협찬사 / 경품 정보" />
          <Input label="협찬사명" value={form.sponsor_name} onChange={(v) => patch({ sponsor_name: v })} />
          <Input label="파트너명" value={form.partner_name} onChange={(v) => patch({ partner_name: v })} />
          <Input label="경품 라벨" value={form.prize_label} onChange={(v) => patch({ prize_label: v })} />
          <Input label="경품명" value={form.prize_title} onChange={(v) => patch({ prize_title: v })} />
          <TextArea label="경품 설명" value={form.prize_desc} onChange={(v) => patch({ prize_desc: v })} />

          <div style={{ marginTop: 18 }}>
            <label style={S.label}>오른쪽 경품 이미지 업로드</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => uploadImage(e, "prize_image_url")}
              style={S.fileInput}
            />
            {uploadingPrize ? <div style={S.help}>경품 이미지 업로드 중...</div> : null}
            {form.prize_image_url ? (
              <img src={form.prize_image_url} alt="" style={S.previewImage} />
            ) : null}
          </div>

          <BoxTitle title="③ 라이브 일정 / 참여자" />
          <Input label="라이브 일정 표시" value={form.live_date_label} onChange={(v) => patch({ live_date_label: v })} />

          <div style={{ marginTop: 16 }}>
            <label style={S.label}>D-Day 계산용 날짜/시간</label>
            <input
              type="datetime-local"
              value={form.live_datetime}
              onChange={(e) => patch({ live_datetime: e.target.value })}
              style={S.input}
            />
          </div>

          <Input label="참여자 라벨" value={form.participant_label} onChange={(v) => patch({ participant_label: v })} />
          <Input
            label="참여 농가 수"
            value={String(form.participant_count_manual)}
            onChange={(v) => patch({ participant_count_manual: Number(v || 0) })}
          />
          <Check label="참여자 수 표시" checked={form.show_participant_count} onChange={(v) => patch({ show_participant_count: v })} />

          <BoxTitle title="④ 제품 핵심 / 추첨 안내" />
          <Input label="제품 핵심 1" value={form.feature_1} onChange={(v) => patch({ feature_1: v })} />
          <Input label="제품 핵심 2" value={form.feature_2} onChange={(v) => patch({ feature_2: v })} />
          <Input label="추첨 안내 1" value={form.feature_3} onChange={(v) => patch({ feature_3: v })} />
          <Input label="추첨 안내 2" value={form.feature_4} onChange={(v) => patch({ feature_4: v })} />

          <BoxTitle title="⑤ 영상 / 대표 이미지" />
          <Select
            label="미디어 타입"
            value={form.media_type}
            onChange={(v) => patch({ media_type: v })}
            options={[
              ["video", "유튜브 영상 우선"],
              ["image", "이미지 우선"],
              ["mixed", "이미지 + 영상"],
            ]}
          />

          <div style={{ marginTop: 18 }}>
            <label style={S.label}>대표 이미지 업로드</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => uploadImage(e, "image_url")}
              style={S.fileInput}
            />
            {uploadingMain ? <div style={S.help}>대표 이미지 업로드 중...</div> : null}
            {form.image_url ? <img src={form.image_url} alt="" style={S.previewImage} /> : null}
          </div>

          <Input label="유튜브 링크" value={form.video_url} onChange={(v) => patch({ video_url: v })} />

          <BoxTitle title="⑥ 버튼 / 노출 상태" />
          <Input label="버튼 문구" value={form.button_text} onChange={(v) => patch({ button_text: v })} />
          <Input label="버튼 링크" value={form.button_link} onChange={(v) => patch({ button_link: v })} />
          <Input label="노출 순서" value={String(form.sort_order)} onChange={(v) => patch({ sort_order: Number(v || 100) })} />

          <Check label="대표 이벤트" checked={form.is_featured} onChange={(v) => patch({ is_featured: v })} />
          <Check label="사용중" checked={form.is_active} onChange={(v) => patch({ is_active: v })} />

          <button onClick={save} disabled={saving} style={S.saveButton}>
            {saving ? "저장중..." : "저장하기"}
          </button>
        </div>
      </section>

      <aside style={S.previewPanel}>
        <div style={S.previewCard}>
          <h2 style={S.previewTitle}>실시간 미리보기</h2>
          <div style={S.previewViewport}>
            <div style={S.previewScale}>
              <ExpoPromotionHero item={previewItem} mode="admin" />
            </div>
          </div>
        </div>

        <div style={S.listCard}>
          <h2 style={S.listTitle}>등록된 이벤트</h2>

          {loading ? <div style={S.loadingText}>불러오는 중...</div> : null}

          {items.map((item) => (
            <div key={item.id} style={S.item}>
              <div style={S.itemTop}>
                <strong>{item.title}</strong>
                {item.is_featured ? <span style={S.featuredBadge}>대표</span> : null}
              </div>

              <div style={S.itemDesc}>{item.subtitle}</div>

              <div style={S.rowButtons}>
                <button
                  style={S.smallButton}
                  onClick={() => {
                    setForm(asPromo(item));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  수정
                </button>

                <button style={S.deleteButton} onClick={() => remove(item.id)}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </main>
  );
}

function BoxTitle({ title }: { title: string }) {
  return <h2 style={S.sectionTitle}>{title}</h2>;
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <label style={S.label}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} style={S.input} />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <label style={S.label}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} style={S.textarea} />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[][];
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <label style={S.label}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={S.input}>
        {options.map((v) => (
          <option key={v[0]} value={v[0]}>
            {v[1]}
          </option>
        ))}
      </select>
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={S.checkWrap}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    padding: "24px 610px 24px 24px",
    background: "#f3f4f6",
    color: "#111827",
  },

  editor: {
    maxWidth: 980,
    margin: 0,
  },

  card: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  top: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },

  topBtns: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 950,
  },

  desc: {
    marginTop: 8,
    color: "#4b5563",
    fontWeight: 800,
  },

  addBtn: {
    height: 48,
    padding: "0 18px",
    borderRadius: 14,
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: 950,
    cursor: "pointer",
  },

  mainViewBtn: {
    height: 48,
    padding: "0 18px",
    borderRadius: 14,
    background: "#111827",
    color: "#ffffff",
    fontWeight: 950,
    textDecoration: "none",
    display: "flex",
    alignItems: "center",
  },

  editingBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    background: "#eff6ff",
    color: "#1d4ed8",
    fontWeight: 950,
  },

  newBox: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    background: "#ecfdf5",
    color: "#15803d",
    fontWeight: 950,
  },

  sectionTitle: {
    margin: "32px 0 0",
    paddingTop: 20,
    borderTop: "1px solid #e5e7eb",
    fontSize: 23,
    fontWeight: 950,
  },

  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 15,
    fontWeight: 950,
  },

  input: {
    width: "100%",
    height: 56,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    padding: "0 14px",
    fontSize: 16,
    fontWeight: 800,
    color: "#111827",
    background: "#ffffff",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: 130,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    padding: 14,
    fontSize: 16,
    fontWeight: 800,
    color: "#111827",
    background: "#ffffff",
    boxSizing: "border-box",
  },

  fileInput: {
    width: "100%",
    minHeight: 54,
    padding: 14,
    borderRadius: 14,
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#111827",
    fontSize: 15,
    fontWeight: 800,
    boxSizing: "border-box",
  },

  help: {
    marginTop: 10,
    color: "#16a34a",
    fontWeight: 950,
  },

  previewImage: {
    width: "100%",
    maxHeight: 260,
    objectFit: "contain",
    marginTop: 12,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },

  checkWrap: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
    fontWeight: 950,
  },

  saveButton: {
    width: "100%",
    height: 68,
    borderRadius: 18,
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: 22,
    fontWeight: 950,
    marginTop: 24,
    cursor: "pointer",
  },

  /*
   * 오른쪽 패널
   */

  previewPanel: {
    position: "fixed",
    top: 20,
    right: 20,
    width: 570,
    height: "calc(100vh - 40px)",
    display: "grid",
    gridTemplateRows: "430px minmax(0, 1fr)",
    gap: 12,
    zIndex: 50,
  },

  /*
   * 미리보기
   */

  previewCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 14,
    boxShadow: "0 14px 40px rgba(0,0,0,0.14)",
    overflow: "hidden",
  },

  previewTitle: {
    margin: "0 0 10px",
    fontSize: 20,
    fontWeight: 950,
  },

  previewViewport: {
    width: "100%",
    height: 355,
    overflow: "hidden",
    borderRadius: 18,
    background: "#f8fafc",
  },

  previewScale: {
    width: 1320,
    transform: "scale(0.405)",
    transformOrigin: "top left",
  },

  /*
   * 등록된 이벤트
   */

  listCard: {
    background: "#ffffff",
    borderRadius: 24,
    padding: 12,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    overflowY: "auto",
    overflowX: "hidden",
    minHeight: 0,
    maxHeight: "100%",
  },

  listTitle: {
    margin: "0 0 8px",
    fontSize: 19,
    fontWeight: 950,
  },

  loadingText: {
    marginTop: 14,
    fontWeight: 900,
    color: "#4b5563",
  },

  /*
   * 이벤트 카드 자체 줄임
   */

  item: {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 10,
    marginTop: 10,
    background: "#ffffff",
    width: "100%",
    boxSizing: "border-box",
  },

  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },

  featuredBadge: {
    background: "#facc15",
    color: "#111827",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 950,
    flexShrink: 0,
  },

  itemDesc: {
    marginTop: 4,
    color: "#4b5563",
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.3,
    wordBreak: "keep-all",
  },

  /*
   * 버튼 반드시 보이게
   */

  rowButtons: {
    display: "flex",
    gap: 6,
    marginTop: 8,
    width: "100%",
  },

  smallButton: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 13,
  },

  deleteButton: {
    width: 74,
    minWidth: 74,
    height: 34,
    borderRadius: 10,
    border: "none",
    background: "#dc2626",
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: 950,
    fontSize: 13,
    flexShrink: 0,
  },
};