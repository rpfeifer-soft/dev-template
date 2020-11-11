/** @format */

import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import commonjs from "@rollup/plugin-commonjs";
import externalGlobals from "rollup-plugin-external-globals";
import { terser } from "rollup-plugin-terser";
import sourcemaps from "rollup-plugin-sourcemaps";

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH && !process.env.DEVENV;

export default [
   {
      input: "dist/client/index.js",
      output: {
         file: "dist/prod/bundle.js",
         format: "es",
      },
      plugins: [
         externalGlobals({
            "./TextEncoder.js": "TextEncoder",
            "./TextDecoder.js": "TextDecoder",
            react: "React",
            "react-dom": "ReactDOM",
         }),
         resolve(),
         replace({
            "process.env.NODE_ENV": production ? "'production'" : "'debug'",
         }),
         commonjs(),
         production && terser(),
      ],
   },
   {
      input: "dist/server/start.js",
      output: {
         file: "dist/server/bundle.js",
         format: "es",
      },
      external: ["fs", "express", "ws"],
      plugins: [
         externalGlobals({
            "./TextEncoder.js": "TextEncoder",
            "./TextDecoder.js": "TextDecoder",
         }),
         sourcemaps(),
         resolve({
            preferBuiltins: false,
         }),
         replace({
            "process.env.NODE_ENV": production ? "'production'" : "'debug'",
         }),
         commonjs(),
         production && terser(),
      ],
   },
];
