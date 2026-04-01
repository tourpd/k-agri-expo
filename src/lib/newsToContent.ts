export function convertNewsToContent(news:any[]) {

  return news.map((n)=>{

    let hook = ""

    if(n.title.includes("총채벌레"))
      hook = "총채벌레 방제 타이밍 놓치면 생기는 일"

    else if(n.title.includes("노균병"))
      hook = "고추 노균병 방제 늦으면 벌어지는 일"

    else if(n.title.includes("비대"))
      hook = "양파 비대 실패하는 농가 특징"

    else
      hook = "지금 농가에서 가장 많이 묻는 질문"

    return {
      title: hook,
      source: n.source,
      original: n.title,
      summary: n.summary
    }

  })

}