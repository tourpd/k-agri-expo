"use client"

import { useState } from "react"

export default function EnterPage() {

  const [form,setForm] = useState({
    company:"",
    owner:"",
    phone:"",
    email:"",
    business:"",
    category:"농자재관"
  })

  const handleChange = (e:any)=>{
    setForm({...form,[e.target.name]:e.target.value})
  }

  const handleSubmit = async (e:any)=>{
    e.preventDefault()

    alert("입점 신청이 접수되었습니다.")

    // 여기서 나중에 Supabase / Firebase 저장
  }

  return (

    <main className="min-h-screen bg-gray-50 p-10">

      <h1 className="text-3xl font-bold mb-8">
        기업 부스 입점 신청
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow max-w-xl"
      >

        <label className="block mb-4">
          회사명
          <input
            name="company"
            className="w-full border p-3 mt-1"
            onChange={handleChange}
          />
        </label>

        <label className="block mb-4">
          대표자명
          <input
            name="owner"
            className="w-full border p-3 mt-1"
            onChange={handleChange}
          />
        </label>

        <label className="block mb-4">
          연락처
          <input
            name="phone"
            className="w-full border p-3 mt-1"
            onChange={handleChange}
          />
        </label>

        <label className="block mb-4">
          이메일
          <input
            name="email"
            className="w-full border p-3 mt-1"
            onChange={handleChange}
          />
        </label>

        <label className="block mb-4">
          사업자등록번호
          <input
            name="business"
            className="w-full border p-3 mt-1"
            onChange={handleChange}
          />
        </label>

        <label className="block mb-6">
          전시관 선택

          <select
            name="category"
            className="w-full border p-3 mt-1"
            onChange={handleChange}
          >
            <option>농자재관</option>
            <option>종자관</option>
            <option>농기계관</option>
            <option>친환경농업관</option>
            <option>스마트농업관</option>
          </select>

        </label>

        <button className="bg-green-600 text-white px-6 py-3 rounded-lg">
          입점 신청
        </button>

      </form>

    </main>
  )
}