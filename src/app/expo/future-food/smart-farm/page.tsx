import Link from "next/link";

export const dynamic = "force-dynamic";

export default function FutureFoodSmartFarmPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f5f1",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
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
          src="/images/smart-farm-mobile.png"
          alt="KFFR 스마트 사육장"
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