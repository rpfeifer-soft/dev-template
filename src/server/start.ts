/** @format */

// read options
import options from './Options.js';
import express from 'express';
import Clients from './Clients.js';
import getIndexHtml from './Index.js';
import connectionState from './modules/ConnectionState.js';
import userLogin from './modules/UserLogin.js';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.use('/', express.static(options.getProdPath()));

   server.get('/', (req, res) => {
      res.send(getIndexHtml());
   });

   // eslint-disable-next-line no-console
   console.log(`Listening on port ${options.getPort()}`);

   // Connection state module
   connectionState();
   userLogin();
});

Clients.init({ port: options.getPortWebSockets() });
