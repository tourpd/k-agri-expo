"use client";

import {useState} from "react";

export default function AIRecommend(){

const [q,setQ] = useState("");
const [result,setResult] = useState<any>(null);

async function ask(){

const res = await fetch("/api/expo/ai-recommend",{
method:"POST",
body:JSON.stringify({question:q})
});

setResult(await res.json());

}

return(

<div>

<h3>AI 농자재 추천</h3>

<input
value={q}
onChange={(e)=>setQ(e.target.value)}
placeholder="예: 고추 잎이 말리는데"
 />

<button onClick={ask}>
추천 받기
</button>

{result && (

<div>

추천 제품

{result.products.map((p:any)=>(
<div key={p.id}>
{p.name}
</div>
))}

</div>

)}

</div>

)

}