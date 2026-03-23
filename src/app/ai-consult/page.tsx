"use client"

import { useState } from "react"

export default function AIConsult(){

  const [question,setQuestion] = useState("")
  const [result,setResult] = useState<any>(null)

  const ask = async ()=>{

    const res = await fetch("/api/farm-ai",{
      method:"POST",
      body:JSON.stringify({question})
    })

    const data = await res.json()

    setResult(data)

  }

  return(

    <main className="max-w-4xl mx-auto p-10">

      <h1 className="text-3xl font-bold mb-6">
        농사 AI 상담
      </h1>

      <input
        value={question}
        onChange={(e)=>setQuestion(e.target.value)}
        placeholder="예: 마늘 1000평 켈팍 몇 리터?"
        className="border p-4 w-full rounded"
      />

      <button
        onClick={ask}
        className="mt-4 bg-green-700 text-white px-6 py-3 rounded"
      >
        상담 시작
      </button>


      {result && (

        <div className="mt-10 border p-6 rounded">

          <h2 className="text-xl font-bold">
            상담 결과
          </h2>

          <p className="mt-4">
            {result.answer}
          </p>

          <div className="mt-6">

            <h3 className="font-bold">
              추천 제품
            </h3>

            <a
              href={result.productLink}
              className="text-green-700"
            >
              {result.product}
            </a>

          </div>

        </div>

      )}

    </main>

  )

}