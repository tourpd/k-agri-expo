export default function BoothLive({videoId}:{videoId:string}){

return(

<div style={{
border:"1px solid #eee",
borderRadius:12,
overflow:"hidden"
}}>

<iframe
width="100%"
height="360"
src={`https://www.youtube.com/embed/${videoId}`}
allowFullScreen
/>

</div>

)

}