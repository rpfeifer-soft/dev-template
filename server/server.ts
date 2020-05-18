/** @format */

// read options
import options from './options.js';
import express from 'express';
import path from 'path';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.get('/index.html', (req, res) => {
      res.sendFile(path.join(options.getProdPath(), './index.html'));
   });

   server.use('/', express.static(options.getProdPath()));

   // tslint:disable-next-line: no-console
   console.log(`Listening on port ${options.getPort()}`);
});
