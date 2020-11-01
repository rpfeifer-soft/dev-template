/** @format */

import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import commonjs from '@rollup/plugin-commonjs';
import externalGlobals from 'rollup-plugin-external-globals';
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
   plugins: [
      externalGlobals({
         './TextEncoder.js': 'TextEncoder',
         './TextDecoder.js': 'TextDecoder',
      }),
      resolve(),
      replace({
         'process.env.NODE_ENV': production ? "'production'" : "'debug'",
      }),
      commonjs(),
      production && terser(),
   ],
};
