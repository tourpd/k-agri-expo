"use client"

import { useState } from "react"

export default function Write(){

  const [text,setText] = useState("")

  return(

    <main className="max-w-3xl mx-auto p-10">

      <h1 className="text-2xl font-bold mb-6">
        농민 글쓰기
      </h1>

      <textarea
        value={text}
        onChange={(e)=>setText(e.target.value)}
        className="border p-4 w-full rounded"
        placeholder="지금 농사 상황을 올려주세요"
      />

      <button className="mt-4 bg-green-700 text-white px-6 py-3 rounded">
        올리기
      </button>

    </main>

  )

}