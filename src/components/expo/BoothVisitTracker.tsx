"use client";

import { useEffect } from "react";

export default function BoothVisitTracker({ boothId }: { boothId: string }) {

  useEffect(() => {

    fetch("/api/expo/booth-visit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        booth_id: boothId
      })
    });

  }, [boothId]);

  return null;
}