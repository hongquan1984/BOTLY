import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import ts from 'typescript';

await mkdir('.next/botly-tests', { recursive: true });
const compile = source => ts.transpile(source, { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 });
await writeFile('.next/botly-tests/article-publishing.mjs', compile(await readFile('src/lib/article-publishing.ts', 'utf8')));
const route = (await readFile('src/app/api/v1/articles/route.ts', 'utf8'))
  .replace("'@/lib/article-publishing'", "'./article-publishing.mjs'")
  .replace("'@/lib/supabase-server'", "'./supabase-stub.mjs'")
  .replace("'@/data/wellness-articles'", "'./legacy-stub.mjs'");
await writeFile('.next/botly-tests/route.mjs', compile(route));
await writeFile('.next/botly-tests/legacy-stub.mjs', 'export const wellnessArticles = [{locale:"vi",slug:"reserved-guide"}];');
await writeFile('.next/botly-tests/supabase-stub.mjs', `
export let configured = true;
export let result = {ok:true,action:'created',translations:[{locale:'vi',slug:'test'}]};
export let status = 200;
export let calls = [];
export function configure(value) { configured = value; }
export function respond(value, code) { result=value; status=code; }
export function supabaseConfig() { return configured ? {} : null; }
export async function supabaseRequest(path, init, admin) {
  calls.push({path, body:JSON.parse(init.body), admin});
  return Response.json(result,{status});
}`);
const db = await import('../.next/botly-tests/supabase-stub.mjs');
const { POST } = await import('../.next/botly-tests/route.mjs');
process.env.NEXT_PUBLIC_SITE_URL = 'https://botly.example';
const token = `botly_${'a'.repeat(43)}`;
const payload = { facebook_page_id: '123', facebook_post_id: '123_456', facebook_url: 'https://www.facebook.com/reel/456',
  translations: [{locale:'vi',slug:'test',title:'Title',description:'Description',sections:[{title:'S',paragraphs:['B']}],status:'published'}] };
const request = (body = payload, auth = `Bearer ${token}`, type = 'application/json') => new Request('http://localhost/api/v1/articles', {
  method:'POST', headers:{Authorization:auth,'Content-Type':type}, body:typeof body === 'string' ? body : JSON.stringify(body),
});
assert.equal((await POST(request(payload, ''))).status, 401);
assert.equal((await POST(request(payload, `Bearer ${token}`, 'text/plain'))).status, 415);
assert.equal((await POST(request('{bad'))).status, 400);
assert.equal((await POST(request('x'.repeat(524289)))).status, 413);
assert.equal((await POST(request({...payload, category_id:'healing'}))).status, 422);
assert.equal(db.calls.length, 0);
db.configure(false);
assert.equal((await POST(request())).status, 503);
db.configure(true);
const created = await POST(request());
assert.equal(created.status, 201);
const result = await created.json();
assert.equal(result.translations[0].url, 'https://botly.example/vi/song-khoe/huong-dan/test');
assert.match(db.calls[0].body.p_token_hash, /^[a-f0-9]{64}$/);
assert(!JSON.stringify(db.calls).includes(token));
db.respond({ok:true,action:'updated',translations:[]},200);
assert.equal((await POST(request())).status, 200);
for (const [code,status] of Object.entries({UNAUTHORIZED:401,CHANNEL_FORBIDDEN:403,SLUG_CONFLICT:409,SLUG_IMMUTABLE:409,
  PUBLICATION_TIME_IMMUTABLE:409,INVALID_PUBLICATION_STATUS:422,RATE_LIMITED:429})) {
  db.respond({message:code},400);
  const response = await POST(request());
  assert.equal(response.status,status);
  if(status===429) assert.equal(response.headers.get('retry-after'),'60');
}
console.log('API authentication, validation, hashing, response URLs and error mapping passed (database stub)');
