/** @format */

// read options
import options from './Options.js';
import express from 'express';
import Clients from './Clients.js';
import getIndexHtml from './Index.js';
import { ServerFunction, ClientMethod } from '../shared/Functions.js';
import Message from '../shared/Message.js';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.use('/', express.static(options.getProdPath()));

   server.get('/', (req, res) => {
      res.send(getIndexHtml());
   });

   // eslint-disable-next-line no-console
   console.log(`Listening on port ${options.getPort()}`);

   Clients.on(ServerFunction.Init, async (msg, client) => {
      return new Message.String(msg.data ? msg.data + ' ' + client.id : 'No data!');
   });
   Clients.on(ServerFunction.Click, async (msg) => {
      Clients.broadcast(ClientMethod.ClickFromClient, msg);
      return new Message.Boolean(true);
   });
});

Clients.init({ port: options.getPortWebSockets() });
