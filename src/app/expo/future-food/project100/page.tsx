import Link from "next/link";
export const dynamic = "force-dynamic";
export default function Page(){return <main className="min-h-screen bg-[#f4f7f2] p-5 text-black"><div className="mx-auto max-w-5xl"><Link href="/expo/future-food" className="font-black text-teal-700">← 미래식량관</Link><section className="mt-4 rounded-[28px] bg-teal-800 p-7 text-white"><h1 className="text-5xl font-black">청년농 100 프로젝트</h1><p className="mt-4 text-xl font-bold leading-8">청년농 1명의 5억은 빚이 될 수 있습니다. 청년농 100명의 500억은 산업이 될 수 있습니다.</p></section></div></main>}
