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
    name: 'golfy-plugin',
    pre: (_state) => {
      // Initialize the short unique name generator
      shortUniqueNameGenerator = generateShortUniqueName();
      funcRefCounter = new Map();
    },
    visitor: {
      CallExpression(path) {
        // Find any method calls such as `foo.bar()`
        if (
          path.node.callee.type === "MemberExpression" &&
          path.node.callee.property.type === "Identifier"
        ) {
          // `.readFileSync()` or `.readFile()`
          if (path.node.callee.property.name === "readFileSync" ||
              path.node.callee.property.name === "readFile"
          ) {
            // Replace read stdio with numeric fds
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

          // Replace `foo.toString()` with ``${foo}``
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

          // Replace `.join(',')` or `.split(',')` with `.join`,`` and `.split`,``
          if (
            path.node.callee.property.name === "join" ||
            path.node.callee.property.name === "split"
          ) {
            if (path.node.arguments.length === 1 && 
                path.node.arguments[0].type === "StringLiteral") {
              path.replaceWith(
                t.taggedTemplateExpression(
                  t.memberExpression(
                    path.node.callee.object,
                    t.identifier(path.node.callee.property.name)
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

        // If there is `foo()` and `foo` is a variable which referenced only once,
        // inline initialization part of `foo` and remove the variable
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
            // if (binding.references + binding.constantViolations.length === 0) {
            //   path.remove();
            //   path.skip();
            //   return;
            // }

            if (path.parent.type === "VariableDeclaration") {
              // Replace `const a = foo(); a.bar();` to `foo().bar();`
              if (
                path.node.init &&
                path.parent.kind === 'const' &&
                binding.references === 1
              ) {
                switch (binding.referencePaths[0].parent.type) {
                  case 'MemberExpression':
                    binding.referencePaths[0].parent.object = path.node.init;
                    path.remove();
                    path.skip();
                    return;
                }
              }

              // Find lazy initializations with single assignment
              if (
                path.parent.kind !== 'const' &&
                path.node.init === null &&
                binding.constantViolations.length === 1 &&
                binding.constantViolations[0].node.type === "AssignmentExpression" &&
                binding.constantViolations[0].node.operator === "="
              ) {
                // If variable referenced only once,
                // inline it, remove declaration and assignment.
                if (binding.references === 1) {
                  binding.referencePaths[0].replaceWith(
                    binding.constantViolations[0].node.right
                  );
                  binding.constantViolations[0].remove();
                  path.remove();
                  path.skip();
                  return;
                }
              }
            }

            if (Object.keys(path.scope.bindings).length > 0) {
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

            // Replace variable declaration with assignment which did not inlined
            if (path.node.init && binding.references + binding.constantViolations.length > 1) {
              path.parentPath.replaceWith(
                t.assignmentExpression(
                  '=',
                  t.cloneNode(path.node.id),
                  t.cloneNode(path.node.init)
                )
              );
            }
          }
        }
      },
      WhileStatement(path) {
        // Find `while (true)` and replace it with `for (;;)`
        if (path.node.test.type === "BooleanLiteral" && path.node.test.value === true) {
          path.replaceWith(t.forStatement(null, null, null, path.node.body));
          path.skip();
        }
      },
    },
  };
};
