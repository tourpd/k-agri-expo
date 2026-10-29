export function createLayout(design:any){

  if(design.vehicle==="PV5 Cargo High Roof"){

    return {
      inside_length:3100,
      inside_width:1565,
      inside_height:1815,

      zones:[
        {
          name:"촬영데스크",
          x:0,
          y:0,
          width:800,
          length:900
        },

        {
          name:"수납",
          x:800,
          y:0,
          width:500,
          length:900
        },

        {
          name:"침대",
          x:0,
          y:1000,
          width:1200,
          length:1900
        },

        {
          name:"낚시장비",
          x:1200,
          y:1000,
          width:300,
          length:1200
        }
      ]
    };
  }

  return null;
}
