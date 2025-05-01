// @ts-check

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

/**
 * @param {import('@babel/core')} babel
 * @returns {import('@babel/core').PluginObj}
 */
export default function golfyPlugin({ types: t }) {
  return {
    visitor: {
      CallExpression(path) {
        // Replace read stdio with numeric fds
        if (
          path.node.callee.type === "MemberExpression" &&
          path.node.callee.property.type === "Identifier" &&
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
        if (path.node.id.type === "Identifier") {
          const binding = path.scope.getBinding(path.node.id.name);
          if (binding) {
            switch (binding.references) {
              case 0:
                path.remove();
                return;
              case 1: {
                const parent = binding.referencePaths[0].parent;
                if (!path.node.init) return;
                switch (parent.type) {
                  case "MemberExpression":
                    parent.object = path.node.init;
                    path.remove();
                    path.skip();
                    return;
                  default:
                    break;
                }
              }
              default:
                break;
            }
          }

          // Replace with short unique names
          let newName;
          do {
            newName = shortUniqueNameGenerator.next().value;
            if (newName === undefined) {
              throw new Error("No more unique names available");
            }
          } while (path.scope.hasBinding(newName));

          path.scope.rename(path.node.id.name, newName);
        }
      },
    },
  };
};
