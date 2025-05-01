import * as babel from "@babel/core";

const code = `
const fs = require('fs');
const input = fs.readFileSync('/dev/stdin');
console.log(input);
`;

const result = await babel.transformAsync(code, {
  plugins: ['./src/plugin'],
  minified: true,
});
console.log(result.code);
