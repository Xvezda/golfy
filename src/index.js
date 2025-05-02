import parser from "@babel/parser";
import { inspect } from 'util';
import { transform } from './core.js';

const code = `
function debug(msg) {
  console.log("DEBUG:", msg);
}

function add(a, b) {
  return a + b;
}

function multiply(x, y) {
  var temp = 0;
  for (var i = 0; i < y; i++) {
    temp = add(temp, x);
  }
  return temp;
}

var unusedVar = 12345;

if (false) {
  debug("This will never run.");
}

var result = multiply(2, 3);
debug("Result is: " + result);

var obj = {
  foo: 1,
  bar: 2,
  baz: function () {
    return this.foo + this.bar;
  }
};

console.log(obj.baz());

// pointless computation
var x = 10 + 0;
var y = !!true;
`;

const ast = parser.parse(code);
// console.log(inspect(ast, { depth: null, colors: true }));

const result = await transform(code);
console.log(result.code);

new Function(result.code)();
