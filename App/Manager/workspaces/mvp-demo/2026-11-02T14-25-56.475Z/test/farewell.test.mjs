import test from 'node:test';
import assert from 'node:assert/strict';
import { farewell } from '../src/farewell.mjs';
test('farewell returns the required message', () => assert.equal(farewell('Ada'), 'Goodbye, Ada!'));
