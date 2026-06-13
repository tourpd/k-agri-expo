import Link from "next/link";

export default function HongsanGarlicBanner() {
  return (
    <section style={{ padding: "18px 20px 0" }}>
      <div
        style={{
          maxWidth: 1160,
          margin: "0 auto",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 18px 45px rgba(15,23,42,0.18)",
        }}
      >
        <Link href="/expo/hongsan-garlic">
          <img
            src="/images/hongsan-garlic-main.png"
            alt="홍산마늘 깐마늘 특가"
            style={{
              width: "100%",
              display: "block",
              cursor: "pointer",
            }}
          />
        </Link>
      </div>
    </section>
  );
}
