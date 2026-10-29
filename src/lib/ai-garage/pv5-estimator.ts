export function estimateCost(
  vehicle:string,
  modules:string[]
){

  let base = 55000000;

  if(vehicle.includes("Cargo"))
    base = 59000000;

  if(vehicle.includes("Openbed"))
    base = 52000000;

  const option =
    modules.length * 1200000;

  return {
    vehicle_price: base,
    option_price: option,
    total: base+option
  };
}
