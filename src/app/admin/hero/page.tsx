"use client";

import { useEffect, useState } from "react";

type HeroSettings = {
  id: number;
  hero_mode: "manual" | "auto";
  hero_auto_window_days: number;
  hero_title?: string | null;
  hero_subtitle?: string | null;
};

type AutoHeroPreview = {
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  button_link: string;
  secondary_button_text: string;
  secondary_button_link: string;
  badge_text: string;
  source_issue_key: string | null;
  source_count: number;
};

export default function AdminHeroPage() {
  const [settings, setSettings] = useState<HeroSettings | null>(null);
  const [autoHero, setAutoHero] = useState<AutoHeroPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const loadData = async () => {
    setLoading(true);
    setErrorText("");

    try {
      const res = await fetch("/api/admin/hero", {
        cache: "no-store",
      });
      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "히어로 설정을 불러오지 못했습니다.");
        return;
      }

      setSettings(data.settings || null);
      setAutoHero(data.autoHero || null);
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveMode = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage("");
    setErrorText("");

    try {
      const res = await fetch("/api/admin/hero/mode", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hero_mode: settings.hero_mode,
          hero_auto_window_days: Number(settings.hero_auto_window_days || 7),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "히어로 모드 저장에 실패했습니다.");
        return;
      }

      setMessage(data.message || "저장되었습니다.");
      await loadData();
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6 text-slate-900">
      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-sm font-black text-emerald-700">HERO CONTROL</div>
            <h1 className="mt-2 text-3xl font-black">메인 히어로 운영</h1>
            <p className="mt-2 text-slate-600">
              수동 히어로와 자동 히어로를 전환하고, 자동 모드일 때 최근 상담 데이터 기반 히어로를 사용합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white"
          >
            {loading ? "불러오는 중..." : "새로고침"}
          </button>
        </div>

        {message ? (
          <div className="mt-4 rounded-xl bg-emerald-100 px-4 py-3 font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorText ? (
          <div className="mt-4 rounded-xl bg-red-100 px-4 py-3 font-bold text-red-700">
            {errorText}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">운영 설정</h2>

          {!settings ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-slate-500">
              설정을 불러오는 중입니다.
            </div>
          ) : (
            <div className="mt-6 grid gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold">히어로 모드</label>
                <select
                  value={settings.hero_mode}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero_mode: e.target.value as "manual" | "auto",
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                >
                  <option value="manual">manual (수동 운영)</option>
                  <option value="auto">auto (자동 운영)</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">자동 히어로 집계 기간(일)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.hero_auto_window_days ?? 7}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero_auto_window_days: Number(e.target.value || 7),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
                <div className="mt-2 text-xs text-slate-500">
                  현재 hero-auto 로직은 최근 상담 이슈를 기준으로 추천 히어로를 생성합니다.
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-black text-slate-800">현재 수동 히어로</div>
                <div className="mt-3 text-base font-bold text-slate-900">
                  {settings.hero_title || "설정된 제목 없음"}
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {settings.hero_subtitle || "설정된 부제 없음"}
                </div>
              </div>

              <button
                type="button"
                onClick={saveMode}
                disabled={saving}
                className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-60"
              >
                {saving ? "저장 중..." : "히어로 설정 저장"}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-black">자동 히어로 미리보기</h2>

          {!autoHero ? (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-slate-500">
              최근 상담 데이터 기반 자동 히어로가 아직 없습니다.
            </div>
          ) : (
            <div className="mt-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-800 to-green-800 p-6 text-white">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black">
                {autoHero.badge_text}
              </div>

              <div className="mt-4 text-sm font-bold text-white/80">
                {autoHero.subtitle}
              </div>

              <h3 className="mt-4 text-3xl font-black leading-tight">
                {autoHero.title}
              </h3>

              <p className="mt-4 max-w-2xl text-base leading-8 text-white/90">
                {autoHero.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={autoHero.button_link}
                  className="rounded-2xl bg-white px-5 py-3 font-black text-slate-900"
                >
                  {autoHero.button_text}
                </a>
                <a
                  href={autoHero.secondary_button_link}
                  className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 font-black text-white"
                >
                  {autoHero.secondary_button_text}
                </a>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-xs font-black text-white/70">기준 이슈</div>
                  <div className="mt-2 text-lg font-black">
                    {autoHero.source_issue_key || "general"}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-xs font-black text-white/70">최근 집계 수</div>
                  <div className="mt-2 text-lg font-black">
                    {autoHero.source_count}건
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}