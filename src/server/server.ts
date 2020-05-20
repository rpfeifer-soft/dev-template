/** @format */

// read options
import options from './options.js';
import express from 'express';
import path from 'path';
import WebSocket from './websocket.js';

const server = express();

server.listen(options.getPort(), () => {

   // Handle the requests
   server.get('/index.html', (req, res) => {
      res.sendFile(path.join(options.getProdPath(), './index.html'));
   });

   server.use('/', express.static(options.getProdPath()));

   // tslint:disable-next-line: no-console
   console.log(`Listening on port ${options.getPort()}`);
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
