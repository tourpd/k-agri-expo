export function selectVehicles(profile:any){

  const designs=[];

  if(profile.creator){

    designs.push({
      title:"Creator Nomad",
      vehicle:"PV5 Cargo High Roof"
    });

    designs.push({
      title:"Travel Creator",
      vehicle:"PV5 Passenger"
    });
  }

  if(profile.camping){

    designs.push({
      title:"Camping Explorer",
      vehicle:"PV5 Cargo"
    });
  }

  if(profile.fishing){

    designs.push({
      title:"Fishing Adventure",
      vehicle:"PV5 Openbed"
    });
  }

  return designs.slice(0,3);
}
