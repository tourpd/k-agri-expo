"use client";

import { useEffect, useState } from "react";

export default function BoothFavoriteButton({
  boothId,
}: {
  boothId: string;
}) {
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    async function fetchState() {
      try {
        const res = await fetch(`/api/buyer/favorites?booth_id=${boothId}`, {
          cache: "no-store",
        });
        const json = await res.json();

        if (!alive) return;
        if (json?.ok) {
          setLiked(!!json.liked);
        }
      } finally {
        if (alive) setReady(true);
      }
    }

    fetchState();

    return () => {
      alive = false;
    };
  }, [boothId]);

  async function onToggle() {
    setLoading(true);

    try {
      const res = await fetch("/api/buyer/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ booth_id: boothId }),
      });

      const json = await res.json();

      if (json?.ok) {
        setLiked(!!json.liked);
      } else {
        alert(json?.error || "찜 처리에 실패했습니다.");
      }
    } catch {
      alert("찜 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!ready || loading}
      className={`rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:opacity-50 ${
        liked
          ? "bg-rose-600 text-white"
          : "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50"
      }`}
    >
      {loading ? "처리 중..." : liked ? "♥ 찜됨" : "♡ 찜하기"}
    </button>
  );
}