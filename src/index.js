import * as babel from "@babel/core";

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
console.log(result.code);
