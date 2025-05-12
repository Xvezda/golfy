import { expect, test, describe } from 'vitest';
import * as babel from "@babel/core";

describe('inlining', () => {
  test('inline when referenced once', async () => {
    const code = `
    const fs = require('fs');
    const input = fs.readFileSync('/dev/stdin');
    console.log(input);
    `;

    const result = await transform(code);

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

    const result = await transform(code);

    expect(result.code).toMatchInlineSnapshot(`
      "a=require("fs").readFileSync(0);a+=\"a\";a+=\"b\";"
    `);
  });
});

test('while true to for loop', async () => {
  const code = `
    while (true);
    `;

  const result = await transform(code);

  expect(result.code).toMatchInlineSnapshot(`
    "for(;;);"
  `);
});

test('toString to template literal', async () => {
  const code = `console.log(foo.toString());`;

  const result = await transform(code);

  expect(result.code).toMatchInlineSnapshot(`
    "console.log(\`\${foo}\`);"
  `);
});

describe('tagged template tricks', () => {
  test('join', async () => {
    const code = `
      console.log([1, 2, 3].join(':'));
    `;

    const result = await transform(code);

    expect(result.code).toMatchInlineSnapshot(`
      "console.log([1,2,3].join\`:\`);"
    `);
  });

  test('split', async () => {
    const code = `
      console.log('1:2:3'.split(':'));
    `;

    const result = await transform(code);

    expect(result.code).toMatchInlineSnapshot(`
      "console.log(\"1:2:3\".split\`:\`);"
    `);
  });
});

describe('newline character escape in string as-is', () => {
  test('string literal', async () => {
    const code = `
      console.log('\\n');
    `;

    const result = await transform(code);

    expect(result.code).toMatchInlineSnapshot(`
      "console.log(\`\n\`);"
    `);
  });

  test('template literal', async () => {
    const code = `
      console.log(\`\\n\`);
    `;

    const result = await transform(code);

    expect(result.code).toMatchInlineSnapshot(`
      "console.log(\`\n\`);"
    `);
  });
});

async function transform(code) {
  return await babel.transformAsync(code, {
    plugins: ['./src/plugin'],
    minified: true,
  });
}
