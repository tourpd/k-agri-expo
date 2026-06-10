import Link from "next/link";
export const dynamic = "force-dynamic";
export default function Page(){return <main className="min-h-screen bg-[#f4f7f2] p-5 text-black"><div className="mx-auto max-w-5xl"><Link href="/expo/future-food" className="font-black text-green-700">← 미래식량관</Link><section className="mt-4 rounded-[28px] bg-green-900 p-7 text-white"><h1 className="text-5xl font-black">농사하며 월급 만들기</h1><p className="mt-4 text-xl font-bold leading-8">농산물 가격에만 인생을 걸지 마십시오. 기존 농사를 유지하면서 두 번째 소득을 만듭니다.</p></section></div></main>}
