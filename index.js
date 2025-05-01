import parser from "@babel/parser";
import { generate } from "@babel/generator";
import { createRequire } from "module";
import * as t from "@babel/types";

const require = createRequire(import.meta.url);
const _traverse = require("@babel/traverse");
const traverse = _traverse.default;

const code = `
const fs = require('fs');
const input = fs.readFileSync('/dev/stdin');
console.log(input);
`;

const ast = parser.parse(code);

// a, b, c ..., aa, bb, cc, ..., Aa, Ab, Ac, ..., aA, aB, aC, ..., zA, zB, zC, ..., a1, b1, c1, ...
function *generateShortUniqueName() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let index = 0;
  let length = 1;

  while (true) {
    let name = '';
    let tempIndex = index;

    for (let i = 0; i < length; i++) {
      name += alphabet[tempIndex % alphabet.length];
      tempIndex = Math.floor(tempIndex / alphabet.length);
    }

    yield name;

    index++;

    if (index === Math.pow(alphabet.length, length)) {
      index = 0;
      length++;
    }
  }
}
const shortUniqueNameGenerator = generateShortUniqueName();

traverse(ast, {
  CallExpression(path) {
    // Replace read stdio with numeric fds
    if (
      path.node.callee.type === "MemberExpression" &&
      (path.node.callee.property.name === "readFileSync" || path.node.callee.property.name === "readFile")
    ) {
      if (path.node.arguments[0].type === "StringLiteral") {
        switch (path.node.arguments[0].value) {
          case '/dev/stdin':
            path.node.arguments[0] = t.numericLiteral(0);
            break;
          case '/dev/stdout':
            path.node.arguments[0] = t.numericLiteral(1);
            break;
          case '/dev/stderr':
            path.node.arguments[0] = t.numericLiteral(2);
            break;
          default:
            break;
        }
        path.skip();
        return;
      }
    }
  },
  VariableDeclarator(path) {
    const binding = path.scope.getBinding(path.node.id.name);
    if (binding.references === 0) {
      path.remove();
      return;
    }

    // Inline if it is a single reference
    if (binding.references === 1) {
      const parent = binding.referencePaths[0].parent;
      switch (parent.type) {
        case "MemberExpression":
          parent.object = path.node.init;
          path.remove();
          path.skip();
          return;
      }
    }

    // Replace with short unique names
    if (path.node.id.type === "Identifier") {
      path.scope.rename(path.node.id.name, shortUniqueNameGenerator.next().value);
    }
  },
});

const output = generate(ast, { minified: true }, code);

console.log(output.code);
