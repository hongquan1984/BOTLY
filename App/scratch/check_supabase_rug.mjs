import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const runtimeConfig = JSON.parse(fs.readFileSync('D:/botly/App/.tmp/healthclues-owner-demo/owner-demo-runtime.json', 'utf8'));
const supabase = createClient(runtimeConfig.apiUrl, runtimeConfig.secretKey);

async function checkCatalog() {
  const { data, error } = await supabase.from('healthclues_wellness_home_catalog').select('*').eq('id', 'bedroom_rug');
  if (error) {
    console.error('Supabase error:', error);
  } else {
    console.log('bedroom_rug in DB:', data);
  }
}

checkCatalog();
