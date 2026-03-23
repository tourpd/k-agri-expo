"use client"

const lives = [
{
title:"영진 로타리 신제품 발표",
date:"3월 28일",
time:"20:00",
prize:"3,200만원"
},
{
title:"도프 신제품 발표",
date:"4월 3일",
time:"19:30",
prize:"1,200만원"
}
]

export default function LiveSchedule(){

return(

<section style={S.wrap}>

<h2 style={S.title}>
📺 라이브 추첨 방송
</h2>

<div style={S.grid}>

{lives.map((live,i)=>(
<div key={i} style={S.card}>

<div style={S.name}>
{live.title}
</div>

<div style={S.date}>
{live.date} {live.time}
</div>

<div style={S.prize}>
경품 {live.prize}
</div>

<button style={S.btn}>
라이브 알림 신청
</button>

</div>
))}

</div>

</section>

)

}

const S:any={

wrap:{},

title:{
fontSize:28,
fontWeight:900
},

grid:{
display:"grid",
gridTemplateColumns:"1fr 1fr",
gap:20,
marginTop:20
},

card:{
border:"1px solid #e5e7eb",
borderRadius:20,
padding:20
},

name:{
fontSize:20,
fontWeight:800
},

date:{
marginTop:6,
color:"#64748b"
},

prize:{
marginTop:6,
fontWeight:700
},

btn:{
marginTop:12,
padding:"10px 16px",
borderRadius:10,
border:"1px solid #e5e7eb",
cursor:"pointer"
}

}