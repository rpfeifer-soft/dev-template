/** @format */

// read options
import options from './options.js';
import express from 'express';
import Clients from './Clients.js';
import getIndexHtml from './index.js';
import { ServerFunction } from '../shared/ServerFunc.js';
import Message from '../shared/Message.js';
import { ClientMethod } from '../shared/ClientFunc.js';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.use('/', express.static(options.getProdPath()));

   server.get('/', (req, res) => {
      res.send(getIndexHtml());
   });

   // eslint-disable-next-line no-console
   console.log(`Listening on port ${options.getPort()}`);

   Clients.on(ServerFunction.Init, Message.String, async (msg, client) => {
      return new Message.String(msg.data ? msg.data + ' ' + client.id : 'No data!');
   });
   Clients.on(ServerFunction.Click, Message.Time, async (msg) => {
      Clients.broadcast(ClientMethod.ClickFromClient, msg);
      return new Message.Boolean(true);
   });
});

Clients.init({ port: options.getPortWebSockets() });
