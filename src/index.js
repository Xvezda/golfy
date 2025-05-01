import * as babel from "@babel/core";
import parser from "@babel/parser";
import { inspect } from 'util';

const code = `
console.log(foo.toString());
`;

const ast = parser.parse(code);
console.log(inspect(ast, { depth: null, colors: true }));

const result = await babel.transformAsync(code, {
  plugins: ['./src/plugin'],
  minified: true,
});
console.log(result.code);
