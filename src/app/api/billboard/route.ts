import { NextResponse } from "next/server"

const products = [
  "싹쓰리충",
  "멸규니",
  "멀티피드",
  "켈팍",
  "메가파워칼"
]

const problems = [
  "총채벌레",
  "노균병",
  "비대불량",
  "잎마름",
  "활착불량"
]

export async function GET(){

  return NextResponse.json({
    products,
    problems
  })

}