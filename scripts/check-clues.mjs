import fs from "fs";

const dotenv = fs.readFileSync("d:/botly/.env.local", "utf8");
const env = {};
dotenv.split(/\r?\n/).forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim().replace(/^['"]|['"]$/g, "");
});
const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;

async function run() {
  const res = await fetch(url + "/rest/v1/healthclues_knowledge_clues?select=clue_id,version,topic_key,chapter_id,title,published,review_status,reviewed_by", {
    headers: {
      apikey: key,
      Authorization: "Bearer " + key
    }
  });
  const clues = await res.json();
  console.log("Total clues in DB:", Array.isArray(clues) ? clues.length : clues);
  if (Array.isArray(clues)) {
    clues.forEach(c => console.log(c.clue_id, "|", c.topic_key, "|", c.title, "| published:", c.published, "| review:", c.review_status, "| reviewer:", c.reviewed_by));
  }
}

run().catch(console.error);
