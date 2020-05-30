/** @format */

import WSTool from '../shared/wsTool.js';
import Message from '../shared/Message.js';
import Sender from '../shared/Sender.js';
import ServerFunc from '../shared/ServerFunc.js';
import ClientFunc from '../shared/ClientFunc.js';

interface IMessageHandler {
   (data: string, requestId: number | false): void;
}

type IHandlers = { [key in ClientFunc]?: IMessageHandler[] };

class Server extends Sender<ServerFunc> {
   public static readonly instance: Server = new Server();

   // The server to use
   private socket: WebSocket;

   // The message handlers
   private handlers: IHandlers = {};

   // Init the instance
   init(url: string, onMessage?: (type: ClientFunc, data: string) => void) {
      // Register the correct handler
      let server = this;
      server.socket = new WebSocket(url);

      server.socket.onopen = function () {
         server.send(Message.String, ServerFunc.Init, new Message.String('Hallo!'))
            .then(msg => console.log(msg.data))
            .catch(error => console.error(error));
      };
      // tslint:disable-next-line: typedef
      server.socket.onmessage = (event) => {
         // Call the handler function
         let request = WSTool.parseRequest(event.data);
         if (request !== false) {

            let foundRequest = this.requests[request.requestId];
            if (foundRequest) {
               // Free the request
               delete request[request.requestId];

               if ('error' in request) {
                  foundRequest.reject(request.error);
               } else {
                  foundRequest.resolve(request.result);
               }
            }
            return;
         }
         let message = WSTool.Server.parse(event.data);
         if (message !== false) {
            let msg = message;
            let handlers = this.handlers[msg.type];
            if (handlers) {

               handlers.forEach(handler => {
                  handler(msg.data, msg.requestId || false);
               });
            }
         }
      };
   }

   on(type: ClientFunc, handler: IMessageHandler) {
      let handlers = this.handlers[type];
      if (handlers === undefined) {
         handlers = [];
         this.handlers[type] = handlers;
      }
      handlers.push(handler);
   }

   off(type: ClientFunc, handler: IMessageHandler) {
      let handlers = this.handlers[type];
      if (handlers) {
         this.handlers[type] = handlers.filter(p => p !== handler);
      }
   }

   prepare(type: ServerFunc, data: string, requestId: number | false) {
      return WSTool.Client.prepare(type, data, requestId);
   }

   socketSend(data: string | ArrayBuffer) {
      this.socket.send(data);
   }
}

export default Server.instance;