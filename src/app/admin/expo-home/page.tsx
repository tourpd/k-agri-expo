"use client";

import React, { useEffect, useMemo, useState } from "react";

type LiveForm = {
  event_badge: string;
  title: string;
  subtitle: string;
  prize_text: string;
  description: string;
  live_date_label: string;
  live_datetime: string;
  participant_label: string;
  participant_count: string;
  featured_title: string;
  featured_desc: string;
  featured_video_url: string;
  image_url: string;
  feature_1: string;
  feature_2: string;
  feature_3: string;
  feature_4: string;
  cta_label: string;
  cta_link: string;
  secondary_cta_label: string;
  secondary_cta_link: string;
};

const DEFAULT_FORM: LiveForm = {
  event_badge: "🔥 LIVE EVENT",
  title: "영진로타리 신개념 역회전 로타리 출시",
  subtitle: "영진로타리 역회전 로타리 1명 무료 추첨",
  prize_text: "영진로타리 역회전 로타리",
  description:
    "사전 참여 후 방송 중 추첨을 통해 최종 당첨자를 선정합니다.",
  live_date_label: "5월 28일 수요일 오후 8시 LIVE",
  live_datetime: "2026-05-28T20:00",
  participant_label: "현재 참여 농가",
  participant_count: "0",
  featured_title: "영진로타리 역회전 로타리",
  featured_desc: "돌 많은 밭에서도 강력한 작업이 가능한 역회전 로타리입니다.",
  featured_video_url: "",
  image_url: "",
  feature_1: "제품 영상으로 실제 성능 확인",
  feature_2: "현장 작업에 필요한 대표 장비",
  feature_3: "방송 중 실시간 추첨 진행",
  feature_4: "전화 확인 후 최종 당첨 확정",
  cta_label: "무료 추첨 참여하기",
  cta_link: "/expo/live/join",
  secondary_cta_label: "제품 영상 보기",
  secondary_cta_link: "",
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

function toDatetimeLocalValue(v: string) {
  if (!v) return "";
  return v.length >= 16 ? v.slice(0, 16) : v;
}

function formatKoreanDateTime(v: string) {
  if (!v) return "";

  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";

  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ExpoHomeAdminPage() {
  const [form, setForm] = useState<LiveForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const embedUrl = useMemo(
    () => toYoutubeEmbed(form.featured_video_url || form.secondary_cta_link),
    [form.featured_video_url, form.secondary_cta_link]
  );

  const autoDateLabel = useMemo(
    () => formatKoreanDateTime(form.live_datetime),
    [form.live_datetime]
  );

  function setValue<K extends keyof LiveForm>(key: K, value: LiveForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyAutoDateLabel() {
    if (!autoDateLabel) return;
    setValue("live_date_label", `${autoDateLabel} LIVE`);
  }

  async function loadLive() {
    setLoading(true);
    setNotice("");
    setError("");

    try {
      const res = await fetch("/api/admin/section?key=live_show", {
        cache: "no-store",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "조회 실패");
      }

      setForm({
        ...DEFAULT_FORM,
        ...(json.content || {}),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  }

  async function saveLive() {
    setSaving(true);
    setNotice("");
    setError("");

    try {
      const videoUrl = form.featured_video_url || form.secondary_cta_link;

      const content = {
        ...form,
        featured_title: form.featured_title || form.prize_text,
        prize_text: form.prize_text || form.featured_title,
        prize_title: form.prize_text || form.featured_title,
        prize_image_url: form.image_url,
        youtube_url: videoUrl,
        video_url: videoUrl,
        product_video_url: videoUrl,
        date_text: form.live_date_label,
        participant_text: `${form.participant_label} ${form.participant_count}명`,
        badge: form.event_badge,
      };

      const res = await fetch("/api/admin/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section_key: "live_show",
          content,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "저장 실패");
      }

      setNotice("저장 완료. /expo 새로고침하면 반영됩니다.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    loadLive();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-green-600">K-Agri Expo Admin</p>
            <h1 className="text-3xl font-black">📺 메인 라이브 이벤트 관리</h1>
            <p className="mt-2 font-bold text-slate-500">
              여기서 저장한 값이 /expo 메인 라이브 박스에 들어갑니다.
            </p>
          </div>

          <div className="flex gap-2">
            <a
              href="/expo"
              target="_blank"
              className="rounded-xl bg-slate-900 px-5 py-3 font-black text-white no-underline"
            >
              메인 보기
            </a>
            <button
              type="button"
              onClick={loadLive}
              className="rounded-xl bg-white px-5 py-3 font-black text-slate-900"
            >
              다시 불러오기
            </button>
          </div>
        </div>

        {loading && <Alert color="blue" text="불러오는 중..." />}
        {notice && <Alert color="green" text={notice} />}
        {error && <Alert color="red" text={error} />}

        <div className="grid gap-6 lg:grid-cols-[1fr_460px]">
          <div className="grid gap-5">
            <Box title="① 핵심 문구">
              <TextInput label="배지" value={form.event_badge} onChange={(v) => setValue("event_badge", v)} />
              <TextInput label="메인 제목" value={form.title} onChange={(v) => setValue("title", v)} />
              <TextInput label="혜택 문구" value={form.subtitle} onChange={(v) => setValue("subtitle", v)} />
              <TextInput label="경품명" value={form.prize_text} onChange={(v) => setValue("prize_text", v)} />
              <TextArea label="하단 안내 문구" value={form.description} onChange={(v) => setValue("description", v)} />
            </Box>

            <Box title="② 일정">
              <TextInput label="일정 표시 문구" value={form.live_date_label} onChange={(v) => setValue("live_date_label", v)} />

              <label className="grid gap-2">
                <span className="font-black">실제 날짜/시간</span>
                <div className="grid gap-2 md:grid-cols-[1fr_180px]">
                  <input
                    type="datetime-local"
                    value={toDatetimeLocalValue(form.live_datetime)}
                    onChange={(e) => setValue("live_datetime", e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyAutoDateLabel}
                    className="rounded-xl bg-slate-900 px-4 py-3 font-black text-white"
                  >
                    표시문구 자동입력
                  </button>
                </div>
              </label>
            </Box>

            <Box title="③ 참여 수">
              <TextInput label="참여 문구" value={form.participant_label} onChange={(v) => setValue("participant_label", v)} />
              <TextInput label="참여 수 기본값" value={form.participant_count} onChange={(v) => setValue("participant_count", v)} />
              <p className="rounded-xl bg-yellow-50 p-3 text-sm font-bold text-yellow-800">
                실제 메인 화면에서는 신청자 수 자동 집계가 우선입니다. 이 값은 자동 집계가 없을 때만 예비값으로 씁니다.
              </p>
            </Box>

            <Box title="④ 제품 이미지 / 유튜브 영상">
              <TextInput label="제품 이미지 URL" value={form.image_url} onChange={(v) => setValue("image_url", v)} />
              <TextInput label="유튜브 영상 URL" value={form.featured_video_url} onChange={(v) => setValue("featured_video_url", v)} />
              <TextInput label="제품명" value={form.featured_title} onChange={(v) => setValue("featured_title", v)} />
              <TextArea label="제품 설명" value={form.featured_desc} onChange={(v) => setValue("featured_desc", v)} />
            </Box>

            <Box title="⑤ 제품 핵심 / 추첨 방식">
              <TextInput label="제품 핵심 1" value={form.feature_1} onChange={(v) => setValue("feature_1", v)} />
              <TextInput label="제품 핵심 2" value={form.feature_2} onChange={(v) => setValue("feature_2", v)} />
              <TextInput label="추첨 방식 1" value={form.feature_3} onChange={(v) => setValue("feature_3", v)} />
              <TextInput label="추첨 방식 2" value={form.feature_4} onChange={(v) => setValue("feature_4", v)} />
            </Box>

            <Box title="⑥ 버튼">
              <TextInput label="참여 버튼 문구" value={form.cta_label} onChange={(v) => setValue("cta_label", v)} />
              <TextInput label="참여 링크" value={form.cta_link} onChange={(v) => setValue("cta_link", v)} />
              <TextInput label="보조 버튼 문구" value={form.secondary_cta_label} onChange={(v) => setValue("secondary_cta_label", v)} />
              <TextInput label="보조 버튼 링크" value={form.secondary_cta_link} onChange={(v) => setValue("secondary_cta_link", v)} />
            </Box>

            <button
              type="button"
              onClick={saveLive}
              disabled={saving}
              className="w-full rounded-2xl bg-green-600 py-5 text-xl font-black text-white disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>

          <aside className="h-fit rounded-3xl bg-white p-5 shadow-xl">
            <p className="mb-3 text-sm font-black text-green-600">미리보기</p>

            <div className="rounded-3xl bg-slate-900 p-5 text-white">
              <div className="mb-3 flex gap-2">
                <span className="rounded-full bg-white/15 px-3 py-2 text-xs font-black">
                  {form.event_badge}
                </span>
                <span className="rounded-full bg-red-500 px-3 py-2 text-xs font-black">
                  LIVE
                </span>
              </div>

              <h2 className="text-3xl font-black leading-tight">{form.title}</h2>

              <div className="mt-3 rounded-2xl bg-yellow-400 p-3 text-xl font-black text-slate-950">
                {form.subtitle}
              </div>

              <div className="mt-3 rounded-xl bg-white/10 p-3">
                <p className="text-xs font-black text-blue-200">📅 라이브 일정</p>
                <p className="font-black">{form.live_date_label}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-white/10 p-3">
                  <p className="font-black text-yellow-300">제품 핵심</p>
                  <p className="mt-2 font-bold">✓ {form.feature_1}</p>
                  <p className="mt-1 font-bold">✓ {form.feature_2}</p>
                </div>

                <div className="rounded-xl bg-white/10 p-3">
                  <p className="font-black text-yellow-300">추첨 방식</p>
                  <p className="mt-2 font-bold">✓ {form.feature_3}</p>
                  <p className="mt-1 font-bold">✓ {form.feature_4}</p>
                </div>
              </div>

              <button className="mt-4 w-full rounded-2xl bg-yellow-400 py-4 text-lg font-black text-slate-950">
                🔥 {form.cta_label}
              </button>

              <div className="mt-5 rounded-2xl bg-white p-3 text-slate-900">
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title={form.featured_title}
                    className="h-48 w-full rounded-xl bg-black"
                    allowFullScreen
                  />
                ) : form.image_url ? (
                  <img
                    src={form.image_url}
                    alt={form.featured_title}
                    className="h-48 w-full rounded-xl object-contain"
                  />
                ) : (
                  <div className="grid h-48 place-items-center rounded-xl bg-slate-100 font-black">
                    이미지/영상 없음
                  </div>
                )}

                <p className="mt-3 text-sm font-black text-green-600">오늘의 대표 경품</p>
                <h3 className="text-xl font-black">{form.prize_text}</h3>
                <p className="mt-1 text-sm font-bold text-slate-500">{form.featured_desc}</p>
              </div>

              <p className="mt-4 text-sm font-bold text-white/70">{form.description}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Alert({ color, text }: { color: "blue" | "green" | "red"; text: string }) {
  const map = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    red: "bg-red-50 text-red-700",
  };

  return <div className={`mb-4 rounded-xl p-4 font-black ${map[color]}`}>{text}</div>;
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xl font-black">{title}</h3>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="grid gap-2">
      <span className="font-black">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold text-slate-900 outline-none"
      />
    </label>
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
    <label className="grid gap-2">
      <span className="font-black">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-28 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-bold leading-relaxed text-slate-900 outline-none"
      />
    </label>
  );
}