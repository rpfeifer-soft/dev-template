/** @format */

// read options
import options from './Options.js';
import express from 'express';
import Clients from './Clients.js';
import getIndexHtml from './Index.js';
import { ServerFunction, ClientFunction } from '../shared/Functions.js';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.use('/', express.static(options.getProdPath()));

   server.get('/', (req, res) => {
      res.send(getIndexHtml());
   });

   // eslint-disable-next-line no-console
   console.log(`Listening on port ${options.getPort()}`);

   Clients.on(ServerFunction.Init, async (init, client) => {
      client.call(ClientFunction.Hello, 'Yes');
      init.dump();
      return init.browser ? init.browser + ' ' + client.id : 'No data!';
   });
   Clients.on(ServerFunction.Click, async (date) => {
      Clients.broadcast(ClientFunction.ClickFromClient, date);
      return true;
   });
   Clients.on(ServerFunction.Cool, async (text) => {
      if (1 + 1 === 2) {
         throw new Error('Ein Fehler!');
      }
      return text === undefined ? -1 : text.length;
   });
});

Clients.init({ port: options.getPortWebSockets() });
