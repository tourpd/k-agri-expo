"use client"

import { useEffect,useState } from "react"
import Link from "next/link"

const basePosts = [
  {
    slug: "march-crops-to-avoid",
    title: "3월에 심으면 망하는 작물 5가지",
    summary: "3월 기온과 지온을 무시하고 심었다가 실패하기 쉬운 작물을 정리했습니다."
  },
  {
    slug: "winter-crops-no-topdressing",
    title: "월동작물에 추비 대신 해야 안 망하는 법",
    summary: "무조건 추비부터 넣기 전에 먼저 체크해야 할 기준을 정리했습니다."
  },
  {
    slug: "pepper-top5-mistakes",
    title: "고추 농사 망치는 실수 TOP5",
    summary: "초기 활착, 칼슘 관리, 병해충 대응까지 농가가 많이 놓치는 실수."
  },
]

export default function ProblemsPage(){

  const [posts,setPosts] = useState<any[]>([])

  useEffect(()=>{

    fetch("/api/problem-news")
      .then(res=>res.json())
      .then(setPosts)

  },[])

  return(

    <main className="max-w-4xl mx-auto p-10">

      <h1 className="text-3xl font-bold mb-10">
        농민 고민 해결
      </h1>


      {/* 기본 콘텐츠 */}

      <h2 className="text-xl font-bold mb-4">
        인기 콘텐츠
      </h2>

      {basePosts.map((p,i)=>(
        <Link
          key={i}
          href={`/problems/${p.slug}`}
          className="block border p-6 rounded-xl mb-4 hover:bg-gray-50"
        >

          <h2 className="text-xl font-bold">
            {p.title}
          </h2>

          <p className="text-gray-600 mt-2">
            {p.summary}
          </p>

        </Link>
      ))}


      {/* 자동 콘텐츠 */}

      <h2 className="text-xl font-bold mt-10 mb-4">
        최신 농업 뉴스 기반 콘텐츠
      </h2>

      {posts.map((p,i)=>(
        <Link
          key={i}
          href="/ai-consult"
          className="block border p-6 rounded-xl mb-4 hover:bg-gray-50"
        >

          <h2 className="text-xl font-bold">
            {p.title}
          </h2>

          <p className="text-gray-600 mt-2">
            {p.summary}
          </p>

          <div className="text-sm text-gray-400 mt-2">
            출처 {p.source}
          </div>

        </Link>
      ))}

    </main>
  )
}