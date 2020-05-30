/** @format */

// read options
import options from './options.js';
import express from 'express';
import Clients from './Clients.js';
import wsTool from '../shared/wsTool.js';
import getIndexHtml from './index.js';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.use('/', express.static(options.getProdPath()));

   server.get('/', (req, res) => {
      res.send(getIndexHtml());
   });

   // tslint:disable-next-line: no-console
   console.log(`Listening on port ${options.getPort()} ${wsTool}`);
});

Clients.init({ port: options.getPortWebSockets() });
