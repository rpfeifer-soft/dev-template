/** @format */

// read options
import express from 'express';
import { options } from './Options.js';
import { clients } from './Clients.js';
import { index } from './Index.js';
import { connectionState } from './modules/ConnectionState.js';
import { userLogin } from './modules/UserLogin.js';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.use('/', express.static(options.getProdPath()));

   server.get('/', (req, res) => {
      res.send(index());
   });

   // eslint-disable-next-line no-console
   console.log(`Listening on port ${options.getPort()}`);

   // Connection state module
   connectionState();
   userLogin();
});

clients.init({ port: options.getPortWebSockets() });
