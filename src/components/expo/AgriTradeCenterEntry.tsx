import React from "react";
import Link from "next/link";

export default function AgriTradeCenterEntry() {
  return (
    <section style={{ padding: "18px 20px 0" }}>
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          position: "relative",
          borderRadius: 28,
          overflow: "hidden",
        }}
      >
        <img
          src="/images/agri-exchange-banner.png"
          style={{ width: "100%", display: "block" }}
          alt="K-Agri"
        />

        <a href="/expo/agri-exchange/register" style={btn(5, 49)} />
        <a href="/expo/agri-exchange/market" style={btn(36, 49)} />
        <a href="/expo/agri-exchange/my-trades" style={btn(67, 49)} />
      </div>
    </section>
  );
}

function btn(left: string | number, top: string | number) {
  return {
    position: "absolute",
    left: typeof left === "number" ? left + "%" : left,
    top: typeof top === "number" ? top + "%" : top,
    width: "28%",
    height: "30%",
    zIndex: 50,
    display: "block",
  } as React.CSSProperties;
}
