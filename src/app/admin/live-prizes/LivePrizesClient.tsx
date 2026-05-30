"use client";

import { useMemo, useState } from "react";
import type { LivePrize } from "./page";

type FormState = {
  id?: string;
  title: string;
  sponsor: string;
  category: string;
  description: string;
  preview_note: string;
  image_url: string;
  quantity: string;
  draw_type: "phone" | "box";
  display_group: "big" | "general";
  sort_order: string;
  is_active: boolean;
  vendor_delivery_required: boolean;
};

const CATEGORIES = [
  "전체",
  "비료",
  "농기계",
  "종자",
  "친환경자재",
  "스마트농업",
  "AI농기계",
  "유기농 살충제/살균제",
  "건강식품",
  "수산식품",
  "농산가공식품",
  "기타",
];

const emptyBigForm: FormState = {
  title: "",
  sponsor: "",
  category: "농기계",
  description: "",
  preview_note: "",
  image_url: "",
  quantity: "1",
  draw_type: "phone",
  display_group: "big",
  sort_order: "1",
  is_active: true,
  vendor_delivery_required: true,
};

const emptyBoxForm: FormState = {
  title: "",
  sponsor: "",
  category: "비료",
  description: "",
  preview_note: "",
  image_url: "",
  quantity: "5",
  draw_type: "box",
  display_group: "general",
  sort_order: "10",
  is_active: true,
  vendor_delivery_required: true,
};

function cleanNumber(v: string, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function getCategory(item: LivePrize) {
  return String((item as any).category || "기타");
}

function isBig(item: LivePrize) {
  return item.draw_type === "phone" || (item as any).display_group === "big";
}

export default function LivePrizesClient({
  initialItems,
  eventId,
}: {
  initialItems: LivePrize[];
  eventId?: string;
}) {
  const [items, setItems] = useState<LivePrize[]>(initialItems);
  const [bigForm, setBigForm] = useState<FormState>(emptyBigForm);
  const [boxForm, setBoxForm] = useState<FormState>(emptyBoxForm);
  const [openBigForm, setOpenBigForm] = useState(false);
  const [openBoxForm, setOpenBoxForm] = useState(false);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [loading, setLoading] = useState(false);
  const [uploadingBig, setUploadingBig] = useState(false);
  const [uploadingBox, setUploadingBox] = useState(false);
  const [message, setMessage] = useState("");

  const activeItems = useMemo(
    () => items.filter((item) => !(item as any).deleted_at),
    [items]
  );

  const bigItems = useMemo(
    () => activeItems.filter((item) => isBig(item)),
    [activeItems]
  );

  const boxItems = useMemo(() => {
    const list = activeItems.filter((item) => !isBig(item));
    if (activeCategory === "전체") return list;
    return list.filter((item) => getCategory(item) === activeCategory);
  }, [activeItems, activeCategory]);

  const totalPrizes = activeItems.length;
  const activePrizeCount = activeItems.filter((item) => item.is_active !== false).length;
  const totalWinnerSlots = activeItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  const drawnTotal = activeItems.reduce(
    (sum, item) => sum + Number(item.drawn_count || 0),
    0
  );

  function updateBig<K extends keyof FormState>(key: K, value: FormState[K]) {
    setBigForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateBox<K extends keyof FormState>(key: K, value: FormState[K]) {
    setBoxForm((prev) => ({ ...prev, [key]: value }));
  }

  async function reload() {
    const qs = eventId ? `?event_id=${eventId}` : "";
    const res = await fetch(`/api/admin/live-prizes${qs}`, {
      method: "GET",
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (data?.ok) setItems(data.items || data.prizes || []);
  }

  async function setCurrentBroadcastPrize(item: LivePrize) {
    const currentEventId = eventId || localStorage.getItem("current_event_id");

    if (!currentEventId) {
      setMessage("현재 선택된 이벤트가 없습니다. 라이브 관제센터에서 이벤트를 먼저 선택하세요.");
      return;
    }

    if (item.is_active === false) {
      setMessage("중지된 경품은 방송에 띄울 수 없습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-events/current-prize", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_id: currentEventId,
          prize_id: item.id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "현재 방송 경품 변경 실패");
      }

      localStorage.setItem(`current_prize_id_${currentEventId}`, item.id);
      setMessage(`📡 [${item.title}] 경품이 현재 방송 화면에 송출됩니다.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "방송 경품 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function createEventFromPrize(item: LivePrize) {
    const ok = window.confirm(
      `[${item.title}] 이 경품으로 새 라이브 이벤트를 만들까요?`
    );

    if (!ok) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-events/from-prize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prize_id: item.id,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || "이벤트 생성 실패");
      }

      localStorage.setItem("current_event_id", data.event.id);
      setMessage("새 이벤트가 생성되었습니다. 통합관제센터로 이동합니다.");

      window.location.href = "/admin/live-control";
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이벤트 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(file: File, kind: "big" | "box") {
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setMessage("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    if (kind === "big") setUploadingBig(true);
    else setUploadingBox(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/live-prizes/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "이미지 업로드에 실패했습니다.");
      }

      if (kind === "big") updateBig("image_url", data.image_url);
      else updateBox("image_url", data.image_url);

      setMessage("이미지가 업로드되었습니다. 저장 버튼을 눌러야 최종 반영됩니다.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      if (kind === "big") setUploadingBig(false);
      else setUploadingBox(false);
    }
  }

  function editPrize(item: LivePrize) {
    const form: FormState = {
      id: item.id,
      title: item.title || "",
      sponsor: item.sponsor || "",
      category: getCategory(item),
      description: item.description || "",
      preview_note: String((item as any).preview_note || ""),
      image_url: item.image_url || "",
      quantity: String(item.quantity || 1),
      draw_type: item.draw_type === "phone" ? "phone" : "box",
      display_group: isBig(item) ? "big" : "general",
      sort_order: String(item.sort_order || 1),
      is_active: item.is_active !== false,
      vendor_delivery_required: (item as any).vendor_delivery_required !== false,
    };

    if (isBig(item)) {
      setBigForm(form);
      setOpenBigForm(true);
      setOpenBoxForm(false);
    } else {
      setBoxForm(form);
      setOpenBoxForm(true);
      setOpenBigForm(false);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function savePrize(form: FormState, kind: "big" | "box") {
    setMessage("");

    if (!form.title.trim()) {
      setMessage("경품명을 입력해주세요.");
      return;
    }

    if (!form.image_url.trim()) {
      setMessage("상품 이미지를 넣는 것을 권장합니다. 방송 화면 완성도가 크게 달라집니다.");
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/live-prizes", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: form.id,
          event_id: eventId || localStorage.getItem("current_event_id") || null,
          title: form.title,
          sponsor: form.sponsor,
          category: form.category,
          description: form.description,
          preview_note: form.preview_note,
          image_url: form.image_url,
          quantity: cleanNumber(form.quantity, kind === "big" ? 1 : 5),
          draw_type: kind === "big" ? "phone" : "box",
          display_group: kind === "big" ? "big" : "general",
          sort_order: cleanNumber(form.sort_order, kind === "big" ? 1 : 10),
          is_active: form.is_active,
          vendor_delivery_required: form.vendor_delivery_required,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "저장에 실패했습니다.");
      }

      setMessage(form.id ? "경품이 수정되었습니다." : "경품이 등록되었습니다.");

      if (kind === "big") {
        setBigForm(emptyBigForm);
        setOpenBigForm(false);
      } else {
        setBoxForm(emptyBoxForm);
        setOpenBoxForm(false);
      }

      await reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(item: LivePrize) {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-prizes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          event_id: eventId || (item as any).event_id || localStorage.getItem("current_event_id") || null,
          title: item.title,
          sponsor: item.sponsor,
          category: getCategory(item),
          description: item.description,
          preview_note: (item as any).preview_note || "",
          image_url: item.image_url,
          quantity: item.quantity || 1,
          draw_type: item.draw_type || "box",
          display_group: isBig(item) ? "big" : "general",
          sort_order: item.sort_order || 0,
          is_active: item.is_active === false,
          vendor_delivery_required: (item as any).vendor_delivery_required !== false,
        }),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "상태 변경 실패");
      }

      await reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "상태 변경 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function deletePrize(item: LivePrize) {
    const ok = window.confirm(
      `[${item.title}] 경품을 삭제하시겠습니까?\n이미 당첨 기록이 있으면 완전 삭제 대신 숨김 처리됩니다.`
    );

    if (!ok) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/live-prizes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });

      const data = await res.json();

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "삭제에 실패했습니다.");
      }

      setMessage(data?.message || "경품이 삭제되었습니다.");
      await reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function goPreview() {
    window.open("/admin/live-draw/preview", "_blank");
  }

  function goBoxDraw() {
    window.open("/admin/live-draw/box", "_blank");
  }

  function goPhoneDraw() {
    window.open("/admin/live-draw", "_blank");
  }

  return (
    <main style={styles.page}>
      <section style={styles.header}>
        <div>
          <p style={styles.kicker}>K-Agri Expo LIVE COMMERCE</p>
          <h1 style={styles.title}>라이브 상품·경품 편성센터</h1>
          <p style={styles.desc}>
            경품을 등록하고 원하는 경품을 즉시 방송 화면에 송출할 수 있습니다.
          </p>
        </div>

        <div style={styles.headerButtons}>
          <button type="button" onClick={goPreview} style={styles.darkButton}>
            방송 미리보기
          </button>
          <button type="button" onClick={goPhoneDraw} style={styles.darkButton}>
            1등 전화추첨
          </button>
          <button type="button" onClick={goBoxDraw} style={styles.redButton}>
            박스추첨 실행
          </button>
        </div>
      </section>

      <section style={styles.dashboard}>
        <StatCard label="등록 상품" value={`${totalPrizes}개`} />
        <StatCard label="사용 중" value={`${activePrizeCount}개`} />
        <StatCard label="총 당첨 슬롯" value={`${totalWinnerSlots}명`} />
        <StatCard label="추첨 완료" value={`${drawnTotal}명`} />
      </section>

      {message && <div style={styles.message}>{message}</div>}

      <PrizeSection
        title="빅 이벤트 편성"
        subtitle="트랙터·로타리·파종기·스마트팜 장비처럼 방송 메인에 세울 1등급 상품입니다."
        buttonText={openBigForm ? "입력 닫기" : "+ 빅 이벤트 추가"}
        onAdd={() => setOpenBigForm((v) => !v)}
      >
        {openBigForm && (
          <PrizeForm
            form={bigForm}
            kind="big"
            loading={loading}
            uploading={uploadingBig}
            onChange={updateBig}
            onUpload={(file) => uploadImage(file, "big")}
            onSave={() => savePrize(bigForm, "big")}
            onCancel={() => {
              setBigForm(emptyBigForm);
              setOpenBigForm(false);
            }}
          />
        )}

        <PrizeCards
          items={bigItems}
          emptyText="등록된 빅 이벤트 상품이 없습니다."
          onEdit={editPrize}
          onToggle={toggleActive}
          onDelete={deletePrize}
          onCreateEvent={createEventFromPrize}
          onSetBroadcast={setCurrentBroadcastPrize}
        />
      </PrizeSection>

      <PrizeSection
        title="일반 경품·상품 편성"
        subtitle="비료, 종자, 유기농자재, 건강식품, 수산식품, 농산가공식품까지 카테고리별로 확장합니다."
        buttonText={openBoxForm ? "입력 닫기" : "+ 일반 상품 추가"}
        onAdd={() => setOpenBoxForm((v) => !v)}
      >
        <div style={styles.categoryTabs}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              style={{
                ...styles.categoryTab,
                background: activeCategory === cat ? "#111827" : "white",
                color: activeCategory === cat ? "white" : "#111827",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {openBoxForm && (
          <PrizeForm
            form={boxForm}
            kind="box"
            loading={loading}
            uploading={uploadingBox}
            onChange={updateBox}
            onUpload={(file) => uploadImage(file, "box")}
            onSave={() => savePrize(boxForm, "box")}
            onCancel={() => {
              setBoxForm(emptyBoxForm);
              setOpenBoxForm(false);
            }}
          />
        )}

        <PrizeCards
          items={boxItems}
          emptyText="이 카테고리에 등록된 상품이 없습니다."
          onEdit={editPrize}
          onToggle={toggleActive}
          onDelete={deletePrize}
          onCreateEvent={createEventFromPrize}
          onSetBroadcast={setCurrentBroadcastPrize}
        />
      </PrizeSection>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <strong style={styles.statValue}>{value}</strong>
    </div>
  );
}

function PrizeSection({
  title,
  subtitle,
  buttonText,
  onAdd,
  children,
}: {
  title: string;
  subtitle: string;
  buttonText: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section style={styles.section}>
      <div style={styles.sectionHead}>
        <div>
          <h2 style={styles.sectionTitle}>{title}</h2>
          <p style={styles.sectionDesc}>{subtitle}</p>
        </div>

        <button type="button" onClick={onAdd} style={styles.addButton}>
          {buttonText}
        </button>
      </div>

      {children}
    </section>
  );
}

function PrizeForm({
  form,
  kind,
  loading,
  uploading,
  onChange,
  onUpload,
  onSave,
  onCancel,
}: {
  form: FormState;
  kind: "big" | "box";
  loading: boolean;
  uploading: boolean;
  onChange: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  onUpload: (file: File) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={styles.formCard}>
      <h3 style={styles.formTitle}>
        {form.id ? "상품 수정" : kind === "big" ? "빅 이벤트 상품 등록" : "일반 상품 등록"}
      </h3>

      <div style={styles.formGrid}>
        <div>
          <label style={styles.label}>상품명</label>
          <input
            style={styles.input}
            value={form.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder={kind === "big" ? "예: 로타리 180cm" : "예: 켈팍 25L"}
          />
        </div>

        <div>
          <label style={styles.label}>협찬사/업체</label>
          <input
            style={styles.input}
            value={form.sponsor}
            onChange={(e) => onChange("sponsor", e.target.value)}
            placeholder="예: 도프"
          />
        </div>

        <div>
          <label style={styles.label}>카테고리</label>
          <select
            style={styles.input}
            value={form.category}
            onChange={(e) => onChange("category", e.target.value)}
          >
            {CATEGORIES.filter((c) => c !== "전체").map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={styles.label}>당첨 수량</label>
          <input
            style={styles.input}
            value={form.quantity}
            onChange={(e) => onChange("quantity", e.target.value)}
            placeholder={kind === "big" ? "1" : "5"}
          />
        </div>

        <div>
          <label style={styles.label}>방송 추첨 순서</label>
          <input
            style={styles.input}
            value={form.sort_order}
            onChange={(e) => onChange("sort_order", e.target.value)}
            placeholder={kind === "big" ? "1" : "10"}
          />
        </div>

        <div>
          <label style={styles.label}>배송 방식</label>
          <select
            style={styles.input}
            value={form.vendor_delivery_required ? "vendor" : "self"}
            onChange={(e) =>
              onChange("vendor_delivery_required", e.target.value === "vendor")
            }
          >
            <option value="vendor">협찬사/업체 배송</option>
            <option value="self">운영자 직접 배송</option>
          </select>
        </div>
      </div>

      <label style={styles.label}>상품 이미지</label>
      <div style={styles.uploadRow}>
        <label style={styles.uploadButton}>
          {uploading ? "업로드 중..." : "이미지 선택"}
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.currentTarget.value = "";
            }}
            style={{ display: "none" }}
          />
        </label>

        {form.image_url ? (
          <button
            type="button"
            onClick={() => onChange("image_url", "")}
            style={styles.removeImageButton}
          >
            이미지 제거
          </button>
        ) : null}
      </div>

      {form.image_url ? (
        <div style={styles.previewBox}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={form.image_url} alt="상품 이미지" style={styles.previewImage} />
        </div>
      ) : (
        <div style={styles.emptyPreview}>상품 이미지를 넣으면 방송 화면에 크게 표시됩니다.</div>
      )}

      <label style={styles.label}>상품 설명</label>
      <textarea
        style={styles.textarea}
        value={form.description}
        onChange={(e) => onChange("description", e.target.value)}
        placeholder="예: 6개월 완효성 비료 / 고함량 해조추출물 / 로타리 신제품 등"
      />

      <label style={styles.label}>방송용 강조 문구</label>
      <textarea
        style={styles.smallTextarea}
        value={form.preview_note}
        onChange={(e) => onChange("preview_note", e.target.value)}
        placeholder="예: 이번 라이브 한정 경품 / 협찬사 특별 제공 / 농민 감사 이벤트"
      />

      <label style={styles.checkRow}>
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => onChange("is_active", e.target.checked)}
        />
        <span>라이브 편성에 사용</span>
      </label>

      <div style={styles.buttonRow}>
        <button
          type="button"
          onClick={onSave}
          disabled={loading || uploading}
          style={styles.saveButton}
        >
          {loading ? "저장 중..." : form.id ? "수정 저장" : "등록"}
        </button>

        <button type="button" onClick={onCancel} style={styles.cancelButton}>
          취소
        </button>
      </div>
    </div>
  );
}

function PrizeCards({
  items,
  emptyText,
  onEdit,
  onToggle,
  onDelete,
  onCreateEvent,
  onSetBroadcast,
}: {
  items: LivePrize[];
  emptyText: string;
  onEdit: (item: LivePrize) => void;
  onToggle: (item: LivePrize) => void;
  onDelete: (item: LivePrize) => void;
  onCreateEvent: (item: LivePrize) => void;
  onSetBroadcast: (item: LivePrize) => void;
}) {
  if (items.length === 0) {
    return <div style={styles.empty}>{emptyText}</div>;
  }

  return (
    <div style={styles.cards}>
      {items.map((item) => (
        <article key={item.id} style={styles.card}>
          <div style={styles.imageBox}>
            {item.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image_url} alt={item.title} style={styles.image} />
            ) : (
              <span style={styles.noImage}>이미지 없음</span>
            )}
          </div>

          <div style={styles.cardBody}>
            <div style={styles.cardTop}>
              <strong style={styles.cardTitle}>{item.title}</strong>
              <span
                style={{
                  ...styles.badge,
                  background: isBig(item) ? "#fee2e2" : "#dcfce7",
                  color: isBig(item) ? "#991b1b" : "#166534",
                }}
              >
                {isBig(item) ? "빅 이벤트" : getCategory(item)}
              </span>
            </div>

            <p style={styles.meta}>
              업체: {item.sponsor || "-"} · 수량: {item.quantity || 1}명 · 순서:{" "}
              {item.sort_order || 0}
            </p>

            <p style={styles.meta}>
              추첨 완료: {item.drawn_count || 0}명 · 상태:{" "}
              {item.is_active === false ? "중지" : "사용 중"}
            </p>

            <p style={styles.descText}>{item.description || "설명 없음"}</p>

            <div style={styles.cardButtons}>
              <button
                type="button"
                onClick={() => onSetBroadcast(item)}
                style={styles.broadcastButton}
              >
                📡 방송에 띄우기
              </button>

              <button type="button" onClick={() => onCreateEvent(item)} style={styles.eventButton}>
                이 경품으로 이벤트 만들기
              </button>

              <button type="button" onClick={() => onEdit(item)} style={styles.smallButton}>
                수정
              </button>

              <button
                type="button"
                onClick={() => onToggle(item)}
                style={{
                  ...styles.smallButton,
                  background: item.is_active === false ? "#16a34a" : "#6b7280",
                }}
              >
                {item.is_active === false ? "사용" : "중지"}
              </button>

              <button type="button" onClick={() => onDelete(item)} style={styles.deleteButton}>
                삭제
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: "32px",
    color: "#111827",
  },
  header: {
    maxWidth: 1280,
    margin: "0 auto 22px",
    display: "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  kicker: {
    margin: 0,
    color: "#2563eb",
    fontWeight: 900,
    letterSpacing: "0.08em",
  },
  title: {
    margin: "8px 0",
    fontSize: 40,
    fontWeight: 950,
  },
  desc: {
    margin: 0,
    color: "#4b5563",
    fontSize: 17,
    lineHeight: 1.6,
  },
  headerButtons: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  darkButton: {
    border: 0,
    borderRadius: 14,
    padding: "13px 16px",
    background: "#111827",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  redButton: {
    border: 0,
    borderRadius: 14,
    padding: "13px 16px",
    background: "#dc2626",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  dashboard: {
    maxWidth: 1280,
    margin: "0 auto 18px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  statCard: {
    background: "white",
    borderRadius: 20,
    padding: 18,
    boxShadow: "0 14px 32px rgba(15,23,42,0.08)",
  },
  statLabel: {
    margin: 0,
    color: "#6b7280",
    fontWeight: 800,
  },
  statValue: {
    display: "block",
    marginTop: 8,
    fontSize: 28,
    fontWeight: 950,
  },
  message: {
    maxWidth: 1280,
    margin: "0 auto 18px",
    padding: 15,
    borderRadius: 14,
    background: "#eef2ff",
    color: "#1e3a8a",
    fontWeight: 900,
  },
  section: {
    maxWidth: 1280,
    margin: "0 auto 24px",
    background: "white",
    borderRadius: 28,
    padding: 24,
    boxShadow: "0 18px 40px rgba(15,23,42,0.08)",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    gap: 18,
    alignItems: "center",
    marginBottom: 18,
    flexWrap: "wrap",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 30,
    fontWeight: 950,
  },
  sectionDesc: {
    margin: "8px 0 0",
    color: "#6b7280",
    lineHeight: 1.5,
  },
  addButton: {
    border: 0,
    borderRadius: 16,
    padding: "14px 18px",
    background: "#111827",
    color: "white",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  categoryTabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 18,
  },
  categoryTab: {
    border: "1px solid #d1d5db",
    borderRadius: 999,
    padding: "10px 13px",
    fontWeight: 900,
    cursor: "pointer",
  },
  formCard: {
    border: "2px solid #111827",
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    background: "#f9fafb",
  },
  formTitle: {
    margin: "0 0 14px",
    fontSize: 22,
    fontWeight: 950,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  label: {
    display: "block",
    margin: "12px 0 7px",
    fontWeight: 900,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "13px 14px",
    fontSize: 16,
    background: "white",
    color: "#111827",
  },
  uploadRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  uploadButton: {
    display: "inline-flex",
    border: 0,
    borderRadius: 14,
    padding: "14px 18px",
    background: "#111827",
    color: "white",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  removeImageButton: {
    border: 0,
    borderRadius: 14,
    padding: "14px 18px",
    background: "#dc2626",
    color: "white",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  previewBox: {
    marginTop: 12,
    width: 300,
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    background: "#e5e7eb",
    border: "1px solid #d1d5db",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    background: "#fff",
  },
  emptyPreview: {
    marginTop: 12,
    width: 300,
    height: 130,
    borderRadius: 18,
    background: "#e5e7eb",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    textAlign: "center",
    padding: 12,
  },
  textarea: {
    width: "100%",
    minHeight: 90,
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    resize: "vertical",
    background: "white",
    color: "#111827",
  },
  smallTextarea: {
    width: "100%",
    minHeight: 70,
    boxSizing: "border-box",
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    resize: "vertical",
    background: "white",
    color: "#111827",
  },
  checkRow: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginTop: 16,
    fontWeight: 800,
  },
  buttonRow: {
    display: "flex",
    gap: 10,
    marginTop: 18,
  },
  saveButton: {
    border: 0,
    borderRadius: 16,
    padding: "14px 22px",
    background: "#16a34a",
    color: "white",
    fontSize: 17,
    fontWeight: 950,
    cursor: "pointer",
  },
  cancelButton: {
    border: 0,
    borderRadius: 16,
    padding: "14px 18px",
    background: "#e5e7eb",
    color: "#111827",
    fontSize: 17,
    fontWeight: 900,
    cursor: "pointer",
  },
  empty: {
    padding: 40,
    textAlign: "center",
    color: "#6b7280",
    background: "#f9fafb",
    borderRadius: 18,
    fontWeight: 800,
  },
  cards: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 14,
  },
  card: {
    display: "grid",
    gridTemplateColumns: "150px 1fr",
    gap: 14,
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    padding: 14,
    background: "#fff",
  },
  imageBox: {
    width: 150,
    height: 130,
    borderRadius: 16,
    background: "#f3f4f6",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    boxSizing: "border-box",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    background: "#f3f4f6",
  },
  noImage: {
    fontSize: 14,
    color: "#9ca3af",
    fontWeight: 800,
    textAlign: "center",
  },
  cardBody: {
    minWidth: 0,
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 950,
  },
  badge: {
    borderRadius: 999,
    padding: "7px 10px",
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  meta: {
    margin: "7px 0",
    color: "#374151",
    fontWeight: 800,
  },
  descText: {
    margin: "7px 0 12px",
    color: "#6b7280",
    lineHeight: 1.5,
  },
  cardButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  broadcastButton: {
    border: 0,
    borderRadius: 12,
    padding: "10px 14px",
    background: "#16a34a",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  eventButton: {
    border: 0,
    borderRadius: 12,
    padding: "10px 14px",
    background: "#2563eb",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  smallButton: {
    border: 0,
    borderRadius: 12,
    padding: "10px 14px",
    background: "#111827",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
  deleteButton: {
    border: 0,
    borderRadius: 12,
    padding: "10px 14px",
    background: "#dc2626",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  },
};