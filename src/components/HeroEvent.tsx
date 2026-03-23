"use client"

export default function HeroEvent() {

  return (
    <section style={S.wrap}>

      <div style={S.left}>

        <div style={S.badge}>
          🔥 신제품 경품 이벤트
        </div>

        <h1 style={S.title}>
          영진 로타리 YJ-180
        </h1>

        <p style={S.desc}>
          3,200만원 상당 신제품 로터리  
          농민 대상 특별 경품 이벤트
        </p>

        <div style={S.counter}>
          응모자 5,432명
        </div>

        <button style={S.btn}>
          경품 응모하기
        </button>

      </div>

      <div style={S.right}>
        <img
          src="/sample_rotary.jpg"
          style={S.img}
        />
      </div>

    </section>
  )
}

const S: any = {

wrap:{
display:"grid",
gridTemplateColumns:"1.2fr 1fr",
gap:40,
padding:40,
borderRadius:30,
background:"#0f172a",
color:"white"
},

left:{},

badge:{
background:"#16a34a",
padding:"6px 12px",
borderRadius:20,
display:"inline-block",
fontWeight:700
},

title:{
fontSize:46,
fontWeight:900,
marginTop:12
},

desc:{
marginTop:10,
fontSize:18,
opacity:.9
},

counter:{
marginTop:20,
fontWeight:800,
fontSize:20
},

btn:{
marginTop:20,
padding:"14px 26px",
borderRadius:16,
border:"none",
background:"white",
fontWeight:800,
cursor:"pointer"
},

right:{},

img:{
width:"100%",
borderRadius:20
}

}