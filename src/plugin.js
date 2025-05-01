// @ts-check
import { generateShortUniqueName } from "./utils.js";

/**
 * @param {import('@babel/core')} babel
 * @returns {import('@babel/core').PluginObj}
 */
export default function golfyPlugin({ types: t }) {
  let shortUniqueNameGenerator;
  let funcRefCounter;

  return {
    pre: (_state) => {
      // Initialize the short unique name generator
      shortUniqueNameGenerator = generateShortUniqueName();
      funcRefCounter = new Map();
    },
    visitor: {
      CallExpression(path) {
        // Replace read stdio with numeric fds
        if (
          path.node.callee.type === "MemberExpression" &&
          path.node.callee.property.type === "Identifier"
        ) {
          if (path.node.callee.property.name === "readFileSync" ||
              path.node.callee.property.name === "readFile"
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

          if (path.node.callee.property.name === "toString") {
            if (path.node.arguments.length === 0) {
              path.replaceWith(
                t.templateLiteral(
                  [
                    t.templateElement({ raw: '', cooked: '' }),
                    t.templateElement({ raw: '', cooked: '' })
                  ],
                  [t.cloneNode(path.node.callee.object)]
                )
              );
              path.skip();
              return;
            }
          }

          if (path.node.callee.property.name === "join") {
            if (path.node.arguments.length === 1 && 
                path.node.arguments[0].type === "StringLiteral") {
              path.replaceWith(
                t.taggedTemplateExpression(
                  t.memberExpression(
                    path.node.callee.object,
                    t.identifier("join")
                  ),
                  t.templateLiteral(
                    [
                      t.templateElement({
                        raw: path.node.arguments[0].value,
                        cooked: path.node.arguments[0].value
                      })
                    ],
                    []
                  )
                )
              );
              path.skip();
              return;
            }
          }
        }

        // inlining
        Object.entries(path.scope.bindings).forEach(([_name, binding]) => {
          const declarator = binding.path.find((p) => p.isVariableDeclarator());
          const count = binding.references;
          if (count === 1) {
            if (
              declarator &&
              declarator.node.type === "VariableDeclarator" &&
              declarator.node.init
            ) {
              binding.referencePaths[0].replaceWith(declarator.node.init);
              declarator.remove();
              path.skip();
            }
          }
        });

        // TODO: assign function to variable and call
        const functionName = path.getSource().split('(')[0].trim();
        if (funcRefCounter.has(functionName)) {
          funcRefCounter.set(functionName, funcRefCounter.get(functionName) + 1);
        } else {
          funcRefCounter.set(functionName, 1);
        }
        // console.log(`Function ${functionName} has been referenced ${funcRefCounter.get(functionName)} times`);
        /*
        if (funcRefCounter.get(functionName) > 1) {
          const newName = shortUniqueNameGenerator.next().value;
          if (newName === undefined) {
            throw new Error("No more unique names available");
          }
          if (functionName.includes('.')) {  // MemberExpression
            const [objectName, methodName] = functionName.split('.');
            const binding = path.scope.getBinding(methodName);
            if (binding) {
              binding.path.replaceWith(
                t.memberExpression(
                  t.identifier(newName),
                  t.identifier(methodName)
                )
              );
            }
          }
        }
        */
      },
      VariableDeclarator(path) {
        if (path.node.id.type === "Identifier") {
          const binding = path.scope.getBinding(path.node.id.name);
          if (binding) {
            const count = binding.references +
              (path.parent.type === "VariableDeclaration" && path.parent.kind === 'const'
                ? 0
                : binding.constantViolations.length);

            switch (count) {
              case 0:
                path.remove();
                path.skip();
                return;
              case 1: {
                // inlining
                const parent = binding.referencePaths[0].parent;
                if (!path.node.init) return;
                switch (parent.type) {
                  case "MemberExpression":
                    parent.object = t.cloneNode(path.node.init);
                    path.remove();
                    path.skip();
                    return;
                  default:
                    break;
                }
              }
              default:
                if (Object.keys(path.scope.getAllBindings()).length > 0) {
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
                // Replace declaration with just assignments
                // i.e. const a = 1; => a = 1;
                if (count > 1 && path.node.init) {
                  path.parentPath.replaceWith(
                    t.expressionStatement(
                      t.assignmentExpression(
                        '=',
                        path.node.id,
                        path.node.init
                      )
                    )
                  );
                }
                break;
            }
          }
        }
      },
      WhileStatement(path) {
        if (path.node.test.type === "BooleanLiteral" && path.node.test.value === true) {
          path.replaceWith(t.forStatement(null, null, null, path.node.body));
          path.skip();
        }
      },
      BooleanLiteral: {
        exit(path) {
          if (path.node.value === true) {
            path.replaceWithSourceString('!0');
            path.skip();
          }

          if (path.node.value === false) {
            path.replaceWithSourceString('!1');
            path.skip();
          }
        }
      },
    },
  };
};
