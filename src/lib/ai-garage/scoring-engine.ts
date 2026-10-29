export function scoreLife(profile:any){

  let score={
    travel:0,
    creator:0,
    camping:0,
    fishing:0,
    office:0,
    family:0
  };

  if(profile.travel) score.travel+=100;
  if(profile.creator) score.creator+=100;
  if(profile.camping) score.camping+=100;
  if(profile.fishing) score.fishing+=100;
  if(profile.office) score.office+=100;
  if(profile.couple) score.family+=80;

  return score;
}
