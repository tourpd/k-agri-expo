"use client";

import { useState } from "react";

export default function ApplyPage() {

  const [name,setName]=useState("");
  const [phone,setPhone]=useState("");
  const [loading,setLoading]=useState(false);
  const [done,setDone]=useState(false);

  async function submit(){
    if(!name || !phone){
      alert("입력해주세요");
      return;
    }

    setLoading(true);

    await fetch("/api/booth-leads",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        farmer_name:name,
        farmer_phone:phone,
        source_type:"insect_farm_apply"
      })
    });

    setDone(true);
    setLoading(false);
  }

  return(
    <div style={{padding:20, maxWidth:600, margin:"0 auto"}}>

      <h1 style={{fontSize:26,fontWeight:900}}>
        🐛 고소애 농가 신청
      </h1>

      {done ? (
        <div style={{marginTop:20}}>
          신청 완료. 연락드립니다.
        </div>
      ) : (
        <>
          <input
            placeholder="이름"
            value={name}
            onChange={e=>setName(e.target.value)}
            style={{width:"100%",padding:12,marginTop:20}}
          />

          <input
            placeholder="전화번호"
            value={phone}
            onChange={e=>setPhone(e.target.value)}
            style={{width:"100%",padding:12,marginTop:10}}
          />

          <button
            onClick={submit}
            style={{
              width:"100%",
              padding:16,
              marginTop:20,
              background:"green",
              color:"white",
              fontWeight:900
            }}
          >
            {loading ? "처리중..." : "신청하기"}
          </button>
        </>
      )}

    </div>
  )
}