import test from 'node:test';
import assert from 'node:assert/strict';
import { greet } from '../src/greeting.mjs';
test('greet returns the required greeting', () => assert.equal(greet('Ada'), 'Hello, Ada!'));
