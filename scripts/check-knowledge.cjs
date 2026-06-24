const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const envPath = path.join(process.cwd(), ".env.local");
const envText = fs.readFileSync(envPath, "utf8");

for (const line of envText.split("\n")) {
  const m = line.match(/^([^#=\s]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
);

(async () => {
  const { data, error } = await supabase
    .from("knowledge_page_index")
    .select("*")
    .limit(3);

  console.log("ERROR:");
  console.dir(error, { depth: null });

  console.log("\nROWS:");
  console.dir(data, { depth: null });

  if (data && data[0]) {
    console.log("\nCOLUMNS:");
    console.log(Object.keys(data[0]));
  }
})();
