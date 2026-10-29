import fs from "fs";
import path from "path";

export function loadPV5Knowledge() {

  const root =
    path.join(
      process.cwd(),
      "data/mobility/kia/pv5"
    );

  if (!fs.existsSync(root))
    return "";

  let result = "";

  const walk = (dir:string) => {

    fs.readdirSync(dir).forEach(file=>{

      const p = path.join(dir,file);

      if(fs.statSync(p).isDirectory())
        walk(p);

      else
        result +=
          "\n\n"+
          fs.readFileSync(
            p,
            "utf8"
          );
    });
  };

  walk(root);

  return result;
}
