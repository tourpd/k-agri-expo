"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import ExpoLiveSection from "@/components/expo/ExpoLiveSection";

type FormType = {
  event_id?: string;

  title: string;
  subtitle: string;
  description: string;
  prize_text: string;

  image_url: string;
  video_url: string;
  live_url: string;

  live_date_label: string;
  live_datetime: string;

  sponsor_logo_url: string;
  partner_logo_url: string;

  sponsor_name: string;
  partner_name: string;

  sponsor_logo_size: string;
  partner_logo_size: string;

  main_image_scale: string;
  dday_font_size: string;
  participant_font_size: string;

  card_radius: string;
  card_padding: string;
  title_font_size: string;
  subtitle_font_size: string;

  button_bg: string;
  button_text_color: string;
  dday_box_bg: string;
  participant_box_bg: string;

  image_position_x: string;
  image_position_y: string;

  feature_1: string;
  feature_2: string;
  feature_3: string;
  feature_4: string;

  cta_label: string;
  cta_link: string;

  secondary_cta_label: string;
  secondary_cta_link: string;

  participant_label: string;
  participant_threshold: string;
};

type PreviewSection =
  | "text"
  | "schedule"
  | "logo"
  | "media"
  | "size"
  | "design"
  | "feature"
  | "button";

const DEFAULT_FORM: FormType = {
  event_id: "",

  title: "2026 영진로타리 신제품 출시",
  subtitle: "역회전 로타리 1대 무료 추첨",
  description: "사전 참여 후 방송 중 실시간 추첨을 통해 최종 당첨자를 선정합니다.",
  prize_text: "역회전 로타리 1대 무료 추첨",

  image_url: "",
  video_url: "",
  live_url: "",

  live_date_label: "5월 28일 (수) 오후 8시 LIVE",
  live_datetime: "2026-05-28T20:00",

  sponsor_logo_url: "",
  partner_logo_url: "",

  sponsor_name: "영진로타리",
  partner_name: "K-Agri Expo",

  sponsor_logo_size: "90",
  partner_logo_size: "70",

  main_image_scale: "1.15",
  dday_font_size: "44",
  participant_font_size: "34",

  card_radius: "36",
  card_padding: "28",
  title_font_size: "68",
  subtitle_font_size: "34",

  button_bg: "#facc15",
  button_text_color: "#111827",
  dday_box_bg: "linear-gradient(180deg,#ef4444,#991b1b)",
  participant_box_bg: "#111827",

  image_position_x: "0",
  image_position_y: "0",

  feature_1: "돌 많은 밭에서도 강력한 분쇄력",
  feature_2: "역회전 구조로 토양 깊이 파쇄",
  feature_3: "방송 중 실시간 당첨자 공개",
  feature_4: "전화 확인 후 최종 당첨 확정",

  cta_label: "무료 추첨 참여하기",
  cta_link: "/expo/live/join",

  secondary_cta_label: "제품 영상 보기",
  secondary_cta_link: "",

  participant_label: "참여 농가",
  participant_threshold: "50",
};

function toYoutubeEmbed(url: string) {
  const v = String(url || "").trim();
  if (!v) return "";

  if (v.includes("youtu.be/")) {
    const id = v.split("youtu.be/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  if (v.includes("watch?v=")) {
    const id = v.split("watch?v=")[1]?.split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  }

  if (v.includes("/embed/")) return v;

  return "";
}

export default function AdminLivePage() {
  const [form, setForm] = useState<FormType>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<keyof FormType | "">("");
  const [activePreview, setActivePreview] = useState<PreviewSection>("text");

  const previewRef = useRef<HTMLDivElement | null>(null);

  const embedUrl = useMemo(() => toYoutubeEmbed(form.video_url), [form.video_url]);

  function movePreview(section: PreviewSection) {
    setActivePreview(section);

    window.setTimeout(() => {
      previewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 120);
  }

  function setValue<K extends keyof FormType>(key: K, value: FormType[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function load() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/live-settings/get", {
        cache: "no-store",
      });

      const json = await res.json();

      if (json.ok && json.data) {
        setForm({
          ...DEFAULT_FORM,
          ...json.data,
        });
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
      const payload = {
        ...form,

        event_badge: "🔥 LIVE EVENT",
        badge: "🔥 LIVE EVENT",

        featured_title: form.sponsor_name || form.prize_text,
        featured_desc: form.description,

        featured_video_url: form.video_url,
        youtube_url: form.video_url,
        video_url: form.video_url,
        product_video_url: form.video_url,

        prize_title: form.prize_text,
        prize_image_url: form.image_url,

        date_text: form.live_date_label,

        participant_text: "",
        participant_count: "",
      };

      const res = await fetch("/api/admin/live-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "저장 실패");
        return;
      }

      alert("✅ 저장 완료");
    } catch {
      alert("저장 실패");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(
    e: React.ChangeEvent<HTMLInputElement>,
    targetKey: keyof FormType
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingKey(targetKey);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/live/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!json.ok) {
        alert(json.error || "업로드 실패");
        return;
      }

      setForm((prev) => ({
        ...prev,
        [targetKey]: json.url,
      }));

      alert("✅ 업로드 완료");
    } catch {
      alert("업로드 실패");
    } finally {
      setUploadingKey("");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const previewItem = {
    ...form,

    event_badge: "🔥 LIVE EVENT",
    badge: "🔥 LIVE EVENT",

    featured_title: form.sponsor_name || form.prize_text,
    featured_desc: form.description,
    featured_video_url: form.video_url,
    youtube_url: form.video_url,
    video_url: form.video_url,
    product_video_url: form.video_url,

    prize_title: form.prize_text,
    prize_image_url: form.image_url,

    date_text: form.live_date_label,
    live_date_label: form.live_date_label,

    participant_count_auto: 152,
    participant_label: form.participant_label,
    participant_threshold: Number(form.participant_threshold || 50),

    sponsor_logo_size: Number(form.sponsor_logo_size || 90),
    partner_logo_size: Number(form.partner_logo_size || 70),
    main_image_scale: Number(form.main_image_scale || 1.15),
    dday_font_size: Number(form.dday_font_size || 44),
    participant_font_size: Number(form.participant_font_size || 34),

    card_radius: Number(form.card_radius || 36),
    card_padding: Number(form.card_padding || 28),
    title_font_size: Number(form.title_font_size || 68),
    subtitle_font_size: Number(form.subtitle_font_size || 34),

    button_bg: form.button_bg,
    button_text_color: form.button_text_color,
    dday_box_bg: form.dday_box_bg,
    participant_box_bg: form.participant_box_bg,

    image_position_x: Number(form.image_position_x || 0),
    image_position_y: Number(form.image_position_y || 0),
  };

  return (
    <main style={S.wrap}>
      <section style={S.card}>
        <div style={S.top}>
          <div>
            <div style={S.small}>K-Agri Live Admin</div>
            <h1 style={S.title}>🔥 라이브 이벤트 관리자</h1>
            <p style={S.desc}>
              입력칸을 누르면 아래 실제 미리보기로 자동 이동합니다.
            </p>
          </div>

          <div style={S.topButtons}>
            <a href="/expo" target="_blank" style={S.darkButton}>
              메인 보기
            </a>
            <button type="button" onClick={load} style={S.lightButton}>
              다시 불러오기
            </button>
          </div>
        </div>

        {loading ? (
          <div style={S.loadingBox}>불러오는 중...</div>
        ) : (
          <>
            <Box title="① 메인 문구">
              <Input
                label="메인 제목"
                value={form.title}
                onFocus={() => movePreview("text")}
                onChange={(v) => setValue("title", v)}
              />
              <Input
                label="혜택 문구"
                value={form.subtitle}
                onFocus={() => movePreview("text")}
                onChange={(v) => setValue("subtitle", v)}
              />
              <Input
                label="경품 문구"
                value={form.prize_text}
                onFocus={() => movePreview("text")}
                onChange={(v) => setValue("prize_text", v)}
              />
              <TextArea
                label="하단 설명"
                value={form.description}
                onFocus={() => movePreview("text")}
                onChange={(v) => setValue("description", v)}
              />
            </Box>

            <Box title="② 라이브 일정">
              <Input
                label="일정 표시 문구"
                value={form.live_date_label}
                onFocus={() => movePreview("schedule")}
                onChange={(v) => setValue("live_date_label", v)}
              />

              <div style={{ marginTop: 16 }}>
                <label style={S.labelStyle}>실제 날짜/시간</label>
                <input
                  type="datetime-local"
                  value={form.live_datetime}
                  onFocus={() => movePreview("schedule")}
                  onChange={(e) => setValue("live_datetime", e.target.value)}
                  style={S.inputStyle}
                />
              </div>
            </Box>

            <Box title="③ 로고 업로드">
              <LogoUploader
                title="협찬사 로고"
                value={form.sponsor_logo_url}
                targetKey="sponsor_logo_url"
                uploadingKey={uploadingKey}
                onFocus={() => movePreview("logo")}
                onUpload={uploadImage}
                onChange={(v) => setValue("sponsor_logo_url", v)}
              />

              <Input
                label="협찬사명"
                value={form.sponsor_name}
                onFocus={() => movePreview("logo")}
                onChange={(v) => setValue("sponsor_name", v)}
              />

              <RangeInput
                label="협찬사 로고 크기"
                value={form.sponsor_logo_size}
                min="40"
                max="180"
                onFocus={() => movePreview("logo")}
                onChange={(v) => setValue("sponsor_logo_size", v)}
              />

              <LogoUploader
                title="파트너 로고"
                value={form.partner_logo_url}
                targetKey="partner_logo_url"
                uploadingKey={uploadingKey}
                onFocus={() => movePreview("logo")}
                onUpload={uploadImage}
                onChange={(v) => setValue("partner_logo_url", v)}
              />

              <Input
                label="파트너명"
                value={form.partner_name}
                onFocus={() => movePreview("logo")}
                onChange={(v) => setValue("partner_name", v)}
              />

              <RangeInput
                label="파트너 로고 크기"
                value={form.partner_logo_size}
                min="40"
                max="180"
                onFocus={() => movePreview("logo")}
                onChange={(v) => setValue("partner_logo_size", v)}
              />
            </Box>

            <Box title="④ 제품 이미지 / 유튜브 영상">
              <LogoUploader
                title="제품 이미지"
                value={form.image_url}
                targetKey="image_url"
                uploadingKey={uploadingKey}
                onFocus={() => movePreview("media")}
                onUpload={uploadImage}
                onChange={(v) => setValue("image_url", v)}
              />

              <Input
                label="유튜브 영상 URL"
                value={form.video_url}
                onFocus={() => movePreview("media")}
                onChange={(v) => setValue("video_url", v)}
              />

              {embedUrl ? (
                <iframe src={embedUrl} title="유튜브 미리보기" style={S.videoPreview} allowFullScreen />
              ) : null}

              <RangeInput
                label="이미지 확대 비율"
                value={form.main_image_scale}
                min="0.7"
                max="1.8"
                step="0.05"
                onFocus={() => movePreview("media")}
                onChange={(v) => setValue("main_image_scale", v)}
              />

              <RangeInput
                label="이미지 좌우 위치"
                value={form.image_position_x}
                min="-100"
                max="100"
                onFocus={() => movePreview("media")}
                onChange={(v) => setValue("image_position_x", v)}
              />

              <RangeInput
                label="이미지 상하 위치"
                value={form.image_position_y}
                min="-100"
                max="100"
                onFocus={() => movePreview("media")}
                onChange={(v) => setValue("image_position_y", v)}
              />
            </Box>

            <Box title="⑤ D-Day / 참여자 / 글자 크기">
              <RangeInput
                label="D-Day 글자 크기"
                value={form.dday_font_size}
                min="18"
                max="90"
                onFocus={() => movePreview("size")}
                onChange={(v) => setValue("dday_font_size", v)}
              />

              <RangeInput
                label="참여자 수 글자 크기"
                value={form.participant_font_size}
                min="18"
                max="90"
                onFocus={() => movePreview("size")}
                onChange={(v) => setValue("participant_font_size", v)}
              />

              <RangeInput
                label="메인 제목 크기"
                value={form.title_font_size}
                min="28"
                max="120"
                onFocus={() => movePreview("size")}
                onChange={(v) => setValue("title_font_size", v)}
              />

              <RangeInput
                label="혜택 문구 크기"
                value={form.subtitle_font_size}
                min="18"
                max="80"
                onFocus={() => movePreview("size")}
                onChange={(v) => setValue("subtitle_font_size", v)}
              />

              <Input
                label="참여 수 라벨"
                value={form.participant_label}
                onFocus={() => movePreview("size")}
                onChange={(v) => setValue("participant_label", v)}
              />

              <Input
                label="몇 명 이상부터 표시"
                value={form.participant_threshold}
                onFocus={() => movePreview("size")}
                onChange={(v) => setValue("participant_threshold", v)}
              />
            </Box>

            <Box title="⑥ 카드 / 버튼 디자인">
              <RangeInput
                label="카드 라운드"
                value={form.card_radius}
                min="0"
                max="70"
                onFocus={() => movePreview("design")}
                onChange={(v) => setValue("card_radius", v)}
              />

              <RangeInput
                label="카드 패딩"
                value={form.card_padding}
                min="10"
                max="70"
                onFocus={() => movePreview("design")}
                onChange={(v) => setValue("card_padding", v)}
              />

              <ColorInput
                label="버튼 배경"
                value={form.button_bg}
                onFocus={() => movePreview("design")}
                onChange={(v) => setValue("button_bg", v)}
              />
              <ColorInput
                label="버튼 글자색"
                value={form.button_text_color}
                onFocus={() => movePreview("design")}
                onChange={(v) => setValue("button_text_color", v)}
              />
              <ColorInput
                label="참여자 박스 배경"
                value={form.participant_box_bg}
                onFocus={() => movePreview("design")}
                onChange={(v) => setValue("participant_box_bg", v)}
              />
            </Box>

            <Box title="⑦ 제품 핵심 / 추첨 방식">
              <Input label="제품 핵심 1" value={form.feature_1} onFocus={() => movePreview("feature")} onChange={(v) => setValue("feature_1", v)} />
              <Input label="제품 핵심 2" value={form.feature_2} onFocus={() => movePreview("feature")} onChange={(v) => setValue("feature_2", v)} />
              <Input label="추첨 방식 1" value={form.feature_3} onFocus={() => movePreview("feature")} onChange={(v) => setValue("feature_3", v)} />
              <Input label="추첨 방식 2" value={form.feature_4} onFocus={() => movePreview("feature")} onChange={(v) => setValue("feature_4", v)} />
            </Box>

            <Box title="⑧ 버튼 / 라이브 URL">
              <Input label="참여 버튼 문구" value={form.cta_label} onFocus={() => movePreview("button")} onChange={(v) => setValue("cta_label", v)} />
              <Input label="참여 버튼 링크" value={form.cta_link} onFocus={() => movePreview("button")} onChange={(v) => setValue("cta_link", v)} />
              <Input label="보조 버튼 문구" value={form.secondary_cta_label} onFocus={() => movePreview("button")} onChange={(v) => setValue("secondary_cta_label", v)} />
              <Input label="보조 버튼 링크" value={form.secondary_cta_link} onFocus={() => movePreview("button")} onChange={(v) => setValue("secondary_cta_link", v)} />
              <Input label="유튜브 라이브 URL" value={form.live_url} onFocus={() => movePreview("button")} onChange={(v) => setValue("live_url", v)} />
            </Box>

            <Box title="⑨ 실제 메인 미리보기">
              <div ref={previewRef} style={S.previewGuide}>
                현재 수정 영역: <b>{activePreview}</b>
              </div>

              <div style={S.realPreviewWrap}>
                <ExpoLiveSection item={previewItem} />
              </div>
            </Box>

            <button type="button" onClick={save} disabled={saving} style={S.btn}>
              {saving ? "저장 중..." : "🔥 저장하기"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function RangeInput({
  label,
  value,
  min,
  max,
  step,
  onFocus,
  onChange,
}: {
  label: string;
  value: string;
  min: string;
  max: string;
  step?: string;
  onFocus?: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginTop: 18 }}>
      <label style={S.labelStyle}>
        {label} : {value}
      </label>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onFocus={onFocus}
        onMouseDown={onFocus}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%" }}
      />
    </div>
  );
}

function ColorInput({
  label,
  value,
  onFocus,
  onChange,
}: {
  label: string;
  value: string;
  onFocus?: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginTop: 18 }}>
      <label style={S.labelStyle}>{label}</label>

      <div style={S.colorRow}>
        <input type="color" value={value} onFocus={onFocus} onChange={(e) => onChange(e.target.value)} />
        <input value={value} onFocus={onFocus} onChange={(e) => onChange(e.target.value)} style={S.inputStyle} />
      </div>
    </div>
  );
}

function LogoUploader({
  title,
  value,
  targetKey,
  uploadingKey,
  onFocus,
  onUpload,
  onChange,
}: {
  title: string;
  value: string;
  targetKey: keyof FormType;
  uploadingKey: keyof FormType | "";
  onFocus?: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>, targetKey: keyof FormType) => void;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginTop: 18 }}>
      <label style={S.labelStyle}>{title}</label>

      <input
        type="file"
        accept="image/*"
        onFocus={onFocus}
        onClick={onFocus}
        onChange={(e) => onUpload(e, targetKey)}
        disabled={uploadingKey === targetKey}
        style={S.fileInput}
      />

      {uploadingKey === targetKey ? <div style={S.helpBox}>업로드 중...</div> : null}

      {!!value && <img src={value} alt={title} style={S.preview} />}

      <input
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...S.inputStyle,
          marginTop: 10,
        }}
      />
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={S.box}>
      <h2 style={S.boxTitle}>{title}</h2>
      {children}
    </div>
  );
}

function Input({
  label,
  value,
  onFocus,
  onChange,
}: {
  label: string;
  value: string;
  onFocus?: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <label style={S.labelStyle}>{label}</label>
      <input value={value} onFocus={onFocus} onChange={(e) => onChange(e.target.value)} style={S.inputStyle} />
    </div>
  );
}

function TextArea({
  label,
  value,
  onFocus,
  onChange,
}: {
  label: string;
  value: string;
  onFocus?: () => void;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ marginTop: 16 }}>
      <label style={S.labelStyle}>{label}</label>
      <textarea value={value} onFocus={onFocus} onChange={(e) => onChange(e.target.value)} style={S.textareaStyle} />
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  wrap: {
    minHeight: "100vh",
    background: "#f3f4f6",
    padding: 24,
    color: "#111827",
  },

  card: {
    maxWidth: 1180,
    margin: "0 auto",
    background: "#fff",
    borderRadius: 30,
    padding: 28,
    boxShadow: "0 18px 45px rgba(0,0,0,0.08)",
  },

  top: {
    marginBottom: 28,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },

  topButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  small: {
    color: "#16a34a",
    fontWeight: 950,
    fontSize: 13,
  },

  title: {
    fontSize: 34,
    fontWeight: 950,
    margin: "8px 0 0",
  },

  desc: {
    marginTop: 10,
    color: "#4b5563",
    fontWeight: 700,
  },

  darkButton: {
    padding: "13px 16px",
    borderRadius: 14,
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 950,
  },

  lightButton: {
    padding: "13px 16px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 950,
    cursor: "pointer",
  },

  loadingBox: {
    padding: 30,
    borderRadius: 18,
    background: "#f9fafb",
    fontWeight: 900,
  },

  box: {
    marginTop: 20,
    padding: 22,
    borderRadius: 24,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },

  boxTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 950,
  },

  labelStyle: {
    display: "block",
    marginBottom: 8,
    fontWeight: 900,
  },

  inputStyle: {
    width: "100%",
    height: 56,
    padding: "0 16px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    fontSize: 16,
    fontWeight: 800,
    background: "#ffffff",
    color: "#111827",
    boxSizing: "border-box",
  },

  textareaStyle: {
    width: "100%",
    minHeight: 120,
    padding: 16,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    fontSize: 16,
    fontWeight: 800,
    background: "#ffffff",
    color: "#111827",
    boxSizing: "border-box",
  },

  fileInput: {
    display: "block",
    width: "100%",
    padding: 14,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#ffffff",
  },

  preview: {
    width: "100%",
    maxHeight: 220,
    objectFit: "contain",
    marginTop: 12,
    borderRadius: 16,
    background: "#fff",
    border: "1px solid #e5e7eb",
  },

  videoPreview: {
    width: "100%",
    height: 320,
    marginTop: 14,
    border: 0,
    borderRadius: 18,
    background: "#000",
  },

  helpBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    background: "#ecfdf5",
    color: "#166534",
    fontSize: 13,
    lineHeight: 1.7,
    fontWeight: 800,
  },

  colorRow: {
    display: "grid",
    gridTemplateColumns: "70px 1fr",
    gap: 10,
    alignItems: "center",
  },

  previewGuide: {
    marginTop: 18,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    background: "#fef3c7",
    color: "#92400e",
    fontWeight: 950,
    border: "2px solid #facc15",
  },

  realPreviewWrap: {
    marginTop: 18,
    background: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
  },

  btn: {
    marginTop: 26,
    width: "100%",
    height: 70,
    borderRadius: 20,
    border: "none",
    background: "#16a34a",
    color: "#fff",
    fontSize: 24,
    fontWeight: 950,
    cursor: "pointer",
  },
};