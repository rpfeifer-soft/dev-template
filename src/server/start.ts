/** @format */

// read options
import options from './Options.js';
import express from 'express';
import Clients from './Clients.js';
import getIndexHtml from './Index.js';
import { ServerFunction, ClientMethod } from '../shared/Functions.js';
import { Text, Bool, Double } from '../shared/Message.js';

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
      client.call(ClientMethod.Hello, new Text('Yes'));
      return new Text(msg.data ? msg.data + ' ' + client.id : 'No data!');
   });
   Clients.on(ServerFunction.Click, async (msg) => {
      Clients.broadcast(ClientMethod.ClickFromClient, msg);
      return new Bool(true);
   });
   Clients.on(ServerFunction.Cool, async (msg) => {
      if (1 + 1 === 2) {
         throw new Error('Ein Fehler!');
      }
      return new Double(msg.data === undefined ? -1 : msg.data.length);
   });
});

Clients.init({ port: options.getPortWebSockets() });
