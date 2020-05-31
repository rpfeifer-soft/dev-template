/** @format */

// read options
import options from './options.js';
import express from 'express';
import Clients from './Clients.js';
import getIndexHtml from './index.js';
import ServerFunc from '../shared/ServerFunc.js';
import Message from '../shared/Message.js';
import ClientFunc from '../shared/ClientFunc.js';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.use('/', express.static(options.getProdPath()));

   server.get('/', (req, res) => {
      res.send(getIndexHtml());
   });

   // eslint-disable-next-line no-console
   console.log(`Listening on port ${options.getPort()}`);

   Clients.on(ServerFunc.Init, Message.String, (msg, requestId, client) => {
      if (requestId) {
         client.answer(requestId,
            new Message.String(msg.data ? msg.data + ' ' + client.id : 'No data!'));
      }
   });
   Clients.on(ServerFunc.Click, Message.Time, (msg) => {
      Clients.broadcast(ClientFunc.ClickFromClient, msg);
   });
});

Clients.init({ port: options.getPortWebSockets() });
