/** @format */

// read options
import options from './options.js';
import express from 'express';
import Clients from './Clients.js';
import wsTool from '../shared/wsTool.js';
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

   // tslint:disable-next-line: no-console
   console.log(`Listening on port ${options.getPort()} ${wsTool}`);

   Clients.on(ServerFunc.Init, (client, data, requestId) => {
      let initMsg = Message.String.parse(data);
      if (requestId) {
         client.answer(requestId,
            new Message.String(initMsg.data ? initMsg.data + ' ' + client.id : 'No data!'));
      }
   });
   Clients.on(ServerFunc.Click, (_, data) => {
      Clients.broadcast(ClientFunc.ClickFromClient, Message.Time.parse(data));
   });
});

Clients.init({ port: options.getPortWebSockets() });
