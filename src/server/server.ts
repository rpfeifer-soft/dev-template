/** @format */

// read options
import options from './options.js';
import express from 'express';
import WebSocket from './websocket.js';
import wsTool from '../shared/wsTool.js';
import getIndexHtml from './index.js';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.use('/', express.static(options.getProdPath()));

   server.get('/', (req, res) => {
      res.send(getIndexHtml());
   });

   // tslint:disable-next-line: no-console
   console.log(`Listening on port ${options.getPort()} ${wsTool}`);
});

const websockets = WebSocket.init(options.getPortWebSockets(), (message) => {
   // tslint:disable-next-line: no-console
   if (message.data === 'Init') {
      return {
         data: 'Received init at the server!'
      };
   }
   // tslint:disable-next-line: no-console
   console.log('Received message: %s', message.data);
   return false;
});

setInterval(() => {
   websockets.broadcast(new Date().toTimeString());
}, 2000);
