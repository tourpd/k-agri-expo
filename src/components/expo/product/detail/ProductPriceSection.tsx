import React from "react";

type Props = {
  price?: number | null;
  originalPrice?: number | null;
  discount?: number | null;
  purchaseUrl?: string | null;
};

function formatMoney(value?: number | null) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "가격 문의";
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function ProductPriceSection({
  price,
  originalPrice,
  discount,
  purchaseUrl,
}: Props) {
  const showOldPrice =
    typeof originalPrice === "number" &&
    typeof price === "number" &&
    price < originalPrice;

  return (
    <section style={S.priceBox}>
      <div>
        <div style={S.price}>{formatMoney(price)}</div>

        {showOldPrice ? (
          <div style={S.oldPrice}>{formatMoney(originalPrice)}</div>
        ) : null}

        {typeof discount === "number" ? (
          <div style={S.discount}>{discount}% 할인</div>
        ) : null}
      </div>

      {purchaseUrl ? (
        <a
          href={purchaseUrl}
          target="_blank"
          rel="noreferrer"
          style={S.buyBtn}
        >
          지금 구매하기
        </a>
      ) : (
        <div style={S.buyBtnDisabled}>구매 링크 준비중</div>
      )}
    </section>
  );
}

const S: Record<string, React.CSSProperties> = {
  priceBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },

  price: {
    fontSize: 30,
    color: "#dc2626",
    fontWeight: 900,
    lineHeight: 1.2,
  },

  oldPrice: {
    marginTop: 6,
    textDecoration: "line-through",
    color: "#94a3b8",
    fontSize: 15,
    fontWeight: 700,
  },

  discount: {
    marginTop: 6,
    color: "#dc2626",
    fontWeight: 900,
    fontSize: 15,
  },

  buyBtn: {
    background: "#16a34a",
    color: "#fff",
    padding: "14px 20px",
    borderRadius: 10,
    textDecoration: "none",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
  },

  buyBtnDisabled: {
    background: "#94a3b8",
    color: "#fff",
    padding: "14px 20px",
    borderRadius: 10,
    fontWeight: 900,
    minWidth: 160,
    textAlign: "center",
  },
};