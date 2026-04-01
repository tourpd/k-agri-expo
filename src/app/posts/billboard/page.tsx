export default function BillboardPage() {

  const products = [

    { rank:1, name:"싹쓰리충", tag:"총채벌레 해결 인기"},
    { rank:2, name:"멸규니", tag:"병해 예방 급상승"},
    { rank:3, name:"멀티피드", tag:"생육 회복 인기"},
    { rank:4, name:"켈팍", tag:"드론 방제 추천"},
    { rank:5, name:"칼슘제", tag:"비대 관리 상위"}

  ]

  return (

    <main className="min-h-screen bg-gray-50 p-10">

      <h1 className="text-3xl font-bold mb-10">

        농업 빌보드  
        이달의 베스트 상품

      </h1>

      <div className="space-y-4">

        {products.map(p => (

          <div
            key={p.rank}
            className="flex items-center bg-white p-5 rounded-xl shadow"
          >

            <div className="text-2xl font-bold w-10">

              {p.rank}

            </div>

            <div>

              <div className="font-bold">

                {p.name}

              </div>

              <div className="text-gray-500 text-sm">

                {p.tag}

              </div>

            </div>

          </div>

        ))}

      </div>

    </main>

  )

}