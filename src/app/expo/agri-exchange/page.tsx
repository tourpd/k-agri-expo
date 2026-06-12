import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AgriExchangePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f2] p-4 text-black">
      <section className="mx-auto max-w-6xl">
        <div className="relative overflow-hidden rounded-[28px] shadow-xl">
          <img
            src="/images/agri-exchange-banner.png"
            alt="K-Agri 농산물거래소"
            className="block w-full"
          />

          <Link href="/expo/agri-exchange/register" className="absolute left-[5%] top-[49%] h-[30%] w-[28%] rounded-3xl" />
          <Link href="/expo/agri-exchange/market" className="absolute left-[36%] top-[49%] h-[30%] w-[28%] rounded-3xl" />
          <Link href="/expo/agri-exchange/my-trades" className="absolute left-[67%] top-[49%] h-[30%] w-[28%] rounded-3xl" />
        </div>
      </section>
    </main>
  );
}
