import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function FutureFoodAcademyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f5f1",
        padding: "24px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
        }}
      >
        <Link
          href="/expo/future-food"
          style={{
            display: "inline-block",
            marginBottom: "20px",
            color: "#0b6b3a",
            fontWeight: 900,
            textDecoration: "none",
          }}
        >
          ← 미래식량관으로
        </Link>

        <Image
          src="/images/academy-poster.png"
          alt="KFFR 미래농업 아카데미"
          width={1200}
          height={3000}
          priority
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "20px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
            display: "block",
          }}
        />
      </div>
    </main>
  );
}