/** @format */

import fs from 'fs';
import path from 'path';

export const copySettings = {
   BASE_URL: '',
};

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
         if (options.src.indexOf('index.html') != -1) {
            let content = fs.readFileSync(options.src, 'utf8');
            content = content.replace('%BASE_URL%', copySettings.BASE_URL);
            fs.writeFileSync(options.dest, content, 'utf8');
         } else {
            fs.writeFileSync(options.dest, fs.readFileSync(options.src));
         }
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
