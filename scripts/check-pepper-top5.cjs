const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(".env.local","utf8");

const url =
 env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();

const key =
 env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(url,key);

(async()=>{

 const { data } = await supabase
   .from("farm_calendar_actions")
   .select("*")
   .eq("crop","고추")
   .order("importance_score",{ascending:false})
   .limit(5);

 console.log(JSON.stringify(data,null,2));

})();
