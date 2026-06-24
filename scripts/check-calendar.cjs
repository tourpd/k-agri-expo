const fs = require("fs");
const { createClient } = require("@supabase/supabase-js");

const env = fs.readFileSync(".env.local","utf8");

const url =
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();

const key =
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(url, key);

(async () => {

  const { data, error } = await supabase
    .from("farm_calendar_actions")
    .select("*")
    .limit(3);

  console.log("ERROR:", error);
  console.log(JSON.stringify(data, null, 2));

})();
