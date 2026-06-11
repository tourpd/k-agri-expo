"use client";

import { useState } from "react";

export default function SendActionButton({ actionId }: { actionId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function send() {
    if (loading || done) return;

    const ok = window.confirm("이 추천 액션을 발송 처리할까요?");
    if (!ok) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/crm-actions/${actionId}/send`, {
        method: "POST",
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || "발송 실패");
      }

      setDone(true);
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "발송 실패");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={send}
      disabled={loading || done}
      className="rounded bg-green-700 px-3 py-1 text-xs font-black text-white disabled:bg-neutral-400"
    >
      {done ? "완료" : loading ? "처리중" : "발송"}
    </button>
  );
}
