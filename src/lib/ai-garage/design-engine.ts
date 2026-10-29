export function createDesigns(score:any){

  return [

    {
      id:"A",
      name:"Creator Touring Couple",

      vehicle:
        score.creator>50
          ? "PV5 Cargo High Roof"
          : "PV5 Passenger",

      why:[
        "부부 여행",
        "유튜브 촬영",
        "차박",
        "장거리 이동"
      ],

      spaces:[
        "촬영데스크",
        "침대",
        "수납",
        "냉장공간"
      ]
    },

    {
      id:"B",
      name:"Explorer Fishing",

      vehicle:
        score.fishing>50
          ? "PV5 Openbed"
          : "PV5 Cargo",

      why:[
        "낚시",
        "차박",
        "야외활동"
      ],

      spaces:[
        "낚시장비",
        "침대",
        "수납"
      ]
    },

    {
      id:"C",
      name:"Mobile Office Nomad",

      vehicle:"PV5 Passenger",

      why:[
        "업무",
        "여행",
        "생활"
      ],

      spaces:[
        "업무데스크",
        "침대",
        "회의공간"
      ]
    }
  ];
}
