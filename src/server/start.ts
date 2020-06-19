/** @format */

// read options
import express from 'express';
import { options } from './options.js';
import { clients } from './clients.js';
import { index } from './index.js';
import { connectionState } from './env/connectionState.js';
import { userLogin } from './env/userLogin.js';

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
