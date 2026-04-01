"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PopularProducts() {

  const [products,setProducts] = useState<any[]>([]);

  useEffect(()=>{

    fetch("/api/expo/popular-products")
      .then(r=>r.json())
      .then(d=>{
        setProducts(d.products || []);
      });

  },[]);

  return(

    <section style={{marginTop:50}}>

      <h2 style={{
        fontSize:22,
        fontWeight:900
      }}>
        🔥 지금 농민들이 많이 보는 제품
      </h2>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",
        gap:14,
        marginTop:14
      }}>

        {products.map((p:any)=>{

          const product = p.products;

          return(

            <Link
              key={product.product_id}
              href={`/expo/product/${product.product_id}`}
              style={{
                border:"1px solid #eee",
                borderRadius:12,
                padding:14,
                textDecoration:"none",
                color:"#111",
                background:"#fff"
              }}
            >

              <div style={{fontWeight:900}}>
                {product.name}
              </div>

              <div style={{
                fontSize:13,
                marginTop:6,
                color:"#666"
              }}>
                {product.description}
              </div>

              <div style={{
                marginTop:10,
                fontWeight:900,
                color:"#dc2626"
              }}>
                {product.price_text}
              </div>

              <div style={{
                marginTop:8,
                fontSize:12,
                color:"#666"
              }}>
                조회 {p.view_count}
              </div>

            </Link>

          )

        })}

      </div>

    </section>

  )

}
