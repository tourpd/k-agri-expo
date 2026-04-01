'use client'

import React from "react"

const productRank = [
  { rank: 1, name: "싹쓰리충" },
  { rank: 2, name: "멸규니" },
  { rank: 3, name: "멀티피드" },
  { rank: 4, name: "켈팍" },
  { rank: 5, name: "메가파워칼" }
]

const problemRank = [
  { rank: 1, name: "총채벌레" },
  { rank: 2, name: "노균병" },
  { rank: 3, name: "비대불량" }
]

export default function BillboardWidget() {
  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm w-full">
      
      <h3 className="text-lg font-bold mb-3">
        K-Agri Billboard
      </h3>

      <div className="mb-5">
        <h4 className="font-semibold text-green-700 mb-2">
          🌾 농민 선택 농자재 TOP5
        </h4>

        <ul className="space-y-1 text-sm">
          {productRank.map((item) => (
            <li key={item.rank} className="flex justify-between">
              <span>{item.rank}</span>
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="font-semibold text-orange-700 mb-2">
          🧑‍🌾 농민 고민 TOP5
        </h4>

        <ul className="space-y-1 text-sm">
          {problemRank.map((item) => (
            <li key={item.rank} className="flex justify-between">
              <span>{item.rank}</span>
              <span>{item.name}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}