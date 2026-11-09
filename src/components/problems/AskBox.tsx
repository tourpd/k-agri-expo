"use client";

import Link from "next/link";
import React, { useState } from "react";

type Hit = { slug: string; title: string; summary?: string };
type Resp = {
  ok: boolean;
  saved?: boolean;
  crop?: { key: string; label: string } | null;
  problems?: Hit[];
  needs?: Hit[];
  notice?: string;
  error?: string;
};

/**
 * 직접 묻기 — 농민이 자기 말로 증상을 적는다.
 * 1단계: 증상만 적어 보내면 맞는 문제 페이지를 바로 보여줌
 * 2단계: 답이 없거나 더 묻고 싶으면 이름·연락처
 */
export default function AskBox({ big }: { big?: boolean }) {
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [res, setRes] = useState<Resp | null>(null);
  const [busy, setBusy] = useState(false);
  const [showContact, setShowContact] = useState(false);

  async function send(withContact: boolean) {
    if (busy || q.trim().length < 4) return;
    setBusy(true);
    try {
      const r = await fetch("/api/problems/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          farmer_name: withContact ? name : "",
          phone: withContact ? phone : "",
          region: withContact ? region : "",
        }),
      });
      const json = (await r.json().catch(() => ({}))) as Resp;
      setRes(json);
      if (!json.problems?.length) setShowContact(true);
    } catch {
      setRes({ ok: false, error: "연결이 끊겼습니다. 잠시 후 다시 시도해 주세요." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={big ? S.wrapBig : S.wrap}>
      <div style={S.head}>
        <div style={big ? S.titleBig : S.title}>💬 증상을 직접 적어 물어보세요</div>
        <div style={S.sub}>예: 딸기 잎 끝이 타들어가요 · 하우스 토마토 밑잎이 노래져요 · 참외 모종 언제 예약하나요</div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(false);
        }}
        style={S.row}
      >
        <input
          style={S.input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="작물과 증상을 한 줄로"
          maxLength={300}
        />
        <button type="submit" style={S.btn} disabled={busy}>
          {busy ? "찾는 중…" : "찾기"}
        </button>
      </form>

      {res?.error ? <div style={S.error}>{res.error}</div> : null}

      {res?.ok ? (
        <div style={S.result}>
          <div style={S.notice}>{res.notice}</div>
          {res.problems && res.problems.length > 0 ? (
            <div style={S.hits}>
              {res.problems.map((p) => (
                <Link key={p.slug} href={`/p/${p.slug}`} style={S.hit}>
                  <div style={S.hitTitle}>{p.title}</div>
                  {p.summary ? <div style={S.hitSummary}>{p.summary}</div> : null}
                  <div style={S.hitCta}>해답 보기 →</div>
                </Link>
              ))}
            </div>
          ) : null}
          {res.needs && res.needs.length > 0 ? (
            <div style={S.needs}>
              준비물: {res.needs.map((n) => (
                <Link key={n.slug} href={`/need/${n.slug}`} style={S.needLink}>{n.title}</Link>
              ))}
            </div>
          ) : null}

          {!res.saved ? (
            <div style={S.contactWrap}>
              {!showContact ? (
                <button type="button" style={S.linkBtn} onClick={() => setShowContact(true)}>
                  기업이 직접 답하게 하려면 연락처 남기기 →
                </button>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send(true);
                  }}
                  style={S.contactForm}
                >
                  <div style={S.row2}>
                    <input style={S.input} placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
                    <input style={S.input} placeholder="전화번호" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                  </div>
                  <input style={S.input} placeholder="지역 (예: 경남 밀양)" value={region} onChange={(e) => setRegion(e.target.value)} />
                  <button type="submit" style={S.btnFull} disabled={busy}>
                    {busy ? "보내는 중…" : "질문 접수하기 (24시간 안에 답)"}
                  </button>
                  <div style={S.fine}>상담을 위해 이름·연락처를 해당 기업에 전달하는 데 동의하는 것으로 봅니다.</div>
                </form>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { padding: 16, borderRadius: 18, background: "#0f172a", color: "#fff" },
  wrapBig: { padding: 20, borderRadius: 22, background: "#0f172a", color: "#fff" },
  head: { marginBottom: 10 },
  title: { fontSize: 17, fontWeight: 950 },
  titleBig: { fontSize: 22, fontWeight: 950 },
  sub: { marginTop: 4, fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 },
  row: { display: "flex", gap: 8 },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  input: { flex: 1, minWidth: 0, padding: "12px 12px", borderRadius: 12, border: "1px solid #334155", fontSize: 15, background: "#fff", color: "#0f172a" },
  btn: { padding: "12px 16px", borderRadius: 12, border: 0, background: "#22c55e", color: "#052e16", fontWeight: 950, fontSize: 15, cursor: "pointer", whiteSpace: "nowrap" },
  btnFull: { padding: "12px", borderRadius: 12, border: 0, background: "#22c55e", color: "#052e16", fontWeight: 950, fontSize: 15, cursor: "pointer" },
  error: { marginTop: 8, fontSize: 13, color: "#fca5a5", fontWeight: 700 },
  result: { marginTop: 12 },
  notice: { fontSize: 14, fontWeight: 800, color: "#bbf7d0", lineHeight: 1.5 },
  hits: { marginTop: 8, display: "grid", gap: 8 },
  hit: { display: "block", padding: 12, borderRadius: 12, background: "#1e293b", textDecoration: "none", color: "#fff" },
  hitTitle: { fontSize: 15, fontWeight: 900 },
  hitSummary: { marginTop: 3, fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 },
  hitCta: { marginTop: 6, fontSize: 13, fontWeight: 900, color: "#86efac" },
  needs: { marginTop: 8, fontSize: 13, color: "#cbd5e1", display: "flex", gap: 8, flexWrap: "wrap" },
  needLink: { color: "#93c5fd", fontWeight: 800 },
  contactWrap: { marginTop: 10 },
  linkBtn: { background: "none", border: 0, color: "#86efac", fontWeight: 900, fontSize: 14, cursor: "pointer", padding: 0 },
  contactForm: { display: "grid", gap: 8 },
  fine: { fontSize: 11, color: "#94a3b8", lineHeight: 1.5 },
};
