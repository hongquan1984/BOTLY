import { readFileSync } from "node:fs";

async function checkCatalog() {
  const runtime = JSON.parse(readFileSync("d:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json", "utf8"));
  const res = await fetch(runtime.apiUrl + "/rest/v1/healthclues_catalog_items?select=id,slug,item_type,slot_key,current_version,review_status,active", {
    headers: { apikey: runtime.secretKey, Authorization: "Bearer " + runtime.secretKey }
  });
  const rows = await res.json();
  console.log("Total catalog items:", rows.length);
  console.log("Items by item_type:", rows.map(r => ({ slug: r.slug, type: r.item_type, slot: r.slot_key, active: r.active, review: r.review_status })));
}

checkCatalog().catch(console.error);
