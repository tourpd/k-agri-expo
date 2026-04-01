import { NextResponse } from "next/server"

function calculateKelpak(area:number){

  // 1000평 기준
  const water = area / 50
  const kelpak = water * 40

  return {
    water,
    kelpak
  }

}

export async function POST(req:Request){

  const {question} = await req.json()

  if(question.includes("켈팍")){

    const area = 1000

    const calc = calculateKelpak(area)

    return NextResponse.json({

      answer:`${area}평 기준

드론 방제 20리터 기준

켈팍
40ml × ${calc.water}통

총 필요량
${calc.kelpak}ml 입니다.`,

      product:"켈팍",

      productLink:"/booth/dof"

    })

  }

  if(question.includes("멀티피드")){

    return NextResponse.json({

      answer:`멀티피드는 보통

500배 희석
10일 간격 사용

100평 기준
20리터 물에
40g 사용합니다.`,

      product:"멀티피드",

      productLink:"/booth/dof"

    })

  }

  return NextResponse.json({

    answer:"질문을 더 구체적으로 입력해주세요."

  })

}