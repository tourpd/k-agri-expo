"use client"

import { useState } from "react"

export default function CommunityPage(){

  const posts = [
    {
      user:"홍성마늘농가",
      content:"마늘 잎이 누래지는데 이유 아시는 분?",
      image:"/sample1.jpg"
    },
    {
      user:"청양고추농가",
      content:"고추 총채벌레 방제 어떻게 하세요?",
      image:"/sample2.jpg"
    }
  ]

  return(

    <main className="max-w-4xl mx-auto p-10">

      <h1 className="text-3xl font-bold mb-8">
        농민 커뮤니티
      </h1>

      {posts.map((p,i)=>(

        <div key={i} className="border rounded-xl p-6 mb-6">

          <div className="font-bold">
            {p.user}
          </div>

          <p className="mt-2">
            {p.content}
          </p>

          <div className="mt-4 flex gap-4">

            <button className="text-green-700">
              AI 진단
            </button>

            <button>
              댓글
            </button>

          </div>

        </div>

      ))}

    </main>

  )

}