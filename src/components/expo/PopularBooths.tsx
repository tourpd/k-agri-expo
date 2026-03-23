"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PopularBooths() {

  const [booths,setBooths] = useState<any[]>([]);

  useEffect(() => {

    fetch("/api/expo/popular-booths")
      .then(r => r.json())
      .then(d => {
        setBooths(d.booths || []);
      });

  },[]);

  return (

    <section style={{marginTop:40}}>

      <h2 style={{
        fontSize:22,
        fontWeight:900
      }}>
        🔥 오늘 가장 인기있는 부스
      </h2>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",
        gap:14,
        marginTop:14
      }}>

        {booths.map((b:any)=>{

          const booth = b.booths;

          return(

            <Link
              key={booth.booth_id}
              href={`/expo/booths/${booth.booth_id}`}
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
                {booth.name}
              </div>

              <div style={{
                fontSize:13,
                color:"#666",
                marginTop:6
              }}>
                {booth.region} · {booth.category_primary}
              </div>

              <div style={{
                marginTop:10,
                fontSize:12,
                color:"#dc2626",
                fontWeight:800
              }}>
                조회 {b.visit_count}
              </div>

            </Link>

          )

        })}

      </div>

    </section>

  )

}