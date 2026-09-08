import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import ts from 'typescript';
// Compile the standalone validator without requiring a new test dependency.
const source = await readFile('src/lib/article-publishing.ts', 'utf8');
await mkdir('.next/botly-tests', { recursive: true });
await writeFile('.next/botly-tests/article-publishing.mjs', ts.transpile(source, { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }));
const { articlePayloadSchema, readArticleBody, PayloadTooLarge, MAX_ARTICLE_BYTES } = await import('../.next/botly-tests/article-publishing.mjs');
const payload = { facebook_page_id: '123', facebook_post_id: '123_456', facebook_url: 'https://www.facebook.com/reel/456',
  translations: [{ locale: 'vi', slug: 'test', title: 'Title', description: 'Description',
    sections: [{ title: 'Section', paragraphs: ['Body'] }], status: 'published' }] };
assert(articlePayloadSchema.safeParse(payload).success);
assert(!articlePayloadSchema.safeParse({ ...payload, category_id: 'healing' }).success);
assert(!articlePayloadSchema.safeParse({ ...payload, facebook_url: 'https://facebook.com.evil.example/video' }).success);
assert(!articlePayloadSchema.safeParse({ ...payload, facebook_url: 'https://user:password@facebook.com/video' }).success);
assert(!articlePayloadSchema.safeParse({ ...payload, translations: [...payload.translations, ...payload.translations] }).success);
assert(!articlePayloadSchema.safeParse({ ...payload, cover_image_url: 'javascript:alert(1)' }).success);
const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify(payload) });
assert.deepEqual(await readArticleBody(request), payload);
await assert.rejects(readArticleBody(new Request('http://localhost', { method: 'POST', body: 'x'.repeat(MAX_ARTICLE_BYTES + 1) })), PayloadTooLarge);
await assert.rejects(readArticleBody(new Request('http://localhost', { method: 'POST', body: '{bad' })), SyntaxError);
console.log('Payload validation and streaming size-limit checks passed');
