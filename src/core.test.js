import { vi, test, expect } from 'vitest';
import { transform, aggressiveMinify } from './core.js';

test('benchmark #1', async () => {
  const code = `
  const fs = require('fs');
  const input = fs.readFileSync('/dev/stdin');
  console.log(input);
  `;

  const result = await transform(code);
  expect(() => new Function(result.code)).not.toThrow(SyntaxError);

  const terserResult = await aggressiveMinify(code);

  showResultInTable(result, terserResult);

  expect(result.code.length).toBeLessThan(terserResult.code.length);
});

test('benchmark #2', async () => {
  const code = `console.log([1, 2, 3, Math.random()].join(':'));`;

  const result = await transform(code);
  expect(() => new Function(result.code)).not.toThrow(SyntaxError);

  const terserResult = await aggressiveMinify(code);

  showResultInTable(result, terserResult);

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

  const terserResult = await aggressiveMinify(code);

  showResultInTable(result, terserResult);

  expect(result.code.length).toBeLessThan(terserResult.code.length);

  // TODO: refactor
  const origFn = vi.fn();
  const golfyFn = vi.fn();

  new Function('console', 'Math', code)({ log: origFn }, { random: () => 0.123456789 });
  new Function('console', 'Math', result.code)({ log: golfyFn }, { random: () => 0.123456789 });

  expect(origFn.mock.calls).toEqual(golfyFn.mock.calls);
});

function showResultInTable(golfyResult, compareResult) {
  console.table({
    golfy: {
      code: golfyResult.code,
      length: golfyResult.code.length,
    },
    compare: {
      code: compareResult.code,
      length: compareResult.code.length,
    },
  });

  const golfyLength = golfyResult.code.length;
  const compareLength = compareResult.code.length;
  const golfyEfficiency = ((compareLength - golfyLength) / compareLength) * 100;
  console.log(`~${golfyEfficiency.toFixed(2)}% shorter when using with golfy.`);
}
