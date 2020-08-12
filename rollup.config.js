/* eslint-disable node/no-unsupported-features/es-syntax */
import ts from '@wessberg/rollup-plugin-ts';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import filesize from 'rollup-plugin-filesize';
import {terser} from 'rollup-plugin-terser';

import pkg from './package.json';

const IS_TEST = process.env.NODE_ENV === 'test';

const output = [
  {
    file: pkg.main,
    format: 'cjs',
    exports: 'default',
  },
  {
    file: pkg.module,
    format: 'es',
    exports: 'default',
  },
];

if (IS_TEST) {
  output.forEach(outputItem => {
    outputItem.sourcemap = true;
  });
}

const config = {
  external: ['fs', 'path', 'util'],
  input: './src/index.ts',
  output,
  plugins: [
    resolve(),
    ts({
      /* options */
      tsconfig: IS_TEST ? 'tsconfig.test.json' : 'tsconfig.json',
    }),
    commonjs({
      include: ['node_modules/**'],
    }),
  ],
};

if (!IS_TEST) {
  config.plugins.push(
    terser({
      output: {
        comments: function (node, comment) {
          const text = comment.value;
          const type = comment.type;
          if (type === 'comment2') {
            // multiline comment
            return /@preserve|@license|@cc_on/i.test(text);
          }
        },
      },
    })
  );
  config.plugins.push(filesize());
}

export default config;
