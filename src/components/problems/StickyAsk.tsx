"use client";

import React, { useState } from "react";

/**
 * 화면 아래 고정 띠: [📞 기업에 전화] [문의 남기기]
 * - 전화는 자재를 낸 기업 번호로 갑니다. 기업 번호가 없으면 전화 버튼은 숨기고 '문의 남기기'만 둡니다.
 * - 문의도 그 기업 부스(boothId)로 들어갑니다. 운영자는 끼지 않습니다.
 */
export default function StickyAsk({
  problemSlug,
  problemTitle,
  needsCrop,
  phone,
  companyName,
  boothId,
}: {
  problemSlug: string;
  problemTitle: string;
  needsCrop?: boolean;
  /** 기업 전화번호. 없으면 전화 버튼 없음 */
  phone?: string | null;
  companyName?: string | null;
  boothId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [crop, setCrop] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/expo/problem-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem_slug: problemSlug,
          booth_id: boothId ?? undefined,
          farmer_name: name,
          phone: tel,
          crop,
          message: note,
          agree_privacy: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setState("error");
        setMsg(json?.error || "접수에 실패했습니다. 전화로 문의해 주세요.");
        return;
      }
      setState("done");
      setMsg("접수됐습니다. 담당 기업이 연락드립니다.");
    } catch {
      setState("error");
      setMsg("연결이 끊겼습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <>
      <style>{CSS}</style>
      {/* 아래 고정 띠 */}
      <div className={phone ? "sticky-ask-bar" : "sticky-ask-bar sticky-ask-bar--one"}>
        {phone ? (
          <a href={`tel:${phone}`} className="sticky-ask-call">
            📞 {companyName ? `${companyName}에 전화` : "기업에 전화"}
          </a>
        ) : null}
        <button type="button" className="sticky-ask-open" onClick={() => setOpen(true)}>
          문의 남기기
        </button>
      </div>

      {/* 문의 창 */}
      {open ? (
        <div className="sticky-ask-backdrop" onClick={() => setOpen(false)}>
          <div className="sticky-ask-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sticky-ask-head">
              <div className="sticky-ask-who">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/doctor-q.svg" alt="닥터Q" width={40} height={43} />
                <div className="sticky-ask-title">{problemTitle}</div>
              </div>
              <button type="button" className="sticky-ask-close" onClick={() => setOpen(false)} aria-label="닫기">✕</button>
            </div>

            {state === "done" ? (
              <div className="sticky-ask-done">
                <div className="sticky-ask-done-title">접수됐습니다</div>
                <div>{msg}</div>
                {phone ? <div>급하시면 <a href={`tel:${phone}`}>{phone}</a></div> : null}
              </div>
            ) : (
              <form onSubmit={submit} className="sticky-ask-form">
                <div className="sticky-ask-sub">
                  닥터Q가 {companyName ? `${companyName}에` : "맞는 기업에"} 전달합니다. 이름과 전화번호만 적으면 {companyName ? "그 기업이" : "기업이"} 직접 연락드립니다.
                </div>
                <label className="sticky-ask-label">이름
                  <input className="sticky-ask-input" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
                <label className="sticky-ask-label">전화번호
                  <input className="sticky-ask-input" placeholder="010-0000-0000" inputMode="tel" value={tel} onChange={(e) => setTel(e.target.value)} required />
                </label>
                {needsCrop ? (
                  <label className="sticky-ask-label">작물
                    <input className="sticky-ask-input" placeholder="예: 딸기" value={crop} onChange={(e) => setCrop(e.target.value)} />
                  </label>
                ) : null}
                <label className="sticky-ask-label">한 줄 메모 <span className="sticky-ask-opt">(안 적어도 됩니다)</span>
                  <input className="sticky-ask-input" value={note} onChange={(e) => setNote(e.target.value)} />
                </label>
                {state === "error" ? <div className="sticky-ask-error">{msg}</div> : null}
                <button type="submit" className="sticky-ask-submit" disabled={state === "sending"}>
                  {state === "sending" ? "보내는 중…" : "보내기"}
                </button>
                <div className="sticky-ask-fine">상담을 위해 이름·연락처를 해당 기업에 전달합니다.</div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

const CSS = `
.sticky-ask-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); background: rgba(255,255,255,.96); border-top: 1px solid #e5e7eb; backdrop-filter: blur(6px); }
.sticky-ask-bar--one { grid-template-columns: 1fr; }
.sticky-ask-call { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; display:flex; align-items:center; justify-content:center; padding: 14px; border-radius: 14px; background: #0f172a; color: #fff; font-weight: 900; font-size: 16px; text-decoration: none; }
.sticky-ask-open { padding: 14px; border-radius: 14px; border: 0; background: #15803d; color: #fff; font-weight: 900; font-size: 16px; cursor: pointer; }
.sticky-ask-backdrop { position: fixed; inset: 0; z-index: 70; background: rgba(15,23,42,.45); display: flex; align-items: flex-end; justify-content: center; }
.sticky-ask-sheet { width: 100%; max-width: 560px; background: #fff; border-radius: 22px 22px 0 0; padding: 18px 16px calc(18px + env(safe-area-inset-bottom)); }
.sticky-ask-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.sticky-ask-who { display: flex; gap: 8px; align-items: center; }
.sticky-ask-title { font-size: 17px; font-weight: 950; color: #0f172a; }
.sticky-ask-close { border: 0; background: #f1f5f9; border-radius: 999px; width: 32px; height: 32px; font-size: 14px; cursor: pointer; }
.sticky-ask-form { display: grid; gap: 8px; margin-top: 10px; }
.sticky-ask-sub { font-size: 13px; color: #475569; }
.sticky-ask-label { display: grid; gap: 4px; font-size: 13px; font-weight: 800; color: #334155; }
.sticky-ask-opt { font-weight: 500; color: #94a3b8; }
.sticky-ask-input { padding: 13px 12px; border-radius: 12px; border: 1px solid #cbd5e1; font-size: 16px; color: #0f172a; background: #fff; }
.sticky-ask-input::placeholder { color: #b6c0cc; opacity: 1; }
.sticky-ask-submit { padding: 14px; border-radius: 14px; border: 0; background: #15803d; color: #fff; font-weight: 900; font-size: 16px; cursor: pointer; }
.sticky-ask-error { font-size: 13px; color: #b91c1c; font-weight: 700; }
.sticky-ask-fine { font-size: 11px; color: #94a3b8; }
.sticky-ask-done { margin-top: 12px; display: grid; gap: 6px; font-size: 14px; color: #065f46; }
.sticky-ask-done-title { font-size: 18px; font-weight: 950; }
.sticky-ask-done a { color: #047857; font-weight: 800; }
@media (min-width: 900px) { .sticky-ask-bar { left: 50%; right: auto; transform: translateX(-50%); width: 560px; border-radius: 18px 18px 0 0; } }
`;
