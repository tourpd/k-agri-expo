"use client";

import { useState } from "react";

type LoginFormProps = {
  titleBadge: string;
  title: string;
  description: string;
  emailLabel?: string;
  emailPlaceholder?: string;
  submitLabel?: string;
  loadingLabel?: string;
  error?: string;
  onSubmit: (payload: { email: string; password: string }) => Promise<void> | void;
  bottomLeft?: React.ReactNode;
  bottomRight?: React.ReactNode;
};

export default function LoginForm({
  titleBadge,
  title,
  description,
  emailLabel = "이메일",
  emailPlaceholder = "예: vendor@company.com",
  submitLabel = "로그인",
  loadingLabel = "로그인 중...",
  error,
  onSubmit,
  bottomLeft,
  bottomRight,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    if (!password.trim()) {
      alert("비밀번호를 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        email: email.trim(),
        password,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-[32px] bg-white p-8 shadow-xl md:p-10">
        <div className="text-sm font-black uppercase tracking-wide text-blue-600">
          {titleBadge}
        </div>

        <h1 className="mt-4 text-4xl font-black text-slate-950">{title}</h1>

        <p className="mt-6 whitespace-pre-line text-lg leading-9 text-slate-500">
          {description}
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <label className="block">
            <div className="mb-3 text-xl font-bold text-slate-950">{emailLabel}</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailPlaceholder}
              autoComplete="email"
              className="w-full rounded-[22px] border border-slate-200 bg-slate-100 px-5 py-5 text-2xl outline-none transition focus:border-slate-400 focus:bg-white"
            />
          </label>

          <label className="block">
            <div className="mb-3 text-xl font-bold text-slate-950">비밀번호</div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                autoComplete="current-password"
                className="w-full rounded-[22px] border border-slate-200 bg-slate-100 px-5 py-5 pr-24 text-2xl outline-none transition focus:border-slate-400 focus:bg-white"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                {showPassword ? "숨김" : "보기"}
              </button>
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-[22px] bg-black px-6 py-5 text-2xl font-black text-white transition hover:bg-slate-900 disabled:opacity-50"
          >
            {submitting ? loadingLabel : submitLabel}
          </button>
        </form>

        {(bottomLeft || bottomRight) && (
          <div className="mt-8 flex items-center justify-between gap-4 text-xl font-bold text-slate-900">
            <div>{bottomLeft}</div>
            <div>{bottomRight}</div>
          </div>
        )}
      </div>
    </main>
  );
}