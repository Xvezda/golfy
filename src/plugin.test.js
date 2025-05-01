import { expect, test, describe } from 'vitest';
import * as babel from "@babel/core";

describe('inlining', () => {
  test('inline when referenced once', async () => {
    const code = `
    const fs = require('fs');
    const input = fs.readFileSync('/dev/stdin');
    console.log(input);
    `;

    const result = await babel.transformAsync(code, {
      plugins: ['./src/plugin'],
      minified: true,
    });

    expect(result.code).toMatchInlineSnapshot(`
      "console.log(require("fs").readFileSync(0));"
    `);
  });

  test('do not inline when referenced multiple times', async () => {
    const code = `
    const fs = require('fs');
    var input = fs.readFileSync('/dev/stdin');
    input += 'a';
    input += 'b';
    `;

    const result = await babel.transformAsync(code, {
      plugins: ['./src/plugin'],
      minified: true,
    });

    expect(result.code).toMatchInlineSnapshot(`
      "a=require("fs").readFileSync(0);a+=\"a\";a+=\"b\";"
    `);
  });
});

test('while true to for loop', async () => {
  const code = `
    while (true);
    `;

  const result = await babel.transformAsync(code, {
    plugins: ['./src/plugin'],
    minified: true,
  });

  expect(result.code).toMatchInlineSnapshot(`
    "for(;;);"
  `);
});
