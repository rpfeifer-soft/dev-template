/** @format */

import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import multi from "@rollup/plugin-multi-entry";

export default {
   input: "test/**/*.test.js",
   output: {
      file: "test/all.js",
      format: "es",
   },
   external: ["tape", "ws", "util"],
   plugins: [multi(), resolve(), commonjs()],
};
