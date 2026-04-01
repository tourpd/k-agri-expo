"use client";

import { useEffect, useState } from "react";

type CmsData = {
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_button_text: string | null;
  hero_button_link: string | null;
  hero_secondary_button_text: string | null;
  hero_secondary_button_link: string | null;
  hero_video_url: string | null;
  notice_text: string | null;
};

export default function AdminCmsPage() {
  const [form, setForm] = useState({
    hero_title: "",
    hero_subtitle: "",
    hero_button_text: "",
    hero_button_link: "",
    hero_secondary_button_text: "",
    hero_secondary_button_link: "",
    hero_video_url: "",
    notice_text: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const loadCms = async () => {
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/cms", { cache: "no-store" });
      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "CMS 정보를 불러오지 못했습니다.");
        return;
      }

      const cms: CmsData | null = data.cms;

      setForm({
        hero_title: cms?.hero_title || "",
        hero_subtitle: cms?.hero_subtitle || "",
        hero_button_text: cms?.hero_button_text || "",
        hero_button_link: cms?.hero_button_link || "",
        hero_secondary_button_text: cms?.hero_secondary_button_text || "",
        hero_secondary_button_link: cms?.hero_secondary_button_link || "",
        hero_video_url: cms?.hero_video_url || "",
        notice_text: cms?.notice_text || "",
      });
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    loadCms();
  }, []);

  const onSave = async () => {
    setLoading(true);
    setErrorText("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/cms", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setErrorText(data.error || "저장에 실패했습니다.");
        return;
      }

      setMessage("저장되었습니다.");
    } catch {
      setErrorText("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="text-sm font-black text-emerald-700">CMS</div>
          <h1 className="mt-2 text-3xl font-black">메인 페이지 관리자</h1>
          <p className="mt-2 text-slate-600">
            메인 배너, 버튼, 영상 링크, 공지 문구를 관리합니다.
          </p>

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

        <section className="rounded-3xl bg-white p-6 shadow-lg">
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-bold">메인 제목</label>
              <input
                value={form.hero_title}
                onChange={(e) => setForm((p) => ({ ...p, hero_title: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="대한민국 농업 온라인 박람회"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">메인 설명</label>
              <textarea
                value={form.hero_subtitle}
                onChange={(e) => setForm((p) => ({ ...p, hero_subtitle: e.target.value }))}
                className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="신제품 · 라이브쇼 · 농민 참여가 연결된 K-Agri Expo"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">기본 버튼 문구</label>
                <input
                  value={form.hero_button_text}
                  onChange={(e) => setForm((p) => ({ ...p, hero_button_text: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="이벤트 참여하기"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">기본 버튼 링크</label>
                <input
                  value={form.hero_button_link}
                  onChange={(e) => setForm((p) => ({ ...p, hero_button_link: e.target.value }))}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="/expo/event"
                />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">보조 버튼 문구</label>
                <input
                  value={form.hero_secondary_button_text}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, hero_secondary_button_text: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="라이브 일정 보기"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">보조 버튼 링크</label>
                <input
                  value={form.hero_secondary_button_link}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, hero_secondary_button_link: e.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                  placeholder="/expo/live"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">대표 영상 링크</label>
              <input
                value={form.hero_video_url}
                onChange={(e) => setForm((p) => ({ ...p, hero_video_url: e.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold">공지 문구</label>
              <textarea
                value={form.notice_text}
                onChange={(e) => setForm((p) => ({ ...p, notice_text: e.target.value }))}
                className="min-h-[160px] w-full rounded-xl border border-slate-300 px-4 py-3"
                placeholder="메인 페이지 공지 문구"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onSave}
                disabled={loading}
                className="rounded-2xl bg-slate-950 px-6 py-3 font-black text-white disabled:opacity-60"
              >
                {loading ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}