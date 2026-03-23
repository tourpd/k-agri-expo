import { NextResponse } from "next/server"

const db = [

  {
    type:"문제 해결",
    keyword:["총채벌레","고추"],
    title:"총채벌레 방제 타이밍 놓치면 생기는 일",
    summary:"초기 방제를 놓치면 피해가 급격히 증가합니다."
  },

  {
    type:"문제 해결",
    keyword:["마늘","황화"],
    title:"마늘 잎이 누래질 때 가장 먼저 봐야 할 3가지",
    summary:"비료 부족인지 뿌리 문제인지 먼저 구분해야 합니다."
  },

  {
    type:"제품",
    keyword:["총채벌레"],
    title:"싹쓰리충",
    summary:"친환경 총채벌레 방제 솔루션"
  },

  {
    type:"제품",
    keyword:["마늘","영양"],
    title:"멀티피드",
    summary:"마늘 생육 회복 영양제"
  }

]

export async function GET(req:Request){

  const {searchParams} = new URL(req.url)
  const q = searchParams.get("q") || ""

  const results = db.filter(item =>
    item.keyword.some(k => q.includes(k))
  )

  return NextResponse.json(results)

}