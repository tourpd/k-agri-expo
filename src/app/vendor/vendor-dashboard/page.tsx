"use client"

import { useState } from "react"

export default function VendorDashboard(){

  const [products,setProducts] = useState([
    {name:"싹쓰리충",price:"29000"},
    {name:"멸규니",price:"19000"}
  ])

  const [newProduct,setNewProduct] = useState({
    name:"",
    price:""
  })

  const addProduct = ()=>{
    setProducts([...products,newProduct])
    setNewProduct({name:"",price:""})
  }

  return(

    <main className="min-h-screen bg-gray-50 p-10">

      <h1 className="text-3xl font-bold mb-10">
        업체 부스 관리
      </h1>

      <div className="grid grid-cols-2 gap-10">

        <section>

          <h2 className="text-xl font-bold mb-4">
            제품 등록
          </h2>

          <input
            placeholder="제품명"
            className="border p-3 w-full mb-3"
            value={newProduct.name}
            onChange={(e)=>setNewProduct({...newProduct,name:e.target.value})}
          />

          <input
            placeholder="가격"
            className="border p-3 w-full mb-3"
            value={newProduct.price}
            onChange={(e)=>setNewProduct({...newProduct,price:e.target.value})}
          />

          <button
            onClick={addProduct}
            className="bg-black text-white px-5 py-2 rounded"
          >
            제품 추가
          </button>

        </section>

        <section>

          <h2 className="text-xl font-bold mb-4">
            등록된 제품
          </h2>

          {products.map((p,i)=>(
            <div
              key={i}
              className="bg-white p-4 mb-3 rounded shadow"
            >
              <div className="font-bold">
                {p.name}
              </div>

              <div className="text-gray-600">
                {p.price}원
              </div>

            </div>
          ))}

        </section>

      </div>

    </main>
  )
}