import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration } from '../src/hc-902.mjs';
test('formats singular and plural minutes', () => {
  assert.equal(formatDuration(1), '1 minute');
  assert.equal(formatDuration(0), '0 minutes');
  assert.equal(formatDuration(15), '15 minutes');
});
test('rejects negative, fractional and nonnumeric input', () => {
  for (const value of [-1, 1.5, '15', NaN]) assert.throws(() => formatDuration(value), TypeError);
});
