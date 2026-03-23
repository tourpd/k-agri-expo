"use client";

import { useEffect, useState } from "react";

export default function BoothVisitCounter({
  boothId,
}: {
  boothId: string;
}) {

  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/expo/visit", {
      method: "POST",
      body: JSON.stringify({ booth_id: boothId }),
    })
      .then((r) => r.json())
      .then((j) => setCount(j.visits));
  }, [boothId]);

  return (
    <div
      style={{
        fontSize: 12,
        color: "#666",
      }}
    >
      👀 방문자 {count ?? "..."}명
    </div>
  );
}