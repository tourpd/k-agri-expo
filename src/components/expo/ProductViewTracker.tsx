"use client";

import { useEffect } from "react";

export default function ProductViewTracker({
  productId,
}: {
  productId: string;
}) {
  useEffect(() => {
    if (!productId) return;

    const sendView = async () => {
      try {
        await fetch("/api/expo/product-view", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_id: productId,
          }),
        });
      } catch (e) {
        console.error("product view log error", e);
      }
    };

    sendView();
  }, [productId]);

  return null;
}