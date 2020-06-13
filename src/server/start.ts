/** @format */

// read options
import options from './Options.js';
import express from 'express';
import Clients from './Clients.js';
import getIndexHtml from './Index.js';
import { ServerFunction } from '../shared/Functions.js';
import ClientInfo from '../shared/Data/ClientInfo.js';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.use('/', express.static(options.getProdPath()));

   server.get('/', (req, res) => {
      res.send(getIndexHtml());
   });

   // eslint-disable-next-line no-console
   console.log(`Listening on port ${options.getPort()}`);

   Clients.on(ServerFunction.Connect, async (info, client) => {
      let clientInfo = Clients.onConnect(client, info);
      if (!clientInfo) {
         client.close();
         return new ClientInfo();
      }
      return clientInfo;
   });

   Clients.on(ServerFunction.GetClientInfos, async () => {
      return Clients.getClientInfos();
   });

   Clients.on(ServerFunction.Cool, async (text) => {
      if (1 + 1 === 2) {
         throw new Error('Ein Fehler!');
      }
      return text === undefined ? -1 : text.length;
   });
});

Clients.init({ port: options.getPortWebSockets() });
