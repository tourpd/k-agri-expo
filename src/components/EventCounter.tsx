"use client";

import { useEffect, useState } from "react";

type CountResponse = {
  success: boolean;
  count?: number;
  error?: string;
};

export default function EventCounter({
  eventId = 1,
}: {
  eventId?: number;
}) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadCount = async () => {
    try {
      const res = await fetch(`/api/event-count?event_id=${eventId}`, {
        cache: "no-store",
      });

      const data: CountResponse = await res.json();

      if (data.success) {
        setCount(data.count || 0);
      }
    } catch {
      // 조용히 무시
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCount();

    const timer = setInterval(() => {
      loadCount();
    }, 3000);

    return () => clearInterval(timer);
  }, [eventId]);

  return (
    <div className="rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15">
      <div className="text-sm font-bold text-orange-100">현재 응모 현황</div>
      <div className="mt-2 text-3xl font-black text-yellow-200">
        {loading ? "불러오는 중..." : `${count.toLocaleString()}명`}
      </div>
      <div className="mt-1 text-sm text-slate-200">
        지금도 계속 응모가 들어오고 있습니다.
      </div>
    </div>
  );
}