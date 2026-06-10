import Link from "next/link";
export const dynamic = "force-dynamic";
export default function Page(){return <main className="min-h-screen bg-[#f4f7f2] p-5 text-black"><div className="mx-auto max-w-5xl"><Link href="/expo/future-food" className="font-black text-blue-700">← 미래식량관</Link><section className="mt-4 rounded-[28px] bg-blue-900 p-7 text-white"><h1 className="text-5xl font-black">아들에게 농장 물려주기</h1><p className="mt-4 text-xl font-bold leading-8">농사만 물려주지 마십시오. 청년이 돌아올 수 있는 미래산업을 보여주십시오.</p></section></div></main>}
