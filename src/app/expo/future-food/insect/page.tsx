import Link from "next/link";

export const dynamic = "force-dynamic";

export default function FutureFoodInsectPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f5f1",
      }}
    >
      <div
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "24px",
        }}
      >
        <Link
          href="/expo/future-food"
          style={{
            display: "inline-block",
            marginBottom: "20px",
            color: "#075b30",
            textDecoration: "none",
            fontWeight: 900,
            fontSize: "18px",
          }}
        >
          ← 미래식량관으로
        </Link>

        <img
          src="/images/insect-page.png"
          alt="곤충산업은 작게 시작해야 합니다"
          style={{
            width: "100%",
            display: "block",
            borderRadius: "20px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
          }}
        />
      </div>
    </main>
  );
}