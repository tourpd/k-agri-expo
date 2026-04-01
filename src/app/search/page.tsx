"use client"

import { useState } from "react"

export default function SearchPage(){

  const [q,setQ] = useState("")
  const [results,setResults] = useState<any[]>([])

  const search = async ()=>{

    const res = await fetch(`/api/search?q=${q}`)
    const data = await res.json()

    setResults(data)

  }

  return(

    <main className="max-w-4xl mx-auto p-10">

      <h1 className="text-3xl font-bold mb-6">
        농업 검색
      </h1>

      <div className="flex gap-2">

        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="예: 고추 총채벌레"
          className="border p-3 rounded w-full"
        />

        <button
          onClick={search}
          className="bg-green-600 text-white px-6 rounded"
        >
          검색
        </button>

      </div>


      <div className="mt-8">

        {results.map((r,i)=>(

          <div key={i} className="border p-6 rounded mb-4">

            <div className="text-lg font-bold">
              {r.title}
            </div>

            <div className="text-gray-600 mt-2">
              {r.summary}
            </div>

            <div className="mt-3 text-sm text-green-700">
              {r.type}
            </div>

          </div>

        ))}

      </div>

    </main>

  )
}