/** @format */

import multi from '@rollup/plugin-multi-entry';

export default {
   input: 'test/**/*.test.js',
   output: {
      file: 'test/all.js',
      format: 'es',
   },
   external: ['tape'],
   plugins: [multi()],
};
