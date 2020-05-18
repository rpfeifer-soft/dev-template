/** @format */

import WebSockets from 'ws';

export interface IMessage {
   data: string;
}

export interface IMessageDelegate {
   (message: IMessage): IMessage | false;
}

function parseMessage(message: string) {
   return {
      data: message
   };
}

function packageMessage(message: IMessage) {
   return message.data;
}

export default class Connections extends WebSockets.Server {

   static init(port: number, dOnMessage: IMessageDelegate) {
      return new Connections({ port }, dOnMessage);
   }

   constructor(options: WebSockets.ServerOptions, dOnMessage: IMessageDelegate) {
      super(options);

      this.on('connection', (ws: WebSockets) => {
         ws.on('message', (message: string) => {
            let answer = dOnMessage(parseMessage(message));
            if (answer) {
               ws.send(packageMessage(answer));
            }
         });
      });
   }

   broadcast(message: string) {
      // Send to all clients
      this.clients.forEach((ws: WebSockets) => {
         ws.send(message);
      });
   }
}
