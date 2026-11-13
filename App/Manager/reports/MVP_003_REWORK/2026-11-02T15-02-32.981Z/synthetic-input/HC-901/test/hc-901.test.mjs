import test from 'node:test';
import assert from 'node:assert/strict';
import { toSlug } from '../src/hc-901.mjs';
test('normalizes basic text', () => assert.equal(toSlug('Hello World'), 'hello-world'));
test('maps ampersand and collapses separators', () => assert.equal(toSlug('A & B---C'), 'a-and-b-c'));
test('preserves Unicode letters', () => assert.equal(toSlug('Crème brûlée'), 'crème-brûlée'));
test('normalizes compatibility characters', () => assert.equal(toSlug('Ｆｏｏ Bar'), 'foo-bar'));
test('blank input becomes empty', () => assert.equal(toSlug('  	 '), ''));
