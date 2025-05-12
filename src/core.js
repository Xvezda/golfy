import * as babel from "@babel/core";
import { minify } from 'terser';

export async function transform(code, options = {}) {
  Object.assign(options, {
    useTerser: true,
  });

  let result;

  // result = await terserMinify(code);

  result = await babel.transformAsync(code, {
    plugins: ['./src/plugin'],
    minified: true,
  });

  if (options.useTerser) {
    result = await terserMinify(result.code);
  }

  return result;
}

export async function terserMinify(code) {
  return await minify(code, {
    compress: {
      arrows: true,
      booleans_as_integers: true,
      collapse_vars: true,
      comparisons: true,
      computed_props: true,
      conditionals: true,
      dead_code: true,
      evaluate: true,
      hoist_funs: true,
      hoist_props: true,
      hoist_vars: true,
      if_return: true,
      inline: true,
      join_vars: true,
      keep_fargs: false,
      keep_infinity: false,
      loops: true,
      passes: 3,
      reduce_funcs: true,
      reduce_vars: true,
      sequences: true,
      side_effects: true,
      switches: true,
      toplevel: true,
      typeofs: true,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_comps: true,
      unsafe_Function: true,
      unsafe_math: true,
      unsafe_symbols: true,
      unsafe_methods: true,
      unsafe_proto: true,
      unsafe_regexp: true,
      unsafe_undefined: true,
      unused: true,
    },
    mangle: {
      toplevel: true,
      properties: {
        regex: /.+/,
      }
    },
    format: {
      semicolons: false,
      comments: false
    }
  });
}
