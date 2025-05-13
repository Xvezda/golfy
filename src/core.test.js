import { vi, test, expect } from 'vitest';
import { transform, terserMinify } from './core.js';

test('benchmark #1', async () => {
  const code = `
  const fs = require('fs');
  const input = fs.readFileSync('/dev/stdin');
  console.log(input);
  `;

  const result = await transform(code);
  expect(() => new Function(result.code)).not.toThrow(SyntaxError);

  const terserResult = await terserMinify(code);

  showResultInTable(code, terserResult.code, result.code);

  expect(result.code.length).toBeLessThan(terserResult.code.length);
});

test('benchmark #2', async () => {
  const code = `console.log([1, 2, 3, Math.random()].join(':'));`;

  const result = await transform(code);
  expect(() => new Function(result.code)).not.toThrow(SyntaxError);

  const terserResult = await terserMinify(code);

  showResultInTable(code, terserResult.code, result.code);

  expect(result.code.length).toBeLessThan(terserResult.code.length);

  // TODO: refactor
  const origFn = vi.fn();
  const golfyFn = vi.fn();

  new Function('console', 'Math', code)({ log: origFn }, { random: () => 0.123456789 });
  new Function('console', 'Math', result.code)({ log: golfyFn }, { random: () => 0.123456789 });

  expect(origFn.mock.calls).toEqual(golfyFn.mock.calls);
});

test('benchmark #3', async () => {
  const code = `console.log('1:2:3'.split(':'));`;

  const result = await transform(code);
  expect(() => new Function(result.code)).not.toThrow(SyntaxError);

  const terserResult = await terserMinify(code);

  showResultInTable(code, terserResult.code, result.code);

  expect(result.code.length).toBeLessThan(terserResult.code.length);

  // TODO: refactor
  const origFn = vi.fn();
  const golfyFn = vi.fn();

  new Function('console', 'Math', code)({ log: origFn }, { random: () => 0.123456789 });
  new Function('console', 'Math', result.code)({ log: golfyFn }, { random: () => 0.123456789 });

  expect(origFn.mock.calls).toEqual(golfyFn.mock.calls);
});

/**
 * @param {string} original
 * @param {string} minified
 * @param {string} golfed
 */
function showResultInTable(original, minified, golfed) {
  const originalLength = original.length;
  const golfedLength = golfed.length;
  const minifiedLength = minified.length;

  console.table({
    original: {
      code: original,
      length: originalLength,
    },
    minified: {
      code: minified,
      length: minifiedLength,
    },
    golfed: {
      code: golfed,
      length: golfedLength,
    },
  });

  const minifiedEfficiency = ((originalLength - minifiedLength) / originalLength) * 100;
  const originalGolfyEfficiency = ((originalLength - golfedLength) / originalLength) * 100;
  const minifiedGolfyEfficiency = ((minifiedLength - golfedLength) / minifiedLength) * 100;

  console.log(`pure minified: ~${minifiedEfficiency.toFixed(2)}% (-${originalLength - minifiedLength}B)`);
  console.log(`minified vs golfy: ~${minifiedGolfyEfficiency.toFixed(2)}% (-${minifiedLength - golfedLength}B)`);
  console.log(`original vs golfy: ~${originalGolfyEfficiency.toFixed(2)}% (-${originalLength - golfedLength}B)`);
}
