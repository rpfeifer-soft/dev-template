/** @format */

import fs from 'fs';
import path from 'path';

const copyPlugin = function (options) {
   return {
      load() {
         this.addWatchFile(options.src);
      },
      generateBundle() {
         const destDir = path.dirname(options.dest);
         if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
         }
         fs.writeFileSync(options.dest, fs.readFileSync(options.src));
      },
   };
};

export default {
   input: 'dist/client/index.js',
   output: {
      file: 'dist/prod/bundle.js',
      format: 'es',
   },
   plugins: [copyPlugin({ src: 'src/server/index.html', dest: 'dist/prod/index.html' })],
};
