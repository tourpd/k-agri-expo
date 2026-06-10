import Link from "next/link";
export const dynamic = "force-dynamic";
export default function Page(){return <main className="min-h-screen bg-[#f4f7f2] p-5 text-black"><div className="mx-auto max-w-5xl"><Link href="/expo/future-food" className="font-black text-green-700">← 미래식량관</Link><section className="mt-4 rounded-[28px] bg-green-900 p-7 text-white"><h1 className="text-5xl font-black">미래식량 참여센터</h1><p className="mt-4 text-xl font-bold leading-8">설명회, 교육, 상담, 참여 신청을 이곳에서 접수합니다.</p></section></div></main>}
