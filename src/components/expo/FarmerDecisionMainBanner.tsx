import Link from "next/link";

export default function FarmerDecisionMainBanner() {
  return (
    <section style={{ maxWidth: 1180, margin: "20px auto 0", padding: "0 20px" }}>
      <Link href="/expo/farmer-decision" style={{ display: "block" }}>
        <img
          src="/images/farmer-decision-main.png"
          alt="농민의 선택 AI"
          style={{
            width: "100%",
            display: "block",
            borderRadius: 28,
            boxShadow: "0 24px 70px rgba(15,23,42,0.12)",
          }}
        />
      </Link>
    </section>
  );
}
