/** @format */

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH && !process.env.DEVENV;

export default {
   input: 'dist/client/index.js',
   output: {
      file: 'dist/prod/bundle.js',
      format: 'es',
   },
   plugins: [resolve(), commonjs(), production && terser()],
};
